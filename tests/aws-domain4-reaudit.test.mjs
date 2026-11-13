import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const questions = read('questions');
const topics = read('topics');
const objectives = read('objectives');
const domain = objectives.exams.find((exam) => exam.code === 'clf-c02').domains.find((item) => item.id === '4.0');
const topic = topics.find((item) => item.id === 'aws-clf-billing-support');
const focused = (id) => questions.filter((question) => question.id.startsWith(`q-clf${id.replace('.', '')}-`));

test('Domain 4 re-audit keeps all three objectives conservative and source dates absent', () => {
  assert.deepEqual(Object.fromEntries(domain.objectives.map((item) => [item.id, item.status])), { '4.1': 'partial', '4.2': 'partial', '4.3': 'partial' });
  for (const objective of domain.objectives) assert.equal(objective.reviewEvidence.checked, undefined, objective.id);
});

test('focused Domain 4 pools remain mapped, distinct, and include transfer items', () => {
  for (const [id, count] of [['4.1', 19], ['4.2', 18], ['4.3', 21]]) {
    const items = focused(id);
    assert.equal(items.length, count, id);
    assert.equal(new Set(items.map((item) => item.id)).size, count, id);
    assert.ok(items.every((item) => item.examCodes.length === 1 && item.examCodes[0] === 'clf-c02'));
    assert.ok(items.every((item) => item.objectiveIds['clf-c02'].length === 1 && item.objectiveIds['clf-c02'][0] === id));
    assert.ok(items.some((item) => Array.isArray(item.answer)), `${id} needs a multiple-response item`);
    assert.ok(items.some((item) => item.prompt.includes('Which') && item.explanation.length > 80), `${id} needs scenario evidence`);
  }
});

test('new Domain 4 questions key the intended answer text', () => {
  const byId = Object.fromEntries(questions.map((question) => [question.id, question]));
  const checks = [
    ['q-clf41-19', 'Check the current Free Tier eligibility, usage limits, time conditions and pricing, then monitor usage'],
    ['q-clf42-18', 'AWS Cost and Usage Report'],
    ['q-clf43-21', 'AWS Skill Builder'],
  ];
  for (const [id, expected] of checks) {
    const question = byId[id];
    assert.ok(question, id);
    assert.equal(question.choices[question.answer], expected, id);
    assert.equal(question.objectiveIds['clf-c02'].length, 1, id);
    assert.ok(question.explanation.length > 80, id);
  }
});

test('new Domain 4 single-answer positions are not concentrated', () => {
  const ids = ['q-clf41-19', 'q-clf42-18', 'q-clf43-21'];
  const byId = Object.fromEntries(questions.map((question) => [question.id, question]));
  const distribution = ids.reduce((counts, id) => {
    const question = byId[id];
    counts[question.answer] = (counts[question.answer] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(distribution, { 1: 1, 2: 1, 3: 1 });
});

test('pricing and billing safety distinctions remain explicit', () => {
  const corpus = JSON.stringify({ topic, questions: [...focused('4.1'), ...focused('4.2')] });
  assert.match(corpus, /Savings Plans provide pricing savings.*commitment/i);
  assert.match(corpus, /Capacity Reservation.*(?:launch|capacity).*specific AZ/i);
  assert.match(corpus, /Spot.*(?:interrupt|spare)/i);
  assert.match(corpus, /Dedicated Host.*(?:physical|host-level)/i);
  assert.match(corpus, /Pricing Calculator.*(?:estimate|planned)/i);
  assert.match(corpus, /Cost Explorer.*(?:historical|current|trend)/i);
  assert.match(corpus, /Budgets.*(?:alert|threshold).*not.*(?:hard|instant)/i);
  assert.match(corpus, /Cost and Usage Report.*(?:detailed|records)/i);
  assert.match(corpus, /cost allocation tags.*(?:activation|attribute)/i);
});

test('support terminology and all three multiple-response keys remain unambiguous', () => {
  const byId = Object.fromEntries(questions.map((question) => [question.id, question]));
  const checks = [
    ['q-clf41-15', ['Savings Plans provide pricing savings in exchange for eligible usage commitment', 'A Capacity Reservation addresses EC2 launch capacity in a specific AZ']],
    ['q-clf42-14', ['Estimate a planned design — AWS Pricing Calculator', 'Investigate current or historical spend — AWS Cost Explorer']],
    ['q-clf43-17', ['AWS Health — account or service health events', 'Trusted Advisor — supported best-practice recommendations/checks']],
  ];
  for (const [id, answers] of checks) {
    const question = byId[id];
    assert.ok(Array.isArray(question.answer), id);
    assert.deepEqual(question.answer.map((index) => question.choices[index]), answers, id);
  }
  const corpus = JSON.stringify({ topic, questions: focused('4.3') });
  assert.match(corpus, /Basic Support.*Business Support\+.*Enterprise Support.*Unified Operations/s);
  assert.match(corpus, /stopped accepting new subscriptions on December 2, 2025/s);
  assert.match(corpus, /scheduled for discontinuation on January 1, 2027/s);
  assert.doesNotMatch(corpus, /Developer Support, Business Support, and Enterprise On-Ramp are the current standard paid/i);
});
