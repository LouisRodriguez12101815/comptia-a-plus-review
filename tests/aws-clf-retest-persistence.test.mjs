import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress } from '../lib/learner/merge.ts';
import { parseProgress } from '../lib/progress.ts';

const snapshot = (id, at) => ({ id, kind: 'baseline', at, bankVersion: 'v1', objectives: { '1.1': { accuracy: 50, distinctQuestions: 3, evidence: 'provisional', state: 'developing', questionEvidence: [] } } });

test('old progress parses without snapshots and new snapshots round-trip', () => {
  const old = parseProgress(JSON.stringify({ studyFocus: 'clf-c02', knownCards: {}, unknownCards: {}, quizAttempts: [], mockAttempts: [], schedules: {} }));
  assert.deepEqual(old.problems, []);
  assert.equal(old.progress.clfAssessmentSnapshots, undefined);
  const next = parseProgress(JSON.stringify({ ...old.progress, clfAssessmentSnapshots: [snapshot('baseline-1', 1)] }));
  assert.deepEqual(next.problems, []);
  assert.equal(next.progress.clfAssessmentSnapshots[0].id, 'baseline-1');
});

test('snapshot synchronization is deduplicated and bounded', () => {
  const base = parseProgress(null).progress;
  const local = { ...base, clfAssessmentSnapshots: [snapshot('same', 2), snapshot('local', 3)] };
  const remote = { ...base, clfAssessmentSnapshots: [snapshot('same', 1), snapshot('remote', 4)] };
  const merged = mergeProgress(local, remote);
  assert.equal(merged.clfAssessmentSnapshots.length, 3);
  assert.equal(merged.clfAssessmentSnapshots.filter((item) => item.id === 'same').length, 1);
});
