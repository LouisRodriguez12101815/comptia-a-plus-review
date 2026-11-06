import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildExamPool, draftTest, allocateByWeight, mulberry32, shuffleQuestionChoices, shuffleChoiceOrder, assessmentVersion, isCorrect, approximatePassPercent, sessionDurationSeconds } from '../lib/exam-test.mjs';
import { evaluateReadiness } from '../lib/readiness.ts';
const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const questions = read('questions'), topics = read('topics'), objectives = read('objectives'), flashcards = read('flashcards'), visuals = read('track-visuals');
for (const code of ['clf-c02', 'saa-c03']) {
  const bank = questions.filter(q => q.examCodes?.includes(code));
  const pool = buildExamPool({ questions, topics, objectives, examCode: code });
  test(`${code}: all eligible questions have a single valid primary objective and enter mocks`, () => {
    assert.equal(pool.totalUnique, bank.length);
    const valid = new Set(pool.domains.flatMap(d => d.objectives.map(o => o.id)));
    for (const q of bank) {
      assert.equal(q.objectiveIds[code].length, 1, q.id);
      assert.ok(valid.has(q.objectiveIds[code][0]), q.id);
      if (Array.isArray(q.answer)) assert.ok(q.choices.length >= 5, q.id);
    }
    const quota = allocateByWeight(pool.domains, 65);
    for (const d of pool.domains) assert.ok(Math.abs(quota[d.id] - 65 * d.weight / 100) < 1, `${code} domain ${d.id}: ${quota[d.id]}`);
    for (let seed = 0; seed < 100; seed++) {
      const draft = draftTest(pool, 65, mulberry32(seed));
      assert.equal(draft.length, 65);
      assert.equal(new Set(draft.map(p => p.questionId)).size, 65);
      for (const d of pool.domains) assert.equal(draft.filter(p => p.domainId === d.id).length, quota[d.id]);
    }
  });
  test(`${code}: selecting display position one / first two does not approach the study target`, () => {
    let correct = 0, total = 0;
    for (let seed = 0; seed < 100; seed++) {
      const rng = mulberry32(seed);
      for (const q of bank) {
        const displayed = shuffleQuestionChoices(q, rng);
        correct += Number(isCorrect(displayed, Array.isArray(q.answer) ? [0, 1] : 0)); total++;
      }
    }
    assert.ok(correct / total < 0.35, `${correct}/${total}`);
  });
  test(`${code}: each objective has a linked original workshop and remains honestly partial`, () => {
    for (const d of objectives.exams.find(e => e.code === code).domains) for (const o of d.objectives) {
      assert.equal(o.status, 'partial');
      assert.ok(o.reviewEvidence);
    }
  });
}
test('choice randomization preserves IDs, correct answer text and authored records', () => {
  for (const q of questions.filter(q => q.id.startsWith('q-saa-multi') || q.id === 'q-clf-01')) {
    const before = JSON.stringify(q);
    for (let seed = 0; seed < 20; seed++) {
      const copy = shuffleQuestionChoices(q, mulberry32(seed));
      const texts = obj => (Array.isArray(obj.answer) ? obj.answer : [obj.answer]).map(i => obj.choices[i]).sort();
      assert.equal(copy.id, q.id);
      assert.deepEqual(texts(copy), texts(q));
      assert.equal(new Set(shuffleChoiceOrder(q, mulberry32(seed))).size, q.choices.length);
    }
    assert.equal(JSON.stringify(q), before);
  }
});
test('content fingerprints invalidate stale answer and objective evidence, independently of array order', () => {
  const q = questions.find(q => q.id === 'q-clf-01');
  assert.equal(assessmentVersion([q, questions[0]]), assessmentVersion([questions[0], q]));
  for (const patch of [{ answer: (q.answer + 1) % 4 }, { prompt: q.prompt + ' changed' }, { objectiveIds: { 'clf-c02': ['4.3'] } }]) assert.notEqual(assessmentVersion([q]), assessmentVersion([{ ...q, ...patch }]));
});
test('full AWS timers are exact shared durations and AWS has no raw-to-scaled conversion', () => {
  assert.equal(sessionDurationSeconds('clf-c02', 65), 5400);
  assert.equal(sessionDurationSeconds('saa-c03', 65), 7800);
  assert.equal(approximatePassPercent('clf-c02'), null);
  assert.equal(approximatePassPercent('saa-c03'), null);
});
test('practice evidence rejects stale banks, old attempts, repeated multi items and missing domains', () => {
  const now = Date.UTC(2026, 9, 23), ids = Array.from({ length: 100 }, (_, i) => `q${i}`), multi = ids.slice(0, 8);
  const evidence = { version: 'v2', questionIds: ids, multiIds: multi, expectedDomains: ['1', '2', '3', '4'], now };
  const base = { exam: 'saa-c03', full: true, bankVersion: 'v2', at: now, percent: 100, domains: evidence.expectedDomains.map(id => ({ id, title: id, correct: 10, total: 10 })), multiCorrect: 8, multiTotal: 8, multiQuestionIds: multi, questionIds: ids, correctIds: ids };
  const evaluate = (patch = {}, missing = 0) => evaluateReadiness([0, 1, 2].map(i => ({ ...base, at: now - i * 1000, ...patch })), 'saa-c03', missing, 100, evidence);
  assert.equal(evaluate().status, 'ready');
  for (const patch of [{ bankVersion: 'v1' }, { at: now - 91 * 86400000 }, { at: now + 1000 }, { correctIds: [] }, { multiQuestionIds: ['q0'] }, { domains: base.domains.slice(0, 3) }]) assert.notEqual(evaluate(patch).status, 'ready', JSON.stringify(patch));
  assert.notEqual(evaluate({}, 1).status, 'ready');
});

