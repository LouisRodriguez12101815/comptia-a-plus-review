import test from 'node:test';
import assert from 'node:assert/strict';
import { compareWithBaseline, snapshotFromAssessment } from '../lib/aws-clf-retest.ts';

const row = (id, accuracy, evidence) => ({ objectiveId: id, domainId: '1.0', domainTitle: 'Cloud', title: id, totalAnswers: evidence.length, distinctQuestions: evidence.length, correctAnswers: evidence.filter((item) => item.correct).length, accuracy, recentAccuracy: accuracy, evidence: 'provisional', state: 'developing', questionEvidence: evidence });

test('baseline snapshots preserve question evidence and compare only new questions', () => {
  const baseline = snapshotFromAssessment([row('1.1', 0, [{ questionId: 'a', correct: false, at: 10 }, { questionId: 'b', correct: false, at: 10 }, { questionId: 'c', correct: false, at: 10 }])], 'baseline', 'v1', 10);
  const current = [row('1.1', 50, [{ questionId: 'a', correct: true, at: 20 }, { questionId: 'b', correct: false, at: 10 }, { questionId: 'c', correct: false, at: 10 }, { questionId: 'd', correct: true, at: 20 }, { questionId: 'e', correct: false, at: 20 }])];
  const result = compareWithBaseline(baseline, current)[0];
  assert.equal(result.newDistinctQuestions, 2);
  assert.equal(result.repeatedQuestions, 1);
  assert.equal(result.retestAccuracy, 50);
  assert.equal(result.outcome, 'improved');
});

test('repeated questions alone cannot establish improvement', () => {
  const baseline = snapshotFromAssessment([row('1.1', 0, [{ questionId: 'a', correct: false, at: 10 }, { questionId: 'b', correct: false, at: 10 }, { questionId: 'c', correct: false, at: 10 }])], 'baseline', 'v1', 10);
  const current = [row('1.1', 100, [{ questionId: 'a', correct: true, at: 20 }, { questionId: 'b', correct: true, at: 20 }, { questionId: 'c', correct: true, at: 20 }])];
  const result = compareWithBaseline(baseline, current)[0];
  assert.equal(result.newDistinctQuestions, 0);
  assert.equal(result.retestAccuracy, null);
  assert.equal(result.outcome, 'insufficient');
});
