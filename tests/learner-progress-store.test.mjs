import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import twilio from 'twilio';
import { loadRemote, saveRemote } from '../lib/learner/store.ts';
import { loadTelemetry } from '../lib/learner/telemetry.ts';
import { mergeProgress } from '../lib/learner/merge.ts';
import { decodeSnapshot, makeSnapshot, PROGRESS_HEAD, snapshotKeys } from '../lib/learner/progress-snapshot.mjs';
import { learnerConfig, twilioLearner } from '../lib/learner/twilio.ts';
import { learnerId, signSession } from '../lib/learner/session.ts';
import { decodeProgress } from '../scripts/export-primary-history.mjs';
import { browserActivityDTO } from '../lib/learner/activity.mjs';

const empty = () => ({ studyFocus: 'n10-009', knownCards: {}, unknownCards: {}, quizAttempts: [], mockAttempts: [], schedules: {} });
const validSchedule = () => ({ due: '2026-01-01T00:00:00.000Z', last_review: '2025-12-31T00:00:00.000Z', stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 1, reps: 1, lapses: 0, state: 2 });
const withQuiz = (name, at) => ({ ...empty(), quizAttempts: [{ topicId: name, correct: 1, total: 1, questionIds: [name], missedIds: [], at }] });
const big = (prefix) => ({ ...empty(), knownCards: Object.fromEntries(Array.from({ length: 1800 }, (_, i) => [`${prefix}-${String(i).padStart(4, '0')}`, true])) });
const ids = progress => progress.quizAttempts.map(q => q.topicId).sort();
const upstream = status => Object.assign(new Error('synthetic-provider-error'), { status });
function deferred() {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
}

// Every instance of a request shares these provider-side revisions. No process lock.
function fakeMap() {
  let version = 0;
  const items = new Map(), revisions = new Map(), calls = [];
  const map = {
    items, calls,
    async get(key) {
      const item = items.has(key) ? { data: structuredClone(items.get(key)), revision: revisions.get(key) } : null;
      if (map.onGet) await map.onGet(key, item);
      return item;
    },
    async list() { return [...items].map(([key, data]) => ({ key, data: structuredClone(data) })); },
    async set(key, data) { items.set(key, structuredClone(data)); revisions.set(key, String(++version)); },
    async create(key, data) {
      calls.push(['create', key]);
      if (map.onCreate) await map.onCreate(key, data);
      if (items.has(key)) throw upstream(409);
      await map.set(key, data);
    },
    async replace(key, data, revision) {
      calls.push(['replace', key, revision]);
      if (map.onReplace) await map.onReplace(key, data, revision);
      // No await between comparison and mutation: this is the provider's atomic CAS.
      if (!items.has(key) || revisions.get(key) !== revision) return false;
      items.set(key, structuredClone(data)); revisions.set(key, String(++version));
      return true;
    },
    async remove(key) {
      if (map.onRemove) await map.onRemove(key);
      items.delete(key); revisions.delete(key);
    },
    async removeAll() { items.clear(); revisions.clear(); },
  };
  return map;
}

test('ordinary multi-chunk saves round-trip, retry without writes, and retire only the old generation', async () => {
  const map = fakeMap();
  assert.equal(await loadRemote(map), null);
  const first = big('known');
  assert.deepEqual(await saveRemote(map, first), first);
  assert.deepEqual(await loadRemote(map), first);
  const old = map.items.get(PROGRESS_HEAD), count = map.calls.length;
  await saveRemote(map, first);
  assert.equal(map.calls.length, count, 'identical retry must not publish a new generation');
  await map.set('telemetry-event-untouched', { v: 1 });
  await saveRemote(map, withQuiz('new', 10));
  const final = await loadRemote(map);
  assert.deepEqual(final.knownCards, first.knownCards);
  assert.deepEqual(ids(final), ['new']);
  assert.ok(snapshotKeys(old).every(key => !map.items.has(key)));
  assert.deepEqual(map.items.get('telemetry-event-untouched'), { v: 1 });
  for (const data of map.items.values()) assert.ok(Buffer.byteLength(JSON.stringify(data)) <= 16 * 1024);
  assert.deepEqual(decodeProgress(await map.list()).quizAttempts, final.quizAttempts);
});

