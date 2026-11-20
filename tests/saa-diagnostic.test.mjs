import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildExamPool, draftTest, mulberry32, sessionDurationSeconds, isCorrect, summarizeTestTasks } from '../lib/exam-test.mjs';
import { rankDiagnosticMisses, saaDiagnosticPool, SAA_DIAGNOSTIC_IDS } from '../lib/saa-diagnostic.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const questions = read('content/questions.json');
const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
const audit = read('docs/saa-c03-question-bank-audit.json');
const manifest = read('docs/saa-diagnostic-source-manifest.json');
const pool = saaDiagnosticPool(buildExamPool({ objectives: read('content/objectives.json'), questions, topics: [...read('content/topics.json'), ...read('content/topics-network-plus.json')], examCode: 'saa-c03' }));

test('diagnostic selects exactly the audited, source-reviewed questions with no invented 65-question coverage', () => {
  assert.deepEqual([...SAA_DIAGNOSTIC_IDS].sort(), [...audit.roundTwo.sourceAccess.verifiedQuestionIds].sort());
  assert.equal(pool.totalUnique, 25);
  assert.deepEqual(pool.domains.map((d) => d.available), [5, 4, 3, 13]);
  const selected = draftTest(pool, 65, mulberry32(7));
  assert.equal(selected.length, 25);
  assert.equal(new Set(selected.map((item) => item.questionId)).size, 25);
  assert.equal(sessionDurationSeconds('saa-c03', selected.length), 3000);
  assert.ok(selected.some((item) => Array.isArray(byId[item.questionId].answer)));
  assert.ok(selected.some((item) => !Array.isArray(byId[item.questionId].answer)));
  for (const selectedQuestion of selected) {
    const q = byId[selectedQuestion.questionId];
    const fingerprint = manifest.records.find((item) => item.id === q.id);
    assert.equal(createHash('sha256').update(JSON.stringify(q)).digest('hex'), fingerprint.recordSha256, `${q.id}: content changed since source review`);
    const reviewed = audit.newQuestionReview.find((item) => item.id === q.id) ?? audit.questionCorrections.find((item) => item.questionId === q.id);
    assert.equal(reviewed.sourceVerification.status, 'verified', q.id);
    assert.equal(reviewed.sourceVerification.optionExplanationsChecked.length, q.choices.length, q.id);
    assert.deepEqual(reviewed.sourceVerification.optionExplanationsChecked.map((item) => item.choice), q.choices, q.id);
    assert.ok(reviewed.sourceVerification.optionExplanationsChecked.every((item) => item.checked && item.officialSourceUrls.length > 0 && item.officialSourceUrls.every((url) => url.startsWith('https://docs.aws.amazon.com/') || url.startsWith('https://aws.amazon.com/'))), q.id);
    for (const choice of q.choices) assert.ok(q.explanation.includes(`Option: ${choice} — `), q.id);
  }
});

test('review follows the existing weak-task ranking before remaining miss counts without mutating input', () => {
  const groups = [['4.2', [1, 2, 3]], ['1.2', [4]], ['2.1', [5, 6]]];
  assert.deepEqual(rankDiagnosticMisses(groups, ['1.2']).map(([id]) => id), ['1.2', '4.2', '2.1']);
  assert.deepEqual(groups.map(([id]) => id), ['4.2', '1.2', '2.1']);
});

test('task counts distinguish unanswered, incorrect and exact multiple response', () => {
  const picks = [{ questionId:'single', domainId:'1.0', objectiveId:'1.1' }, { questionId:'multi', domainId:'1.0', objectiveId:'1.1' }, { questionId:'blank', domainId:'1.0', objectiveId:'1.1' }];
  const q = { single:{answer:1}, multi:{answer:[0,2]}, blank:{answer:0} };
  const responses = { single:{answer:1}, multi:{answer:[0]}, blank:{answer:undefined} };
  assert.equal(isCorrect(q.multi, [0]), false);
  assert.equal(isCorrect(q.multi, [2,0]), true);
  assert.deepEqual(summarizeTestTasks({picks, questionsById:q, responses}), [{domainId:'1.0', objectiveId:'1.1', correct:1, attempted:2, unanswered:1}]);
});
