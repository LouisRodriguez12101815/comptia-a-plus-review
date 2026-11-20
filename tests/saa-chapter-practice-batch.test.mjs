import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const questions = read('content/questions.json');
const map = read('content/saa-chapter-map.json');
const practice = read('content/saa-practice-set.json');
const objectives = read('content/objectives.json');
const batch = questions.filter((q) => q.id.startsWith('q-saa-chapter-'));
const exam = objectives.exams.find((e) => e.code === 'saa-c03');
const known = new Set(exam.domains.flatMap((d) => d.objectives.map((o) => o.id)));

test('chapter-mapped practice batch has 26 items covering all textbook chapters', () => {
  assert.equal(batch.length, 26);
  assert.equal(practice.chapterPracticeIds.length, 26);
  assert.deepEqual(practice.chapterPracticeIds, batch.map((q) => q.id));
  const chapters = new Set(batch.map((q) => q.chapterId));
  assert.equal(chapters.size, 13);
  for (const chapter of map.chapters) {
    assert.equal(chapter.practiceQuestionIds.length, 2, chapter.id);
    for (const id of chapter.practiceQuestionIds) {
      const q = batch.find((item) => item.id === id);
      assert.ok(q, id);
      assert.equal(q.chapterId, chapter.id);
      assert.ok(chapter.objectiveIds.includes(q.objectiveIds['saa-c03'][0]));
    }
  }
});

test('each chapter practice item has option-level explanations and official sources', () => {
  for (const q of batch) {
    assert.deepEqual(q.examCodes, ['saa-c03']);
    assert.equal(q.objectiveIds['saa-c03'].length, 1);
    assert.ok(known.has(q.objectiveIds['saa-c03'][0]));
    assert.equal(q.choices.length, 4);
    assert.ok(q.sourceUrls.every((u) => u.startsWith('https://docs.aws.amazon.com/')));
    const correct = q.choices[q.answer];
    assert.ok(q.explanation.includes(`${correct} — Correct.`));
    for (const choice of q.choices) {
      assert.ok(q.explanation.includes(`${choice} — Correct.`) || q.explanation.includes(`${choice} — Incorrect.`));
    }
  }
});
