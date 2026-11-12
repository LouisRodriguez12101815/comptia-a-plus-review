import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, symlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVITY_FIELDS, collectActivity, DAY, sourceHash } from '../scripts/lib/learner-activity-data.mjs';
import { analyzeActivity, buildFollowup } from '../scripts/lib/learner-activity-plan.mjs';
import { activityCsv, options, outputNames, readLearnerItems, runExport } from '../scripts/export-learner-activity.mjs';
import { configuration } from '../scripts/export-primary-history.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const NOW = Date.parse('2026-11-11T12:00:00Z');
const N10 = 'n10-009', AWS = 'clf-c02';
const session = 'session-synthetic-device-0001';
const content = {
  topics: [{ id: 'net', examCodes: [N10] }, { id: 'other-net', examCodes: [N10] }, { id: 'aws', examCodes: [AWS] }],
  objectives: { exams: [
    { code: N10, name: 'CompTIA Network+', domains: [{ objectives: [{ id: '1.1', topics: ['net'] }, { id: '1.2', topics: ['other-net'] }] }] },
    { code: AWS, name: 'AWS Cloud Practitioner', domains: [{ objectives: [{ id: '1.1', topics: ['aws'] }] }] },
  ] },
  questions: Array.from({ length: 26 }, (_, i) => ({
    id: 'q' + i, topicId: i < 10 ? 'net' : i < 20 ? 'other-net' : 'aws', examCodes: [i < 20 ? N10 : AWS],
    objectiveIds: { [i < 20 ? N10 : AWS]: [i < 10 || i >= 20 ? '1.1' : '1.2'] },
    prompt: `Authored scenario ${i}: choose the matching behavior.`, choices: ['First', 'Second', 'Third'], answer: 0, explanation: 'The authored explanation.',
  })),
  concepts: { concepts: [{ id: 'contrast', questionIds: ['q0', 'q1', 'q2', 'q3'] }] },
};
const event = (questionId = 'q0', correct = false, at = NOW - DAY, extra = {}) => ({
  v: 1, type: 'question_answered', at, exam: Number(questionId.slice(1)) >= 20 ? AWS : N10,
  sessionId: session, questionId, topicId: content.questions.find(q => q.id === questionId)?.topicId ?? 'net', correct, ...extra,
});
const events = values => values.map((e, i) => ({ key: `telemetry-event-${i}`, data: { e } }));
// These analyzer fixtures deliberately include malformed attempts; the older
// direct-export format permits exercising analyzer-level redaction and gaps.
const progressItems = progress => [{ key: 'progress', data: { quizAttempts: [], mockAttempts: [], ...progress } }];
const sitting = (q = 'q0', correct = 0, at = NOW - DAY) => ({ topicId: 'net', total: 1, correct, questionIds: [q], missedIds: correct ? [] : [q], at });
const collect = (items, opts = {}, bank = content) => collectActivity(items, bank, { days: 7, asOf: NOW, ...opts });
const summary = values => analyzeActivity(collect(events(values)));
const ranked = (values, id = 'q0') => summary(values).questions.find(q => q.questionId === id);
const env = {
  TWILIO_ACCOUNT_SID: 'AC' + '0'.repeat(32), TWILIO_API_KEY_SID: 'SK' + '1'.repeat(32),
  TWILIO_API_KEY_SECRET: 'synthetic-key-never-export', TWILIO_SYNC_SERVICE_SID: 'IS' + '2'.repeat(32),
  LEARNER_SESSION_SECRET: 'synthetic-session-secret-'.repeat(2), LEARNER_ALLOWED_PHONES: '+12025550101',
};

test('window filtering uses the explicit anchor; persisted events older than seven days remain readable', () => {
  const items = events([event('q0', false, NOW - 8 * DAY), event('q1', true, NOW - 7 * DAY), event('q2', false, NOW + 1)]);
  assert.deepEqual(collect(items).activity.map(r => r.questionId), ['q1']);
  assert.deepEqual(collect(items, { days: 30 }).activity.map(r => r.questionId), ['q1', 'q0']);
  assert.equal(collect(items).gaps.outsideWindow, 2);
});

