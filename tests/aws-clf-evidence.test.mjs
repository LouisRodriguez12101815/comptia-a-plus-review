import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const evidence = read('docs/aws-clf-evidence-map.json');
const topics = read('content/topics.json');
const questions = read('content/questions.json');
const cards = read('content/flashcards.json');

test('CLF source identities cover every task and preserve separate knowledge/skill ordinals', () => {
  // Counts transcribed from the four retrieved official domain pages, not content counts.
  const expected = {
    '1.1': [1, 2], '1.2': [1, 2], '1.3': [2, 2], '1.4': [2, 6],
    '2.1': [1, 5], '2.2': [3, 6], '2.3': [4, 6], '2.4': [2, 4],
    '3.1': [3, 3], '3.2': [4, 4], '3.3': [1, 5], '3.4': [2, 5],
    '3.5': [1, 4], '3.6': [1, 7], '3.7': [2, 2], '3.8': [7, 7],
    '4.1': [2, 5], '4.2': [4, 4], '4.3': [4, 9],
  };
  assert.equal(evidence.bullets.length, 135);
  assert.equal(new Set(evidence.bullets.map(row => row.id)).size, 135);
  for (const [task, counts] of Object.entries(expected)) {
    for (const [index, group] of ['Knowledge of', 'Skills in'].entries()) {
      const rows = evidence.bullets.filter(row => row.taskId === task && row.source.group === group);
      assert.deepEqual(rows.map(row => row.source.bulletOrdinal), Array.from({ length: counts[index] }, (_, i) => i + 1));
      assert.ok(rows.every(row => row.source.url.endsWith(`domain${task[0]}.html`) && row.source.retrievedTextLine > 0));
    }
  }
});

test('CLF teaching evidence resolves to actual sections and unchanged quoted blocks', () => {
  const flatten = section => section.blocks.flatMap(block => block.items ?? block.rows?.map(row => row.join(' | ')) ?? (block.text ? [block.text] : []));
  for (const unit of Object.values(evidence.lessonEvidenceCatalog)) {
    const topic = topics.find(topic => topic.id === unit.topicId);
    const section = topic?.sections.find(section => section.id === unit.sectionId);
    assert.ok(section, unit.href);
    assert.equal(section.title, unit.heading);
    assert.deepEqual(unit.excerpts, flatten(section));
  }
  for (const row of evidence.bullets) {
    for (const id of row.teaching.lessonEvidenceIds) assert.ok(evidence.lessonEvidenceCatalog[id], id);
    for (const [key, ids] of Object.entries(row.resources)) {
      if (!key.endsWith('Ids')) continue;
      for (const id of ids) assert.ok(evidence.resourceEvidenceCatalog[id], `${row.id}: ${id}`);
    }
    assert.equal(row.assessment.associationIsBulletCoverage, false);
  }
});

test('CLF status report cannot silently promote a known root-task omission', () => {
  const exam = read('content/objectives.json').exams.find(exam => exam.code === 'clf-c02');
  const actual = Object.fromEntries(exam.domains.flatMap(domain => domain.objectives.map(objective => [objective.id, objective.status])));
  assert.deepEqual(Object.fromEntries(evidence.tasks.map(task => [task.id, task.proposedStatus])), actual);
  assert.equal(actual['2.3'], 'partial');
  assert.equal(evidence.bullets.find(row => row.id === '2.3-S4').teaching.classification, 'mention');
});

test('CLF question and card evidence cannot drift from the resources being assessed', () => {
  for (const [id, unit] of Object.entries(evidence.resourceEvidenceCatalog)) {
    if (unit.kind === 'question') {
      const actual = questions.find(question => question.id === id);
      assert.ok(actual, id);
      for (const field of ['prompt', 'choices', 'answer', 'explanation']) {
        assert.deepEqual(unit[field], actual[field], `${id}: ${field}`);
      }
    } else if (unit.kind === 'flashcard') {
      const actual = cards.find(card => card.id === id);
      assert.ok(actual, id);
      assert.deepEqual(unit.excerpts, [actual.front, actual.back], id);
    }
  }
});

test('new CLF storage items are single-exam resources with complete option explanations', () => {
  const added = questions.filter(question => question.id.startsWith('q-clf-s3-decisions-'));
  assert.equal(added.length, 6);
  for (const question of added) {
    assert.deepEqual(question.examCodes, ['clf-c02']);
    assert.deepEqual(question.objectiveIds, { 'clf-c02': ['3.6'] });
    assert.equal(typeof question.answer, 'number');
    assert.equal(new Set(question.choices).size, question.choices.length);
    for (const choice of question.choices) assert.ok(question.explanation.includes(`${choice}:`), question.id);
    assert.ok(question.answer >= 0 && question.answer < question.choices.length);
  }
  assert.equal(cards.filter(card => card.id.startsWith('fc-clf-s3-decisions-')).length, 3);
});
