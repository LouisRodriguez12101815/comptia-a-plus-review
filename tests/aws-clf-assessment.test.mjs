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
  assert.equal(assessAwsClf({ ...empty, quizAttempts: [quiz(['a'])] }, pool, questions)[0].state, 'insufficient');
});

test('classifies only distinct mapped questions and excludes other exams', () => {
  const progress = { ...empty, quizAttempts: [quiz(['a', 'a', 'b', 'c'], ['a', 'b'])], mockAttempts: [{ exam: 'saa-c03', questionIds: ['saa'], missedIds: [], at: 2 }] };
  const row = assessAwsClf(progress, pool, questions)[0];
  assert.equal(row.distinctQuestions, 3);
  assert.equal(row.totalAnswers, 4);
  assert.equal(row.accuracy, 25);
  assert.equal(row.state, 'weak');
});

test('uses persisted mock objective mappings and ignores stale bank versions', () => {
  const mock = { exam: 'clf-c02', bankVersion: 'old', questionIds: ['a', 'b', 'c'], objectiveByQuestion: { a: '1.1', b: '1.1', c: '1.1' }, missedIds: [], correctIds: ['a', 'b', 'c'], at: 1 };
  assert.equal(assessAwsClf({ ...empty, mockAttempts: [mock] }, pool, questions, 'new')[0].state, 'not-assessed');
  assert.equal(assessAwsClf({ ...empty, mockAttempts: [{ ...mock, bankVersion: 'new' }] }, pool, questions, 'new')[0].state, 'strong');
});
