import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildExamPool, draftTest, allocateByWeight, mulberry32, shuffleQuestionChoices, shuffleChoiceOrder, assessmentVersion, isCorrect, approximatePassPercent, sessionDurationSeconds } from '../lib/exam-test.mjs';
import { evaluateReadiness } from '../lib/readiness.ts';
const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const questions = read('questions'), topics = read('topics'), objectives = read('objectives');
for (const code of ['clf-c02', 'saa-c03']) {
  const bank = questions.filter(q => q.examCodes?.includes(code));
  const pool = buildExamPool({ questions, topics, objectives, examCode: code });
  test(`${code}: all eligible questions have a single valid primary objective and enter mocks`, () => {
    assert.equal(pool.totalUnique, bank.length);
    const valid = new Set(pool.domains.flatMap(d => d.objectives.map(o => o.id)));
    for (const q of bank) {
      assert.equal(q.objectiveIds[code].length, 1, q.id);
      assert.ok(valid.has(q.objectiveIds[code][0]), q.id);
      if (Array.isArray(q.answer)) assert.ok(q.choices.length >= 5, q.id);
    }
    const quota = allocateByWeight(pool.domains, 65);
    for (const d of pool.domains) assert.ok(Math.abs(quota[d.id] - 65 * d.weight / 100) < 1, `${code} domain ${d.id}: ${quota[d.id]}`);
    for (let seed = 0; seed < 100; seed++) {
      const draft = draftTest(pool, 65, mulberry32(seed));
      assert.equal(draft.length, 65);
      assert.equal(new Set(draft.map(p => p.questionId)).size, 65);
      for (const d of pool.domains) assert.equal(draft.filter(p => p.domainId === d.id).length, quota[d.id]);
    }
  });
  test(`${code}: selecting display position one / first two does not approach the study target`, () => {
    let correct = 0, total = 0;
    for (let seed = 0; seed < 100; seed++) {
      const rng = mulberry32(seed);
      for (const q of bank) {
        const displayed = shuffleQuestionChoices(q, rng);
        correct += Number(isCorrect(displayed, Array.isArray(q.answer) ? [0, 1] : 0)); total++;
      }
    }
    assert.ok(correct / total < 0.35, `${correct}/${total}`);
  });
  test(`${code}: each objective has a linked original workshop and remains honestly partial`, () => {
    for (const d of objectives.exams.find(e => e.code === code).domains) for (const o of d.objectives) {
      assert.equal(o.status, 'partial');
      assert.ok(o.reviewEvidence);
    }
  });
}
test('choice randomization preserves IDs, correct answer text and authored records', () => {
  for (const q of questions.filter(q => q.id.startsWith('q-saa-multi') || q.id === 'q-clf-01')) {
    const before = JSON.stringify(q);
    for (let seed = 0; seed < 20; seed++) {
      const copy = shuffleQuestionChoices(q, mulberry32(seed));
      const texts = obj => (Array.isArray(obj.answer) ? obj.answer : [obj.answer]).map(i => obj.choices[i]).sort();
      assert.equal(copy.id, q.id);
      assert.deepEqual(texts(copy), texts(q));
      assert.equal(new Set(shuffleChoiceOrder(q, mulberry32(seed))).size, q.choices.length);
    }
    assert.equal(JSON.stringify(q), before);
  }
});
test('content fingerprints invalidate stale answer and objective evidence, independently of array order', () => {
  const q = questions.find(q => q.id === 'q-clf-01');
  assert.equal(assessmentVersion([q, questions[0]]), assessmentVersion([questions[0], q]));
  for (const patch of [{ answer: (q.answer + 1) % 4 }, { prompt: q.prompt + ' changed' }, { objectiveIds: { 'clf-c02': ['4.3'] } }]) assert.notEqual(assessmentVersion([q]), assessmentVersion([{ ...q, ...patch }]));
});
test('full AWS timers are exact shared durations and AWS has no raw-to-scaled conversion', () => {
  assert.equal(sessionDurationSeconds('clf-c02', 65), 5400);
  assert.equal(sessionDurationSeconds('saa-c03', 65), 7800);
  assert.equal(approximatePassPercent('clf-c02'), null);
  assert.equal(approximatePassPercent('saa-c03'), null);
});
test('practice evidence rejects stale banks, old attempts, repeated multi items and missing domains', () => {
  const now = Date.UTC(2026, 9, 23), ids = Array.from({ length: 100 }, (_, i) => `q${i}`), multi = ids.slice(0, 8);
  const evidence = { version: 'v2', questionIds: ids, multiIds: multi, expectedDomains: ['1', '2', '3', '4'], now };
  const base = { exam: 'saa-c03', full: true, bankVersion: 'v2', at: now, percent: 100, domains: evidence.expectedDomains.map(id => ({ id, title: id, correct: 10, total: 10 })), multiCorrect: 8, multiTotal: 8, multiQuestionIds: multi, questionIds: ids, correctIds: ids };
  const evaluate = (patch = {}, missing = 0) => evaluateReadiness([0, 1, 2].map(i => ({ ...base, at: now - i * 1000, ...patch })), 'saa-c03', missing, 100, evidence);
  assert.equal(evaluate().status, 'ready');
  for (const patch of [{ bankVersion: 'v1' }, { at: now - 91 * 86400000 }, { at: now + 1000 }, { correctIds: [] }, { multiQuestionIds: ['q0'] }, { domains: base.domains.slice(0, 3) }]) assert.notEqual(evaluate(patch).status, 'ready', JSON.stringify(patch));
  assert.notEqual(evaluate({}, 1).status, 'ready');
});
