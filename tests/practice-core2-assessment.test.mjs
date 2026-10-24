import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { drillDecks, choicesFor } from '../lib/practice/drills.ts';
import { buildExamPool, shuffleQuestionChoices, mulberry32 } from '../lib/exam-test.mjs';
const read = name => JSON.parse(fs.readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const assessment = read('core2-assessment'), map = read('core2-learning-map'), questions = read('questions'), cards = read('flashcards'), topics = read('topics'), objectives = read('objectives');
const byId = Object.fromEntries(questions.map(q => [q.id, q]));
const visual = file => fs.readFileSync(new URL(`../public/visuals/${file}`, import.meta.url), 'utf8');
const visualData = file => JSON.parse(visual(file).match(/<script type="application\/json" id="workshop-data">([\s\S]*?)<\/script>/)[1]);
const answerTexts = q => (Array.isArray(q.answer) ? q.answer : [q.answer]).map(i => q.choices[i]);
test('every supplied reference has a valid, distinct question, card, notes/recall path and visual state', () => {
  assert.deepEqual(assessment.items.map(i => i.number), Array.from({ length: 50 }, (_, n) => n + 1));
  assert.equal(new Set(assessment.items.map(i => i.questionId)).size, 50);
  for (const item of assessment.items) {
    const q = byId[item.questionId];
    assert.ok(q, item.number);
    assert.equal(q.topicId, item.topicId);
    assert.deepEqual(q.examCodes, [item.exam]);
    assert.deepEqual(q.objectiveIds[item.exam], [item.objective]);
    const exam = objectives.exams.find(e => e.code === item.exam);
    assert.ok(exam.domains.some(d => d.objectives.some(o => o.id === item.objective)), item.number);
    assert.ok(cards.some(c => c.id === item.cardId && c.topicId === item.topicId));
    const topic = topics.find(t => t.id === item.topicId);
    assert.ok(topic);
    if (item.number < 50) assert.ok(topic.sections.some(s => s.id === item.sectionId));
    const deck = drillDecks.find(d => d.id === item.drillId);
    const entry = deck.items.find(i => i.id === item.drillItemId);
    assert.equal(entry.fields.answer, answerTexts(q).join('; '));
    assert.equal(entry.objective, item.objective);
    assert.ok(choicesFor(deck, deck.modes[0], entry).includes(entry.fields.answer));
    const state = visualData(item.visualFile).find(r => r.number === item.number);
    assert.equal(state.questionId, q.id);
    assert.deepEqual(state.choices, q.choices);
    assert.deepEqual(state.answer, q.answer);
    assert.equal(state.explanation, q.explanation);
    assert.ok(state.transfer.length > 20);
    for (const id of item.sourceIds) assert.ok(assessment.sources[id]?.url.startsWith('https://'));
  }
});
test('supplemental RAID is present for study but cannot enter a Core 2 mock', () => {
  const pool = buildExamPool({ questions, topics, objectives, examCode: '220-1202' });
  const ids = new Set(pool.domains.flatMap(d => d.objectives.flatMap(o => o.questionIds)));
  for (const item of assessment.items) assert.equal(ids.has(item.questionId), item.number !== 50, String(item.number));
});
test('all current Core 2 topics expose real cards, quizzes, visual resources and reachable recall decks', () => {
  const current = topics.filter(t => t.examCodes.includes('220-1202'));
  assert.deepEqual(new Set(map.topics.map(e => e.topicId)), new Set(current.map(t => t.id)));
  for (const entry of map.topics) {
    for (const id of entry.drillIds) assert.ok(drillDecks.some(d => d.id === id && d.items.length > 0), id);
    for (const file of entry.visualFiles) assert.ok(visual(file).includes('<html'), file);
    const topic = topics.find(t => t.id === entry.topicId);
    const eligible = item => (item.examCodes ?? topic.examCodes).includes('220-1202');
    assert.ok(questions.some(q => q.topicId === entry.topicId && eligible(q)), entry.topicId + '/quiz');
    assert.ok(cards.some(c => c.topicId === entry.topicId && eligible(c)), entry.topicId + '/cards');

  }
});
test('new question shuffling preserves answer identity across repeat practice', () => {
  for (const item of assessment.items) for (let seed = 0; seed < 20; seed++) {
    const q = byId[item.questionId], copy = shuffleQuestionChoices(q, mulberry32(seed));
    assert.equal(copy.id, q.id);
    assert.deepEqual(answerTexts(copy).sort(), answerTexts(q).sort());
  }
});
test('no Core 2 objective is queued after the 3.2 and 3.4 notes were added', () => {
  const expected = [];
  assert.deepEqual(assessment.queuedObjectives, expected);
  assert.deepEqual(map.queuedObjectives, expected);
  const current = objectives.exams.find(e => e.code === '220-1202').domains.flatMap(d => d.objectives);
  for (const id of ['3.2', '3.4']) assert.equal(current.find(o => o.id === id).status, 'covered');
});
test('every authored workshop is self-contained and its interaction script is valid JavaScript', () => {
  for (const file of new Set([...assessment.items.map(i => i.visualFile), 'core2-hardening-decisions.html'])) {
    const html = visual(file);
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    assert.ok(html.includes('aria-live="polite"'));
    assert.ok(html.includes('prefers-reduced-motion'));
    assert.ok(html.includes('tabindex="0"'));
    assert.ok(!/<script[^>]+src=|<link[^>]+href=https?:/i.test(html));
    for (const [, attrs, script] of scripts) if (!attrs.includes('application/json')) new vm.Script(script, { filename: file });
  }
});
