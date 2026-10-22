import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { topFives } from '../lib/study/topFive.ts';
import { getDeck } from '../lib/practice/drills.ts';

const { exams } = JSON.parse(readFileSync(new URL('../content/objectives.json', import.meta.url), 'utf8'));
const locales = ['en', 'es', 'fr', 'pt'];

test('each Top 5 has five concepts tied to real domains, objectives and drills', () => {
  for (const top of topFives) {
    const exam = exams.find((e) => e.code === top.exam);
    assert.ok(exam, `${top.id}: unknown exam ${top.exam}`);
    assert.equal(top.concepts.length, 5);
    const domains = new Set(exam.domains.map((d) => d.objectives[0].id.split('.')[0]));
    const ids = new Set(exam.domains.flatMap((d) => d.objectives.map((o) => o.id)));
    for (const c of top.concepts) {
      for (const n of c.domains) assert.ok(domains.has(n), `${c.id}: domain ${n}`);
      const named = c.objectives.match(/\d+\.\d+/g) ?? [];
      assert.ok(named.length, `${c.id}: objectives`);
      for (const id of named) {
        assert.ok(ids.has(id), `${c.id}: objective ${id} not in ${top.exam}`);
        assert.ok(c.domains.includes(id.split('.')[0]), `${c.id}: objective ${id} outside its listed domains`);
      }
      assert.ok(c.facts.length >= 3 && c.why, `${c.id}: content`);
      for (const deck of c.drills) assert.equal(getDeck(deck)?.exam, top.exam, `${c.id}: drill ${deck}`);
    }
  }
});

test('Top 5 page text exists in all four languages', () => {
  for (const l of locales) {
    const m = JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), 'utf8'));
    for (const k of ['eyebrow', 'title', 'intro', 'noteTitle', 'note', 'mustKnow', 'practice', 'indexTitle']) assert.ok(m.topFive?.[k], `${l}: topFive.${k}`);
    assert.ok(m.header.top5, `${l}: header.top5`);
  }
});
