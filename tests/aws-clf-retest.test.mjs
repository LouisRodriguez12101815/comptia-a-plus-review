import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSnapshots, snapshotFromAssessment } from '../lib/aws-clf-retest.ts';

const row = (id, accuracy, evidence) => ({ objectiveId: id, domainId: '1.0', domainTitle: 'Cloud', title: id, totalAnswers: evidence.length, distinctQuestions: evidence.length, correctAnswers: evidence.filter((item) => item.correct).length, accuracy, recentAccuracy: accuracy, evidence: 'provisional', state: 'developing', questionEvidence: evidence });

test('baseline snapshots preserve question evidence and compare only new questions', () => {
  const baseline = snapshotFromAssessment([row('1.1', 0, [{ questionId: 'a', correct: false, at: 10 }, { questionId: 'b', correct: false, at: 10 }, { questionId: 'c', correct: false, at: 10 }])], 'baseline', 'v1', 10);
  const retest = snapshotFromAssessment([row('1.1', 50, [{ questionId: 'a', correct: true, at: 20 }, { questionId: 'b', correct: false, at: 10 }, { questionId: 'c', correct: false, at: 10 }, { questionId: 'd', correct: true, at: 20 }, { questionId: 'e', correct: false, at: 20 }])], 'retest', 'v1', 20, baseline.id);
  const result = compareSnapshots(baseline, retest)[0];
  assert.equal(result.newDistinctQuestions, 2);
  assert.equal(result.repeatedQuestions, 1);
  assert.equal(result.retestAccuracy, 50);
  assert.equal(result.outcome, 'improved');
});

test('repeated questions alone cannot establish improvement', () => {
  const baseline = snapshotFromAssessment([row('1.1', 0, [{ questionId: 'a', correct: false, at: 10 }, { questionId: 'b', correct: false, at: 10 }, { questionId: 'c', correct: false, at: 10 }])], 'baseline', 'v1', 10);
  const retest = snapshotFromAssessment([row('1.1', 100, [{ questionId: 'a', correct: true, at: 20 }, { questionId: 'b', correct: true, at: 20 }, { questionId: 'c', correct: true, at: 20 }])], 'retest', 'v1', 20, baseline.id);
  const result = compareSnapshots(baseline, retest)[0];
  assert.equal(result.newDistinctQuestions, 0);
  assert.equal(result.retestAccuracy, null);
  assert.equal(result.outcome, 'insufficient');
});

test('mismatched baseline, retest, or bank fingerprint is insufficient', () => {
  const baseline = snapshotFromAssessment([row('1.1', 0, [{ questionId: 'a', correct: false, at: 10 }])], 'baseline', 'v1', 10);
  const retest = snapshotFromAssessment([row('1.1', 100, [{ questionId: 'b', correct: true, at: 20 }])], 'retest', 'v2', 20, baseline.id);
  const result = compareSnapshots(baseline, retest)[0];
  assert.equal(result.outcome, 'insufficient');
  assert.equal(result.incompatible, true);
});

test('persisted retest comparison is stable and retests cannot cross baselines', () => {
  const baselineA = snapshotFromAssessment([row('1.1', 0, [{ questionId: 'a', correct: false, at: 10 }])], 'baseline', 'v1', 10);
  const baselineB = snapshotFromAssessment([row('1.1', 100, [{ questionId: 'z', correct: true, at: 20 }])], 'baseline', 'v1', 20);
  const retestA = snapshotFromAssessment([row('1.1', 100, [{ questionId: 'a', correct: false, at: 10 }, { questionId: 'b', correct: true, at: 30 }])], 'retest', 'v1', 30, baselineA.id);
  const original = compareSnapshots(baselineA, retestA)[0];
  assert.equal(original.outcome, 'improved');
  assert.equal(compareSnapshots(baselineB, retestA)[0].outcome, 'insufficient');
  assert.equal(compareSnapshots(baselineA, retestA)[0].retestAccuracy, original.retestAccuracy);
});