test('CLF-C02 objective 3.7 expansion is original, mapped, and remains partial', () => {
  const expanded = questions.filter(q => q.id.startsWith('q-clf37-'));
  const objective = objectives.exams.find(e => e.code === 'clf-c02').domains.flatMap(d => d.objectives).find(o => o.id === '3.7');
  assert.equal(expanded.length, 14);
  assert.equal(new Set(expanded.map(q => q.id)).size, expanded.length);
  assert.ok(expanded.every(q => q.examCodes.includes('clf-c02') && q.objectiveIds['clf-c02'].length === 1 && q.objectiveIds['clf-c02'][0] === '3.7'));
  assert.ok(expanded.every(q => q.choices.length === 4 && !Array.isArray(q.answer)));
  assert.equal(objective.status, 'partial');
  assert.ok(objective.topics.includes('aws-clf-ai-analytics'));
  const newServices = ['Comprehend', 'Transcribe', 'Translate', 'Lex', 'Polly', 'Textract', 'Rekognition', 'SageMaker', 'Athena', 'Glue', 'Kinesis', 'Quick', 'Redshift', 'OpenSearch'];
  for (const service of newServices) assert.ok(expanded.some(q => q.prompt.includes(service) || q.choices.some(choice => choice.includes(service)) || q.explanation.includes(service)), service);
});

test('CLF-C02 objective 2.3 access-management expansion is mapped and stays partial', () => {
  const expanded = questions.filter(q => q.id.startsWith('q-clf23-'));
  const exam = objectives.exams.find(e => e.code === 'clf-c02');
  const objective = exam.domains.flatMap(d => d.objectives).find(o => o.id === '2.3');
  const topic = topics.find(t => t.id === 'aws-clf-access-management');
  assert.equal(expanded.length, 14);
  assert.equal(new Set(expanded.map(q => q.id)).size, expanded.length);
  assert.ok(expanded.every(q => q.examCodes.length === 1 && q.examCodes[0] === 'clf-c02'));
  assert.ok(expanded.every(q => q.objectiveIds['clf-c02'].length === 1 && q.objectiveIds['clf-c02'][0] === '2.3'));
  assert.ok(expanded.every(q => q.choices.length === 4 && !Array.isArray(q.answer)));
  assert.equal(objective.status, 'partial');
  assert.ok(objective.topics.includes('aws-clf-access-management'));
  assert.ok(topic.sections.some(s => s.id === 'authentication-authorization'));
  assert.ok(flashcards.filter(c => c.topicId === 'aws-clf-access-management').length >= 12);
  const corpus = JSON.stringify({ topic, questions: expanded, cards: flashcards.filter(c => c.topicId === topic.id) });
  for (const concept of ['role', 'group', 'Identity Center', 'federation', 'MFA', 'access key', 'password policy', 'temporary', 'Secrets Manager', 'KMS']) assert.match(corpus, new RegExp(concept, 'i'), concept);
  assert.match(readFileSync(new URL('../lib/practice/drills.ts', import.meta.url), 'utf8'), /id: "aws-clf-access-compare"/);
  for (const o of exam.domains.flatMap(d => d.objectives).filter(o => o.id !== '2.3')) assert.equal(o.status, 'partial', `unexpected CLF status change: ${o.id}`);
});