test('sorting and deduplication are deterministic with stable timestamp ties and independent sources', () => {
  const one = event('q1', false), two = event('q0', true), otherDevice = event('q1', false, one.at, { sessionId: 'session-synthetic-device-0002' });
  const a = collect(events([one, two, one, otherDevice])), b = collect(events([otherDevice, one, two, one]).reverse());
  assert.deepEqual(a, b);
  assert.equal(a.activity.length, 3);
  assert.equal(a.gaps.duplicateRows, 1);
  assert.equal(analyzeActivity(a).questions.find(q => q.questionId === 'q1').attempts, 2);
  assert.ok(a.activity.every(row => row.sourceHash.length === 24 && !row.sourceHash.includes(session)));
});

test('contradictory copies fail closed rather than inventing two outcomes', () => {
  assert.throws(() => collect(events([event(), event('q0', true)])), /conflicting_history/);
});

test('sensitive arbitrary fields and raw provider objects are never serialized', () => {
  const secret = 'PRIVATE-DO-NOT-EXPORT';
  const items = events([event('q0', false, NOW - DAY, { phone: secret, authToken: secret, headers: { authorization: secret } })]);
  items[0].toJSON = () => assert.fail('raw provider object serialized');
  items[0].data.profile = { secret };
  items.push(...progressItems({ phone: secret, cookies: secret, quizAttempts: [{ ...sitting('q1'), selectedChoices: { q1: secret } }] }));
  const report = collect(items), serialized = JSON.stringify(report);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes(session), false);
  assert.equal(report.gaps.redactedRecords, 1);
  assert.ok(report.activity.every(row => Object.keys(row).every(k => ACTIVITY_FIELDS.includes(k))));
  assert.equal(report.activity.find(r => r.questionId === 'q1').selectedAnswer, undefined);
  assert.equal(sourceHash(session), sourceHash(session));
  assert.notEqual(sourceHash(session), sourceHash(session + 'other'));
});

test('missing optional values stay absent; aggregate-only attempts are not converted into answers', () => {
  const report = collect([...events([event()]), ...progressItems({ quizAttempts: [{ total: 10, correct: 3, missedIds: [], at: NOW - DAY }] })]);
  const row = report.activity[0];
  for (const field of ['selectedAnswer', 'responseDurationMs', 'confidence', 'deviceId', 'attemptNumber', 'reviewCount']) assert.equal(field in row, false);
  assert.equal(report.gaps.aggregateOnlyAttempts, 1);
  assert.equal(analyzeActivity(report).questions[0].attempts, 1);
});

test('timed-out mocks export only explicitly visited questions and never infer unvisited outcomes', () => {
  const mock = { exam: N10, at: NOW - DAY, total: 3, correct: 1, questionIds: ['q0', 'q1'], correctIds: ['q0'], missedIds: ['q1', 'q2'], guessedIds: ['q0'] };
  const report = collect(progressItems({ mockAttempts: [mock] }));
  assert.equal(report.activity.length, 2);
  assert.equal(report.activity.find(r => r.questionId === 'q0').isCorrect, true);
  assert.equal(report.activity.find(r => r.questionId === 'q0').confidence, 'guess');
  assert.equal(report.activity.some(r => r.questionId === 'q2'), false);
  assert.equal(report.gaps.omittedUnvisitedQuestions, 1);
});

test('malformed sitting aggregates cannot become apparently correct question evidence', () => {
  for (const change of [{ correct: -1 }, { correct: 2 }, { total: 1.5 }, { missedIds: [] }, { exam: 'invalid' }]) {
    const report = collect(progressItems({ mockAttempts: [{ ...sitting(), exam: N10, ...change }] }));
    assert.equal(report.activity.length, 0);
    assert.equal(report.gaps.invalidAttempts, 1);
  }
});

