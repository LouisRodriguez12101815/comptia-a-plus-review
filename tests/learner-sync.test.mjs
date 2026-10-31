import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress } from '../lib/learner/merge.ts';
import { learnerId, normalizePhone, readSession, signSession, cookieValue } from '../lib/learner/session.ts';
import { loadRemote, saveRemote, splitChunks } from '../lib/learner/store.ts';
import { learnerConfig } from '../lib/learner/twilio.ts';

const empty = () => ({ studyFocus: 'n10-009', knownCards: {}, unknownCards: {}, quizAttempts: [], mockAttempts: [], schedules: {} });
const sched = (iso) => ({ due: iso, last_review: iso, stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 1, reps: 1, lapses: 0, state: 2 });
const quiz = (at, topicId = 't') => ({ topicId, correct: 1, total: 2, missedIds: [], at });

test('newest review of each card wins, either direction', () => {
  const a = { ...empty(), knownCards: { c1: true }, schedules: { c1: sched('2026-10-01T00:00:00.000Z') } };
  const b = { ...empty(), unknownCards: { c1: true }, schedules: { c1: sched('2026-10-02T00:00:00.000Z') } };
  const m1 = mergeProgress(a, b), m2 = mergeProgress(b, a);
  for (const m of [m1, m2]) { assert.deepEqual(m.unknownCards, { c1: true }); assert.deepEqual(m.knownCards, {}); assert.equal(m.schedules.c1.last_review, '2026-10-02T00:00:00.000Z'); }
});

test('cards only on one side are kept; attempts combine without duplicates', () => {
  const a = { ...empty(), knownCards: { a: true }, quizAttempts: [quiz(3), quiz(1)] };
  const b = { ...empty(), unknownCards: { b: true }, quizAttempts: [quiz(3), quiz(2)] };
  const m = mergeProgress(a, b);
  assert.deepEqual(m.knownCards, { a: true });
  assert.deepEqual(m.unknownCards, { b: true });
  assert.deepEqual(m.quizAttempts.map((q) => q.at), [3, 2, 1]);
});

test('merging with an empty copy changes nothing', () => {
  const a = { ...empty(), knownCards: { a: true }, quizAttempts: [quiz(5)] };
  assert.deepEqual(mergeProgress(a, empty()), a);
  assert.deepEqual(mergeProgress(empty(), a), { ...a });
});

test('attempt caps hold', () => {
  const many = Array.from({ length: 60 }, (_, i) => quiz(i + 1, 'x'));
  assert.equal(mergeProgress({ ...empty(), quizAttempts: many }, empty()).quizAttempts.length, 40);
});

test('phone numbers normalise and ids never contain the number', () => {
  assert.equal(normalizePhone('(305) 555-0123'), '+13055550123');
  assert.equal(normalizePhone('+44 20 7946 0958'), '+442079460958');
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone(42), null);
  const id = learnerId('+13055550123', 's'.repeat(40));
  assert.match(id, /^[0-9a-f]{40}$/);
  assert.ok(!id.includes('3055550123'));
});

test('session cookie: valid, tampered, expired, wrong secret', () => {
  const secret = 'k'.repeat(40), id = 'a'.repeat(40), now = 1_000_000;
  const token = signSession({ id, last4: '0123', exp: now + 1000 }, secret);
  assert.equal(readSession(token, secret, now)?.id, id);
  assert.equal(readSession(token, 'z'.repeat(40), now), null);
  assert.equal(readSession(token.slice(0, -2) + 'xx', secret, now), null);
  assert.equal(readSession(token, secret, now + 2000), null);
  assert.equal(readSession(undefined, secret, now), null);
  assert.equal(cookieValue('a=1; learner_session=abc.def', 'learner_session'), 'abc.def');
});

function fakeMap() {
  const items = new Map();
  return { items,
    async list() { return [...items].map(([key, data]) => ({ key, data })); },
    async set(key, data) { items.set(key, data); }, async remove(key) { items.delete(key); }, async removeAll() { items.clear(); } };
}

test('large progress round-trips through chunked map items and shrinks cleanly', async () => {
  const map = fakeMap();
  const big = { ...empty(), knownCards: Object.fromEntries(Array.from({ length: 2500 }, (_, i) => [`card-${i}`, true])) };
  assert.ok(splitChunks(JSON.stringify(big)).length > 1);
  await saveRemote(map, big);
  for (const v of map.items.values()) assert.ok(JSON.stringify(v).length < 16 * 1024);
  assert.deepEqual((await loadRemote(map)).knownCards, big.knownCards);
  await saveRemote(map, empty());
  assert.equal(map.items.size, 1);
  assert.deepEqual((await loadRemote(map)).knownCards, {});
  assert.equal(await loadRemote(fakeMap()), null);
});

test('sync stays off unless every variable is present and well formed', () => {
  const ok = { TWILIO_ACCOUNT_SID: 'AC' + 'a'.repeat(32), TWILIO_API_KEY_SID: 'SK' + 'a'.repeat(32), TWILIO_API_KEY_SECRET: 'x', TWILIO_SYNC_SERVICE_SID: 'IS' + 'a'.repeat(32), TWILIO_VERIFY_SERVICE_SID: 'VA' + 'a'.repeat(32), LEARNER_SESSION_SECRET: 'q'.repeat(32) };
  assert.ok(learnerConfig(ok));
  for (const k of Object.keys(ok)) assert.equal(learnerConfig({ ...ok, [k]: '' }), null, k);
  assert.equal(learnerConfig({ ...ok, LEARNER_SESSION_SECRET: 'short' }), null);
});