test('two concurrent first publishers preserve both updates after the create conflict', async () => {
  const map = fakeMap(), gate = deferred();
  let arrivals = 0;
  map.onCreate = async key => {
    if (key === PROGRESS_HEAD && ++arrivals <= 2) {
      if (arrivals === 2) gate.resolve();
      await gate.promise;
    }
  };
  await Promise.all([saveRemote(map, withQuiz('a', 1)), saveRemote(map, withQuiz('b', 2))]);
  assert.deepEqual(ids(await loadRemote(map)), ['a', 'b']);
  assert.equal(map.items.size, snapshotKeys(map.items.get(PROGRESS_HEAD)).length + 1);
});

test('a stale writer loses CAS, re-reads the winner, re-merges, and preserves both accepted updates', async () => {
  const map = fakeMap();
  await saveRemote(map, empty());
  const started = deferred(), release = deferred();
  let first = true;
  map.onReplace = async () => {
    if (first) { first = false; started.resolve(); await release.promise; }
  };
  const stale = saveRemote(map, withQuiz('a', 1));
  await started.promise;
  await saveRemote(map, withQuiz('b', 2));
  release.resolve();
  assert.deepEqual(ids(await stale), ['a', 'b']);
  assert.deepEqual(ids(await loadRemote(map)), ['a', 'b']);
  assert.equal(map.calls.filter(([kind]) => kind === 'replace').length, 3);
  assert.equal(map.items.size, snapshotKeys(map.items.get(PROGRESS_HEAD)).length + 1);
});

test('interruption at every chunk or before publication leaves the last complete snapshot authoritative', async () => {
  const next = big('new'), chunkCount = makeSnapshot(JSON.stringify(mergeProgress(next, big('old')))).chunks.length;
  for (let failAt = 0; failAt <= chunkCount; failAt++) {
    const map = fakeMap(), old = big('old');
    await saveRemote(map, old);
    let created = 0;
    map.onCreate = async key => {
      if (key.startsWith('progress-snapshot-') && created++ === failAt) throw upstream(503);
    };
    map.onReplace = async () => { if (failAt === chunkCount) throw upstream(503); };
    await assert.rejects(saveRemote(map, next));
    assert.deepEqual(await loadRemote(map), old);
    map.onCreate = undefined; map.onReplace = undefined;
    await saveRemote(map, withQuiz('recovered', 5));
    assert.deepEqual(ids(await loadRemote(map)), ['recovered']);
  }
});

test('failure before the first publication leaves no committed state and can be retried', async () => {
  const map = fakeMap();
  map.onCreate = async key => { if (key === PROGRESS_HEAD) throw upstream(503); };
  await assert.rejects(saveRemote(map, withQuiz('first', 1)));
  assert.equal(await loadRemote(map), null);
  map.onCreate = undefined;
  await saveRemote(map, withQuiz('first', 1));
  assert.deepEqual(ids(await loadRemote(map)), ['first']);
});

test('an abandoned partial first generation is ignored and a later save can succeed', async () => {
  const map = fakeMap(), candidate = makeSnapshot(JSON.stringify(big('orphan')));
  await map.set(snapshotKeys(candidate.head)[0], { s: candidate.chunks[0] });
  assert.equal(await loadRemote(map), null);
  await saveRemote(map, withQuiz('valid', 1));
  assert.deepEqual(ids(await loadRemote(map)), ['valid']);
});