test('overlapping telemetry and completed progress remain exported but are not double-counted', () => {
  const report = collect([...events([event()]), ...progressItems({ quizAttempts: [sitting('q0', 0, NOW - DAY + 1000)] })]);
  assert.equal(report.activity.length, 2);
  assert.equal(report.activity.filter(r => r.scoringEvidence).length, 1);
  assert.equal(report.gaps.supplementalResults, 1);
  assert.equal(analyzeActivity(report).questions[0].attempts, 1);
});

test('a newer completed result is not hidden by older telemetry, and supplemental misses prevent mastery', () => {
  const report = collect([...events([event()]), ...progressItems({ quizAttempts: [sitting('q0', 1, NOW), sitting('q0', 1, NOW - 1000), sitting('q0', 1, NOW - 2000)] })]);
  const q = analyzeActivity(report).questions[0];
  assert.equal(q.mostRecentResult, 'correct');
  assert.equal(q.attempts, 3);
  assert.equal(q.incorrect, 0);
  assert.equal(q.supplementalMissObserved, true);
  assert.equal(q.recentlyImproved, true);
  assert.equal(q.recentlyMasteredCandidate, false);
  assert.equal(q.weaknessScore, 2);
});

test('legacy telemetry and independent migration copies are deduplicated without writes or repair', () => {
  const value = event();
  const items = [{ key: 'telemetry-0', data: { s: JSON.stringify([value]) } }, { key: 'telemetry-event-legacy-000000', data: { e: value } }];
  const before = JSON.stringify(items);
  assert.equal(collect(items).activity.length, 1);
  assert.equal(JSON.stringify(items), before);
  const interrupted = collect([{ key: 'telemetry-1', data: { s: 'truncated' } }, ...events([value])]);
  assert.equal(interrupted.activity.length, 1);
  assert.equal(interrupted.gaps.interruptedLegacyTelemetry, 1);
  assert.throws(() => collect([{ key: 'telemetry-1', data: { s: 'truncated' } }]), /history/);
});

test('committed generation takes precedence over stale legacy data and incomplete snapshots fail closed', () => {
  const raw = JSON.stringify({ quizAttempts: [sitting()], mockAttempts: [] });
  const head = { v: 1, generation: '12345678-1234-1234-1234-123456789012', count: 1, bytes: Buffer.byteLength(raw), sha256: createHash('sha256').update(raw).digest('hex') };
  const items = [{ key: 'progress-head', data: head }, { key: `progress-snapshot-${head.generation}-0`, data: { s: raw } }, ...progressItems({ quizAttempts: [sitting('q1')] })];
  assert.deepEqual(collect(items).activity.map(r => r.questionId), ['q0']);
  assert.throws(() => collect(items.filter(i => !i.key.startsWith('progress-snapshot-'))), /history/);
  assert.throws(() => collect([{ key: 'progress-head', data: { ...head, sha256: '0'.repeat(64) } }, ...items.slice(1)]), /history/);
});

test('exam and objective attribution are bank-grounded, never broad-topic guesses', () => {
  const bank = structuredClone(content);
  bank.questions[0].objectiveIds = { [N10]: [] };
  const report = collect(events([event('q0', false, NOW - DAY, { objectiveId: '9.9' })]), {}, bank);
  assert.equal(report.activity[0].objectiveId, null);
  assert.equal(report.gaps.invalidObjectives, 1);
  const badExam = collect(events([event('q0', false, NOW - DAY, { exam: AWS })]));
  assert.equal(badExam.activity.length, 0);
  assert.equal(collect(events([event('q20')]), { exam: N10 }).activity.length, 0);
});

test('repeated incorrect answers rank above single misses and clean first-observed correct answers', () => {
  const result = summary([event('q0', false, NOW - 2 * DAY), event('q0', false), event('q1', false), event('q2', true)]).questions;
  assert.deepEqual(result.map(q => q.questionId), ['q0', 'q1', 'q2']);
  assert.ok(result[0].weaknessScore > result[1].weaknessScore);
  assert.equal(result[2].weaknessScore, 0);
});

