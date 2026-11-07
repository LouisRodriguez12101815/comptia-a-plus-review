import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgress } from '../lib/progress.ts';
import { wrongChoiceForAttempt, wrongChoicesForQuiz } from '../lib/quiz-answer-history.ts';

const question = { id: 'q1', topicId: 't1', prompt: 'Prompt', choices: ['authored A', 'authored B', 'authored C'], answer: 0, explanation: 'Why', examCodes: ['n10-009'] };
const base = { studyFocus: 'n10-009', knownCards: {}, unknownCards: {}, mockAttempts: [], schedules: {} };

test('preserves authored wrong-choice indices after display shuffling', () => {
  assert.equal(wrongChoiceForAttempt(question, [2, 0, 1], 1), 0);
  assert.deepEqual(wrongChoicesForQuiz([question], { q1: 0 }, { q1: [2, 0, 1] }), { q1: 2 });
  assert.equal(wrongChoiceForAttempt({ ...question, answer: [0, 1] }, [2, 0, 1], [1, 2]), undefined);
});

test('repairs malformed optional quiz answer details without dropping the attempt', () => {
  const raw = JSON.stringify({ ...base, quizAttempts: [{ topicId: 't1', correct: 0, total: 1, missedIds: ['q1'], at: 1, questionIds: ['q1'], wrongChoices: { q1: -1, q2: 2 }, selectedChoices: 'bad' }] });
  const parsed = parseProgress(raw);
  assert.equal(parsed.progress.quizAttempts.length, 1);
  assert.deepEqual(parsed.progress.quizAttempts[0].wrongChoices, { q2: 2 });
  assert.equal(parsed.progress.quizAttempts[0].selectedChoices, undefined);
  assert.deepEqual(parsed.problems, ['repaired']);
});
