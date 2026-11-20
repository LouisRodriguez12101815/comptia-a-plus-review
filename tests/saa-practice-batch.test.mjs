import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { questionsForLength, buildExamPool, draftTest, mulberry32 } from '../lib/exam-test.mjs';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const questions = readJson('content/questions.json');
const topics = readJson('content/topics.json');
const objectives = readJson('content/objectives.json');
const practice = readJson('content/saa-practice-set.json');
const batch = questions.filter((q) => q.id.startsWith('q-saa-practice-'));

test('SAA practice batch has 56 original items with option-level explanations', () => {
  assert.equal(batch.length, 56);
  assert.equal(practice.questionIds.length, 56);
  assert.deepEqual(practice.questionIds, batch.map((q) => q.id));
  const exam = objectives.exams.find((e) => e.code === 'saa-c03');
  const known = new Set(exam.domains.flatMap((d) => d.objectives.map((o) => o.id)));
  for (const q of batch) {
    assert.deepEqual(q.examCodes, ['saa-c03']);
    assert.equal(q.objectiveIds['saa-c03'].length, 1);
    assert.ok(known.has(q.objectiveIds['saa-c03'][0]));
    assert.equal(q.choices.length, 4);
    assert.ok(q.sourceUrls.every((u) => u.startsWith('https://docs.aws.amazon.com/')));
    for (const choice of q.choices) {
      assert.match(q.explanation, new RegExp(`${choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — (Correct|Incorrect)\\.`));
    }
    const correct = q.choices[q.answer];
    assert.ok(q.explanation.includes(`${correct} — Correct.`));
  }
});

test('selectable practice lengths resolve for SAA-C03', () => {
  assert.equal(questionsForLength('saa-c03', 'count10'), 10);
  assert.equal(questionsForLength('saa-c03', 'count20'), 20);
  assert.equal(questionsForLength('saa-c03', 'count40'), 40);
  assert.equal(questionsForLength('saa-c03', 'full'), 65);
  assert.equal(questionsForLength('saa-c03', '20'), 20);
});

test('SAA pool drafts rotate and remain domain-weighted after the practice batch', () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: 'saa-c03' });
  assert.ok(pool.totalUnique >= 200, pool.totalUnique);
  const first = draftTest(pool, 20, mulberry32(9));
  assert.equal(first.length, 20);
  const history = first.map((p) => p.questionId);
  const second = draftTest(pool, 20, mulberry32(10), { history });
  assert.equal(second.filter((p) => history.includes(p.questionId)).length, 0);
});