test('missing or valid-JSON mixed current chunks fail closed, without publishing replacement data', async () => {
  for (const damage of ['missing', 'mixed']) {
    const map = fakeMap();
    await saveRemote(map, big('old'));
    const head = map.items.get(PROGRESS_HEAD), key = snapshotKeys(head)[1];
    if (damage === 'missing') await map.remove(key);
    else await map.set(key, { s: map.items.get(key).s.replaceAll('old-', 'new-') });
    const before = structuredClone([...map.items]);
    await assert.rejects(loadRemote(map), /invalid_progress_snapshot/);
    await assert.rejects(saveRemote(map, withQuiz('new', 1)), /invalid_progress_snapshot/);
    assert.throws(() => decodeProgress([...before].map(([key, data]) => ({ key, data }))), /invalid_progress_snapshot/);
    assert.deepEqual([...map.items], before);
  }
});

test('malformed manifests are rejected before chunk reads and UTF-8 snapshots round-trip', async () => {
  const candidate = makeSnapshot(JSON.stringify({ ...empty(), knownCards: { 'réseau-網絡': true } }));
  assert.equal(decodeSnapshot(candidate.head, candidate.chunks.map(s => ({ s }))), candidate.chunks.join(''));
  for (const patch of [{ v: 2 }, { count: 0 }, { count: 41 }, { generation: '../unrelated' }, { bytes: -1 }, { sha256: 'bad' }]) {
    const map = fakeMap();
    await map.set(PROGRESS_HEAD, { ...candidate.head, ...patch });
    map.onGet = key => { assert.equal(key, PROGRESS_HEAD); };
    await assert.rejects(loadRemote(map), /invalid_progress_snapshot/);
  }
});

test('a reader whose old chunks are retired retries against the advanced head', async () => {
  const map = fakeMap();
  await saveRemote(map, withQuiz('a', 1));
  const oldHead = await map.get(PROGRESS_HEAD), captured = deferred(), release = deferred();
  let first = true;
  map.onGet = async key => {
    if (key === PROGRESS_HEAD && first) { first = false; captured.resolve(); await release.promise; }
  };
  const reader = loadRemote(map);
  await captured.promise;
  await saveRemote(map, withQuiz('b', 2));
  assert.ok(snapshotKeys(oldHead.data).every(key => !map.items.has(key)));
  release.resolve();
  assert.deepEqual(ids(await reader), ['a', 'b']);
});

test('publication that commits then times out keeps its chunks and is idempotently recovered', async () => {
  for (const existing of [false, true]) {
    const map = fakeMap();
    if (existing) await saveRemote(map, empty());
    const method = existing ? 'replace' : 'create', real = map[method];
    map[method] = async (...args) => {
      const value = await real(...args);
      if (args[0] === PROGRESS_HEAD) throw upstream(504);
      return value;
    };
    const local = withQuiz('once', 1);
    await assert.rejects(saveRemote(map, local));
    assert.deepEqual(ids(await loadRemote(map)), ['once']);
    map[method] = real;
    const before = map.calls.length;
    await saveRemote(map, local);
    assert.equal(map.calls.length, before);
    assert.deepEqual(ids(await loadRemote(map)), ['once']);
  }
});

test('cleanup interruption cannot invalidate a commit, and repeated retries do not duplicate attempts', async () => {
  const map = fakeMap();
  await saveRemote(map, big('old'));
  let removes = 0;
  map.onRemove = async () => { if (++removes > 1) throw upstream(503); };
  const local = withQuiz('new', 1);
  await saveRemote(map, local);
  assert.ok(removes > 1);
  await saveRemote(map, local);
  assert.deepEqual(ids(await loadRemote(map)), ['new']);
});

