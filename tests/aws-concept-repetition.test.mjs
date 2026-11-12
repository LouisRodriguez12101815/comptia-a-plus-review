import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { awsClfAlternatives, awsClfConceptEvidence, awsClfPracticeAt, awsClfRemediation, remediationQuizHref } from '../lib/aws-clf-remediation.ts';
import { remediationForQuestion } from '../lib/weak-areas.ts';
import { selectInlineRemediation } from '../lib/inline-remediation.ts';
import { parseProgress, recordQuiz, saveProgress, getProgressSnapshot } from '../lib/progress.ts';
import { mergeProgress } from '../lib/learner/merge.ts';
import { buildStudyEvent } from '../lib/study-telemetry.ts';
import { parseStudyEvent, appendTelemetry, loadTelemetry } from '../lib/learner/telemetry.ts';
import { controlledQuestionIds } from '../lib/controlled-question-pool.ts';
import { isCorrectPick } from '../lib/quiz-feedback.ts';

const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const questions = read('questions'), cards = read('flashcards'), visuals = read('track-visuals');
const topics = [...read('topics'), ...read('topics-network-plus')];
const q = id => questions.find(question => question.id === id);
const ec2 = q('q-clf21-01'), ec2Other = q('q-clf21-05'), third = q('q-clf21-06'), rds = q('q-clf21-03');
const attempt = (question, correct, at) => ({ topicId: question.topicId, at, correct: Number(correct), total: 1, questionIds: [question.id], missedIds: correct ? [] : [question.id] });
const progress = attempts => ({ ...parseProgress(null).progress, studyFocus: 'clf-c02', quizAttempts: attempts });
const evidence = attempts => awsClfConceptEvidence(progress(attempts), questions);

// Fail when content changes invalidate the reviewed mapping/resource contract.
test('only reviewed 2.1 competencies map, with valid existing notes/cards/visuals', () => {
  assert.equal(awsClfRemediation(ec2).id, awsClfRemediation(ec2Other).id);
  assert.notEqual(awsClfRemediation(ec2).id, awsClfRemediation(rds).id);
  assert.notEqual(awsClfRemediation(q('q-clf21-04')).id, awsClfRemediation(q('q-clf21-07')).id);
  assert.equal(awsClfRemediation(q('q-clf21-10')), undefined, 'broad model is not one precise misconception');
  assert.equal(awsClfRemediation(q('q-clf22-03')), undefined);
  const mapped = questions.filter(question => awsClfRemediation(question));
  assert.equal(mapped.length, 10);
  for (const question of mapped) {
    const meta = awsClfRemediation(question);
    assert.ok(cards.some(card => card.id === meta.cardId && card.examCodes.includes('clf-c02')));
    const rem = remediationForQuestion({ question, misses: 1, latestMissAt: 1 }, { questions, visualsForTopic: id => visuals[id] ?? [] });
    const [topicId, sectionId] = rem.notesHref.slice('/notes/'.length).split('#');
    assert.ok(topics.find(topic => topic.id === topicId)?.sections.some(section => section.id === sectionId));
    assert.equal(rem.visual.file, 'aws-clf-security-transfer.html');
    for (const locale of ['en', 'es', 'fr', 'pt']) {
      const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url)));
      assert.equal(typeof messages.weakAreas.remediation.clusters[meta.labelKey], 'string');
      for (const key of ['repeatQuestion', 'practiceConcept', 'awsNoAlternative', 'awsRepeatedEvidence', 'awsTransferEvidence', 'awsRecoveryEvidence']) assert.equal(typeof messages.quizRunner[key], 'string');
    }
  }
});

test('precise resources replace arbitrary topic cards; unmapped SG/NACL avoids unrelated recommendations', () => {
  const resources = { questions, flashcards: cards, priorMisses: 2, visualsForTopic: id => visuals[id] ?? [] };
  const rem = selectInlineRemediation(ec2, resources);
  assert.deepEqual(rem.flashcards.map(card => card.id), ['fc-clf21-ec2']);
  assert.equal(rem.notesHref, '/notes/aws-clf-security-transfer#responsibility');
  assert.equal(rem.visual.file, 'aws-clf-security-transfer.html');
  const sg = selectInlineRemediation(q('q-clf35-03'), resources);
  assert.deepEqual(sg.flashcards, []);
  assert.equal(sg.visual, undefined);
  assert.equal(sg.video, undefined);
  assert.equal(sg.notesHref, '/notes/aws-clf-technology-services');
});

test('different-question selection excludes original, unrelated certifications, objectives and unmapped IDs', () => {
  const alternatives = awsClfAlternatives(ec2, questions);
  assert.deepEqual(alternatives, ['q-clf21-05', 'q-clf21-06']);
  assert.deepEqual(awsClfAlternatives(ec2, [ec2, rds, { ...ec2Other, examCodes: ['n10-009'] }, { ...third, objectiveIds: { 'clf-c02': ['2.2'] } }]), []);
  const url = new URL(remediationQuizHref(alternatives, 'clf-c02'), 'https://local.example');
  assert.equal(url.searchParams.get('exam'), 'clf-c02');
  assert.deepEqual(controlledQuestionIds(url.searchParams.get('questions').split(','), questions, topics, 'clf-c02'), alternatives);
  assert.deepEqual(controlledQuestionIds(alternatives, questions, topics, 'n10-009'), []);
});

test('single-item competencies omit unsupported alternatives without substituting another 2.1 misconception', () => {
  assert.deepEqual(awsClfAlternatives(q('q-clf21-04'), questions), []);
  assert.deepEqual(awsClfAlternatives(q('q-clf21-02'), questions), []);
  assert.deepEqual(awsClfAlternatives(ec2, [ec2]), []);
});

