import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgress } from '../lib/progress.ts';

const good = { studyFocus: 'all', knownCards: { a: true }, unknownCards: { b: true }, quizAttempts: [{ topicId: 't', correct: 3, total: 4, missedIds: ['q1'], at: 1 }], schedules: {} };

test('Class 10: clean saved progress loads with no problems', () => {
  const r = parseProgress(JSON.stringify(good));
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.progress.knownCards, { a: true });
  assert.equal(r.progress.quizAttempts.length, 1);
});

test('Class 10: nothing saved yet is not a problem', () => {
  assert.deepEqual(parseProgress(null).problems, []);
  assert.deepEqual(parseProgress('').problems, []);
});

test('Class 10: text that is not JSON is caught and reported as unreadable', () => {
  for (const raw of ['{not json', 'undefined', '{"knownCards":']) {
    const r = parseProgress(raw);
    assert.deepEqual(r.problems, ['unreadable']);
    assert.deepEqual(r.progress.quizAttempts, []);
  }
});

test('Class 10: valid JSON of the wrong shape is unreadable, not a crash', () => {
  for (const raw of ['null', '42', '"text"', '[1,2]']) assert.deepEqual(parseProgress(raw).problems, ['unreadable']);
});

test('Class 10: damaged fields are skipped, the rest is kept, and it is reported', () => {
  const r = parseProgress(JSON.stringify({ ...good, knownCards: 'oops', quizAttempts: [good.quizAttempts[0], { topicId: 5 }, { topicId: 't', correct: 1, total: 0, missedIds: [], at: 2 }], schedules: [] }));
  assert.deepEqual(r.problems, ['repaired']);
  assert.deepEqual(r.progress.knownCards, {});
  assert.deepEqual(r.progress.unknownCards, { b: true });
  assert.equal(r.progress.quizAttempts.length, 1);
  assert.deepEqual(r.progress.schedules, {});
});

test('Class 10: older saves missing newer fields load cleanly', () => {
  const r = parseProgress(JSON.stringify({ studyFocus: 'all', knownCards: {}, unknownCards: {}, quizAttempts: [] }));
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.progress.schedules, {});
});