test('legacy multi-chunk progress migrates without rewriting legacy or other learner-map items', async () => {
  const map = fakeMap(), old = big('legacy'), raw = JSON.stringify(old);
  for (let i = 0; i < raw.length; i += 12000) await map.set(`progress-${i / 12000}`, { s: raw.slice(i, i + 12000) });
  await map.set('telemetry-event-untouched', { v: 1 });
  const before = structuredClone([...map.items]);
  assert.deepEqual(await loadRemote(map), old);
  await saveRemote(map, withQuiz('after-migration', 10));
  for (const [key, data] of before) assert.deepEqual(map.items.get(key), data);
  assert.deepEqual(await loadRemote(map), mergeProgress(withQuiz('after-migration', 10), old));
  assert.deepEqual(ids(await loadRemote(map)), ['after-migration']);
  assert.deepEqual(ids(decodeProgress(await map.list())), ['after-migration']);
  // The committed manifest, never a leftover legacy stream, is authoritative.
  await map.set('progress-0', { s: '{truncated' });
  assert.deepEqual(ids(await loadRemote(map)), ['after-migration']);
  assert.deepEqual(ids(decodeProgress(await map.list())), ['after-migration']);
  await map.removeAll();
  assert.equal(await loadRemote(map), null, 'existing learner-map deletion includes every new item');
});

test('corrupt legacy streams fail closed before any candidate or head is written, retaining every byte', async () => {
  const raw = JSON.stringify(withQuiz('legacy', 1)), cut = Math.floor(raw.length / 2);
  const cases = [
    [['progress-0', { s: '{"quizAttempts":[' }]],
    [['progress-0', { s: raw.slice(0, cut) }], ['progress-1', { s: raw.slice(cut, -1) }]],
    [['progress-0', { s: raw.slice(0, cut) }], ['progress-2', { s: raw.slice(cut) }]],
    [['progress-1', { s: raw }]],
    [['progress-00', { s: raw }]],
    [['progress-0', {}]],
    [['progress-0', null]],
    [['progress-0', { s: '' }]],
    [['progress-0', { s: '[]' }]],
    [['progress-0', { s: JSON.stringify({ ...empty(), quizAttempts: 'malformed' }) }]],
    [['progress-0', { s: JSON.stringify({ ...empty(), knownCards: { damaged: false } }) }]],
    [['progress-0', { s: JSON.stringify({ ...empty(), studyFocus: 'invalid-focus' }) }]],
    ...[null, {}, { due: 'bad' }, { due: '2026-01-01T00:00:00.000Z', stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 1, reps: 1, lapses: 0, state: 9 }].map(schedule =>
      [['progress-0', { s: JSON.stringify({ ...empty(), schedules: { card: schedule } }) }]]),
    ...[{ due: 'bad' }, { last_review: 'bad' }, { due: '2026-02-30T00:00:00.000Z' },
      { last_review: '2026-02-30T00:00:00.000Z' }, { due: '2025-02-29T00:00:00.000Z' },
      { stability: null }, { reps: 0.5 }, { learning_steps: -1 }].map(patch =>
      [['progress-0', { s: JSON.stringify({ ...empty(), schedules: { card: { ...validSchedule(), ...patch } } }) }]]),
    [['progress-0', { s: raw + ' '.repeat(12000) }]],
    Array.from({ length: 41 }, (_, i) => [`progress-${i}`, { s: i ? ' ' : raw }]),
  ];
  for (const chunks of cases) {
    const map = fakeMap();
    for (const [key, data] of chunks) await map.set(key, data);
    const before = structuredClone([...map.items]);
    await assert.rejects(loadRemote(map), /invalid_legacy_progress/);
    await assert.rejects(saveRemote(map, withQuiz('new', 2)), /invalid_legacy_progress/);
    assert.equal(map.items.has(PROGRESS_HEAD), false);
    assert.deepEqual([...map.items], before, 'failed migration must not repair or rewrite legacy bytes');
    assert.deepEqual(map.calls, [], 'reject before creating even a candidate chunk');
  }
});

test('valid older legacy progress missing newer optional fields still migrates', async () => {
  const map = fakeMap(), legacy = { knownCards: { earlier: true }, quizAttempts: withQuiz('older', 1).quizAttempts };
  const raw = JSON.stringify(legacy);
  await map.set('progress-0', { s: raw });
  const expected = { ...empty(), studyFocus: '220-1201', ...legacy };
  assert.deepEqual(await loadRemote(map), expected);
  const local = withQuiz('current', 2);
  await saveRemote(map, local);
  assert.deepEqual(await loadRemote(map), mergeProgress(local, expected));
  assert.deepEqual(map.items.get('progress-0'), { s: raw });
});

