import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolveSaaLesson, saaCurriculumDomains } from '../lib/saa-curriculum.ts';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const matrix = read('content/objectives.json');
const topics = read('content/topics.json');
const questions = read('content/questions.json');
const labs = read('content/labs.json');
const visuals = read('content/track-visuals.json');
const evidence = read('docs/saa-c03-evidence-map.json');
const exam = matrix.exams.find((exam) => exam.code === 'saa-c03');
const resources = { topics, questions, labs, visualsForTopic: (id) => visuals[id] ?? [] };
const lookup = (id) => topics.find((topic) => topic.id === id);

test('all 14 navigation destinations match the reviewed teaching evidence', () => {
  const domains = saaCurriculumDomains(exam, resources);
  assert.deepEqual(domains.map((domain) => domain.weight), [30, 26, 24, 20]);
  const tasks = domains.flatMap((domain) => domain.tasks);
  assert.equal(tasks.length, 14);
  assert.equal(evidence.repositoryTeaching.tasks.length, 14);
  for (const task of tasks) {
    const reviewed = evidence.repositoryTeaching.tasks.find((row) => row.taskId === task.id);
    assert.ok(reviewed, task.id);
    assert.ok(task.lesson, task.id);
    assert.equal(task.lesson.href, reviewed.repositoryTeaching.href);
    const section = lookup(task.lesson.topicId).sections.find((section) => section.id === task.lesson.sectionId);
    assert.equal(section.title, reviewed.repositoryTeaching.heading);
    // These guard the reviewed passage against drift; they do not grade teaching quality.
    assert.ok(section.blocks.some((block) => block.type === 'bullets' && block.items.includes(reviewed.repositoryTeaching.evidenceExcerpt)));
    assert.ok(section.blocks.some((block) => block.type === 'paragraph' && block.text === reviewed.repositoryTeaching.workedDecisionExcerpt));
    const current = exam.domains.flatMap((domain) => domain.objectives).find((objective) => objective.id === task.id);
    assert.equal(current.status, reviewed.repositoryTeaching.existingCoverageStatus);
    assert.equal(reviewed.pdfAlignment.status, 'mapped');
    assert.ok(reviewed.pdfAlignment.knowledgeBulletIds.length > 0);
    assert.ok(reviewed.pdfAlignment.skillsBulletIds.length > 0);
    assert.ok(task.questionHref);
    const questionId = new URL(task.questionHref, 'https://example.invalid').searchParams.get('questions');
    assert.ok(questions.find((question) => question.id === questionId).objectiveIds['saa-c03'].includes(task.id));
  }
});

test('absent, malformed and unrelated lesson references produce a gap, never an invented URL', () => {
  for (const reference of ['', 'missing#anchor', 'aws-saa-compute#absent', 'aws-saa-compute', 'aws-saa-compute#ec2#extra']) {
    assert.equal(resolveSaaLesson(reference, lookup), null, reference);
  }
  const other = topics.find((topic) => !topic.examCodes.includes('saa-c03'));
  assert.equal(resolveSaaLesson(`${other.id}#${other.sections[0].id}`, lookup), null);
  const altered = structuredClone(exam);
  altered.domains[0].objectives[0].reviewEvidence.section = 'missing#anchor';
  altered.domains[0].objectives[0].reviewEvidence.questionId = 'unknown';
  const task = saaCurriculumDomains(altered, resources)[0].tasks[0];
  assert.equal(task.lesson, null);
  assert.equal(task.questionHref, null);
});

test('the index preserves its inputs and only links existing domain resources', () => {
  const baseline = JSON.stringify({ exam, topics, questions, labs, visuals });
  for (const domain of saaCurriculumDomains(exam, resources)) {
    assert.equal(new Set(domain.visuals.map((visual) => visual.file)).size, domain.visuals.length);
    for (const lab of domain.labs) assert.ok(labs.some((item) => item.slug === lab.slug));
    const drills = readFileSync(new URL('../lib/practice/drills.ts', import.meta.url), 'utf8');
    assert.ok(drills.includes(`"id": "${domain.drillId}"`));
  }
  assert.equal(JSON.stringify({ exam, topics, questions, labs, visuals }), baseline);
});

