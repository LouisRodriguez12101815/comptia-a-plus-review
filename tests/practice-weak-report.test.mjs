import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeakReport, STATUS_ORDER } from '../lib/weak-report.ts';

const row = (over = {}) => ({ id: 'q-1', objectiveId: '2.1', topicId: 'n10-ch9', topicTitle: 'Routing', status: 'wrong', flagged: false, prompt: 'What   does\nARP do?', picked: 'Maps names to IPs', correct: 'Maps IPs to MACs', explanation: 'ARP resolves IPv4 to MAC.', ...over });
const base = { exam: 'n10-009', date: '2026-10-31', correct: 7, total: 10 };

test('a strong sitting is a normal result, not an error', () => {
  const text = buildWeakReport({ ...base, correct: 10, rows: [] });
  assert.match(text, /No wrong, guessed or flagged questions/);
  assert.doesNotMatch(text, /weak-concept-coach/);
});
test('baseline row appears with its question, pick, key and notes link', () => {
  const text = buildWeakReport({ ...base, rows: [row()] });
  assert.match(text, /Score 7 of 10\. 1 question needs attention/);
  assert.match(text, /Question: What does ARP do\?/); // whitespace collapsed
  assert.match(text, /I picked: Maps names to IPs/);
  assert.match(text, /Correct answer: Maps IPs to MACs/);
  assert.match(text, /Notes: \/notes\/n10-ch9/);
  assert.match(text, /weak-concept-coach/);
});
test('urgent statuses come first', () => {
  const rows = STATUS_ORDER.slice().reverse().map((status, i) => row({ id: `q-${i}`, status }));
  const text = buildWeakReport({ ...base, rows });
  const order = STATUS_ORDER.map((s) => ({ 'sure-wrong': 'Sure, but wrong', wrong: '## Wrong', 'guessed-wrong': 'Guessed, and wrong', 'lucky-guess': 'Guessed, and right', flagged: 'Flagged for review' }[s])).map((h) => text.indexOf(h, text.indexOf('## ', 0) + 1));
  assert.ok(order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])));
});
test('lucky guesses and flagged-only rows do not claim the learner picked a wrong answer', () => {
  const text = buildWeakReport({ ...base, rows: [row({ status: 'lucky-guess' }), row({ id: 'q-2', status: 'flagged', flagged: true })] });
  assert.doesNotMatch(text, /I picked:/);
  assert.match(text, /⚑/);
});
