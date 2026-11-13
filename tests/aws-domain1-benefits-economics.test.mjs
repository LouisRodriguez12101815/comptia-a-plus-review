import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const questions = read('questions');
const topics = read('topics');
const objectives = read('objectives');
const cards = read('flashcards');
const domain = objectives.exams.find((exam) => exam.code === 'clf-c02').domains.find((item) => item.id === '1.0');
const mapped = (id) => questions.filter((question) => question.objectiveIds?.['clf-c02']?.includes(id));

test('Domain 1 statuses remain conservative and unrelated objectives remain unchanged', () => {
  assert.deepEqual(Object.fromEntries(domain.objectives.map((item) => [item.id, item.status])), { '1.1': 'partial', '1.2': 'covered', '1.3': 'covered', '1.4': 'partial' });
  for (const id of ['1.1', '1.4']) assert.equal(domain.objectives.find((item) => item.id === id).reviewEvidence.checked, '2026-11-06');
});

test('new questions cover varied 1.1 and 1.4 transfer cues', () => {
  assert.equal(mapped('1.1').length, 21);
  assert.equal(mapped('1.4').length, 21);
  for (const id of ['1.1', '1.4']) {
    const items = mapped(id);
    const additions = items.filter((item) => item.id.startsWith(`q-clf${id.replace('.', '')}-`));
    assert.ok(additions.every((item) => item.topicId === 'aws-clf-cloud-concepts'));
    assert.ok(additions.every((item) => item.examCodes.length === 1 && item.examCodes[0] === 'clf-c02'));
    assert.ok(additions.every((item) => item.sourceUrls.some((url) => url.includes('cloud-practitioner-02-domain1'))));
  }
  assert.ok(mapped('1.1').some((item) => item.prompt.includes('unpredictable')));
  assert.ok(mapped('1.1').some((item) => item.prompt.includes('minutes')));
  assert.ok(mapped('1.4').some((item) => item.prompt.includes('TCO')));
  assert.ok(mapped('1.4').some((item) => item.prompt.includes('license')));
  assert.equal(mapped('1.1').filter((item) => Array.isArray(item.answer)).length, 2);
  assert.equal(mapped('1.4').filter((item) => Array.isArray(item.answer)).length, 2);
});

test('new Domain 1 scenarios key the intended answer text and distribute positions', () => {
  const ids = ['q-clf11-13', 'q-clf14-15', 'q-clf14-16'];
  const byId = Object.fromEntries(questions.map((question) => [question.id, question]));
  const expected = [
    ['q-clf11-13', 'Scalability for planned growth and redundant deployment across multiple Availability Zones for availability'],
    ['q-clf14-15', 'Compare one-time migration costs and ongoing TCO, including transfer, duplicated operations, training, licensing and expected infrastructure savings'],
    ['q-clf14-16', 'Separate relatively fixed or committed baseline costs from variable usage, then compare flexibility, utilization and resilience'],
  ];
  for (const [id, answerText] of expected) {
    const question = byId[id];
    assert.ok(question, id);
    assert.equal(question.choices[question.answer], answerText, id);
    assert.equal(question.objectiveIds['clf-c02'].length, 1, id);
    assert.ok(question.explanation.length > 80, id);
  }
  assert.deepEqual(ids.map((id) => byId[id].answer), [1, 2, 3]);
});

test('teaching, cards, drill, lab and visual are attached to the existing topic', () => {
  const topic = topics.find((item) => item.id === 'aws-clf-cloud-concepts');
  assert.ok(topic.sections.some((section) => section.id === 'benefits-transfer'));
  assert.ok(topic.sections.some((section) => section.id === 'cloud-economics-transfer'));
  assert.equal(cards.filter((card) => card.topicId === 'aws-clf-cloud-concepts').length, 31);
  const drills = readFileSync(new URL('../lib/practice/drills.ts', import.meta.url), 'utf8');
  const topFive = readFileSync(new URL('../lib/study/topFive.ts', import.meta.url), 'utf8');
  const finalReview = readFileSync(new URL('../lib/practice/finalReview.ts', import.meta.url), 'utf8');
  const labs = read('labs');
  assert.match(drills, /aws-clf-benefits-economics/);
  assert.match(topFive, /benefits-economics/);
  assert.match(finalReview, /clf-benefit-elasticity/);
  assert.ok(labs.some((lab) => lab.slug === 'aws-clf-cloud-economics-selection'));
});

test('new question cues are not a single repeated traffic-spike template', () => {
  const prompts = mapped('1.1').filter((item) => item.id.startsWith('q-clf11-')).map((item) => item.prompt);
  assert.equal(new Set(prompts).size, prompts.length);
  assert.ok(new Set(prompts.map((prompt) => prompt.split(' ').slice(0, 4).join(' '))).size >= 8);
});