test('PDF identity expectations remain distinct from measured verification', () => {
  assert.equal(evidence.suppliedPdf.expectedPageCount, 17);
  assert.equal(evidence.suppliedPdf.expectedSha256, '78e9aa30bd67653603a8a782aeeca1619a7576916fe9bb0588db49429e31033c');
  assert.equal(evidence.suppliedPdf.identityVerified, true);
  assert.equal(evidence.suppliedPdf.actualPageCount, evidence.suppliedPdf.expectedPageCount);
  assert.equal(evidence.suppliedPdf.actualSha256, evidence.suppliedPdf.expectedSha256);
  assert.equal(evidence.suppliedPdf.version, '1.0 SAA-C03');
  assert.equal(evidence.suppliedPdf.bulletMappings.length, 189);
});

test('every PDF knowledge and skill group is complete with correct pages and unique source IDs', () => {
  // Counts and pages transcribed independently from the verified 17-page PDF.
  const groups = {
    '1.1': [5, 6, 3, 3], '1.2': [6, 4, 3, 3], '1.3': [4, 7, 4, 4],
    '2.1': [16, 7, 4, 5], '2.2': [12, 8, 5, 5],
    '3.1': [3, 2, 6, 6], '3.2': [6, 4, 6, 6], '3.3': [8, 5, 6, 7],
    '3.4': [4, 4, 7, 7], '3.5': [7, 7, 7, 7],
    '4.1': [11, 10, 8, 8], '4.2': [9, 6, 9, 9], '4.3': [9, 5, 9, 10], '4.4': [7, 7, 10, 10],
  };
  const rows = evidence.suppliedPdf.bulletMappings;
  const classifications = ['direct teaching', 'mention', 'partial support', 'missing support', 'unresolved'];
  assert.equal(new Set(rows.map((row) => row.id)).size, 189);
  assert.equal(evidence.suppliedPdf.domains.length, 4);
  assert.equal(evidence.suppliedPdf.taskStatements.length, 14);
  for (const [taskId, [knowledgeCount, skillsCount, knowledgePage, skillsPage]] of Object.entries(groups)) {
    const task = evidence.repositoryTeaching.tasks.find((task) => task.taskId === taskId);
    for (const [group, count, page, letter, ids] of [
      ['Knowledge of', knowledgeCount, knowledgePage, 'K', task.pdfAlignment.knowledgeBulletIds],
      ['Skills in', skillsCount, skillsPage, 'S', task.pdfAlignment.skillsBulletIds],
    ]) {
      const matching = rows.filter((row) => row.taskId === taskId && row.sourceGroup === group);
      assert.equal(matching.length, count, `${taskId} ${group}`);
      assert.deepEqual(matching.map((row) => row.id), ids);
      matching.forEach((row, index) => {
        assert.equal(row.id, `${taskId}-${letter}${String(index + 1).padStart(2, '0')}`);
        assert.equal(row.pdfPage, page);
        assert.equal(row.domainId, `${taskId[0]}.0`);
        assert.ok(row.sourceBullet.length > 5);
        assert.ok(classifications.includes(row.classification));
        assert.ok(row.rationale);
        for (const id of [...row.teachingEvidenceIds, ...row.resourceEvidenceIds, ...row.reviewedButInsufficientEvidenceIds]) {
          assert.ok(evidence.evidenceCatalog[id], `${row.id}: unresolved evidence ID ${id}`);
        }
        assert.equal(row.existingReferences.length, row.teachingEvidenceIds.length);
        assert.equal(row.relevantResources.length, row.resourceEvidenceIds.length);
        if (row.classification === 'direct teaching') assert.ok(row.teachingEvidenceIds.length > 0);
        if (row.classification === 'missing support') {
          assert.equal(row.teachingEvidenceIds.length, 0);
          assert.equal(row.resourceEvidenceIds.length, 0);
          assert.ok(row.reviewedButInsufficientEvidenceIds.length > 0);
        }
        if (row.classification !== 'direct teaching') assert.ok(row.gap);
      });
    }
  }
  const count = (items) => Object.fromEntries(classifications.map((classification) =>
    [classification, items.filter((row) => row.classification === classification).length]));
  assert.deepEqual(evidence.coverageSummary.byClassification, count(rows));
  assert.equal(evidence.coverageSummary.byDomain.length, 4);
  for (const domain of evidence.coverageSummary.byDomain) {
    const selected = rows.filter((row) => row.domainId === domain.domainId);
    assert.equal(domain.totalBullets, selected.length);
    assert.deepEqual(domain.byClassification, count(selected));
  }
});

