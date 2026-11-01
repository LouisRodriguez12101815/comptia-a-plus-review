import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { configuration, decodeProgress, exportHistory, runExport } from '../scripts/export-primary-history.mjs';

const env = {
  TWILIO_ACCOUNT_SID: `AC${'0'.repeat(32)}`, TWILIO_API_KEY_SID: `SK${'1'.repeat(32)}`,
  TWILIO_API_KEY_SECRET: 'synthetic-key', TWILIO_SYNC_SERVICE_SID: `IS${'2'.repeat(32)}`,
  LEARNER_SESSION_SECRET: 'synthetic-session-secret-'.repeat(2), LEARNER_ALLOWED_PHONES: '+12025550101',
};
const content = {
  questions: [{ id: 'q-test', topicId: 'n10-test' }, { id: 'q-other', topicId: 'other' }],
  topics: [{ id: 'n10-test', examCodes: ['n10-009'] }, { id: 'other', examCodes: ['220-1201'] }],
  objectives: { exams: [{ code: 'n10-009', domains: [{ objectives: [{ id: '1.1', topics: ['n10-test'] }] }] }] },
};
const sitting = { total: 1, correct: 0, questionIds: ['q-test'], missedIds: ['q-test'], at: 1700000000000 };
const progress = { quizAttempts: [sitting], mockAttempts: [], schedules: { 'fc-test': { state: 2, privateField: 'do not export' } }, phone: 'do not export' };
const itemsFor = p => [{ key: 'progress-0', data: { s: JSON.stringify(p) } }];

test('requires unambiguous allowlisted primary selection and uses application HMAC', () => {
  assert.match(configuration(env).mapName, /^learner-[a-f0-9]{40}$/);
  assert.throws(() => configuration({ ...env, LEARNER_ALLOWED_PHONES: '+12025550101,+12025550102' }));
  assert.throws(() => configuration({ ...env, LEARNER_PRIMARY_PHONE: '+12025550102' }));
  assert.equal(configuration({ ...env, LEARNER_PRIMARY_PHONE: '2025550101' }).mapName, configuration(env).mapName);
});

test('rejects missing, discontinuous, duplicate, corrupt, and malformed chunks', () => {
  assert.deepEqual(decodeProgress(itemsFor(progress)), { ...progress, questionEvents: [] });
  for (const items of [[], [{ key: 'progress-1', data: { s: '{}' } }], [...itemsFor(progress), ...itemsFor(progress)], [{ key: 'progress-0', data: { s: '{' } }], itemsFor({ quizAttempts: {} })]) assert.throws(() => decodeProgress(items));
});

test('exports allowlisted fields only, excludes non-Network+ and never attaches flashcard FSRS', () => {
  const p = structuredClone(progress);
  p.quizAttempts.push({ ...sitting, questionIds: ['q-other'], missedIds: ['q-other'] });
  const result = exportHistory(p, content);
  assert.deepEqual(result.rows, [{ questionId: 'q-test', objective: '1.1', correct: false, timestamp: new Date(sitting.at).toISOString(), fsrsState: null }]);
  assert.deepEqual(p.schedules, progress.schedules);
  assert.equal(JSON.stringify(result).includes('do not export'), false);
});

test('old/incomplete sittings are omitted; inconsistent grading rejected; duplicate rows collapse', () => {
  const old = { total: 4, correct: 3, missedIds: ['q-test'], at: sitting.at };
  assert.equal(exportHistory({ quizAttempts: [old] }, content).omittedSittings, 1);
  for (const change of [{ correct: 1 }, { missedIds: ['unknown'] }, { at: Infinity }]) assert.throws(() => exportHistory({ quizAttempts: [{ ...sitting, ...change }] }, content));
  assert.equal(exportHistory({ quizAttempts: [sitting, sitting] }, content).rows.length, 1);
});

test('ambiguous topic mappings stay null; valid mock draw resolves them', () => {
  const c = structuredClone(content);
  c.objectives.exams[0].domains[0].objectives.push({ id: '1.2', topics: ['n10-test'] });
  assert.equal(exportHistory(progress, c).rows[0].objective, null);
  const p = { mockAttempts: [{ ...sitting, exam: 'n10-009', objectiveByQuestion: { 'q-test': '1.2' } }] };
  assert.equal(exportHistory(p, c).rows[0].objective, '1.2');
  p.mockAttempts[0].objectiveByQuestion['q-test'] = '9.9';
  assert.throws(() => exportHistory(p, c));
});

