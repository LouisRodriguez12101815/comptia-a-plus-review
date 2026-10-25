import test from 'node:test';
import assert from 'node:assert/strict';
import { objectiveStats, weakestObjectives } from '../lib/weakness.ts';

const pool = {
  code: '220-1202', name: 'Core 2', totalUnique: 6,
  domains: [
    { id: '2.0', title: 'Security', weight: 28, available: 6, objectives: [
      { id: '2.3', title: 'Wireless', topics: [], questionIds: ['a', 'b', 'c'] },
      { id: '2.5', title: 'Social engineering', topics: [], questionIds: ['d', 'e', 'f'] },
    ] },
  ],
};
const sitting = (at, shown, missed) => ({ exam: '220-1202', full: false, correct: 0, total: shown.length, percent: 0, domains: [], multiCorrect: 0, multiTotal: 0, questionIds: shown, missedIds: missed, at });

test('objective stats count only shown questions and mark weak, few and untested objectives', () => {
  const attempts = [
    sitting(2, ['a', 'b', 'c', 'd'], ['a', 'b']),
    sitting(1, ['a', 'b'], ['a', 'zz']),
    sitting(3, ['a'], []),
    sitting(4, ['x'], ['x']),
  ];
  attempts.push({ ...sitting(5, ['a', 'b'], ['a', 'b']), exam: '220-1201' });
  const stats = objectiveStats(pool, attempts, '220-1202');
  const wireless = stats.find((s) => s.id === '2.3');
  assert.equal(wireless.answered, 6);
  assert.equal(wireless.correct, 3);
  assert.equal(wireless.recent, 50);
  assert.equal(wireless.status, 'weak');
  assert.equal(stats.find((s) => s.id === '2.5').status, 'few');
  assert.deepEqual(weakestObjectives(stats).map((s) => s.id), ['2.3']);
  assert.equal(objectiveStats(pool, [], '220-1202').every((s) => s.status === 'untested'), true);
});

test('a recorded objective per question keeps a shared question from counting toward every objective', () => {
  const shared = { ...pool, domains: [{ ...pool.domains[0], objectives: [
    { id: '2.3', title: 'Wireless', topics: [], questionIds: ['a', 'b', 'c'] },
    { id: '2.5', title: 'Social engineering', topics: [], questionIds: ['a', 'b', 'c'] },
  ] }] };
  const attempt = { ...sitting(1, ['a', 'b', 'c'], ['a']), objectiveByQuestion: { a: '2.3', b: '2.3', c: '2.3' } };
  const stats = objectiveStats(shared, [attempt], '220-1202');
  assert.equal(stats.find((s) => s.id === '2.3').answered, 3);
  assert.equal(stats.find((s) => s.id === '2.5').answered, 0);
  const legacy = objectiveStats(shared, [sitting(1, ['a', 'b', 'c'], ['a'])], '220-1202');
  assert.equal(legacy.find((s) => s.id === '2.5').answered, 3);
});
