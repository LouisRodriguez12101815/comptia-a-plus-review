import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const data = read("content/network-plus-concepts.json");
const questions = read("content/questions.json");
const videos = read("content/concept-videos.json");
const objectives = read("content/objectives.json");
const questionIds = new Set((Array.isArray(questions) ? questions : questions.questions).map((q) => q.id));
const n10 = objectives.exams.find((e) => e.code === "n10-009");
const objectiveIds = new Set(n10.domains.flatMap((d) => d.objectives).map((o) => o.id));
const slugs = new Set(videos.map((v) => v.slug));
const { conceptProgress } = await import("../lib/concept-status.ts");

test("concept ids are unique kebab-case and map to real objectives", () => {
  const all = [...data.concepts, ...data.pairs];
  assert.equal(new Set(all.map((c) => c.id)).size, all.length);
  for (const c of all) {
    assert.match(c.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(objectiveIds.has(c.objective), `${c.id}: unknown objective ${c.objective}`);
    assert.ok(c.title.length > 3);
  }
});

test("every concept question exists and belongs to exactly one concept", () => {
  const seen = new Map();
  for (const c of data.concepts) {
    assert.ok(c.questionIds.length >= 3, `${c.id}: needs at least three questions`);
    for (const id of c.questionIds) {
      assert.ok(questionIds.has(id), `${c.id}: unknown question ${id}`);
      assert.ok(!seen.has(id), `${id} is in both ${seen.get(id)} and ${c.id}`);
      seen.set(id, c.id);
    }
  }
});

test("look-alike pairs use real questions and a one-line rule", () => {
  for (const p of data.pairs) {
    assert.ok(p.questionIds.length >= 2, `${p.id}: needs at least two questions`);
    assert.ok(p.rule.length > 20);
    for (const id of p.questionIds) assert.ok(questionIds.has(id), `${p.id}: unknown question ${id}`);
  }
});

test("linked videos and diagrams exist", () => {
  for (const c of data.concepts) {
    for (const slug of c.videos) assert.ok(slugs.has(slug), `${c.id}: unknown video ${slug}`);
    for (const v of c.visuals) assert.ok(readFileSync(new URL(`../public/visuals/${v.file}`, import.meta.url)).length > 0, `${c.id}: missing ${v.file}`);
  }
});

test("concept status: untested, weak, improving and solid follow the stated rules", () => {
  const ids = ["a", "b", "c", "d"];
  const day = 24 * 60 * 60 * 1000;
  const attempt = (at, missed) => ({ at, questionIds: ids, missedIds: missed });
  assert.equal(conceptProgress(ids, { quizAttempts: [], mockAttempts: [] }).status, "untested");
  assert.equal(conceptProgress(ids, { quizAttempts: [attempt(day, ["a", "b"])], mockAttempts: [] }).status, "weak");
  assert.equal(conceptProgress(ids, { quizAttempts: [attempt(day, [])], mockAttempts: [] }).status, "improving", "one day of correct answers is not solid yet");
  assert.equal(conceptProgress(ids, { quizAttempts: [attempt(day, []), attempt(3 * day, [])], mockAttempts: [] }).status, "solid");
  assert.equal(conceptProgress(ids, { quizAttempts: [attempt(day, []), attempt(3 * day, ["a", "b"])], mockAttempts: [] }).status, "weak", "the latest answer counts");
});

test("weak-concept report groups misses by concept, most missed first, and stays unchanged without concepts", async () => {
  const { buildWeakReport } = await import("../lib/weak-report.ts");
  const row = (id, conceptTitle, status) => ({ id, objectiveId: "2.3", topicId: "t", topicTitle: "Wi-Fi", conceptTitle, status, flagged: false, prompt: "p", picked: "x", correct: "y", explanation: "e" });
  const report = buildWeakReport({ exam: "n10-009", date: "2026-11-05", correct: 1, total: 4, rows: [row("q1", "Antennas", "wrong"), row("q2", "Channels", "sure-wrong"), row("q3", "Channels", "wrong")] });
  assert.match(report, /## By concept/);
  assert.ok(report.indexOf("| Channels | 2 |") < report.indexOf("| Antennas | 1 |"));
  assert.match(report, /Channels — Wi-Fi/);
  const plain = buildWeakReport({ exam: "n10-009", date: "2026-11-05", correct: 1, total: 2, rows: [{ ...row("q1", undefined, "wrong") }] });
  assert.doesNotMatch(plain, /By concept/);
});

test("the three chapters that were split into concepts leave no question uncovered", () => {
  const split = new Set(["n10-wireless-standards-security", "n10-sdn-overlay", "n10-zerotrust-iac"]);
  const covered = new Set(data.concepts.flatMap((c) => c.questionIds));
  const list = Array.isArray(questions) ? questions : questions.questions;
  const missing = list.filter((q) => q.id.startsWith("q-n10") && split.has(q.topicId) && !covered.has(q.id)).map((q) => q.id);
  assert.deepEqual(missing, []);
});
