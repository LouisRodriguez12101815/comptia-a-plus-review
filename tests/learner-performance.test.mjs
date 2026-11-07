import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performanceSummary, questionPerformance, objectivePerformance, repeatedMisses, recoveredQuestions, topicPerformance, remediationOutcomes, resourceOutcomes } from '../lib/learner-performance.ts';

const question = (id, topicId = 'topic-a', objectiveIds = { 'n10-009': ['1.1'] }) => ({ id, topicId, prompt: `Prompt ${id}`, choices: ['A', 'B'], answer: 0, explanation: 'Why', examCodes: ['n10-009'], objectiveIds });
const progress = (quizAttempts = [], mockAttempts = []) => ({ studyFocus: 'n10-009', knownCards: {}, unknownCards: {}, schedules: {}, quizAttempts, mockAttempts });
const quiz = (at, questionIds, missedIds = [], topicId = 'topic-a') => ({ at, topicId, questionIds, missedIds, correct: questionIds.length - missedIds.length, total: questionIds.length });

test('uses actual timestamps for windows and preserves aggregate totals', () => {
  const now = 24 * 60 * 60 * 1000 + 1000;
  const p = progress([quiz(now, ['q1'], []), quiz(999, ['q1'], ['q1'])]);
  assert.deepEqual(performanceSummary(p, '24h', now), { quizzes: 1, mocks: 0, questions: 1, correct: 1, incorrect: 0, accuracy: 100 });
  assert.equal(performanceSummary(p, 'history', now).questions, 2);
});

test('tracks ever recovered separately from currently recovered', () => {
  const p = progress([quiz(100, ['q1', 'q2'], ['q1']), quiz(200, ['q1'], []), quiz(300, ['q1'], ['q1'])]);
  const rows = questionPerformance(p, [question('q1'), question('q2')], { now: 400 });
  const q1 = rows.find((row) => row.questionId === 'q1');
  assert.equal(q1?.incorrect, 2);
  assert.equal(q1?.everRecovered, true);
  assert.equal(q1?.currentlyRecovered, false);
  assert.equal(repeatedMisses(rows).length, 1);
  assert.equal(recoveredQuestions(rows).length, 0);
});

test('counts authored wrong choices deterministically', () => {
  const q = { ...question('q1'), choices: ['A', 'B', 'C'] };
  const p = progress([
    { ...quiz(100, ['q1'], ['q1']), wrongChoices: { q1: 2 } },
    { ...quiz(200, ['q1'], ['q1']), wrongChoices: { q1: 2 } },
    { ...quiz(300, ['q1'], ['q1']), wrongChoices: { q1: 1 } },
  ]);
  const row = questionPerformance(p, [q], { now: 400 })[0];
  assert.deepEqual(row?.wrongChoiceCounts, { 1: 1, 2: 2 });
  assert.deepEqual(row?.mostCommonWrongChoice, { index: 2, count: 2, percent: 67 });
});

test('derives remediation outcomes by question ID without cross-question linkage', () => {
  const events = [
    { v: 1, type: 'remediation_opened', at: 1, exam: 'n10-009', sessionId: 'session-1234567890', questionId: 'q1', topicId: 't1' },
    { v: 1, type: 'remediation_resource_opened', at: 2, exam: 'n10-009', sessionId: 'session-1234567890', questionId: 'q1', topicId: 't1', resourceType: 'notes' },
    { v: 1, type: 'question_answered', at: 3, exam: 'n10-009', sessionId: 'session-1234567890', questionId: 'q2', topicId: 't2', correct: true },
    { v: 1, type: 'question_answered', at: 4, exam: 'n10-009', sessionId: 'session-1234567890', questionId: 'q1', topicId: 't1', correct: true },
  ];
  assert.deepEqual(remediationOutcomes(events), [{ questionId: 'q1', opened: 1, resources: 1, retries: 0, laterCorrect: true, latestAt: 4 }]);
  assert.deepEqual(resourceOutcomes(events).find((row) => row.resourceType === 'notes'), { resourceType: 'notes', opened: 1, laterCorrect: 1 });
});

test('groups topics and composite exam objectives without inventing unknown mappings', () => {
  const q1 = question('q1', 'networking', { 'n10-009': ['1.1'] });
  const q2 = question('q2', 'networking', {});
  const rows = questionPerformance(progress([quiz(100, ['q1', 'q2'], ['q1', 'q2'])]), [q1, q2], { topics: [{ id: 'networking', title: 'Networking' }], now: 200 });
  assert.equal(topicPerformance(rows)[0].title, 'Networking');
  assert.equal(objectivePerformance(rows).map((row) => row.key).join(','), 'n10-009:1.1');
});

test('older attempts without question IDs remain aggregate-only and do not crash', () => {
  const p = progress([{ at: 100, topicId: 'old', correct: 2, total: 3, missedIds: [] }]);
  assert.equal(performanceSummary(p, 'history', 200).questions, 3);
  assert.deepEqual(questionPerformance(p, [question('q1')], { now: 200 }), []);
});

test('performance route and all supported locale messages are present', () => {
  const route = readFileSync(resolve('app/[locale]/performance/page.tsx'), 'utf8');
  const component = readFileSync(resolve('app/components/PerformanceDashboard.tsx'), 'utf8');
  assert.match(route, /PerformanceDashboard/);
  assert.match(component, /useSyncExternalStore/);
  for (const locale of ['en', 'es', 'fr', 'pt']) {
    const messages = JSON.parse(readFileSync(resolve(`messages/${locale}.json`), 'utf8'));
    assert.ok(messages.performance?.title, `${locale} performance title missing`);
    assert.ok(messages.header?.performance, `${locale} header label missing`);
    assert.ok(messages.weakAreas?.performanceLink, `${locale} weak-area link missing`);
  }
});
