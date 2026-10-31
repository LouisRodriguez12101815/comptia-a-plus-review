import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges } from '../lib/practice/catalog.ts';
import { newSession, restoreSessionChecked, restoreSession, safePercent, submit } from '../lib/practice/session.ts';
import { validateTypedAddress } from '../lib/subnet/grading.ts';
import { address, AddressFormatError, addressProblem } from '../lib/subnet/ipv4.ts';

/* Class 10 test table: one good baseline, then change exactly one thing and check the result. */
const challenge = challenges[0];
const good = () => JSON.stringify(newSession(challenge));

test('baseline: a good saved session restores', () => {
  const result = restoreSessionChecked(good(), challenge);
  assert.equal(result.ok, true);
});

const saved = [
  ['nothing saved is an expected case, not an error', null, 'empty'],
  ['empty text is an expected case', '', 'empty'],
  ['broken JSON is the one error we expect', '{"challengeId":', 'unreadable'],
  ['plain text is unreadable', 'not json', 'unreadable'],
  ['null parses but is not a session', 'null', 'mismatch'],
  ['an array parses but is not a session', '[]', 'mismatch'],
  ['a number parses but is not a session', '42', 'mismatch'],
  ['wrong challenge id', JSON.stringify({ ...newSession(challenge), challengeId: 'other' }), 'mismatch'],
  ['wrong content version', JSON.stringify({ ...newSession(challenge), version: 999 }), 'mismatch'],
  ['round index out of range', JSON.stringify({ ...newSession(challenge), roundIndex: -1 }), 'mismatch'],
  ['receipt for a round that does not exist', JSON.stringify({ ...newSession(challenge), receipts: { nope: { hintUsed: false, attemptedIds: [] } } }), 'mismatch'],
];
for (const [name, raw, reason] of saved) {
  test(`saved progress: ${name}`, () => {
    const result = restoreSessionChecked(raw, challenge);
    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
    assert.equal(restoreSession(raw, challenge), null); // the older helper keeps working
  });
}

test('saved progress: a real progress record still round-trips after a submit', () => {
  const round = challenge.rounds[0];
  const next = submit(newSession(challenge), challenge, round.id, round.correctAnswerId);
  const result = restoreSessionChecked(JSON.stringify(next), challenge);
  assert.equal(result.ok, true);
});

test('zero attempts is a normal state: no exception, no NaN', () => {
  assert.equal(safePercent(0, 0), null);
  assert.equal(safePercent(1, 2), 50);
  assert.equal(safePercent(3, 3), 100);
});

/* Typed-answer validator: baseline passes, then one change at a time. */
test('validator baseline: a clean address is ok', () => {
  const r = validateTypedAddress('192.168.10.0', 'network');
  assert.equal(r.ok, true);
  assert.equal(r.value, address('192.168.10.0'));
  assert.deepEqual(r.errors, []);
});
const typed = [
  ['empty text', ''],
  ['spaces only', '   '],
  ['letters', 'ABC'],
  ['three octets', '192.168.10'],
  ['five octets', '192.168.10.0.1'],
  ['octet above 255', '192.168.10.256'],
  ['leading zero', '192.168.010.0'],
  ['negative octet', '192.168.-1.0'],
  ['not text at all (null)', null],
  ['not text at all (a number)', 3232238080],
  ['not text at all (an object)', {}],
];
for (const [name, raw] of typed) {
  test(`validator: ${name} is a normal result, not a crash`, () => {
    const r = validateTypedAddress(raw, 'network');
    assert.equal(r.ok, false);
    assert.equal(r.value, null);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0].text, /^network: Enter four decimal octets/);
    assert.equal(r.errors[0].key, 'fieldError');
  });
}
test('validator: surrounding spaces are trimmed', () => {
  assert.equal(validateTypedAddress('  10.0.0.1  ').ok, true);
});
test('address() throws only the specific error class; addressProblem() never throws', () => {
  assert.throws(() => address('ABC'), AddressFormatError);
  assert.equal(addressProblem('10.0.0.1'), null);
  assert.ok(addressProblem(undefined));
});
