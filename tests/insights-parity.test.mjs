import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { buildCoverage } from '../scripts/objective-coverage.mjs';
import { buildInsightsFromCoverage } from '../lib/objective-coverage.mjs';

test('Insights aggregate output matches report:objectives CLI for every exam and domain', () => {
  const coverage = buildCoverage();
  const expected = buildInsightsFromCoverage(coverage);
  const cli = spawnSync(process.execPath, ['scripts/objective-coverage.mjs', '--json'], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  const actual = JSON.parse(cli.stdout);
  assert.deepEqual(actual, expected);
  assert.equal(actual.exams.length, coverage.objectives.exams.length);
  for (const exam of coverage.objectives.exams) {
    const row = actual.exams.find((item) => item.code === exam.code);
    assert.ok(row, `missing exam ${exam.code}`);
    assert.equal(row.domains.length, exam.domains.length, exam.code);
    assert.equal(row.weighted, expected.exams.find((item) => item.code === exam.code).weighted, exam.code);
    assert.deepEqual(row.domains.map(({ id, covered, partial, missing }) => ({ id, covered, partial, missing })),
      expected.exams.find((item) => item.code === exam.code).domains.map(({ id, covered, partial, missing }) => ({ id, covered, partial, missing })));
  }
  assert.ok(actual.exams.some((exam) => exam.total === 0 && exam.questions === 0 && exam.flashcards === 0 && exam.labs === 0), 'empty matrix tracks remain visible with zero counts');
  assert.deepEqual(Object.keys(actual), ['exams', 'resourceTracks', 'partialCandidates'], 'aggregate output excludes raw resource data');
  assert.deepEqual(actual.resourceTracks.find((track) => track.code === '200-301'), {
    code: '200-301', name: 'Cisco CCNA', questions: 0, flashcards: 0, labs: 25, weighted: null,
  });
});

test('track counts use exam tags while domain counts require mapped topics', () => {
  const result = buildInsightsFromCoverage({
    objectives: { reviewed: false, note: '', exams: [{ code: 'demo', name: 'Demo', domains: [
      { id: 'A', title: 'Mapped', weight: 70, objectives: [{ id: '1.1', title: 'Mapped task', status: 'partial', topics: ['mapped'] }] },
      { id: 'B', title: 'No objectives', weight: 30, objectives: [] },
    ] }] },
    rows: [{ exam: 'demo', id: '1.1', domain: 'A', status: 'partial', topics: ['mapped'] }],
    topics: [{ id: 'mapped', examCodes: ['demo'] }, { id: 'unmapped', examCodes: ['demo'] }, { id: 'other', examCodes: ['other'] }],
    questions: [
      { id: 'q-mapped', topicId: 'mapped' },
      { id: 'q-track-only', topicId: 'unmapped' },
      { id: 'q-explicit-other', topicId: 'mapped', examCodes: ['other'] },
    ],
    cards: [{ id: 'fc-mapped', topicId: 'mapped' }, { id: 'fc-track-only', topicId: 'unmapped' }],
    labs: [{ slug: 'lab-mapped', relatedTopicIds: ['mapped'] }, { slug: 'lab-track-only', relatedTopicIds: ['unmapped'] }],
  });
  const exam = result.exams[0];
  assert.deepEqual([exam.questions, exam.flashcards, exam.labs], [2, 2, 2]);
  assert.deepEqual([exam.domains[0].questions, exam.domains[0].flashcards, exam.domains[0].labs], [1, 1, 1]);
  assert.deepEqual([exam.domains[1].questions, exam.domains[1].flashcards, exam.domains[1].labs], [0, 0, 0]);
  assert.equal(exam.weighted, 35);
  assert.equal(result.resourceTracks.find((track) => track.code === '200-301').labs, 2);
  assert.deepEqual(result.partialCandidates.map(({ exam, id }) => [exam, id]), [['demo', '1.1']]);
});
