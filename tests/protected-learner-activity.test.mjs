import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import twilio from 'twilio';
import { browserActivityDTO } from '../lib/learner/activity.mjs';
import { createActivityReader, readConsistentActivity } from '../lib/learner/activity-reader.mjs';
import { makeSnapshot, snapshotKeys } from '../lib/learner/progress-snapshot.mjs';
import { learnerId, signSession } from '../lib/learner/session.ts';

const now = Date.now();
const qid = 'q-n10c7-16';
const event = { v: 1, type: 'question_answered', at: now - 1000, exam: 'n10-009', sessionId: 'synthetic-session-12345678', questionId: qid, topicId: 'n10-ch7', correct: false };
const progress = { studyFocus: 'n10-009', knownCards: {}, unknownCards: {}, schedules: {}, mockAttempts: [], quizAttempts: [] };
const snapshot = (value, revision = 'r1') => {
  const { head, chunks } = makeSnapshot(JSON.stringify(value));
  return [{ key: 'progress-head', revision, data: head }, ...snapshotKeys(head).map((key, i) => ({ key, data: { s: chunks[i] } }))];
};
const fixture = () => [...snapshot(progress), { key: 'telemetry-event-1', data: { e: event, privateProviderValue: 'secret-provider-data' } }];

test('browser DTO contains only allowed aggregate fields and no private answer or provider data', () => {
  const items = fixture();
  items.push({ key: 'profile', data: { phone: 'PRIVATE-PHONE', token: 'PRIVATE-TOKEN' } });
  const dto = browserActivityDTO(items, now);
  assert.deepEqual(Object.keys(dto).sort(), ['ambiguity', 'limitations', 'objectives', 'topics', 'totals', 'window']);
  assert.deepEqual(Object.keys(dto.window).sort(), ['days', 'end', 'start']);
  assert.deepEqual(Object.keys(dto.totals).sort(), ['attempts', 'correct', 'incorrect', 'questions']);
  assert.equal(dto.totals.questions, 1);
  assert.equal(dto.totals.incorrect, 1);
  for (const row of dto.topics) assert.deepEqual(Object.keys(row).sort(), ['ambiguous', 'attempts', 'correct', 'examId', 'incorrect', 'questionCount', 'topicId', 'weaknessScore']);
  for (const row of dto.objectives) assert.deepEqual(Object.keys(row).sort(), ['ambiguous', 'attempts', 'correct', 'examId', 'incorrect', 'objectiveId', 'questionCount', 'weaknessScore']);
  const json = JSON.stringify(dto);
  for (const secret of ['PRIVATE-PHONE', 'PRIVATE-TOKEN', 'secret-provider-data', event.sessionId, qid, 'correctAnswer', 'selectedAnswer', 'explanation', 'progress-head']) assert.ok(!json.includes(secret), secret);
  assert.equal(browserActivityDTO([], now).totals.questions, 0);
});

test('opposite same-time outcomes stay explicitly ambiguous in totals and groups', () => {
  for (const telemetryCorrect of [true, false]) {
    const sitting = { topicId: 'n10-ch7', at: event.at, correct: telemetryCorrect ? 0 : 1, total: 1,
      questionIds: [qid], missedIds: telemetryCorrect ? [qid] : [] };
    const items = [...snapshot({ ...progress, quizAttempts: [sitting] }),
      { key: 'telemetry-event-1', data: { e: { ...event, correct: telemetryCorrect } } }];
    const dto = browserActivityDTO(items, now);
    assert.deepEqual(dto.totals, { questions: 1, attempts: 1, correct: 0, incorrect: 0 });
    assert.equal(dto.ambiguity.count, 1);
    assert.equal(dto.topics[0].ambiguous, 1);
    for (const row of [...dto.topics, ...dto.objectives]) {
      assert.equal(row.correct, 0); assert.equal(row.incorrect, 0); assert.equal(row.ambiguous, 1);
    }
    for (const secret of [qid, event.sessionId, 'selectedAnswer', 'correctAnswer']) assert.ok(!JSON.stringify(dto).includes(secret));
  }
});