test('legacy persistence, exporter and protected activity agree without writing', async () => {
  const cases = [
    [{ knownCards: { older: true } }, true],
    [{ studyFocus: 'invalid' }, false],
    [{ schedules: { card: { ...validSchedule(), state: 8 } } }, false],
    [{ schedules: { card: { ...validSchedule(), due: '2026-02-30T00:00:00.000Z' } } }, false],
    [{ schedules: { card: { ...validSchedule(), last_review: '2026-02-30T00:00:00.000Z' } } }, false],
    [{ knownCards: { older: 'yes' } }, false],
    [{ schedules: { card: validSchedule() } }, true],
  ];
  for (const [legacy, valid] of cases) {
    const map = fakeMap(), raw = JSON.stringify(legacy);
    await map.set('progress-0', { s: raw });
    const items = await map.list(), before = structuredClone(items);
    if (valid) {
      const persistence = await loadRemote(map), exported = decodeProgress(items);
      assert.deepEqual({ ...persistence, questionEvents: [] }, exported);
      assert.equal(browserActivityDTO(items).totals.questions, 0);
    } else {
      await assert.rejects(loadRemote(map), /invalid_legacy_progress/);
      assert.throws(() => decodeProgress(items));
      assert.throws(() => browserActivityDTO(items));
    }
    assert.deepEqual(await map.list(), before);
    assert.equal(map.calls.length, 0);
  }
});

test('valid legacy FSRS schedules survive migration', async () => {
  const map = fakeMap();
  const schedule = validSchedule();
  const old = { ...empty(), schedules: { card: schedule } };
  await map.set('progress-0', { s: JSON.stringify(old) });
  await saveRemote(map, withQuiz('new', 1));
  assert.deepEqual((await loadRemote(map)).schedules.card, schedule);
});

test('valid canonical leap-day schedule dates migrate unchanged', async () => {
  const map = fakeMap();
  const schedule = { ...validSchedule(), due: '2024-02-29T23:59:59.999Z', last_review: '2024-02-29T00:00:00.000Z' };
  await map.set('progress-0', { s: JSON.stringify({ ...empty(), schedules: { card: schedule } }) });
  await saveRemote(map, withQuiz('new', 1));
  assert.deepEqual((await loadRemote(map)).schedules.card, schedule);
});

test('a late legacy writer cannot change the committed manifest or mix invisible legacy progress into reads', async () => {
  const map = fakeMap(), legacy = withQuiz('legacy-before', 1), modern = withQuiz('modern', 2);
  await map.set('progress-0', { s: JSON.stringify(legacy) });
  await saveRemote(map, modern);
  const committed = structuredClone(map.items.get(PROGRESS_HEAD));
  const expected = mergeProgress(modern, legacy);
  // Simulate a request running old deployed code completing after migration.
  await map.set('progress-0', { s: JSON.stringify(withQuiz('late-legacy-save', 3)) });
  assert.deepEqual(await loadRemote(map), expected);
  assert.deepEqual(decodeProgress(await map.list()).quizAttempts, expected.quizAttempts);
  assert.deepEqual(map.items.get(PROGRESS_HEAD), committed);
  const later = withQuiz('modern-after', 4);
  await saveRemote(map, later);
  assert.deepEqual(await loadRemote(map), mergeProgress(later, expected));
  assert.ok(!ids(await loadRemote(map)).includes('late-legacy-save'), 'old writers must be drained, not silently merged');
});

