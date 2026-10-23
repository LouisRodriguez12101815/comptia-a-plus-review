import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EXAM_FORMATS, allocateByWeight, approximatePassPercent, buildExamPool, draftTest,
  gradeTest, isCorrect, mulberry32, questionsForLength, secondsPerQuestion,
} from '../lib/exam-test.mjs';
import { evaluateReadiness } from '../lib/readiness.ts';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const objectives = read('content/objectives.json');
const questions = read('content/questions.json');
const topics = [...read('content/topics.json'), ...read('content/topics-network-plus.json')];
const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
const codes = ['220-1201', '220-1202', 'n10-009', 'clf-c02', 'saa-c03'];
const pool = (examCode) => buildExamPool({ objectives, questions, topics, examCode });

test('formats match the objective matrix and use the published exam pacing', () => {
  for (const code of codes) {
    const exam = objectives.exams.find((e) => e.code === code);
    assert.equal(EXAM_FORMATS[code].passingScore, exam.passingScore, code);
  }
  assert.equal(secondsPerQuestion('220-1201'), 60);
  assert.equal(secondsPerQuestion('220-1202'), 60);
  assert.equal(secondsPerQuestion('n10-009'), 60);
  assert.equal(secondsPerQuestion('clf-c02'), 83);
  assert.equal(secondsPerQuestion('saa-c03'), 120);
  assert.equal(questionsForLength('clf-c02', 'full'), 65);
  assert.equal(questionsForLength('saa-c03', 'full'), 65);
  assert.equal(questionsForLength('clf-c02', 'half'), 33);
  assert.equal(questionsForLength('saa-c03', 'half'), 33);
  assert.equal(approximatePassPercent('220-1201'), 72);
});

test('every drafted question belongs to the exam and maps to its objective', () => {
  for (const code of codes) {
    const p = pool(code);
    const requested = EXAM_FORMATS[code].maxQuestions;
    const draft = draftTest(p, requested, mulberry32(7));
    assert.equal(draft.length, Math.min(requested, p.totalUnique), code);
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


test('AWS full mocks can draft 65 unique questions across all weighted domains', () => {
  for (const code of ['clf-c02', 'saa-c03']) {
    const p = pool(code);
    assert.ok(p.totalUnique >= 65, `${code} bank has only ${p.totalUnique} unique questions`);
    for (const domain of p.domains) assert.ok(domain.available > 0, `${code} ${domain.id} is empty`);
    const draft = draftTest(p, 65, mulberry32(2026));
    assert.equal(draft.length, 65, code);
    assert.equal(new Set(draft.map((item) => item.questionId)).size, 65, `${code} has duplicates`);
    for (const domain of p.domains) {
      const count = draft.filter((item) => item.domainId === domain.id).length;
      assert.ok(count > 0, `${code} ${domain.id} not represented`);
    }
  }
});

test('AWS banks contain multi-response questions', () => {
  for (const code of ['clf-c02', 'saa-c03']) {
    const p = pool(code);
    const ids = new Set(p.domains.flatMap((domain) => domain.objectives.flatMap((objective) => objective.questionIds)));
    const multi = questions.filter((question) => ids.has(question.id) && Array.isArray(question.answer));
    assert.ok(multi.length >= 5, `${code} needs more multi-response coverage`);
  }
});


test('readiness requires three strong full mocks, domain floors, multi-response accuracy, and complete objectives', () => {
  const attempt = (percent, domainPercent, questionIds, multiCorrect = 3, multiTotal = 4) => ({
    exam: 'saa-c03',
    full: true,
    percent,
    domains: [
      { id: '1.0', title: 'Secure', correct: domainPercent, total: 100 },
      { id: '2.0', title: 'Resilient', correct: domainPercent, total: 100 },
    ],
    multiCorrect,
    multiTotal,
    questionIds,
  });
  const ready = evaluateReadiness([
    attempt(84, 78, Array.from({ length: 65 }, (_, i) => `q${i}`)),
    attempt(82, 76, Array.from({ length: 65 }, (_, i) => `q${i + 30}`)),
    attempt(80, 72, Array.from({ length: 65 }, (_, i) => `q${i + 55}`)),
  ], 'saa-c03', 0, 120);
  assert.equal(ready.status, 'ready');
  assert.deepEqual(ready.blockers, []);

  const exposure = Array.from({ length: 100 }, (_, i) => `q${i}`);
  const weakDomain = evaluateReadiness([
    attempt(84, 69, exposure.slice(0, 65)),
    attempt(83, 75, exposure.slice(20, 85)),
    attempt(82, 76, exposure.slice(35, 100)),
  ], 'saa-c03', 0, 120);
  assert.equal(weakDomain.status, 'not-ready');
  assert.ok(weakDomain.blockers.some((item) => item.includes('domain')));

  const missing = evaluateReadiness([
    attempt(84, 78, exposure.slice(0, 65)),
    attempt(83, 78, exposure.slice(20, 85)),
    attempt(82, 78, exposure.slice(35, 100)),
  ], 'saa-c03', 1, 120);
  assert.equal(missing.status, 'not-ready');
  assert.ok(missing.blockers.some((item) => item.includes('missing objective')));

  const lowMulti = evaluateReadiness([
    attempt(84, 78, exposure.slice(0, 65), 2, 4),
    attempt(83, 78, exposure.slice(20, 85), 2, 4),
    attempt(82, 78, exposure.slice(35, 100), 2, 4),
  ], 'saa-c03', 0, 120);
  assert.equal(lowMulti.multiPercent, 50);
  assert.equal(lowMulti.status, 'not-ready');
});

test('readiness ignores non-full and other-exam attempts', () => {
  const attempts = [
    { exam: 'clf-c02', full: true, percent: 90, domains: [{ id: '1.0', title: 'Cloud', correct: 9, total: 10 }], multiCorrect: 4, multiTotal: 4 },
    { exam: 'saa-c03', full: false, percent: 95, domains: [{ id: '1.0', title: 'Secure', correct: 9, total: 10 }], multiCorrect: 4, multiTotal: 4 },
  ];
  const result = evaluateReadiness(attempts, 'saa-c03', 0, 120);
  assert.equal(result.fullAttempts, 0);
  assert.equal(result.status, 'not-ready');
});


test('readiness blocks narrow repeated-question exposure', () => {
  const same = Array.from({ length: 65 }, (_, i) => `q${i}`);
  const attempts = [84, 83, 82].map((percent) => ({
    exam: 'saa-c03',
    full: true,
    percent,
    domains: [{ id: '1.0', title: 'Secure', correct: 80, total: 100 }],
    multiCorrect: 3,
    multiTotal: 4,
    questionIds: same,
  }));
  const result = evaluateReadiness(attempts, 'saa-c03', 0, 120);
  assert.equal(result.exposurePercent, 54);
  assert.equal(result.status, 'not-ready');
  assert.ok(result.blockers.some((item) => item.includes('question bank')));
});