test('recent misses and repeated weakness in an objective increase the auditable score', () => {
  const old = ranked([event('q0', false, NOW - 6 * DAY)]), recent = ranked([event()]);
  assert.equal(recent.weaknessScore - old.weaknessScore, 4);
  const isolated = ranked([event()]), adjacent = ranked([event(), event('q1', false)]);
  assert.equal(adjacent.weaknessScore - isolated.weaknessScore, 2);
});

test('a later miss after logged review adds relapse weight, not invented completion/mastery', () => {
  const base = [event('q0', false, NOW - 3 * DAY), event('q0', false)];
  const review = event('q0', undefined, NOW - 2 * DAY, { type: 'remediation_opened', correct: undefined });
  assert.equal(ranked([...base, review]).weaknessScore - ranked(base).weaknessScore, 5);
});

test('correct-after-retry stays weaker than clean correct, but below repeated unrecovered misses', () => {
  const recovered = ranked([event('q0', false, NOW - 2 * DAY), event('q0', true)]);
  const clean = ranked([event('q0', true)]), repeated = ranked([event('q0', false, NOW - 2 * DAY), event()]);
  assert.ok(recovered.weaknessScore > clean.weaknessScore);
  assert.ok(recovered.weaknessScore < repeated.weaknessScore);
  assert.equal(recovered.recentlyImproved, true);
  assert.equal(recovered.recentlyMasteredCandidate, false);
  assert.equal(summary([event('q0', true)]).recentlyMasteredCandidates.length, 0);
});

test('three clean correct observations can be labelled a bounded mastery candidate', () => {
  assert.equal(summary([event('q0', true, NOW - 3 * DAY), event('q0', true, NOW - 2 * DAY), event('q0', true)]).recentlyMasteredCandidates.length, 1);
});

test('context and missing duration/confidence never count as answers or weakness', () => {
  const values = [event('q0', true), event('q1', undefined, NOW - DAY, { type: 'remediation_opened', correct: undefined })];
  const result = summary(values);
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].weaknessScore, 0);
});

test('simultaneous opposite outcomes from different sources do not invent a latest recovery', () => {
  const q = ranked([event(), event('q0', true, NOW - DAY, { sessionId: 'session-synthetic-device-0002' })]);
  assert.equal(q.mostRecentResult, 'ambiguous');
  assert.equal(q.recentlyImproved, false);
  assert.equal(q.factors.latestCorrectAfterMiss, 0);
});

test('simultaneous contradictory telemetry and completed sittings remain ambiguous', () => {
  for (const telemetryCorrect of [true, false]) {
    const report = collect([...events([event('q0', telemetryCorrect)]),
      ...progressItems({ quizAttempts: [sitting('q0', telemetryCorrect ? 0 : 1)] })]);
    const q = analyzeActivity(report).questions[0];
    assert.equal(q.attempts, 1, 'cross-stream results do not double-count attempts');
    assert.equal(q.mostRecentResult, 'ambiguous');
    assert.equal(q.recentlyImproved, false);
    assert.equal(q.recentlyMasteredCandidate, false);
  }
});

test('a question with different valid objective contexts does not attribute every result to the latest one', () => {
  const bank = structuredClone(content); bank.questions[0].objectiveIds[N10] = ['1.1', '1.2'];
  const report = collect(events([event('q0', false, NOW - 2 * DAY, { objectiveId: '1.1' }), event('q0', false, NOW - DAY, { objectiveId: '1.2' })]), {}, bank);
  const result = analyzeActivity(report);
  assert.equal(result.questions[0].objectiveId, null);
  assert.equal(result.questions[0].ambiguousObjectiveContext, true);
  assert.equal(result.objectives.length, 0);
  assert.deepEqual(report.activity.map(row => row.objectiveId), ['1.2', '1.1']);
});