test('mixed definite and ambiguous outcomes aggregate safely by topic and objective', () => {
  const a = 'q-n10tcp-01', b = 'q-n10tcp-02', c = 'q-n10c11-04';
  const sitting = { topicId: 'n10-tcpip', at: event.at, correct: 1, total: 1, questionIds: [a], missedIds: [] };
  const rows = [
    { ...event, questionId: a, topicId: 'n10-tcpip', correct: false },
    { ...event, questionId: b, topicId: 'n10-tcpip', correct: true },
    { ...event, questionId: c, topicId: 'n10-ch11', correct: false },
  ];
  const dto = browserActivityDTO([...snapshot({ ...progress, quizAttempts: [sitting] }),
    ...rows.map((e, i) => ({ key: `telemetry-event-${i}`, data: { e } }))], now);
  assert.deepEqual(dto.totals, { questions: 3, attempts: 3, correct: 1, incorrect: 1 });
  assert.equal(dto.ambiguity.count, 1);
  const objective = dto.objectives.find(row => row.examId === 'n10-009' && row.objectiveId === '1.4');
  assert.ok(objective); assert.equal(objective.correct, 1); assert.equal(objective.incorrect, 0); assert.equal(objective.ambiguous, 1);
  const topic = dto.topics.find(row => row.topicId === 'n10-tcpip');
  assert.equal(topic.correct, 1); assert.equal(topic.incorrect, 0); assert.equal(topic.ambiguous, 1);
  for (const secret of [a, b, c, event.sessionId]) assert.ok(!JSON.stringify(dto).includes(secret));
});

test('committed snapshot wins over legacy and corruption fails closed without legacy fallback', async () => {
  const items = fixture();
  items.push({ key: 'progress-0', data: { s: JSON.stringify({ ...progress, quizAttempts: [{ topicId: 'n10-ch7', at: now, correct: 1, total: 1, questionIds: [qid], missedIds: [] }] }) } });
  const reader = { async head() { return { revision: 'r1' }; }, async list() { return items; } };
  const dto = await readConsistentActivity(reader, x => browserActivityDTO(x, now));
  assert.equal(dto.totals.attempts, 1); assert.equal(dto.totals.incorrect, 1); assert.equal(dto.totals.correct, 0);
  const bad = items.filter(item => !item.key.startsWith('progress-snapshot-'));
  await assert.rejects(readConsistentActivity({ ...reader, async list() { return bad; } }, x => browserActivityDTO(x, now)), /history|snapshot/);
  await assert.rejects(readConsistentActivity({ ...reader, async list() { return items.filter(item => item.key !== 'progress-head'); } }, x => browserActivityDTO(x, now)), /invalid_progress_snapshot/);
  const changed = items.map(item => item.key.startsWith('progress-snapshot-') ? { ...item, data: { s: 'damaged' } } : item);
  await assert.rejects(readConsistentActivity({ ...reader, async list() { return changed; } }, x => browserActivityDTO(x, now)), /history|snapshot/);
});

test('retirement during paginated reading retries only after a head revision change', async () => {
  const current = snapshot(progress, 'r2');
  let heads = 0, listings = 0;
  const reader = {
    async head() { return { revision: ++heads === 1 ? 'r1' : 'r2' }; },
    async list() { listings++; return listings === 1 ? [] : current; },
  };
  const dto = await readConsistentActivity(reader, items => browserActivityDTO(items, now));
  assert.equal(dto.totals.questions, 0);
  assert.equal(listings, 2);
  const oldHead = snapshot(progress, 'r1')[0];
  const revisions = ['r1', 'r1', 'r2', 'r2', 'r2'];
  let reads = 0;
  const overlap = { async head() { return { revision: revisions.shift() ?? 'r2' }; }, async list() { return ++reads === 1 ? [oldHead] : current; } };
  assert.equal((await readConsistentActivity(overlap, items => browserActivityDTO(items, now))).totals.questions, 0);
  assert.equal(reads, 2, 'retired chunks discovered during decoding trigger a new snapshot read');
  let version = 0;
  await assert.rejects(readConsistentActivity({ async head() { return { revision: String(++version) }; }, async list() { return []; } }, () => ({})), /progress_conflict/);
});

