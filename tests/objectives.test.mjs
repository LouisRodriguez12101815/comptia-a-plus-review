import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCoverage, renderReport } from '../scripts/objective-coverage.mjs';

const { objectives, rows } = buildCoverage();

test('every exam has domains that add up to 100%', () => {
  for (const exam of objectives.exams) {
    assert.equal(exam.domains.reduce((sum, d) => sum + d.weight, 0), 100, exam.code);
  }
});

test('objective ids are unique per exam and statuses are known', () => {
  for (const exam of objectives.exams) {
    const ids = rows.filter((r) => r.exam === exam.code).map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, exam.code);
  }
  for (const r of rows) assert.ok(['covered', 'partial', 'missing'].includes(r.status), `${r.exam} ${r.id}`);
});

test('mapped topics exist and covered or partial objectives name a topic', async () => {
  const { readFileSync } = await import('node:fs');
  const load = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
  const known = new Set([...load('content/topics.json'), ...load('content/topics-network-plus.json')].map((t) => t.id));
  for (const r of rows) {
    for (const id of r.topics) assert.ok(known.has(id), `${r.exam} ${r.id} maps unknown topic ${id}`);
    if (r.status !== 'missing') assert.ok(r.topics.length > 0, `${r.exam} ${r.id} is ${r.status} with no topic`);
  }
});

test('report lists every gap', () => {
  const report = renderReport({ objectives, rows });
  const gaps = rows.filter((r) => r.status !== 'covered').length;
  assert.equal((report.split('## Gaps')[1].match(/^\d+\. /gm) ?? []).length, gaps);
});