test('repeat correctness preserves misses but only a new, different matched question supplies recovery evidence', () => {
  const initial = attempt(ec2, false, 100), repeated = attempt(ec2, true, 200), transfer = attempt(ec2Other, true, 300);
  const first = evidence([initial])[0];
  assert.equal(first.incorrect, 1);
  assert.equal(first.currentlyRecovered, false);
  const repeat = evidence([initial, repeated])[0];
  assert.equal(repeat.repeatedCorrect, 1);
  assert.equal(repeat.transferCorrect, 0);
  assert.equal(repeat.currentlyRecovered, false);
  const recovered = evidence([initial, repeated, transfer])[0];
  assert.deepEqual([recovered.incorrect, recovered.correct, recovered.repeatedCorrect, recovered.transferCorrect], [1, 2, 1, 1]);
  assert.equal(recovered.currentlyRecovered, true);
  assert.deepEqual(recovered.recoveryQuestionIds, [ec2Other.id]);
  const relapse = evidence([initial, repeated, transfer, attempt(third, false, 400)])[0];
  assert.equal(relapse.currentlyRecovered, false);
  assert.equal(relapse.incorrect, 2);
  assert.equal(relapse.transferCorrect, 1);
  assert.equal('mastery' in relapse, false);
});

test('unrelated success and previously exposed alternatives are not new transfer evidence', () => {
  const rows = evidence([attempt(ec2Other, true, 50), attempt(ec2, false, 100), attempt(rds, true, 200), attempt(ec2Other, true, 300)]);
  const row = rows.find(row => row.conceptId === awsClfRemediation(ec2).id);
  assert.equal(row.transferCorrect, 0);
  assert.equal(row.repeatedCorrect, 1);
  assert.equal(row.currentlyRecovered, false);
});

test('tied, duplicate and contradictory streams cannot manufacture recovery or extra attempts', () => {
  assert.equal(evidence([attempt(ec2, false, 100), attempt(ec2Other, true, 100)])[0].transferCorrect, 0);
  const initial = attempt(ec2, false, 100), transfer = attempt(ec2Other, true, 200);
  assert.equal(evidence([initial, initial, transfer, transfer])[0].correct, 1);
  assert.equal(evidence([initial, transfer, attempt(ec2Other, false, 200)])[0].currentlyRecovered, false);
  const rows = evidence([initial, transfer, attempt(third, true, 300), attempt(third, false, 300)]);
  assert.equal(rows[0].currentlyRecovered, false);
});

test('explicit other-exam and mismatched-objective mock evidence cannot enter CLF recovery', () => {
  const p = progress([attempt(ec2, false, 100)]);
  p.mockAttempts = [{ ...attempt(ec2Other, true, 200), exam: 'n10-009' }, { ...attempt(third, true, 300), exam: 'clf-c02', objectiveByQuestion: { [third.id]: '2.2' } }];
  assert.equal(awsClfConceptEvidence(p, questions)[0].transferCorrect, 0);
});

test('existing progress parsing/merge retains repeats and deduplicates synced copies', () => {
  const p = progress([attempt(ec2, false, 100), attempt(ec2, true, 101), attempt(ec2Other, true, 102)]);
  const decoded = parseProgress(JSON.stringify(p));
  assert.deepEqual(decoded.problems, []);
  const merged = mergeProgress(decoded.progress, decoded.progress);
  assert.equal(merged.quizAttempts.length, 3);
  assert.equal(awsClfConceptEvidence(merged, questions)[0].transferCorrect, 1);
});

test('real recordQuiz and telemetry append record distinct synthetic repeats through existing persistence', async () => {
  const storage = new Map();
  globalThis.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, addEventListener() {}, removeEventListener() {} };
  const items = new Map();
  const map = { async list() { return [...items].map(([key, data]) => ({ key, data })); }, async set(key, data) { items.set(key, data); }, async remove(key) { items.delete(key); } };
  try {
    saveProgress(progress([]));
    const now = Date.now();
    for (const [index, [question, correct]] of [[ec2, false], [ec2, true], [ec2Other, true]].entries()) {
      assert.equal(isCorrectPick(question, correct ? question.answer : (question.answer + 1) % question.choices.length), correct);
      const a = { ...attempt(question, correct, awsClfPracticeAt(getProgressSnapshot(), now)), ...(index === 0 ? { topicId: 'all' } : {}) }; const { at, ...saved } = a;
      recordQuiz(saved, at);
      await appendTelemetry(map, parseStudyEvent(buildStudyEvent({ type: 'question_answered', question, exam: 'clf-c02', correct, ...(!correct ? { missCount: 1 } : {}) }, 'synthetic-clf-practice-session', at)));
    }
    const saved = getProgressSnapshot();
    assert.equal(saved.quizAttempts.length, 3);
    assert.equal(saved.quizAttempts.filter(a => a.missedIds.includes(ec2.id)).length, 1);
    assert.equal((await loadTelemetry(map)).length, 3);
    assert.equal(awsClfConceptEvidence(saved, questions)[0].currentlyRecovered, true);
  } finally { delete globalThis.window; }
});

test('Network+ authored resources and retry identity remain unchanged', () => {
  const question = q('q-n10c7-16');
  const rem = selectInlineRemediation(question, { questions, flashcards: cards, visualsForTopic: id => visuals[id] ?? [] });
  assert.equal(rem.examClueKey, 'eui64BitFlip');
  assert.equal(rem.retryExam, 'n10-009');
  assert.equal(rem.notesHref, '/notes/n10-ch7');
  assert.equal(awsClfRemediation(question), undefined);
});