test('follow-up uses same-concept alternatives before exact repeats and honors requested size', () => {
  const result = buildFollowup(summary([event(), event('q10', true)]), content, { quizSize: 10 });
  const plan = result.plans[0];
  assert.equal(plan.questions.length, 10);
  assert.equal(plan.selections[0].reason, 'same-authored-concept');
  assert.notEqual(plan.questions[0].id, 'q0');
  assert.ok(plan.questions.every(q => q.examCodes.includes(N10)));
  assert.ok(plan.selections.some(s => s.category === 'related-concept-reinforcement'));
  assert.ok(plan.selections.some(s => s.category === 'spaced-review'));
  assert.ok(plan.questions.every(q => q.answer === content.questions.find(original => original.id === q.id).answer));
  assert.ok(plan.questions.every(q => q.explanation === 'The authored explanation.'));
  assert.match(plan.learnerQuizPath, /^\/quiz\?exam=n10-009&questions=/);
});

test('spaced review requires the candidate itself to have prior correct evidence', () => {
  const evidence = summary([event('q10', true)]);
  const plan = buildFollowup(evidence, content, { quizSize: 10 });
  const spaced = plan.plans[0].selections.filter(s => s.category === 'spaced-review');
  assert.deepEqual(spaced.map(s => s.questionId), ['q10']);
  assert.ok(!spaced.some(s => s.questionId === 'q11'), 'unseen related alternatives are not spaced review');
  assert.ok(plan.shortages.some(s => s.reason === 'insufficient-relevant-unique-wording'));
  assert.deepEqual(buildFollowup(evidence, content, { quizSize: 10 }), plan, 'shortage fallback stays deterministic');
});

test('never-correct misses remain remediation evidence, not spaced review', () => {
  const evidence = summary([event('q10', true), event('q11', false)]);
  const result = buildFollowup(evidence, content, { quizSize: 5 });
  const selections = result.plans[0].selections;
  const spaced = selections.filter(s => s.category === 'spaced-review');
  assert.deepEqual(spaced.map(s => s.questionId), ['q10']);
  assert.ok(!spaced.some(s => s.questionId === 'q11' || s.questionId === 'q12'));
  assert.ok(selections.some(s => s.questionId === 'q12' && ['direct-remediation', 'related-concept-reinforcement'].includes(s.category)));
  assert.deepEqual(buildFollowup(evidence, content, { quizSize: 5 }), result);
});

test('the target mix is preserved when enough relevant and previously-correct questions exist', () => {
  const bank = structuredClone(content);
  for (let i = 30; i < 45; i++) bank.questions.push({ ...bank.questions[1], id: `mix-${i}`, prompt: `Distinct remediation ${i}` });
  const evidence = summary([event('q0', false), event('q10', true), event('q11', true)]);
  const plan = buildFollowup(evidence, bank, { quizSize: 15 }).plans[0];
  const count = category => plan.selections.filter(s => s.category === category).length;
  assert.equal(count('direct-remediation'), 9);
  assert.equal(count('related-concept-reinforcement'), 4);
  assert.equal(count('spaced-review'), 2);
  assert.ok(plan.selections.filter(s => s.category === 'spaced-review').every(s => ['q10', 'q11'].includes(s.questionId)));
  assert.deepEqual(buildFollowup(evidence, bank, { quizSize: 15 }).plans[0], plan);
});

test('weak objective selection is not dominated by repeated-correct material', () => {
  const values = [event('q0', false, NOW - 2 * DAY), event(), ...['q10', 'q11', 'q12'].flatMap(id => [event(id, true, NOW - 3 * DAY), event(id, true)])];
  const result = buildFollowup(summary(values), content, { quizSize: 15 });
  const plan = result.plans[0];
  assert.equal(plan.questions.length, 13);
  assert.ok(result.shortages.some(s => s.reason === 'insufficient-relevant-unique-wording' && s.selected === 13));
  assert.ok(plan.selections.slice(0, 9).every(s => s.category === 'direct-remediation'));
  assert.ok(plan.questions.slice(0, 9).every(q => q.objectiveIds[N10].includes('1.1')));
});