test('real SDK pagination keeps telemetry visible beyond 1,000 mixed items with read-only learner isolation', async () => {
  const seeded = fakeMap(), progress = withQuiz('committed', 1);
  await saveRemote(seeded, progress);
  await seeded.set('progress-0', { s: JSON.stringify(withQuiz('frozen', 0)) });
  for (let i = 0; i < 1205; i++) await seeded.set(`progress-snapshot-orphan-${String(i).padStart(4, '0')}`, { s: 'uncommitted' });
  const event = { v: 1, type: 'quiz_started', at: 1, exam: 'n10-009', sessionId: 'session-1234567890', questionCount: 1 };
  await seeded.set('telemetry-event-visible', { e: event });
  const other = new Map([['telemetry-event-other-learner', { e: { ...event, sessionId: 'other-session-12345678' } }]]);
  const maps = new Map([['learner-isolated', seeded.items], ['learner-other', other]]);
  const before = structuredClone([...maps].map(([name, items]) => [name, [...items]]));
  const config = { accountSid: 'AC' + '0'.repeat(32), keySid: 'SK' + '1'.repeat(32), keySecret: 'synthetic',
    syncServiceSid: 'IS' + '2'.repeat(32), verifyServiceSid: 'VA' + '3'.repeat(32), secret: 'synthetic', allowed: [] };
  const client = twilio(config.keySid, config.keySecret, { accountSid: config.accountSid, logLevel: 'silent' });
  const requests = [];
  let laterPageError;
  // Exercise the installed SDK's actual page decoder/navigation, but never use its HTTP transport.
  client.request = async ({ method, uri, params = {} }) => {
    assert.equal(method.toLowerCase(), 'get', 'reads must not create, update, or delete any item');
    const url = new URL(uri), path = url.pathname.match(/\/Maps\/([^/]+)\/Items(?:\/([^/]+))?$/);
    assert.ok(path, 'never enumerate maps or read an unrelated provider resource');
    requests.push({ map: path[1], key: path[2], token: url.searchParams.get('PageToken') });
    const records = maps.get(path[1]);
    const reply = (statusCode, body) => ({ statusCode, body, headers: {} });
    if (!records) return reply(404, { code: 20404, message: 'Synthetic missing map' });
    if (path[2]) {
      const key = decodeURIComponent(path[2]);
      return records.has(key) ? reply(200, { key, data: records.get(key), revision: 'r1' })
        : reply(404, { code: 20404, message: 'Synthetic missing item' });
    }
    const start = Number(url.searchParams.get('PageToken') ?? 0);
    if (start && laterPageError) return reply(laterPageError, { code: 20404, message: 'Synthetic interrupted pagination' });
    const size = Number(params.PageSize ?? url.searchParams.get('PageSize') ?? 100);
    const entries = [...records].sort(([a], [b]) => a.localeCompare(b));
    const page = entries.slice(start, start + size).map(([key, data]) => ({ key, data, revision: 'r1' }));
    url.searchParams.set('PageToken', String(start + size));
    url.searchParams.set('PageSize', String(size));
    return reply(200, { items: page, meta: { key: 'items', next_page_url: start + size < entries.length ? url.href : null } });
  };
  const provider = twilioLearner(config, client), map = provider.mapFor('isolated');
  const listed = await map.list();
  assert.equal(listed.length, seeded.items.size);
  assert.ok(listed.length > 1000);
  assert.ok(listed.findIndex(item => item.key === 'telemetry-event-visible') > 1000);
  assert.deepEqual(await loadTelemetry(map), [event]);
  assert.deepEqual(await loadRemote(map), progress);
  assert.ok(requests.some(request => Number(request.token) > 1000), 'follow later provider pages');
  assert.ok(requests.every(request => request.map === 'learner-isolated'));
  assert.ok(!listed.some(item => item.key === 'telemetry-event-other-learner'));
  for (const status of [404, 503]) {
    laterPageError = status;
    await assert.rejects(loadTelemetry(map), undefined, 'a later-page failure must not return partial or empty telemetry');
  }
  laterPageError = undefined;
  assert.deepEqual(await provider.mapFor('missing').list(), [], 'an initially absent map is still empty');
  assert.deepEqual(await loadTelemetry(provider.mapFor('other')), [{ ...event, sessionId: 'other-session-12345678' }]);
  assert.deepEqual([...maps].map(([name, items]) => [name, [...items]]), before, 'reading must not repair, retire, or mutate records');
});

