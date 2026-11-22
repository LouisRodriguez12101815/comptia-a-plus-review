import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReport, issueBody, issueTitle, githubIssueUrl, quote, createRateLimiter } from '../lib/report/issue.ts';
import { formatSectionDetails } from '../lib/report/details.ts';

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

test('question reports include id, order, selected and keyed choices, and no personal fields', () => {
  const r = validateReport({
    ...good,
    question: {
      id: 'q-as1201-30',
      choiceOrder: ['Telnet', 'SSH', 'SNMPv1', 'HTTPS'],
      selected: ['SSH', 'HTTPS'],
      keyed: ['SSH', 'HTTPS'],
      email: 'learner@example.com',
      name: 'A Learner',
    },
  });
  assert.equal(r.ok, true);
  assert.equal(r.report.question.id, 'q-as1201-30');
  assert.deepEqual(r.report.question.choiceOrder, ['Telnet', 'SSH', 'SNMPv1', 'HTTPS']);
  const body = issueBody(r.report, 'https://site.example');
  assert.match(body, /Question id:\*\* q-as1201-30/);
  assert.match(body, /1\. Telnet/);
  assert.match(body, /Selected choices:\*\* SSH · HTTPS/);
  assert.match(body, /Keyed choices:\*\* SSH · HTTPS/);
  assert.equal(body.includes('learner@example.com'), false);
  assert.equal(body.includes('A Learner'), false);
  assert.equal(validateReport(good).report.question, undefined);
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

test('attached report details keep the codes and drop SIDs, phone numbers, and secrets', () => {
  const sid = `AC${'a'.repeat(32)}`;
  const phone = '+13055550123';
  const secret = 'secret-value-not-for-output';
  const details = formatSectionDetails({
    section: 'Study report',
    status: 502,
    error: 'unavailable',
    reason: { call: `sync list ${sid} ${phone} ${secret}`, code: 20404, status: 404 },
  });
  const r = validateReport({
    ...good,
    page: '/account/report',
    item: 'Error',
    claim: 'Error shown on this page',
    source: 'Error',
    details: `${details}\n${sid} ${phone} ${secret}`,
  });
  assert.equal(r.ok, true);
  const body = issueBody(r.report, 'https://site.example');
  assert.match(body, /### Attached report details/);
  assert.match(body, /Study report/);
  assert.match(body, /error: unavailable/);
  assert.match(body, /twilio: 20404/);
  assert.match(body, /http: 404/);
  assert.equal(body.includes(sid), false);
  assert.equal(body.includes(phone), false);
  assert.equal(body.includes('3055550123'), false);
  assert.equal(body.includes(secret), false);
  assert.equal(body.includes('secret-value'), false);
});

test('attached report details omit Twilio friendly names and keep the last four, counts, and dates', () => {
  const account = 'Civic Path Lab';
  const parent = 'Parent Holding Co';
  const service = 'Outage Ops Sync';
  const fullSid = `AC${'a'.repeat(28)}ab12`;
  const details = formatSectionDetails({
    section: 'Diagnostics',
    status: 200,
    sections: [{ call: 'account', ok: false, code: 20003, status: 401 }],
    sidLast4: 'ab12',
    usageStart: '2026-10-22T00:00:00.000Z',
    usageEnd: '2026-11-21T00:00:00.000Z',
    usage: [
      { category: 'sync-storage', count: '3', usage: '12', price: '0.40' },
      { category: account, count: '1', usage: '2', price: '0.10' },
    ],
    accountFriendlyName: account,
    parentFriendlyName: parent,
    syncServiceFriendlyName: service,
  });
  const health = formatSectionDetails({
    section: 'Connection check',
    status: 200,
    checks: [{
      name: 'account',
      ok: false,
      code: 20003,
      status: 401,
      friendlyName: account,
      sidLast4: fullSid,
      itemCount: 4,
      dateUpdated: '2026-11-21T12:00:00.000Z',
      quizAttempts: 2,
      mockAttempts: 1,
      memoryMisses: 3,
      mistakeRows: 1,
    }, {
      name: 'sync service',
      ok: true,
      code: null,
      status: null,
      friendlyName: service,
    }],
  });
  const r = validateReport({
    ...good,
    page: '/account/report',
    item: 'Error',
    claim: 'Error shown on this page',
    source: 'Error',
    details: `${details}\n\n${health}`,
  });
  assert.equal(r.ok, true);
  const body = issueBody(r.report, 'https://site.example');
  assert.match(body, /### Attached report details/);
  assert.match(body, /Diagnostics/);
  assert.match(body, /error: failed/);
  assert.match(body, /call: account/);
  assert.match(body, /twilio: 20003/);
  assert.match(body, /http: 401/);
  assert.match(body, /sid: ab12/);
  assert.match(body, /usage start: 2026-10-22T00:00:00.000Z/);
  assert.match(body, /usage end: 2026-11-21T00:00:00.000Z/);
  assert.match(body, /sync-storage: count 3, usage 12, price 0.40/);
  assert.match(body, /usage: count 1, usage 2, price 0.10/);
  assert.match(body, /items: 4/);
  assert.match(body, /quizzes: 2/);
  assert.match(body, /updated: 2026-11-21T12:00:00.000Z/);
  assert.equal(body.includes(account), false);
  assert.equal(body.includes(parent), false);
  assert.equal(body.includes(service), false);
  assert.equal(body.includes(fullSid), false);
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
