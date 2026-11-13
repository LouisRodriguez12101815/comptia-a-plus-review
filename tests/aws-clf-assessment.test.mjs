import test from 'node:test';
import assert from 'node:assert/strict';
import { assessAwsClf } from '../lib/aws-clf-assessment.ts';

const questions = [
  { id: 'a', examCodes: ['clf-c02'], objectiveIds: { 'clf-c02': ['1.1'] }, choices: ['a'], answer: 0, prompt: 'a', explanation: '' },
  { id: 'b', examCodes: ['clf-c02'], objectiveIds: { 'clf-c02': ['1.1'] }, choices: ['b'], answer: 0, prompt: 'b', explanation: '' },
  { id: 'c', examCodes: ['clf-c02'], objectiveIds: { 'clf-c02': ['1.1'] }, choices: ['c'], answer: 0, prompt: 'c', explanation: '' },
  { id: 'saa', examCodes: ['saa-c03'], objectiveIds: { 'saa-c03': ['1.1'] }, choices: ['s'], answer: 0, prompt: 's', explanation: '' },
];
const pool = { domains: [{ id: '1.0', title: 'Cloud Concepts', objectives: [
  { id: '1.1', title: 'Benefits', questionIds: ['a', 'b', 'c'] },
  { id: '1.2', title: 'Design', questionIds: [] },
] }] };
const empty = { quizAttempts: [], mockAttempts: [] };
const quiz = (ids, missed = [], at = 1) => ({ topicId: 'aws-clf', questionIds: ids, missedIds: missed, correct: ids.length - missed.length, total: ids.length, at });

test('returns every objective and conservative empty/limited states', () => {
  const rows = assessAwsClf(empty, pool, questions);
  assert.deepEqual(rows.map((row) => row.objectiveId), ['1.1', '1.2']);
  assert.equal(rows[0].state, 'not-assessed');
  assert.equal(rows[1].state, 'not-assessed');
  assert.equal(assessAwsClf({ ...empty, quizAttempts: [{ ...quiz(['a']), exam: 'clf-c02', bankVersion: 'current' }] }, pool, questions, 'current')[0].state, 'insufficient');
});

test('latest result per distinct question prevents repeated practice from inflating accuracy', () => {
  const progress = { ...empty, quizAttempts: [{ ...quiz(['a', 'a', 'a', 'a', 'b', 'c'], ['a', 'b', 'c']), exam: 'clf-c02', bankVersion: 'current' }] };
  const row = assessAwsClf(progress, pool, questions, 'current')[0];
  assert.equal(row.distinctQuestions, 3);
  assert.equal(row.totalAnswers, 6);
  assert.equal(row.accuracy, 0);
  assert.equal(row.state, 'weak');
});

test('latest valid result wins and timestamp ties use input order deterministically', () => {
  const progress = { ...empty, quizAttempts: [
    { ...quiz(['a'], ['a'], 10), exam: 'clf-c02', bankVersion: 'current' },
    { ...quiz(['a'], [], 10), exam: 'clf-c02', bankVersion: 'current' },
    { ...quiz(['b'], [], 11), exam: 'clf-c02', bankVersion: 'current' },
    { ...quiz(['c'], [], 12), exam: 'clf-c02', bankVersion: 'current' },
  ] };
  const row = assessAwsClf(progress, pool, questions, 'current')[0];
  assert.equal(row.accuracy, 100);
});

test('shared CLF/SAA questions require explicit CLF provenance', () => {
  const shared = { id: 'shared', examCodes: ['clf-c02', 'saa-c03'], objectiveIds: { 'clf-c02': ['1.1'] }, choices: ['x'], answer: 0, prompt: 'shared', explanation: '' };
  const sharedPool = { domains: [{ id: '1.0', title: 'Cloud', objectives: [{ id: '1.1', title: 'Benefits', questionIds: ['shared'] }] }] };
  const legacy = { ...empty, quizAttempts: [quiz(['shared'], [], 1)] };
  assert.equal(assessAwsClf(legacy, sharedPool, [shared], 'current')[0].distinctQuestions, 0);
  const saa = { ...empty, quizAttempts: [{ ...quiz(['shared'], [], 1), exam: 'saa-c03', bankVersion: 'saa' }] };
  assert.equal(assessAwsClf(saa, sharedPool, [shared], 'current')[0].distinctQuestions, 0);
  const clf = { ...empty, quizAttempts: [{ ...quiz(['shared'], [], 1), exam: 'clf-c02', bankVersion: 'current' }] };
  assert.equal(assessAwsClf(clf, sharedPool, [shared], 'current')[0].distinctQuestions, 1);
});

test('legacy and stale quiz records remain preserved but cannot establish current evidence', () => {
  const progress = { ...empty, quizAttempts: [
    quiz(['a', 'b', 'c'], [], 1),
    { ...quiz(['a', 'b', 'c'], [], 2), exam: 'clf-c02', bankVersion: 'old' },
  ] };
  assert.equal(assessAwsClf(progress, pool, questions, 'current')[0].state, 'not-assessed');
});

test('uses persisted mock objective mappings and ignores stale bank versions', () => {
  const mock = { exam: 'clf-c02', bankVersion: 'old', questionIds: ['a', 'b', 'c'], objectiveByQuestion: { a: '1.1', b: '1.1', c: '1.1' }, missedIds: [], correctIds: ['a', 'b', 'c'], at: 1 };
  assert.equal(assessAwsClf({ ...empty, mockAttempts: [mock] }, pool, questions, 'new')[0].state, 'not-assessed');
  assert.equal(assessAwsClf({ ...empty, mockAttempts: [{ ...mock, bankVersion: 'new' }] }, pool, questions, 'new')[0].state, 'strong');
});
