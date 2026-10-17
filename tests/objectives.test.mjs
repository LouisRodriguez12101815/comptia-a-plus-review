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

// Dashboard and CLI consume these same pure operations.
import { buildCoverageFromContent, examCoverage, filterCoverage, normalizeSearch, objectiveKey, rankGaps, summarizeCoverage } from '../lib/objective-coverage.mjs';

test('combined filters normalize whitespace, Unicode, and mixed-case objective/title searches', () => {
  const expected = rows.find((r) => r.exam === '220-1201' && r.id === '5.3');
  assert.deepEqual(filterCoverage(rows, { exam: '220-1201', status: 'covered', search: '  220-1201\t 5.3 \n DiSpLaY  ' }), [expected]);
  assert.deepEqual(filterCoverage(rows, { search: '２２０-１２０１ ５.３' }), [expected]);
  assert.deepEqual(filterCoverage(rows, { exam: '220-1202', status: 'covered', search: 'display 5.3' }), []);
  assert.deepEqual(filterCoverage(rows, { search: ' \n\t ' }), rows);
  assert.equal(normalizeSearch('  Video \n DISPLAY  '), 'video display');
  assert.deepEqual(filterCoverage(rows, { search: 'not-a-real-objective-xyz' }), []);
  assert.deepEqual(summarizeCoverage([]), { total: 0, covered: 0, partial: 0, missing: 0 });
});

test('composite identity keeps repeated objective numbers distinct across exams', () => {
  const repeated = filterCoverage(rows, { search: '1.1' });
  assert.ok(new Set(repeated.map((r) => r.exam)).size > 1);
  assert.equal(new Set(rows.map(objectiveKey)).size, rows.length);
  for (const r of rows) assert.equal(r.key, `${r.exam}:${r.id}`);
  const own = filterCoverage(rows, { exam: '220-1202', search: '1.1' });
  assert.ok(own.every((r) => r.exam === '220-1202'));
  assert.equal(own.filter((r) => r.id === '1.1').length, 1);
});

test('ranked gaps prefer domain weight, then missing, then exam and stable matrix order', () => {
  const base = rows[0];
  const fixtures = [
    { ...base, id: 'a', weight: 20, status: 'missing', exam: 'B' },
    { ...base, id: 'b', weight: 30, status: 'partial', exam: 'A' },
    { ...base, id: 'c', weight: 30, status: 'missing', exam: 'B' },
    { ...base, id: 'd', weight: 30, status: 'missing', exam: 'A' },
    { ...base, id: 'e', weight: 30, status: 'missing', exam: 'A' },
    { ...base, id: 'f', weight: 99, status: 'covered', exam: 'A' },
  ];
  const original = structuredClone(fixtures);
  assert.deepEqual(rankGaps(fixtures).map((r) => r.id), ['d', 'e', 'c', 'b', 'a']);
  assert.deepEqual(fixtures, original);
  assert.deepEqual(rankGaps([fixtures[5]]), []);
});

test('weighted estimates average status credit within domains, including empty domains safely', () => {
  const exam = { code: 'test', domains: [{ id: 'a', weight: 60 }, { id: 'b', weight: 40 }, { id: 'empty', weight: 0 }] };
  const sample = [
    { exam: 'test', domain: 'a', status: 'covered' },
    { exam: 'test', domain: 'a', status: 'partial' },
    { exam: 'test', domain: 'b', status: 'missing' },
    { exam: 'other', domain: 'a', status: 'covered' },
  ];
  assert.deepEqual(examCoverage(exam, sample), { total: 3, covered: 1, partial: 1, missing: 1, weighted: 45 });
});

test('mapped counts count each item once, support multiple topic IDs, and leave unmapped rows empty', () => {
  const matrix = { reviewed: false, note: '', exams: [{ code: 'test', domains: [{ id: '1', title: '', weight: 100, objectives: [
    { id: '1.1', title: '', status: 'partial', topics: ['a', 'b'] },
    { id: '1.2', title: '', status: 'missing', topics: [] },
  ] }] }] };
  const before = structuredClone(matrix);
  const { rows: sample } = buildCoverageFromContent({ objectives: matrix,
    topics: [{ id: 'a', sections: [1, 2] }, { id: 'b', sections: [3] }, { id: 'unmapped', sections: [4] }],
    cards: [{ topicId: ['a', 'b'] }, { topicId: 'a' }, { topicId: 'unmapped' }],
    questions: [{ topicId: 'b' }], labs: [{ relatedTopicIds: ['a', 'b'] }, {}], visuals: { a: [1, 2], b: [3] },
  });
  const counts = (r) => [r.notes, r.cards, r.quiz, r.labs, r.visuals];
  assert.deepEqual(counts(sample[0]), [3, 2, 1, 1, 3]);
  assert.deepEqual(counts(sample[1]), [0, 0, 0, 0, 0]);
  assert.deepEqual(matrix, before);
});

test('shared dashboard summaries and complete ranking agree with the CLI report', () => {
  const report = renderReport({ objectives, rows });
  const ranked = rankGaps(rows);
  const actual = report.split('## Gaps, heaviest domain first')[1].trim().split('\n');
  assert.equal(actual.length, ranked.length);
  ranked.forEach((row, i) => assert.ok(actual[i].startsWith(`${i + 1}. ${row.exam} ${row.id} (`)));
  for (const exam of objectives.exams) {
    const stats = examCoverage(exam, rows);
    assert.ok(report.includes(`${stats.covered} covered, ${stats.partial} partial, ${stats.missing} missing of ${stats.total} objectives. Weighted coverage about ${stats.weighted}%`));
  }
  const before = structuredClone(ranked[0]);
  filterCoverage(rows, { exam: 'N10-009', status: 'covered', search: 'nonexistent' });
  assert.deepEqual(rankGaps(rows)[0], before, 'filtering must not change the global recommendation');
});

test('reconciled display package is counted from its single mapping and guided lab', async () => {
  const display = rows.find((r) => r.key === '220-1201:5.3');
  assert.deepEqual(display.topics, ['core1-display-troubleshooting']);
  assert.deepEqual([display.notes, display.cards, display.quiz, display.labs], [8, 12, 15, 1]);
  const { readFileSync } = await import('node:fs');
  const labs = JSON.parse(readFileSync(new URL('../content/labs.json', import.meta.url), 'utf8'));
  const related = labs.filter((lab) => lab.relatedTopicIds?.includes(display.topics[0]));
  assert.equal(related.length, 1);
  assert.equal(related[0].slug, 'display-path-isolation');
  assert.match(JSON.stringify(related[0]), /paper alternative/i);
});