test('bounded conflicts fail explicitly; unexpected provider errors are not treated as conflicts', async () => {
  const map = fakeMap();
  await saveRemote(map, empty());
  map.replace = async () => false;
  await assert.rejects(saveRemote(map, withQuiz('new', 1)), /progress_conflict/);
  assert.deepEqual(ids(await loadRemote(map)), []);
  for (const status of [401, 403, 404, 429, 500]) {
    const error = upstream(status);
    map.replace = async () => { throw error; };
    await assert.rejects(saveRemote(map, withQuiz('new', 1)), e => e === error);
    assert.deepEqual(ids(await loadRemote(map)), []);
  }
});

test('attempt caps and input idempotency retain existing merge semantics', async () => {
  const map = fakeMap();
  const a = { ...empty(), quizAttempts: Array.from({ length: 40 }, (_, i) => withQuiz('q' + i, i).quizAttempts[0]) };
  await saveRemote(map, a);
  const b = withQuiz('latest', 50);
  await saveRemote(map, b); await saveRemote(map, b);
  const restored = await loadRemote(map);
  assert.equal(restored.quizAttempts.length, 40);
  assert.equal(restored.quizAttempts[0].topicId, 'latest');
  assert.equal(ids(restored).filter(id => id === 'latest').length, 1);
});

test('oversized or heavily escaped chunks are rejected before any writes', async () => {
  for (const value of ['x'.repeat(500000), '\\'.repeat(12000), '文'.repeat(12000)]) {
    const map = fakeMap();
    await assert.rejects(saveRemote(map, { ...empty(), knownCards: { [value]: true } }), /too_large/);
    assert.equal(map.items.size, 0);
  }
});

test('Twilio adapter sends If-Match, distinguishes conflicts, and never updates immutable create winners', async () => {
  const config = { accountSid: 'synthetic', keySid: 'synthetic', keySecret: 'synthetic', syncServiceSid: 'synthetic', verifyServiceSid: 'synthetic', secret: 'synthetic', allowed: [] };
  const calls = [];
  let updateError, createError;
  const item = {
    async fetch() { return { data: { x: 1 }, revision: 'r7' }; },
    async update(options) { calls.push(options); if (updateError) throw upstream(updateError); },
  };
  const items = () => item;
  items.create = async () => { if (createError) throw upstream(createError); };
  const maps = name => { assert.match(name, /^learner-/); return { syncMapItems: items }; };
  maps.create = async () => { throw upstream(409); };
  const client = { sync: { v1: { services: () => ({ syncMaps: maps, documents() {} }) } }, verify: { v2: { services: () => ({}) } } };
  const map = twilioLearner(config, client).mapFor('isolated');
  assert.equal((await map.get(PROGRESS_HEAD)).revision, 'r7');
  assert.equal(await map.replace(PROGRESS_HEAD, { next: true }, 'r7'), true);
  assert.deepEqual(calls[0], { data: { next: true }, ifMatch: 'r7' });
  for (const status of [409, 412]) { updateError = status; assert.equal(await map.replace(PROGRESS_HEAD, {}, 'r7'), false); }
  updateError = 503;
  await assert.rejects(map.replace(PROGRESS_HEAD, {}, 'r7'));
  updateError = undefined;
  const before = calls.length;
  createError = 409;
  await assert.rejects(map.create(PROGRESS_HEAD, {}), e => e.status === 409);
  assert.equal(calls.length, before, 'create conflict must not fall back to unconditional update');
  let first = true, mapCreations = 0;
  items.create = async () => { if (first) { first = false; throw upstream(404); } };
  maps.create = async () => { mapCreations++; };
  await map.create(PROGRESS_HEAD, {});
  assert.equal(mapCreations, 1, 'first use creates the learner map, then the item');
  item.fetch = async () => { throw upstream(404); };
  assert.equal(await map.get(PROGRESS_HEAD), null);
});

