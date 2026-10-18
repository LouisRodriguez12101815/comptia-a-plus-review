import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EXAM_FORMATS, allocateByWeight, approximatePassPercent, buildExamPool, draftTest,
  gradeTest, isCorrect, mulberry32, secondsPerQuestion,
} from '../lib/exam-test.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const objectives = read('content/objectives.json');
const questions = read('content/questions.json');
const topics = [...read('content/topics.json'), ...read('content/topics-network-plus.json')];
const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
const codes = ['220-1201', '220-1202', 'n10-009'];
const pool = (examCode) => buildExamPool({ objectives, questions, topics, examCode });

test('formats match the objective matrix and give 60 seconds per question', () => {
  for (const code of codes) {
    const exam = objectives.exams.find((e) => e.code === code);
    assert.equal(EXAM_FORMATS[code].passingScore, exam.passingScore, code);
    assert.equal(secondsPerQuestion(code), 60, code);
  }
  assert.equal(approximatePassPercent('220-1201'), 72);
});

test('every drafted question belongs to the exam and maps to its objective', () => {
  for (const code of codes) {
    const p = pool(code);
    const draft = draftTest(p, 90, mulberry32(7));
    assert.equal(draft.length, Math.min(90, p.totalUnique), code);
    assert.equal(new Set(draft.map((d) => d.questionId)).size, draft.length, `${code} has duplicates`);
    for (const pick of draft) {
      const objective = p.domains.find((d) => d.id === pick.domainId).objectives.find((o) => o.id === pick.objectiveId);
      assert.ok(objective.questionIds.includes(pick.questionId), `${code} ${pick.questionId}`);
    }
  }
});

test('domain counts follow weights when the bank allows', () => {
  const p = pool('n10-009');
  const quota = allocateByWeight(p.domains, 90);
  assert.equal(Object.values(quota).reduce((a, b) => a + b, 0), 90);
  for (const d of p.domains) assert.ok(Math.abs(quota[d.id] - (90 * d.weight) / 100) <= 1, d.id);
  const draft = draftTest(p, 90, mulberry32(3));
  for (const d of p.domains) assert.equal(draft.filter((x) => x.domainId === d.id).length, quota[d.id], d.id);
});

test('empty domains hand their share to the others', () => {
  const domains = [
    { id: 'a', weight: 50, available: 100, objectives: [] },
    { id: 'b', weight: 50, available: 0, objectives: [] },
  ];
  assert.deepEqual(allocateByWeight(domains, 20), { a: 20, b: 0 });
  assert.deepEqual(allocateByWeight([{ id: 'a', weight: 60, available: 3 }, { id: 'b', weight: 40, available: 50 }], 10), { a: 3, b: 7 });
});

test('the same seed drafts the same test', () => {
  const p = pool('220-1202');
  assert.deepEqual(draftTest(p, 15, mulberry32(42)), draftTest(p, 15, mulberry32(42)));
});

test('grading handles single, multi-select, blank, and timed-out answers', () => {
  assert.ok(isCorrect({ answer: 2 }, 2));
  assert.ok(!isCorrect({ answer: 2 }, undefined));
  assert.ok(isCorrect({ answer: [0, 3] }, [3, 0]));
  assert.ok(!isCorrect({ answer: [0, 3] }, [0]));
  const p = pool('220-1201');
  const picks = draftTest(p, 4, mulberry32(1));
  const [a, b, c] = picks;
  const responses = {
    [a.questionId]: { answer: byId[a.questionId].answer, timedOut: false, seconds: 20 },
    [b.questionId]: { answer: undefined, timedOut: true, seconds: 60 },
    [c.questionId]: { answer: byId[c.questionId].answer, timedOut: true, seconds: 60 },
  };
  const result = gradeTest({ pool: p, picks, questionsById: byId, responses });
  assert.equal(result.total, 4);
  assert.equal(result.correct, 2);
  assert.equal(result.timedOut, 2);
  assert.equal(result.domains.reduce((s, d) => s + d.total, 0), 4);
});
