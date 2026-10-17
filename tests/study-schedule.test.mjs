import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewCard, isDue, daysUntilDue, isKnownGrade } from '../lib/study/schedule.ts';

const t0 = new Date('2026-10-17T12:00:00Z');
const day = 86_400_000;

test('new cards are due now and have no schedule yet', () => {
  assert.equal(isDue(undefined, t0), true);
  assert.equal(daysUntilDue(undefined, t0), 0);
});

test('a reviewed card is not due until its due date', () => {
  const s = reviewCard(undefined, 'good', t0);
  assert.equal(isDue(s, t0), false);
  assert.equal(isDue(s, new Date(new Date(s.due).getTime() + 1)), true);
  assert.ok(daysUntilDue(s, t0) >= 1);
});

test('intervals grow with the grade: again < hard < good < easy', () => {
  const due = (g) => new Date(reviewCard(undefined, g, t0).due).getTime();
  assert.ok(due('again') < due('hard'));
  assert.ok(due('hard') < due('good'));
  assert.ok(due('good') < due('easy'));
});

test('a card reviewed again later gets a longer interval when remembered', () => {
  const first = reviewCard(undefined, 'good', t0);
  const later = new Date(new Date(first.due).getTime() + day);
  const second = reviewCard(first, 'good', later);
  assert.ok(new Date(second.due).getTime() - later.getTime() > new Date(first.due).getTime() - t0.getTime());
});

test('stored schedules are JSON-safe and revive to dates', () => {
  const s = reviewCard(undefined, 'easy', t0);
  const round = JSON.parse(JSON.stringify(s));
  assert.equal(typeof round.due, 'string');
  assert.equal(new Date(round.due).getTime(), new Date(s.due).getTime());
  const again = reviewCard(round, 'hard', new Date(new Date(round.due).getTime() + day));
  assert.equal(typeof again.due, 'string');
});

test('only good and easy count as known', () => {
  assert.equal(isKnownGrade('again'), false);
  assert.equal(isKnownGrade('hard'), false);
  assert.equal(isKnownGrade('good'), true);
  assert.equal(isKnownGrade('easy'), true);
});