test('runner reads exactly one map, only lists, refuses overwrite, suppresses provider PII', async () => {
  await mkdir('work', { recursive: true });
  const root = await mkdtemp(resolve('work/export-test-'));
  try {
    await mkdir(resolve(root, 'content'));
    await writeFile(resolve(root, '.env.local'), Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'));
    for (const [name, data] of Object.entries({ ...content, topics: content.topics, 'topics-network-plus': [] })) await writeFile(resolve(root, 'content', `${name}.json`), JSON.stringify(data));
    let reads = 0;
    const messages = [];
    const clientFactory = (_key, _secret, options) => {
      assert.equal(options.logLevel, 'silent');
      return { sync: { v1: { services: () => ({ syncMaps: name => {
        assert.equal(name, configuration(env).mapName);
        return { syncMapItems: { list: async options => { assert.deepEqual(options, { pageSize: 100 }); reads++; return itemsFor(progress); } } };
      } }) } } };
    };
    const deps = { root, clientFactory, log: x => messages.push(x), error: x => messages.push(x) };
    assert.equal(await runExport([], deps), 0);
    const before = await readFile(resolve(root, 'data/primary-history.json'), 'utf8');
    assert.equal(JSON.parse(before).length, 1);
    assert.equal(reads, 1);
    assert.equal(await runExport([], deps), 1);
    assert.equal(await readFile(resolve(root, 'data/primary-history.json'), 'utf8'), before);
    assert.equal(await runExport([], { ...deps, clientFactory: () => { throw new Error('private phone and token'); } }), 1);
    assert.equal(messages.join('\n').includes('private phone and token'), false);
    for (const value of Object.values(env)) assert.equal(messages.join('\n').includes(value), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});


test('timed-out mock exports only visited questions and never counts unvisited misses', () => {
  const p = { mockAttempts: [{ ...sitting, exam: 'n10-009', total: 3, correct: 1, questionIds: ['q-test'], correctIds: ['q-test'], missedIds: ['q-unvisited-1', 'q-unvisited-2'] }] };
  const result = exportHistory(p, content);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].correct, true);
  assert.equal(result.omittedUnvisitedQuestions, 2);
  delete p.mockAttempts[0].correctIds;
  assert.equal(exportHistory(p, content).omittedSittings, 1);
  assert.equal(exportHistory(p, content).rows.length, 0);
});


test('documented progress/history items strip profile, schedules and run fields', () => {
  const items = [
    { key: 'profile', data: { displayName: 'synthetic private marker' } },
    { key: 'progress', data: progress },
    { key: 'schedules-0', data: { 'fc-test': { state: 2 } } },
    { key: 'run:synthetic', data: { secretMarker: 'never export' } },
    { key: 'history', data: { events: [{ questionId: 'q-test', objective: '1.1', correct: false, timestamp: sitting.at, fsrsState: 2, learnerId: 'never export' }] } },
  ];
  const result = exportHistory(decodeProgress(items), content);
  assert.deepEqual(result.rows, [{ questionId: 'q-test', objective: '1.1', correct: false, timestamp: new Date(sitting.at).toISOString(), fsrsState: 2 }]);
  assert.throws(() => decodeProgress([...items, ...itemsFor(progress)]));
  assert.throws(() => decodeProgress([{ key: 'progress', data: {} }]));
  assert.throws(() => decodeProgress([{ key: 'history', data: { unknownSchema: [] } }]));
});

test('history-only question events are supported; aggregate events are never turned into attempts', () => {
  const events = [{ questionId: 'q-test', correct: true, timestamp: sitting.at }, { type: 'quiz', correct: 8, total: 10, timestamp: sitting.at }];
  const result = exportHistory(decodeProgress([{ key: 'history', data: events }]), content);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].fsrsState, null);
  assert.equal(result.rows[0].correct, true);
  assert.equal(result.omittedHistoryEvents, 1);
  assert.throws(() => exportHistory({ questionEvents: [{ ...events[0], fsrsState: { privateMarker: 'must not escape' } }] }, content));
});

test('progress/history conflicts fail safely and same-time duplicate outcomes collapse', () => {
  const event = { questionId: 'q-test', correct: true, timestamp: sitting.at };
  assert.throws(() => exportHistory({ ...progress, questionEvents: [event] }, content));
  const duplicate = { ...event, correct: false };
  assert.equal(exportHistory({ ...progress, questionEvents: [duplicate] }, content).rows.length, 1);
});