test('different certifications generate separate plans; explicit filtering cannot contaminate them', () => {
  const analysis = summary([event(), event('q20')]);
  const result = buildFollowup(analysis, content, { quizSize: 3 });
  assert.equal(result.plans.length, 2);
  for (const plan of result.plans) assert.ok(plan.questions.every(q => q.examCodes.includes(plan.examId)));
  assert.deepEqual(buildFollowup(analysis, content, { exam: AWS, quizSize: 3 }).plans.map(p => p.examId), [AWS]);
});

test('shortages are reported instead of unrelated filler; original reused only without alternatives', () => {
  const bank = structuredClone(content); bank.questions = bank.questions.filter(q => q.id === 'q0' || q.id === 'q20');
  const result = buildFollowup(summary([event()]), bank, { quizSize: 15 });
  assert.deepEqual(result.plans[0].questions.map(q => q.id), ['q0']);
  assert.equal(result.plans[0].selections[0].reason, 'exact-repeat-after-alternative-exhaustion');
  assert.ok(result.shortages.some(s => s.availableAlternatives === 0));
  assert.ok(result.shortages.some(s => s.selected === 1 && s.requested === 15));
});

test('topic fallback cannot inflate an objective-specific shortage count', () => {
  const bank = structuredClone(content);
  for (const q of bank.questions.slice(1, 10)) q.objectiveIds[N10] = ['1.2'];
  const result = buildFollowup(summary([event()]), bank, { quizSize: 5 });
  const shortage = result.shortages.find(s => s.objectiveId === '1.1');
  assert.equal(shortage.availableQuestions, 1);
  assert.equal(shortage.availableAlternatives, 0);
});

test('round robin gives another weak objective a turn before repeating the strongest one', () => {
  const values = [event('q0', false, NOW - 3 * DAY), event('q0', false, NOW - 2 * DAY), event(), event('q10', false)];
  const plan = buildFollowup(summary(values), content, { quizSize: 10 }).plans[0];
  assert.deepEqual(plan.questions.slice(0, 2).map(q => q.objectiveIds[N10][0]), ['1.1', '1.2']);
});

test('a 25-question plan uses two existing-runner batches instead of silently dropping questions', () => {
  const bank = structuredClone(content);
  for (let i = 30; i < 60; i++) bank.questions.push({ ...bank.questions[1], id: `q${i}`, prompt: `Additional authored contrast ${i}` });
  const plan = buildFollowup(summary([event()]), bank, { quizSize: 25 }).plans[0];
  assert.equal(plan.questions.length, 25);
  assert.equal(plan.learnerQuizPath, null);
  assert.deepEqual(plan.learnerQuizPaths.map(path => new URL(path, 'https://example.test').searchParams.get('questions').split(',').length), [15, 10]);
});

test('multi-answer selections retain validated sets; contradictory confidence stays unknown', () => {
  const bank = structuredClone(content); bank.questions[0].answer = [0, 2];
  const attempts = [{ ...sitting(), selectedChoices: { q0: [2, 0] }, sureIds: ['q0'], guessedIds: ['q0'] }];
  const report = collect(progressItems({ mockAttempts: attempts.map(a => ({ ...a, exam: N10 })) }), {}, bank);
  assert.deepEqual(report.activity[0].selectedAnswer, [0, 2]);
  assert.equal(report.activity[0].confidence, undefined);
  assert.deepEqual(report.activity[0].correctAnswer, [0, 2]);
});

test('duplicate wording is not selected twice and invalid answer keys are not eligible', () => {
  const bank = structuredClone(content);
  bank.questions[2].prompt = bank.questions[1].prompt.toUpperCase();
  bank.questions[3].answer = 99;
  const result = buildFollowup(summary([event()]), bank, { quizSize: 10 });
  assert.equal(result.rejectedBankQuestions, 1);
  assert.ok(!result.plans[0].questions.some(q => q.id === 'q3'));
  assert.equal(result.plans[0].questions.filter(q => ['q1', 'q2'].includes(q.id)).length, 1);
});

test('same input and bank produce identical scores and plans regardless of input ordering', () => {
  const values = [event('q0', false, NOW - 2 * DAY), event(), event('q10', true)];
  const a = summary(values), b = summary([...values].reverse());
  assert.deepEqual(a, b);
  assert.deepEqual(buildFollowup(a, content), buildFollowup(b, content));
});

