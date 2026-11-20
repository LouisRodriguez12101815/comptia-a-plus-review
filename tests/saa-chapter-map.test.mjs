import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolveSaaChapterPath, saaChapterMapMeta } from '../lib/saa-chapter-map.ts';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const map = read('content/saa-chapter-map.json');
const objectives = read('content/objectives.json');
const topics = read('content/topics.json');
const labs = read('content/labs.json');
const exam = objectives.exams.find((item) => item.code === 'saa-c03');

// Minimal drill fixtures matching production IDs.
const drills = [
  { id: 'aws-saa-service-compare', topic: 'AWS architecture tradeoffs', exam: 'saa-c03' },
  { id: 'aws-saa-secure-cues', topic: 'Secure architecture cues', exam: 'saa-c03' },
  { id: 'aws-saa-resilient-cues', topic: 'Resilient architecture cues', exam: 'saa-c03' },
  { id: 'aws-saa-performance-cues', topic: 'Performance architecture cues', exam: 'saa-c03' },
  { id: 'aws-saa-cost-cues', topic: 'Cost architecture cues', exam: 'saa-c03' },
];

test('SAA chapter map covers thirteen textbook chapters for saa-c03', () => {
  const meta = saaChapterMapMeta(map);
  assert.equal(meta.examCode, 'saa-c03');
  assert.equal(meta.chapterCount, 13);
  assert.equal(map.chapters.length, 13);
  assert.ok(meta.guide.title.includes('Solutions Architect'));
});

test('every chapter resolves only live objectives, topics, drills, and labs', () => {
  const chapters = resolveSaaChapterPath(map, { exam, topics, labs, drills });
  assert.equal(chapters.length, 13);
  const objectiveIds = new Set(exam.domains.flatMap((domain) => domain.objectives.map((objective) => objective.id)));
  const topicIds = new Set(topics.map((topic) => topic.id));
  const labSlugs = new Set(labs.map((lab) => lab.slug));
  const drillIds = new Set(drills.map((drill) => drill.id));

  for (const chapter of chapters) {
    assert.ok(chapter.objectives.length > 0, chapter.id);
    for (const objective of chapter.objectives) {
      assert.ok(objectiveIds.has(objective.id), `${chapter.id} ${objective.id}`);
      assert.match(objective.href, /^\/aws-saa#saa-domain-\d\.0$/);
    }
    assert.ok(chapter.topics.length > 0, chapter.id);
    for (const topic of chapter.topics) {
      assert.ok(topicIds.has(topic.id), `${chapter.id} ${topic.id}`);
      assert.equal(topic.href, `/notes/${topic.id}`);
    }
    for (const drill of chapter.drills) {
      assert.ok(drillIds.has(drill.id), `${chapter.id} ${drill.id}`);
      assert.equal(drill.href, `/practice-games/drills/${drill.id}`);
    }
    for (const lab of chapter.labs) {
      assert.ok(labSlugs.has(lab.slug), `${chapter.id} ${lab.slug}`);
      assert.equal(lab.href, `/labs/${lab.slug}`);
    }
    assert.match(chapter.practiceHref, /^\/test\?exam=saa-c03/);
  }

  // Representative wiring: VPC chapter hits secure/network/cost objectives and the VPC lab.
  const vpc = chapters.find((chapter) => chapter.id === 'ch03');
  assert.deepEqual(vpc.objectives.map((item) => item.id).sort(), ['1.2', '3.4', '4.4']);
  assert.ok(vpc.labs.some((lab) => lab.slug === 'aws-saa-vpc-public-private'));
  assert.ok(vpc.drills.some((drill) => drill.id === 'aws-saa-secure-cues'));

  // Cost chapter maps domain 4 and the cost drill.
  const cost = chapters.find((chapter) => chapter.id === 'ch13');
  assert.deepEqual(cost.objectives.map((item) => item.id).sort(), ['4.1', '4.2', '4.3', '4.4']);
  assert.ok(cost.drills.some((drill) => drill.id === 'aws-saa-cost-cues'));
});

test('missing resources never invent links', () => {
  const chapters = resolveSaaChapterPath(map, {
    exam,
    topics: topics.filter((topic) => topic.id === 'aws-saa-networking'),
    labs: [],
    drills: [],
  });
  const vpc = chapters.find((chapter) => chapter.id === 'ch03');
  assert.ok(vpc.topics.every((topic) => topic.id === 'aws-saa-networking'));
  assert.equal(vpc.labs.length, 0);
  assert.equal(vpc.drills.length, 0);
  assert.ok(vpc.objectives.length > 0);
});
