import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const text = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const exists = (rel) => existsSync(new URL(`../${rel}`, import.meta.url));

const videos = read("content/concept-videos.json");
const objectives = read("content/objectives.json");
const questions = read("content/questions.json");
const topicIds = new Set([...read("content/topics.json"), ...read("content/topics-network-plus.json")].map((t) => t.id));
const n10 = objectives.exams.find((e) => e.code === "n10-009");
const objectiveById = new Map(n10.domains.flatMap((d) => d.objectives).map((o) => [o.id, o]));

test("concept videos have unique kebab-case slugs", () => {
  assert.ok(videos.length > 0);
  const slugs = videos.map((v) => v.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("every video has its media, captions, poster and complete metadata", () => {
  for (const v of videos) {
    for (const ext of ["mp4", "vtt", "jpg"]) {
      assert.ok(exists(`public/videos/concepts/${v.slug}.${ext}`), `${v.slug}.${ext} is missing`);
    }
    const vtt = text(`public/videos/concepts/${v.slug}.vtt`);
    assert.match(vtt, /^WEBVTT/, `${v.slug}: captions must be WebVTT`);
    assert.match(vtt, /-->/, `${v.slug}: captions have no cues`);
    assert.ok(v.title && v.title.length <= 80, `${v.slug}: title missing or over 80 characters`);
    assert.ok(v.description && v.description.length <= 220, `${v.slug}: description missing or over 220 characters`);
    assert.ok(v.takeaway && v.transcript.length > 100, `${v.slug}: takeaway or transcript missing`);
    assert.ok(v.duration >= 20 && v.duration <= 300, `${v.slug}: unexpected duration ${v.duration}`);
    assert.match(v.published, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("each video maps to a real N10-009 objective, topic and question that agree", () => {
  for (const v of videos) {
    assert.equal(v.exam, "n10-009");
    const objective = objectiveById.get(v.objective);
    assert.ok(objective, `${v.slug}: objective ${v.objective} is not in content/objectives.json`);
    assert.ok(topicIds.has(v.topicId), `${v.slug}: topic ${v.topicId} does not exist`);
    assert.ok((objective.topics ?? []).includes(v.topicId), `${v.slug}: topic ${v.topicId} is not mapped to objective ${v.objective}`);
    const question = questions.find((q) => q.id === v.questionId);
    assert.ok(question, `${v.slug}: question ${v.questionId} does not exist`);
    const qTopics = Array.isArray(question.topicId) ? question.topicId : [question.topicId];
    assert.ok(qTopics.includes(v.topicId), `${v.slug}: question ${v.questionId} belongs to a different topic`);
  }
});

test("no orphaned files in public/videos/concepts", () => {
  const known = new Set(videos.flatMap((v) => ["mp4", "vtt", "jpg"].map((e) => `${v.slug}.${e}`)));
  // Some self-contained AWS/SAA visuals embed their own narrated media without
  // being entries in the N10 concept-video manifest. Those files are owned by
  // the visual HTML and must not be registered as Network+ concept videos.
  for (const file of readdirSync(new URL("../public/visuals/", import.meta.url))) {
    if (!file.endsWith(".html")) continue;
    const html = text(`public/visuals/${file}`);
    for (const match of html.matchAll(/\/videos\/concepts\/([^"'\s]+)/g)) known.add(match[1]);
  }
  for (const file of readdirSync(new URL("../public/videos/concepts/", import.meta.url))) {
    assert.ok(known.has(file), `${file} is not listed in content/concept-videos.json`);
  }
});

test("concept video labels exist in every language", () => {
  const keys = Object.keys(read("messages/en.json").conceptVideos).sort();
  for (const locale of ["fr", "es", "pt"]) {
    assert.deepEqual(Object.keys(read(`messages/${locale}.json`).conceptVideos).sort(), keys, `${locale} labels differ from en`);
  }
});