test('read-only SDK adapter follows every page, isolates maps and rejects any write transport', async () => {
  const id = 'a'.repeat(40), otherId = 'b'.repeat(40);
  const records = new Map(fixture().map(({ key, data, revision }) => [key, { data, revision: revision ?? 'x' }]));
  for (let i = 0; i < 1205; i++) records.set(`progress-snapshot-orphan-${String(i).padStart(4, '0')}`, { data: { s: 'orphan' }, revision: 'x' });
  const maps = new Map([[`learner-${id}`, records], [`learner-${otherId}`, new Map([['private-other', { data: { x: 1 }, revision: 'x' }]])]]);
  const config = { accountSid: 'AC' + '0'.repeat(32), keySid: 'SK' + '1'.repeat(32), keySecret: 'synthetic', syncServiceSid: 'IS' + '2'.repeat(32) };
  let client; const calls = []; let serviceMissing = false, pageFailure = false;
  const factory = (...args) => {
    client = twilio(...args);
    client.request = async ({ method, uri, params = {} }) => {
      assert.equal(method.toLowerCase(), 'get');
      const url = new URL(uri);
      if (url.pathname === `/v1/Services/${config.syncServiceSid}`) return { statusCode: serviceMissing ? 404 : 200, body: serviceMissing ? { code: 20404, message: 'missing' } : { sid: config.syncServiceSid }, headers: {} };
      const path = url.pathname.match(/\/Maps\/([^/]+)\/Items(?:\/([^/]+))?$/);
      assert.ok(path); calls.push({ map: path[1], token: url.searchParams.get('PageToken') });
      const entries = maps.get(path[1]);
      const reply = (statusCode, body) => ({ statusCode, body, headers: {} });
      if (!entries) return reply(404, { code: 20404, message: 'missing' });
      if (path[2]) {
        const key = decodeURIComponent(path[2]), item = entries.get(key);
        return item ? reply(200, { key, ...item }) : reply(404, { code: 20404, message: 'missing' });
      }
      const start = Number(url.searchParams.get('PageToken') ?? 0), size = Number(params.PageSize ?? url.searchParams.get('PageSize') ?? 100);
      if (start && pageFailure) return reply(404, { code: 20404, message: 'interrupted page' });
      const sorted = [...entries].sort(([a], [b]) => a.localeCompare(b));
      const page = sorted.slice(start, start + size).map(([key, item]) => ({ key, ...item }));
      url.searchParams.set('PageToken', String(start + size)); url.searchParams.set('PageSize', String(size));
      return reply(200, { items: page, meta: { key: 'items', next_page_url: start + size < sorted.length ? url.href : null } });
    };
    return client;
  };
  const before = structuredClone([...maps].map(([name, entries]) => [name, [...entries]]));
  const reader = createActivityReader(config, id, factory);
  assert.deepEqual(Object.keys(reader).sort(), ['head', 'list']);
  const dto = await readConsistentActivity(reader, items => browserActivityDTO(items, now));
  assert.equal(dto.totals.incorrect, 1);
  assert.ok(calls.some(call => Number(call.token) > 1000));
  assert.ok(calls.every(call => call.map === `learner-${id}`));
  assert.throws(() => client.request({ method: 'POST', uri: 'https://invalid.test' }), /read_only_transport/);
  pageFailure = true;
  await assert.rejects(reader.list(), 'later-page errors must not return partial data');
  pageFailure = false;
  assert.deepEqual([...maps].map(([name, entries]) => [name, [...entries]]), before);
  const missing = createActivityReader(config, 'c'.repeat(40), factory);
  assert.deepEqual(await readConsistentActivity(missing, items => browserActivityDTO(items, now)), browserActivityDTO([], now));
  serviceMissing = true;
  await assert.rejects(readConsistentActivity(missing, items => browserActivityDTO(items, now)));
});