test('CLF-C02 Domain 4 expansion is objective-specific, current, and remains partial', () => {
  const groups = {
    '4.1': questions.filter(q => q.id.startsWith('q-clf41-')),
    '4.2': questions.filter(q => q.id.startsWith('q-clf42-')),
    '4.3': questions.filter(q => q.id.startsWith('q-clf43-')),
  };
  const exam = objectives.exams.find(e => e.code === 'clf-c02');
  const objectiveFor = id => exam.domains.flatMap(d => d.objectives).find(o => o.id === id);
  assert.equal(groups['4.1'].length, 10);
  assert.equal(groups['4.2'].length, 9);
  assert.equal(groups['4.3'].length, 10);
  const all = Object.values(groups).flat();
  assert.equal(new Set(all.map(q => q.id)).size, all.length);
  for (const [objectiveId, items] of Object.entries(groups)) {
    assert.ok(items.every(q => q.examCodes.length === 1 && q.examCodes[0] === 'clf-c02'));
    assert.ok(items.every(q => q.objectiveIds['clf-c02'].length === 1 && q.objectiveIds['clf-c02'][0] === objectiveId));
    assert.ok(items.every(q => q.choices.length === 4 && !Array.isArray(q.answer)));
    assert.equal(objectiveFor(objectiveId).status, 'partial');
  }
  const topic = topics.find(t => t.id === 'aws-clf-billing-support');
  assert.ok(topic.sections.some(s => s.id === 'pricing-factors'));
  assert.ok(flashcards.filter(c => c.topicId === topic.id).length >= 40);
  const corpus = JSON.stringify({ topic, questions: all, cards: flashcards.filter(c => c.topicId === topic.id) });
  for (const concept of ['Capacity Reservation', 'Dedicated Host', 'Dedicated Instance', 'Spot', 'Savings Plans', 'Pricing Calculator', 'Cost Explorer', 'Budgets', 'Cost and Usage Report', 'cost allocation', 'Organizations', 'Trusted Advisor', 'AWS Health', 'Trust and Safety', 'Marketplace', 'Professional Services']) assert.match(corpus, new RegExp(concept, 'i'), concept);
  assert.match(corpus, /Business Support\+.*Enterprise Support.*Unified Operations/s);
  assert.doesNotMatch(corpus, /Developer Support, Business Support, and Enterprise On-Ramp are the current paid plans/i);
  const drills = readFileSync(new URL('../lib/practice/drills.ts', import.meta.url), 'utf8');
  assert.match(drills, /id: "aws-clf-cost-compare"/);
  assert.match(drills, /id: "aws-clf-support-resources"/);
  for (const o of exam.domains.flatMap(d => d.objectives).filter(o => !['4.1', '4.2', '4.3'].includes(o.id))) assert.equal(o.status, 'partial', `unexpected CLF status change: ${o.id}`);
});

test('CLF-C02 completeness audit keeps every objective evidenced and honestly partial', () => {
  const exam = objectives.exams.find(e => e.code === 'clf-c02');
  const allObjectives = exam.domains.flatMap(domain => domain.objectives);
  const questionIds = new Set(questions.map(question => question.id));
  const topicIds = new Set(topics.map(topic => topic.id));

  assert.equal(allObjectives.length, 19);
  assert.equal(new Set(allObjectives.map(objective => objective.id)).size, 19);
  assert.ok(allObjectives.every(objective => objective.status === 'partial'));
  assert.ok(allObjectives.every(objective => objective.note && objective.note.length > 80));
  assert.ok(allObjectives.every(objective => objective.topics.every(topicId => topicIds.has(topicId))));
  assert.ok(allObjectives.every(objective => objective.reviewEvidence?.section && objective.reviewEvidence?.scopeUrl));
  assert.ok(allObjectives.every(objective => questionIds.has(objective.reviewEvidence.questionId)));

  for (const objectiveId of ['2.3', '3.7', '4.1', '4.2', '4.3']) {
    const objective = allObjectives.find(item => item.id === objectiveId);
    assert.equal(objective.reviewEvidence.checked, '2026-11-06', objectiveId);
  }
});

