import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgress, questionHistory } from '../lib/progress.ts';

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

test('quiz attempts keep their question ids, and history lists them oldest sitting first', () => {
  const saved = {
    ...good,
    quizAttempts: [
      { topicId: 't', correct: 1, total: 2, questionIds: ['q3', 'q4'], missedIds: ['q4'], at: 30 },
      { topicId: 't', correct: 1, total: 1, missedIds: [], at: 10 },
    ],
    mockAttempts: [{ exam: '220-1202', full: false, correct: 1, total: 2, percent: 50, domains: [], multiCorrect: 0, multiTotal: 0, questionIds: ['q1', 'q2'], missedIds: ['q2'], at: 20 }],
  };
  const { progress, problems } = parseProgress(JSON.stringify(saved));
  assert.deepEqual(problems, []);
  assert.deepEqual(questionHistory(progress), ['q1', 'q2', 'q3', 'q4']);
});