test('actual route requires signed allowlisted session, rejects identity overrides and sanitizes failures', async () => {
  const values = { TWILIO_ACCOUNT_SID: 'AC' + '0'.repeat(32), TWILIO_API_KEY_SID: 'SK' + '1'.repeat(32), TWILIO_API_KEY_SECRET: 'synthetic',
    TWILIO_SYNC_SERVICE_SID: 'IS' + '2'.repeat(32), TWILIO_VERIFY_SERVICE_SID: 'VA' + '3'.repeat(32),
    LEARNER_SESSION_SECRET: 'synthetic-session-secret-'.repeat(2), LEARNER_ALLOWED_PHONES: '+12025550101,+12025550102' };
  const old = Object.fromEntries(Object.keys(values).map(k => [k, process.env[k]]));
  Object.assign(process.env, values);
  const idA = learnerId('+12025550101', values.LEARNER_SESSION_SECRET), idB = learnerId('+12025550102', values.LEARNER_SESSION_SECRET);
  const calls = [];
  globalThis.__activityRouteTest = async (_config, id) => {
    calls.push(id);
    if (globalThis.__activityRouteFail === 'corrupt') {
      const damaged = fixture().filter(item => !item.key.startsWith('progress-snapshot-'));
      return readConsistentActivity({ async head() { return { revision: 'r1' }; }, async list() { return damaged; } }, items => browserActivityDTO(items, now));
    }
    if (globalThis.__activityRouteFail) throw new Error('PRIVATE-PROVIDER-DETAIL');
    return browserActivityDTO(id === idA ? fixture() : [], now);
  };
  const hooks = registerHooks({ resolve(specifier, context, next) {
    if (specifier === '@/lib/learner/twilio' && context.parentURL?.includes('/api/learner/activity/route.ts?protected-test')) {
      return { shortCircuit: true, url: 'data:text/javascript,export const twilioLearner = () => ({guard:{assertActive:async()=>{}}});' };
    }
    if (specifier === '@/lib/learner/activity.mjs' && context.parentURL?.includes('/api/learner/activity/route.ts?protected-test')) {
      return { shortCircuit: true, url: 'data:text/javascript,export const getLearnerActivity = (...args) => globalThis.__activityRouteTest(...args);' };
    }
    return next(specifier, context);
  } });
  try {
    const { GET } = await import('../app/api/learner/activity/route.ts?protected-test');
    const token = (id, exp = Date.now() + 60000) => signSession({ id, last4: '0101', exp }, values.LEARNER_SESSION_SECRET);
    const req = (path = '', session, headers = {}) => new Request(`https://example.test/api/learner/activity${path}`, { headers: { ...(session ? { cookie: `learner_session=${session}` } : {}), ...headers } });
    assert.equal((await GET(req())).status, 401);
    assert.equal((await GET(req('', token(idA, Date.now() - 1000)))).status, 401);
    assert.equal((await GET(req('', token(idA).replace(/.$/, '!')))).status, 401);
    const removed = learnerId('+12025550103', values.LEARNER_SESSION_SECRET);
    assert.equal((await GET(req('', token(removed)))).status, 401);
    for (const path of ['?phone=x', '?learnerId=x', '?mapId=x', '?sessionId=x']) assert.equal((await GET(req(path, token(idA)))).status, 400);
    const withBody = { ...req('', token(idA)), url: 'https://example.test/api/learner/activity', headers: req('', token(idA)).headers, body: {} };
    assert.equal((await GET(withBody)).status, 400);
    assert.equal((await GET(req('', token(idA), { origin: 'https://evil.test' }))).status, 403);
    assert.equal((await GET(req('', token(idA), { 'sec-fetch-site': 'cross-site' }))).status, 403);
    assert.equal(calls.length, 0);
    const a = await GET(req('', token(idA))), b = await GET(req('', token(idB)));
    assert.equal(a.status, 200); assert.equal(a.headers.get('cache-control'), 'no-store');
    const dtoA = await a.json(), dtoB = await b.json();
    assert.equal(dtoA.totals.questions, 1); assert.equal(dtoB.totals.questions, 0);
    assert.deepEqual(Object.keys(dtoA).sort(), ['ambiguity', 'limitations', 'objectives', 'topics', 'totals', 'window']);
    for (const value of [idA, idB, event.sessionId, qid, 'correctAnswer', 'selectedAnswer', 'explanation']) assert.ok(!JSON.stringify(dtoA).includes(value));
    assert.deepEqual(calls, [idA, idB]);
    globalThis.__activityRouteFail = true;
    const failed = await GET(req('', token(idA)));
    assert.equal(failed.status, 502); assert.equal(failed.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await failed.json(), { error: 'unavailable' });
    globalThis.__activityRouteFail = 'corrupt';
    assert.deepEqual(await (await GET(req('', token(idA)))).json(), { error: 'unavailable' });
    process.env.TWILIO_API_KEY_SECRET = '';
    const unavailable = await GET(req('', token(idA)));
    assert.equal(unavailable.status, 503); assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  } finally {
    hooks.deregister(); delete globalThis.__activityRouteTest; delete globalThis.__activityRouteFail;
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('real route and reader enforce pause, learner isolation, pagination and ambiguity with a synthetic provider', async () => {
  const values = { TWILIO_ACCOUNT_SID: 'AC' + '0'.repeat(32), TWILIO_API_KEY_SID: 'SK' + '1'.repeat(32), TWILIO_API_KEY_SECRET: 'synthetic',
    TWILIO_SYNC_SERVICE_SID: 'IS' + '2'.repeat(32), TWILIO_VERIFY_SERVICE_SID: 'VA' + '3'.repeat(32),
    LEARNER_SESSION_SECRET: 'synthetic-session-secret-'.repeat(2), LEARNER_ALLOWED_PHONES: '+12025550101' };
  const old = Object.fromEntries(Object.keys(values).map(k => [k, process.env[k]]));
  Object.assign(process.env, values);
  const id = learnerId('+12025550101', values.LEARNER_SESSION_SECRET);
  const sitting = { topicId: 'n10-ch7', at: event.at, correct: 1, total: 1, questionIds: [qid], missedIds: [] };
  const entries = [...snapshot({ ...progress, quizAttempts: [sitting] }), { key: 'telemetry-event-1', data: { e: event, secret: 'PRIVATE-PROVIDER' } }];
  for (let i = 0; i < 205; i++) entries.push({ key: `orphan-${String(i).padStart(4, '0')}`, data: {} });
  const calls = [];
  let paused = true;
  const hooks = registerHooks({ resolve(specifier, context, next) {
    if (specifier === '@/lib/learner/activity.mjs' && context.parentURL?.includes('/api/learner/activity/route.ts?real-provider-test')) {
      return { shortCircuit: true, url: new URL('../lib/learner/activity.mjs', import.meta.url).href };
    }
    return next(specifier, context);
  } });
  const original = twilio.Twilio.prototype.request;
  twilio.Twilio.prototype.request = async ({ method, uri, params = {} }) => {
    const url = new URL(uri); calls.push({ method, path: url.pathname, page: url.searchParams.get('PageToken') });
    assert.equal(method.toUpperCase(), 'GET', 'synthetic transport forbids writes');
    const reply = (statusCode, body) => ({ statusCode, body, headers: {} });
    if (url.pathname.includes('/Documents/')) return reply(200, { data: { MULTIPLAYER_PAUSED: paused }, revision: 'r' });
    const match = url.pathname.match(/\/Maps\/([^/]+)\/Items(?:\/([^/]+))?$/);
    assert.ok(match); assert.equal(match[1], `learner-${id}`);
    if (match[2]) {
      const entry = entries.find(item => item.key === decodeURIComponent(match[2]));
      return entry ? reply(200, entry) : reply(404, { code: 20404, message: 'missing' });
    }
    const start = Number(url.searchParams.get('PageToken') ?? 0), size = Number(params.PageSize ?? url.searchParams.get('PageSize') ?? 100);
    const page = entries.slice(start, start + size);
    url.searchParams.set('PageToken', String(start + size)); url.searchParams.set('PageSize', String(size));
    return reply(200, { items: page, meta: { key: 'items', next_page_url: start + size < entries.length ? url.href : null } });
  };
  try {
    const { GET } = await import('../app/api/learner/activity/route.ts?real-provider-test');
    const token = signSession({ id, last4: '0101', exp: Date.now() + 60000 }, values.LEARNER_SESSION_SECRET);
    const req = path => new Request(`https://example.test/api/learner/activity${path}`, { headers: { cookie: `learner_session=${token}` } });
    assert.equal((await GET(req('?mapId=other'))).status, 400);
    assert.equal(calls.length, 0);
    const stopped = await GET(req(''));
    assert.equal(stopped.status, 423); assert.equal(stopped.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await stopped.json(), { error: 'paused' });
    assert.equal(calls.length, 1); assert.ok(calls[0].path.includes('/Documents/'));
    paused = false; calls.length = 0;
    const response = await GET(req(''));
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    const dto = await response.json();
    assert.deepEqual(dto.totals, { questions: 1, attempts: 1, correct: 0, incorrect: 0 });
    assert.equal(dto.ambiguity.count, 1);
    assert.ok(calls.some(call => Number(call.page) >= 200));
    for (const secret of [id, qid, event.sessionId, 'PRIVATE-PROVIDER', token, values.TWILIO_API_KEY_SECRET, 'selectedAnswer', 'correctAnswer']) assert.ok(!JSON.stringify(dto).includes(secret));
  } finally {
    hooks.deregister();
    twilio.Twilio.prototype.request = original;
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