test('CLF-C02 objective 3.8 expansion covers current category cues without out-of-scope answers', () => {
  const exam = objectives.exams.find(e => e.code === 'clf-c02');
  const objective = exam.domains.flatMap(domain => domain.objectives).find(item => item.id === '3.8');
  const added = questions.filter(question => question.id.startsWith('q-clf38-'));
  const topic = topics.find(item => item.id === 'aws-clf-other-service-categories');
  const cards = flashcards.filter(card => card.topicId === topic.id);
  const answerCorpus = JSON.stringify({ questions: added.map(question => ({ choices: question.choices, answer: question.answer })), cards });
  const categories = {
    integration: ['SQS', 'SNS', 'EventBridge', 'Step Functions'],
    business: ['Connect', 'SES'],
    customerEnablement: ['AWS Support'],
    developer: ['CodeBuild', 'CodePipeline', 'X-Ray'],
    endUser: ['AppStream', 'WorkSpaces', 'Secure Browser'],
    frontend: ['Amplify'],
    iot: ['IoT Core'],
  };

  assert.equal(added.length, 16);
  assert.equal(new Set(added.map(question => question.id)).size, added.length);
  assert.ok(added.every(question => question.examCodes.length === 1 && question.examCodes[0] === 'clf-c02'));
  assert.ok(added.every(question => question.objectiveIds['clf-c02'].length === 1 && question.objectiveIds['clf-c02'][0] === '3.8'));
  assert.equal(topic.sections.length, 9);
  for (const [category, services] of Object.entries(categories)) {
    assert.ok(services.every(service => answerCorpus.includes(service)), `${category} missing service cue`);
  }
  assert.doesNotMatch(answerCorpus, /CodeDeploy|Greengrass|Device Defender/);
  assert.equal(objective.status, 'partial');
  assert.ok(objective.topics.includes('aws-clf-other-service-categories'));
  assert.equal(visuals['aws-clf-other-service-categories'][0].file, 'aws-clf-other-service-categories.html');
  const drills = readFileSync(new URL('../lib/practice/drills.ts', import.meta.url), 'utf8');
  assert.match(drills, /id: "aws-clf-other-services-compare"/);
});

test('CLF-C02 objective 1.3 expansion covers migration decisions and remains partial', () => {
  const exam = objectives.exams.find(e => e.code === 'clf-c02');
  const allObjectives = exam.domains.flatMap(domain => domain.objectives);
  const objective = allObjectives.find(item => item.id === '1.3');
  const added = questions.filter(question => question.id.startsWith('q-clf13-'));
  const topic = topics.find(item => item.id === 'aws-clf-migration-decisions');
  const cards = flashcards.filter(card => card.topicId === topic.id);
  const corpus = JSON.stringify({ topic, questions: added, cards });
  const requiredCues = [
    ['CAF/readiness', /CAF|readiness/],
    ['strategy selection', /Rehost|Replatform|Refactor|Repurchase|Retire|Retain/],
    ['discovery', /discovery|dependencies|utilization/i],
    ['database replication', /replication|Database Migration Service|DMS/],
    ['validation/cutover', /validation|cutover|rollback/i],
  ];

  assert.equal(added.length, 14);
  assert.equal(new Set(added.map(question => question.id)).size, added.length);
  assert.ok(added.every(question => question.examCodes.length === 1 && question.examCodes[0] === 'clf-c02'));
  assert.ok(added.every(question => question.objectiveIds['clf-c02'].length === 1 && question.objectiveIds['clf-c02'][0] === '1.3'));
  assert.equal(topic.sections.length, 9);
  for (const [label, pattern] of requiredCues) assert.match(corpus, pattern, label);
  assert.equal(objective.status, 'partial');
  assert.ok(objective.topics.includes('aws-clf-migration-decisions'));
  assert.equal(objective.reviewEvidence.section, 'aws-clf-migration-decisions#objective-clf-c02-1-3');
  assert.equal(visuals['aws-clf-migration-decisions'][0].file, 'aws-clf-migration-decisions.html');
  const drills = readFileSync(new URL('../lib/practice/drills.ts', import.meta.url), 'utf8');
  assert.match(drills, /id: "aws-clf-migration-compare"/);
  for (const item of allObjectives.filter(item => item.id !== '1.3')) assert.equal(item.status, 'partial', `unexpected CLF status change: ${item.id}`);
});
