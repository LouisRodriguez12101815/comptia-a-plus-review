import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allocate, buildRound, finalReviews, reviewPool, troubleshootingDomain, choicesFor } from '../lib/practice/finalReview.ts';

const { exams } = JSON.parse(readFileSync(new URL('../content/objectives.json', import.meta.url), 'utf8'));
const locales = ['en', 'es', 'fr', 'pt'];
const messages = Object.fromEntries(locales.map((l) => [l, JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), 'utf8'))]));

function planFor(review) {
  const exam = exams.find((e) => e.code === review.exam);
  const domains = exam.domains.map((d) => ({ domain: d.objectives[0].id.split('.')[0], title: d.title, weight: d.weight }));
  const counts = allocate(domains, review.drillQuestions);
  return { exam, plan: domains.map((d) => ({ ...d, count: counts[d.domain] })) };
}

test('allocation sums to the total and follows the exam weights', () => {
  const counts = allocate([{ domain: '1', weight: 13 }, { domain: '2', weight: 23 }, { domain: '3', weight: 25 }, { domain: '4', weight: 11 }, { domain: '5', weight: 28 }], 26);
  assert.deepEqual(counts, { 1: 3, 2: 6, 3: 7, 4: 3, 5: 7 });
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 26);
});

test('heavier domains never get fewer questions than lighter ones', () => {
  for (const review of finalReviews) {
    const { plan } = planFor(review);
    const sorted = [...plan].sort((a, b) => b.weight - a.weight);
    for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i - 1].count >= sorted[i].count, `${review.id}: ${sorted[i - 1].title} vs ${sorted[i].title}`);
  }
});

test('every domain has enough unique drill prompts and a round has the planned size', () => {
  for (const review of finalReviews) {
    const { exam, plan } = planFor(review);
    const pool = reviewPool(review, troubleshootingDomain(exam.domains));
    for (const p of plan) {
      const prompts = new Set(pool.filter((q) => q.domain === p.domain).map((q) => q.prompt));
      assert.ok(prompts.size >= p.count, `${review.id}: domain ${p.domain} has ${prompts.size} prompts, needs ${p.count}`);
    }
    for (let i = 0; i < 20; i++) {
      const round = buildRound(review, plan, pool);
      assert.equal(round.length, review.drillQuestions + review.trapsPerRound);
      assert.equal(new Set(round.map((q) => q.id)).size, round.length);
      for (const q of round) {
        const c = choicesFor(q);
        assert.ok(c.length >= 2 && c.length <= 4 && c.includes(q.answer) && new Set(c).size === c.length, q.id);
      }
    }
  }
});

test('traps and sequences are well formed and translated', () => {
  for (const review of finalReviews) {
    for (const t of review.traps) assert.ok(t.wrong.length === 3 && !t.wrong.includes(t.answer), t.id);
    for (const locale of locales) {
      const fr = messages[locale].finalReview;
      assert.ok(fr?.noteTime && fr.noteWeighted && messages[locale].header.final15, `${locale}: note text`);
      for (const s of review.sequences) assert.ok(fr.sequences[s.id], `${locale}: sequence ${s.id}`);
    }
  }
});
