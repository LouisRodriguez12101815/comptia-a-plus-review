import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildExamPool, draftFocused, draftTest, mulberry32 } from '../lib/exam-test.mjs';
import { objectiveTopicMap, questionObjectiveIds } from '../lib/question-objectives.mjs';
import { auditQuestionObjectives } from '../scripts/audit-n10-question-objectives.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const objectives = read('content/objectives.json');
const questions = read('content/questions.json');
const topics = [...read('content/topics.json'), ...read('content/topics-network-plus.json')];
const n10 = objectives.exams.find((exam) => exam.code === 'n10-009');

test('every explicit N10-009 objective ID exists in the matrix', () => {
  const ids = new Set(n10.domains.flatMap((domain) => domain.objectives.map((objective) => objective.id)));
  for (const question of questions) for (const id of question.objectiveIds?.['n10-009'] ?? []) assert.ok(ids.has(id), `${question.id}: ${id}`);
});

test('explicit question mapping wins over broader topic inference', () => {
  const topicMap = objectiveTopicMap(n10);
  assert.deepEqual(questionObjectiveIds({ topicId: 'n10-ch11', objectiveIds: { 'n10-009': ['2.2'] } }, 'n10-009', topicMap), ['2.2']);
});

test('an explicit objective excludes a question from another overlapping objective', () => {
  const topicMap = objectiveTopicMap(n10);
  const ids = questionObjectiveIds({ topicId: 'n10-ch11', objectiveIds: { 'n10-009': ['2.2'] } }, 'n10-009', topicMap);
  assert.equal(ids.includes('4.3'), false);
});

test('intentional multi-objective mappings are preserved', () => {
  const topicMap = objectiveTopicMap(n10);
  assert.deepEqual(questionObjectiveIds({ topicId: 'n10-ch11', objectiveIds: { 'n10-009': ['2.2', '4.3'] } }, 'n10-009', topicMap), ['2.2', '4.3']);
});

test('questions without explicit mappings retain topic fallback', () => {
  const topicMap = objectiveTopicMap(n10);
  assert.deepEqual(questionObjectiveIds({ topicId: 'n10-troubleshoot-method' }, 'n10-009', topicMap), ['5.1']);
});

test('unmapped questions in broad or unknown topics resolve to no objective', () => {
  const topicMap = objectiveTopicMap(n10);
  assert.deepEqual(questionObjectiveIds({ topicId: 'n10-ch11' }, 'n10-009', topicMap), []);
  assert.deepEqual(questionObjectiveIds({ topicId: 'not-in-objective-matrix' }, 'n10-009', topicMap), []);
});

test('objective metadata does not affect another certification track', () => {
  const question = { topicId: 'n10-ch11', objectiveIds: { 'n10-009': ['2.2'] } };
  assert.deepEqual(questionObjectiveIds(question, '220-1201', new Map()), []);
});

test('focused Network+ drafting stays unique and uses the explicit objective pool', () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: 'n10-009' });
  const draft = draftFocused(pool, 3, () => 0.42, { objectiveIds: ['2.2'], share: 1 });
  assert.equal(new Set(draft.map((item) => item.questionId)).size, draft.length);
  assert.ok(draft.length > 0);
  assert.ok(draft.every((item) => item.objectiveId === '2.2'));
});

test('ambiguous questions do not enter focused drafts for either overlapping objective', () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: 'n10-009' });
  const ambiguousIds = new Set(questions
    .filter((question) => question.topicId === 'n10-ch11' && !question.objectiveIds?.['n10-009'])
    .map((question) => question.id));
  for (const objectiveId of ['2.2', '4.3']) {
    const draft = draftFocused(pool, 20, mulberry32(7), { objectiveIds: [objectiveId], share: 1 });
    assert.ok(draft.every((item) => !ambiguousIds.has(item.questionId)), objectiveId);
  }
});

test('explicit mapping in a broad topic enters only its mapped objective', () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: 'n10-009' });
  const mapped = 'q-n10c11-04';
  const forSwitching = pool.domains.flatMap((domain) => domain.objectives.filter((objective) => objective.id === '2.2').flatMap((objective) => objective.questionIds));
  const forSecurity = pool.domains.flatMap((domain) => domain.objectives.filter((objective) => objective.id === '4.3').flatMap((objective) => objective.questionIds));
  assert.ok(forSwitching.includes(mapped));
  assert.equal(forSecurity.includes(mapped), false);
});

test('a full Network+ draft still reaches the configured 90-question maximum', () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: 'n10-009' });
  const draft = draftTest(pool, 90, mulberry32(2026));
  assert.ok(pool.totalUnique >= 90);
  assert.equal(draft.length, 90);
  assert.equal(new Set(draft.map((item) => item.questionId)).size, 90);
});

test('AWS objective pools retain their explicit-mapping behavior', () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: 'clf-c02' });
  const draft = draftTest(pool, 65, mulberry32(2026));
  assert.ok(pool.totalUnique >= 65);
  assert.equal(draft.length, 65);
  assert.equal(new Set(draft.map((item) => item.questionId)).size, 65);
});

test('the audit detects invalid objective IDs', () => {
  const report = auditQuestionObjectives({ objectives, questions: [{ id: 'q-invalid', topicId: 'n10-troubleshoot-method', examCodes: ['n10-009'], objectiveIds: { 'n10-009': ['9.9'] } }], topics });
  assert.equal(report.invalid, 1);
});

test('the audit detects an N10-009 mapping on a question outside the exam', () => {
  const report = auditQuestionObjectives({ objectives, questions: [{ id: 'q-outside', topicId: 'core1-ch2', objectiveIds: { 'n10-009': ['1.1'] } }], topics });
  assert.equal(report.mappedOutsideExam, 1);
});

test('the audit reports topic-only and unresolved questions', () => {
  const report = auditQuestionObjectives({ objectives, questions: [{ id: 'q-topic', topicId: 'n10-ch11', examCodes: ['n10-009'] }, { id: 'q-none', topicId: 'not-in-objective-matrix', examCodes: ['n10-009'] }], topics });
  assert.equal(report.topicOnly, 1);
  assert.equal(report.ambiguousTopicOnly, 1);
  assert.equal(report.noObjective, 1);
  assert.equal(report.unresolved, 2);
});

test('audit rows and counts are deterministic regardless of question ordering', () => {
  const a = auditQuestionObjectives({ objectives, questions, topics });
  const b = auditQuestionObjectives({ objectives, questions: [...questions].reverse(), topics: [...topics].reverse() });
  assert.deepEqual({ ...a, rows: undefined }, { ...b, rows: undefined });
  assert.deepEqual(a.rows, b.rows);
});