test('evidence catalog excerpts and existing resource pointers resolve to unchanged source content', () => {
  const allTopics = [...topics, ...read('content/topics-network-plus.json')];
  const cards = read('content/flashcards.json');
  const flatten = (section) => section.blocks.flatMap((block) => {
    if (block.type === 'bullets') return block.items;
    if (block.type === 'table') return block.rows.map((row) => row.join(' | '));
    return block.text ? [block.text] : [];
  });
  const file = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
  const drillSource = file('lib/practice/drills.ts').toString();
  for (const [id, item] of Object.entries(evidence.evidenceCatalog)) {
    assert.equal(createHash('sha256').update(file(item.file)).digest('hex'), item.sourceSha256, id);
    assert.ok(item.excerpts.length > 0, id);
    let original;
    if (item.kind === 'lesson') {
      const topic = allTopics.find((topic) => topic.id === item.topicId);
      const section = topic?.sections.find((section) => section.id === item.sectionId);
      assert.ok(section, id);
      assert.equal(item.heading, section.title);
      assert.equal(item.href, `/notes/${topic.id}#${section.id}`);
      original = flatten(section);
    } else if (item.kind === 'question') {
      const question = questions.find((question) => question.id === item.id);
      assert.ok(question, id);
      assert.equal(question.topicId, item.topicId);
      original = [question.prompt, question.explanation];
    } else if (item.kind === 'flashcard') {
      const card = cards.find((card) => card.id === item.id);
      assert.ok(card, id);
      original = [card.front, card.back];
    } else if (item.kind === 'lab') {
      const lab = labs.find((lab) => lab.slug === item.id);
      const section = lab?.sections.find((section) => section.id === item.sectionId);
      assert.ok(section, id);
      original = flatten(section);
    } else if (item.kind === 'practice') {
      const deckPosition = drillSource.indexOf(`"id": "${item.id}"`);
      assert.ok(deckPosition >= 0, id);
      const objectStart = drillSource.lastIndexOf('{', deckPosition);
      const objectEnd = drillSource.indexOf('\n};', objectStart) + 2;
      const deck = JSON.parse(drillSource.slice(objectStart, objectEnd));
      const unit = deck.items.find((unit) => unit.id === item.itemId);
      assert.ok(unit, id);
      assert.deepEqual(JSON.parse(item.excerpts[0]), unit.fields);
      original = [item.excerpts[0], unit.detail];
    } else if (item.kind === 'visual') {
      assert.ok(item.excerpts.every((excerpt) => file(item.file).toString().includes(excerpt)), id);
      original = item.excerpts;
    } else if (item.kind === 'video') {
      const transcript = file(item.transcriptFile).toString().replace(/\s+/g, ' ');
      assert.ok(item.excerpts.every((excerpt) => transcript.includes(excerpt)), id);
      assert.ok(file(item.embeddingFile).toString().includes(item.file.replace('public', '')), id);
      original = item.excerpts;
    } else assert.fail(`Unknown evidence kind: ${item.kind}`);
    for (const excerpt of item.excerpts) assert.ok(original.includes(excerpt), `${id}: excerpt drift`);
  }
});