test('the actual authenticated sync route merges simultaneous saves and keeps learners isolated', async () => {
  const values = {
    TWILIO_ACCOUNT_SID: 'AC' + '0'.repeat(32), TWILIO_API_KEY_SID: 'SK' + '1'.repeat(32), TWILIO_API_KEY_SECRET: 'synthetic',
    TWILIO_SYNC_SERVICE_SID: 'IS' + '2'.repeat(32), TWILIO_VERIFY_SERVICE_SID: 'VA' + '3'.repeat(32),
    LEARNER_SESSION_SECRET: 'synthetic-session-secret-'.repeat(2), LEARNER_ALLOWED_PHONES: '+12025550101,+12025550102',
  };
  const oldEnv = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  const config = learnerConfig(), maps = new Map();
  const gate = deferred(); let arrivals = 0;
  globalThis.__atomicProgressTestProvider = {
    guard: { async assertActive() {} },
    mapFor(id) {
      if (!maps.has(id)) {
        const map = fakeMap();
        map.onCreate = async key => { if (key === PROGRESS_HEAD && ++arrivals <= 2) { if (arrivals === 2) gate.resolve(); await gate.promise; } };
        maps.set(id, map);
      }
      return maps.get(id);
    },
  };
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === '@/lib/learner/twilio' && context.parentURL?.includes('/api/learner/sync/route.ts?atomic-test')) {
        return { shortCircuit: true, url: 'data:text/javascript,export const twilioLearner = () => globalThis.__atomicProgressTestProvider;' };
      }
      return next(specifier, context);
    },
  });
  try {
    const { POST } = await import('../app/api/learner/sync/route.ts?atomic-test');
    const request = (progress, phone = config.allowed[0]) => {
      const token = signSession({ id: learnerId(phone, config.secret), last4: '0101', exp: Date.now() + 60000 }, config.secret);
      return new Request('https://example.test/api/learner/sync', { method: 'POST', headers: { origin: 'https://example.test', cookie: 'learner_session=' + token }, body: JSON.stringify(progress) });
    };
    const responses = await Promise.all([POST(request(withQuiz('a', 1))), POST(request(withQuiz('b', 2)))]);
    assert.deepEqual(responses.map(r => r.status), [200, 200]);
    for (const [i, response] of responses.entries()) {
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.ok(ids(body.progress).includes(i ? 'b' : 'a'));
      assert.equal(typeof body.savedAt, 'number');
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    assert.deepEqual(ids(await loadRemote(maps.get(learnerId(config.allowed[0], config.secret)))), ['a', 'b']);
    assert.equal((await POST(request(withQuiz('other-learner', 3), config.allowed[1]))).status, 200);
    assert.deepEqual(ids(await loadRemote(maps.get(learnerId(config.allowed[1], config.secret)))), ['other-learner']);
    assert.deepEqual(ids(await loadRemote(maps.get(learnerId(config.allowed[0], config.secret)))), ['a', 'b']);
    assert.equal((await POST(new Request('https://example.test/api/learner/sync', { method: 'POST', headers: { origin: 'https://example.test' }, body: '{}' }))).status, 401);
    assert.equal((await POST(new Request('https://example.test/api/learner/sync', { method: 'POST', body: '{}' }))).status, 403);
    const corrupt = maps.get(learnerId(config.allowed[1], config.secret));
    await corrupt.removeAll();
    await corrupt.set('progress-0', { s: '{"quizAttempts":[' });
    const before = structuredClone([...corrupt.items]);
    const rejected = await POST(request(withQuiz('not-acknowledged', 4), config.allowed[1]));
    assert.equal(rejected.status, 502, 'corrupt legacy progress remains a retryable failure, never an empty successful save');
    assert.deepEqual(await rejected.json(), { error: 'unavailable' });
    assert.deepEqual([...corrupt.items], before);
    assert.ok(!corrupt.items.has(PROGRESS_HEAD));
  } finally {
    hooks.deregister(); delete globalThis.__atomicProgressTestProvider;
    for (const [key, value] of Object.entries(oldEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