test('CLI options are bounded and reject ambiguous/unknown options', () => {
  assert.deepEqual(options([]), { days: 7, quizSize: 15 });
  assert.deepEqual(options(['--days', '30', '--quiz-size', '25', '--exam', AWS]), { days: 30, quizSize: 25, exam: AWS });
  for (const args of [['--days', '0'], ['--days', '1.5'], ['--days', '366'], ['--quiz-size', '101'], ['--exam', 'all'], ['--url', 'private'], ['--days', '7', '--days', '1']]) assert.throws(() => options(args));
  assert.match(outputNames(30)[0], /last-30-days/);
});

test('CSV has a fixed allowlist and protects spreadsheet formulas', () => {
  const csv = activityCsv([{ timestamp: '=unsafe', phone: 'SECRET', isCorrect: false }]);
  assert.equal(csv.includes('SECRET'), false);
  assert.match(csv, /'=unsafe/);
});

function factoryFor(items, calls) {
  return (key, secret, options) => {
    assert.equal(key, env.TWILIO_API_KEY_SID); assert.equal(secret, env.TWILIO_API_KEY_SECRET);
    assert.equal(options.logLevel, 'silent'); assert.equal(options.autoRetry, false);
    const deny = () => assert.fail('write-capable API called');
    const client = { request: async opts => { calls.push(opts.method); }, sync: { v1: { services: sid => {
      assert.equal(sid, env.TWILIO_SYNC_SERVICE_SID);
      const maps = name => {
        assert.equal(name, configuration(env).mapName); calls.push('selected-map');
        return { update: deny, remove: deny, syncMapItems: { create: deny, update: deny, remove: deny,
          list: async opts => { assert.deepEqual(opts, { pageSize: 100 }); await client.request({ method: 'GET' }); return items; } } };
      };
      maps.list = deny; maps.create = deny;
      return { syncMaps: maps };
    } } } };
    return client;
  };
}

async function fixture(values = env) {
  await mkdir(resolve(ROOT, 'work'), { recursive: true });
  const root = await mkdtemp(resolve(ROOT, 'work/learner-activity-'));
  await mkdir(resolve(root, 'content'));
  await writeFile(resolve(root, '.gitignore'), '/tmp/\n');
  await writeFile(resolve(root, '.env.local'), Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n'));
  for (const [name, data] of Object.entries({ questions: content.questions, topics: content.topics, 'topics-network-plus': [], objectives: content.objectives, 'network-plus-concepts': content.concepts })) {
    await writeFile(resolve(root, 'content', `${name}.json`), JSON.stringify(data));
  }
  return root;
}

test('runner reads exactly the selected learner via GET and writes only five sanitized ignored files', async () => {
  const root = await fixture(), calls = [], logs = [];
  const items = events([event()]); items[0].toJSON = () => assert.fail('provider object serialized');
  const deps = { root, now: () => NOW, clientFactory: factoryFor(items, calls), log: s => logs.push(s), error: s => logs.push(s) };
  assert.equal(await runExport([], deps), 0);
  assert.deepEqual(calls, ['selected-map', 'GET']);
  assert.deepEqual((await readdir(resolve(root, 'tmp'))).sort(), outputNames(7).sort());
  const files = await Promise.all(outputNames(7).map(name => readFile(resolve(root, 'tmp', name), 'utf8')));
  for (const value of [...Object.values(env), session, configuration(env).mapName]) assert.ok(files.concat(logs).every(text => !text.includes(value)));
  const report = JSON.parse(files[0]); assert.equal(report.activity[0].questionId, 'q0');
  const plan = JSON.parse(files[4]); assert.equal(plan.internalAnswerKey, true);
  const before = [...files];
  assert.equal(await runExport([], deps), 1, 'existing reports are not overwritten or deleted');
  assert.deepEqual(await Promise.all(outputNames(7).map(name => readFile(resolve(root, 'tmp', name), 'utf8'))), before);
  assert.deepEqual(calls, ['selected-map', 'GET'], 'existing outputs fail before reading provider data again');
});

test('ambiguous identity and missing learner fail closed without any export', async () => {
  for (const values of [{ ...env, LEARNER_ALLOWED_PHONES: '+12025550101,+12025550102' }, { ...env, LEARNER_PRIMARY_PHONE: '+12025550102' }, { ...env, LEARNER_ALLOWED_PHONES: '' }]) {
    const root = await fixture(values);
    assert.equal(await runExport([], { root, now: () => NOW, clientFactory: () => assert.fail('unsafe identity accessed provider'), error() {} }), 1);
    assert.equal((await readdir(root)).includes('tmp'), false);
  }
  const root = await fixture();
  assert.equal(await runExport([], { root, now: () => NOW, clientFactory: factoryFor([], []), error() {} }), 1);
  assert.equal((await readdir(root)).includes('tmp'), false);
});

test('provider errors and accidental write requests are rejected without sensitive logs', async () => {
  const root = await fixture(), logs = [];
  assert.equal(await runExport([], { root, now: () => NOW, clientFactory: () => { throw new Error(Object.values(env).join(' ')); }, error: s => logs.push(s) }), 1);
  for (const secret of Object.values(env)) assert.ok(logs.every(line => !line.includes(secret)));
  let reachedTransport = false;
  const client = { request() { reachedTransport = true; }, sync: { v1: { services: () => ({ syncMaps: () => ({ syncMapItems: {
    list: async () => client.request({ method: 'POST' }),
  } }) }) } } };
  await assert.rejects(readLearnerItems(env, configuration(env).mapName, () => client), /read_only_transport/);
  assert.equal(reachedTransport, false);
});

test('unsafe output directories are rejected, and actual repository output names are gitignored', async () => {
  const root = await fixture();
  await mkdir(resolve(root, 'elsewhere'));
  await symlink(resolve(root, 'elsewhere'), resolve(root, 'tmp'), 'dir');
  assert.equal(await runExport([], { root, clientFactory: () => assert.fail('unsafe directory read production'), error() {} }), 1);
  for (const name of outputNames(7)) {
    execFileSync('git', ['check-ignore', '--quiet', '--', 'tmp/' + name], { cwd: ROOT, stdio: 'ignore' });
  }
});

test('help is offline and tool imports avoid side-effectful application sync helpers', async () => {
  assert.equal(await runExport(['--help'], { root: '/missing', clientFactory: () => assert.fail('help accessed provider'), log() {} }), 0);
  const sources = await Promise.all(['scripts/export-learner-activity.mjs', 'scripts/lib/learner-activity-data.mjs', 'scripts/lib/learner-activity-plan.mjs'].map(path => readFile(resolve(ROOT, path), 'utf8')));
  assert.ok(sources.every(text => !/from ['"].*(?:learner\/store|learner\/twilio|learner\/sync)['"]/.test(text)));
});

test('real repository metadata yields in-exam contrast questions without changing authored keys', async () => {
  const read = async name => JSON.parse(await readFile(resolve(ROOT, 'content', name + '.json'), 'utf8'));
  const [questions, topics, networkTopics, objectives, concepts] = await Promise.all(['questions', 'topics', 'topics-network-plus', 'objectives', 'network-plus-concepts'].map(read));
  const bank = { questions, topics: [...topics, ...networkTopics], objectives, concepts };
  const q = questions.find(q => q.id === 'q-n10c7-16');
  const report = collect(events([event(q.id, false, NOW - DAY, { topicId: q.topicId })]), {}, bank);
  const plan = buildFollowup(analyzeActivity(report), bank, { quizSize: 10 }).plans[0];
  assert.equal(plan.questions.length, 10);
  assert.notEqual(plan.questions[0].id, q.id);
  for (const selected of plan.questions) {
    assert.ok(selected.examCodes.includes(N10));
    assert.deepEqual(selected.answer, questions.find(q => q.id === selected.id).answer);
  }
});
