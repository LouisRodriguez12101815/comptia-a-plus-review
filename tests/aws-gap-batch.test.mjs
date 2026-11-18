import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const topics = read('content/topics.json');
const questions = read('content/questions.json');
const cards = read('content/flashcards.json');
const objectives = read('content/objectives.json');
const clf = read('docs/aws-clf-evidence-map.json');
const saa = read('docs/saa-c03-evidence-map.json');

const flatten = (section) => section.blocks.flatMap((block) => [
  ...(block.items ?? []),
  ...(block.rows?.map((row) => row.join(' | ')) ?? []),
  ...(block.text ? [block.text] : []),
]);

test('new CLF/SAA curriculum bullets resolve to cited lessons and real practice', () => {
  const selectedClf = ['2.3-S1', '2.3-S3', '2.3-S4', '2.2-S5', '3.6-S5', '4.1-S2', '4.1-S3', '4.2-S4', '4.3-S7', '4.3-S8'];
  for (const id of selectedClf) {
    const row = clf.bullets.find((item) => item.id === id);
    assert.ok(row, id);
    assert.equal(row.teaching.classification, 'direct teaching', id);
    assert.ok(row.source.exactOfficialWording.length > 10, id);
    assert.ok(row.source.technicalSourceUrls.length > 0, id);
    for (const evidenceId of row.teaching.lessonEvidenceIds) {
      const unit = clf.lessonEvidenceCatalog[evidenceId];
      assert.ok(unit, `${id}: ${evidenceId}`);
      const topic = topics.find((item) => item.id === unit.topicId);
      const section = topic?.sections.find((item) => item.id === unit.sectionId);
      assert.ok(section, `${id}: missing section`);
      assert.deepEqual(unit.excerpts, flatten(section), `${id}: excerpt drift`);
    }
    for (const questionId of row.resources.questionIds) {
      const question = questions.find((item) => item.id === questionId);
      assert.ok(question, `${id}: ${questionId}`);
      assert.ok(question.sourceUrls.length > 0, questionId);
    }
  }

  for (const id of ['2.1-K08', '2.2-K07', '4.1-S04']) {
    const row = saa.suppliedPdf.bulletMappings.find((item) => item.id === id);
    assert.ok(row, id);
    assert.equal(row.classification, 'direct teaching', id);
    assert.ok(row.pdfPage > 0, id);
    assert.ok(row.sourceBullet.length > 10, id);
    assert.ok(row.sourceUrl.startsWith('https://docs.aws.amazon.com/aws-certification/'), id);
    assert.equal(row.teachingEvidenceIds.length, 1, id);
    assert.equal(row.resourceEvidenceIds.length, 1, id);
  }
  assert.equal(saa.studyGuideAvailability.status, 'not supplied');
});

test('gap-batch practice has unique IDs and explains every option', () => {
  const added = questions.filter((question) => question.id.startsWith('q-clf-gap-') || question.id.startsWith('q-saa-gap-'));
  assert.equal(added.length, 16);
  assert.equal(new Set(added.map((question) => question.id)).size, added.length);
  for (const question of added) {
    assert.equal(typeof question.answer, 'number', question.id);
    assert.ok(question.answer >= 0 && question.answer < question.choices.length, question.id);
    assert.equal(new Set(question.choices).size, question.choices.length, question.id);
    for (const choice of question.choices) assert.ok(question.explanation.includes(`${choice}:`), `${question.id}: ${choice}`);
  }
  for (const id of ['fc-clf-gap-root-centralized', 'fc-clf-gap-gateway-cache', 'fc-clf-gap-billing-tags', 'fc-clf-gap-parameter-store', 'fc-clf-gap-policy-ownership', 'fc-saa-gap-immutable']) {
    assert.ok(cards.some((card) => card.id === id), id);
  }
});

test('current-source CLF transfer, billing, and tag evidence matches the teaching', () => {
  const transfer = clf.bullets.find((item) => item.id === '4.1-S4');
  const billing = clf.bullets.find((item) => item.id === '4.2-K1');
  const tags = clf.bullets.find((item) => item.id === '4.2-S4');
  assert.equal(transfer.teaching.classification, 'direct teaching');
  assert.equal(billing.teaching.classification, 'direct teaching');
  assert.equal(tags.teaching.classification, 'direct teaching');
  for (const row of [transfer, billing, tags]) {
    assert.equal(row.source.checkedAgainstCurrentOfficialPageOn, '2026-11-18');
    assert.ok(row.source.technicalSourceUrls.length > 0, row.id);
    for (const evidenceId of row.teaching.lessonEvidenceIds) {
      const unit = clf.lessonEvidenceCatalog[evidenceId];
      const section = topics.find((topic) => topic.id === unit.topicId)?.sections.find((item) => item.id === unit.sectionId);
      assert.ok(section, evidenceId);
      assert.deepEqual(unit.excerpts, flatten(section), evidenceId);
    }
  }
  assert.ok(clf.currentSourceVerification.clfInScope.status === 'retrieved');
  assert.equal(clf.currentSourceVerification.clfInScope.exactStatement, 'This list is non-exhaustive and is subject to change.');
  assert.match(clf.currentSourceVerification.costAllocationTags.officialStatements.join(' '), /historically assigned/);
  assert.match(clf.currentSourceVerification.clfBillingData.officialStatement, /invoice/);
  assert.deepEqual(clf.currentSourceVerification.supportOptions.currentNames, [
    'Basic', 'AWS Business Support+', 'AWS Enterprise Support', 'AWS Unified Operations',
  ]);
  assert.ok(clf.bullets.find((item) => item.id === '4.3-K2').source.technicalSourceUrls.includes(clf.currentSourceVerification.supportOptions.url));
  assert.equal(clf.coverageSummary.afterBatch['direct teaching'], 135);
  assert.equal(clf.coverageSummary.afterBatch['partial support'], 0);
  assert.equal(saa.currentScopeListVerification.checkedOn, '2026-11-18');
  assert.match(saa.currentScopeListVerification.result, /^UNRESOLVED:/);
});

test('only CLF objective 2.3 status changes in this batch; SAA task statuses stay partial', () => {
  const clfExam = objectives.exams.find((exam) => exam.code === 'clf-c02');
  const clfStatuses = Object.fromEntries(clfExam.domains.flatMap((domain) => domain.objectives.map((objective) => [objective.id, objective.status])));
  assert.equal(clfStatuses['2.3'], 'covered');
  assert.equal(clf.tasks.find((task) => task.id === '2.3').proposedStatus, 'covered');
  const saaExam = objectives.exams.find((exam) => exam.code === 'saa-c03');
  for (const id of ['2.1', '2.2', '4.1']) {
    const objective = saaExam.domains.flatMap((domain) => domain.objectives).find((item) => item.id === id);
    assert.equal(objective.status, 'partial', id);
    const mapping = saa.repositoryTeaching.tasks.find((task) => task.taskId === id);
    assert.equal(mapping.repositoryTeaching.existingCoverageStatus, 'partial', id);
  }
});
