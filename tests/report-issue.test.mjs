import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReport, issueBody, issueTitle, githubIssueUrl, quote, createRateLimiter } from '../lib/report/issue.ts';

const good = { category: 'Factual error', page: '/notes/n10-tcpip', pageTitle: 'TCP/IP', item: 'SNMP uses TCP 161', claim: 'SNMP uses UDP 161 and 162 per N10-009 1.4.', source: 'N10-009 1.4', reporter: '' };

test('valid report passes and is trimmed', () => {
  const r = validateReport({ ...good, item: '  SNMP uses TCP 161  ' });
  assert.equal(r.ok, true);
  assert.equal(r.report.item, 'SNMP uses TCP 161');
});

test('rejects bad category, missing page, short item and claim', () => {
  assert.equal(validateReport({ ...good, category: 'Spam' }).ok, false);
  assert.equal(validateReport({ ...good, page: 'https://evil.example' }).ok, false);
  assert.equal(validateReport({ ...good, item: 'x' }).ok, false);
  assert.equal(validateReport({ ...good, claim: 'wrong' }).ok, false);
  assert.equal(validateReport(null).ok, false);
});

test('caps field lengths', () => {
  const r = validateReport({ ...good, claim: 'a'.repeat(10000) });
  assert.equal(r.report.claim.length, 4000);
});

test('issue body neutralises mentions, issue refs and HTML', () => {
  const q = quote('ping @maintainer about #12 <script>alert(1)</script>');
  assert.ok(!q.includes('@maintainer'));
  assert.ok(!q.includes('#12'));
  assert.ok(!q.includes('<script>'));
  assert.ok(q.startsWith('> '));
  const r = validateReport({ ...good, claim: 'line one is wrong\nline two @someone' }).report;
  const body = issueBody(r, 'https://site.example');
  assert.ok(body.includes('https://site.example/notes/n10-tcpip'));
  assert.ok(body.includes('> line two @​someone'));
  assert.ok(issueTitle(r).startsWith('[Content dispute] Factual error:'));
});

test('fallback URL targets the issue form with prefilled fields', () => {
  const url = new URL(githubIssueUrl(good, 'https://site.example', 'owner/repo'));
  assert.equal(url.pathname, '/owner/repo/issues/new');
  assert.equal(url.searchParams.get('template'), 'content-dispute.yml');
  assert.equal(url.searchParams.get('page'), 'https://site.example/notes/n10-tcpip');
  assert.equal(url.searchParams.get('item'), good.item);
});

test('rate limiter allows max per window then resets', () => {
  const allow = createRateLimiter(2, 1000);
  assert.equal(allow('a', 0), true);
  assert.equal(allow('a', 10), true);
  assert.equal(allow('a', 20), false);
  assert.equal(allow('b', 20), true);
  assert.equal(allow('a', 2000), true);
});

test('Class 10: every problem is collected, not just the first', () => {
  const r = validateReport({ ...good, category: 'Spam', item: 'x', claim: 'wrong' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors, [
    'Choose a category.',
    'Say which item is wrong (paste the text, question, or card).',
    'Explain what is wrong and what it should say (at least 15 characters).',
  ]);
  assert.equal(r.error, r.errors.join(' '));
  // one problem still gives one message
  assert.deepEqual(validateReport({ ...good, claim: 'wrong' }).errors, ['Explain what is wrong and what it should say (at least 15 characters).']);
  // wrong types are reported, not thrown
  for (const bad of [null, 'text', 42, [], undefined]) assert.deepEqual(validateReport(bad).errors, ['Send the report as a JSON object.']);
  assert.equal(validateReport({ ...good, item: 12345 }).errors[0], 'Say which item is wrong (paste the text, question, or card).');
});
