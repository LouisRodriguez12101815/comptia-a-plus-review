import assert from "node:assert/strict";
import { test } from "node:test";
import {
  rankMissedQuestions,
  remediationForQuestion,
  videoForQuestion,
  visualForQuestion,
} from "../lib/weak-areas.ts";

const question = (id, topicId = "topic-a") => ({
  id,
  topicId,
  prompt: `Prompt ${id}`,
  choices: ["First", "Second"],
  answer: 0,
  explanation: `Explanation ${id}`,
});

const emptyProgress = () => ({
  studyFocus: "all",
  knownCards: {},
  unknownCards: {},
  quizAttempts: [],
  mockAttempts: [],
  schedules: {},
});

const video = (overrides = {}) => ({
  slug: "topic-video",
  title: "Topic video",
  description: "A topic video",
  exam: "n10-009",
  objective: "2.1",
  topicId: "topic-a",
  questionId: "other-question",
  duration: 60,
  published: "2026-01-01",
  takeaway: "A takeaway",
  transcript: "Transcript",
  ...overrides,
});

const visual = (overrides = {}) => ({
  file: "topic-visual.html",
  title: "Topic visual",
  description: "A topic visual",
  group: "Topic",
  ...overrides,
});

test("no progress produces an empty, valid fallback selection", () => {
  assert.deepEqual(rankMissedQuestions(emptyProgress(), [question("q1")]), []);
});

test("one missed quiz question is selected and duplicate misses are deduplicated", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [
    { topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 1 },
    { topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 2 },
  ];

  const result = rankMissedQuestions(progress, [question("q1")]);
  assert.equal(result.length, 1);
  assert.equal(result[0].question.id, "q1");
  assert.equal(result[0].misses, 2);
});

test("repeated misses are prioritized, with recency breaking ties", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [
    { topicId: "topic-a", questionIds: ["q1", "q2"], missedIds: ["q1", "q2"], at: 10 },
    { topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 20 },
  ];

  assert.deepEqual(
    rankMissedQuestions(progress, [question("q1"), question("q2")]).map((row) => row.question.id),
    ["q1", "q2"],
  );
});

test("mock-test misses and older attempts without questionIds remain supported", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [{ topicId: "topic-a", missedIds: ["q1"], at: 1 }];
  progress.mockAttempts = [{ missedIds: ["q2"], at: 2 }];

  assert.deepEqual(
    rankMissedQuestions(progress, [question("q1"), question("q2")]).map((row) => row.question.id),
    ["q2", "q1"],
  );
});

test("exact question video matching wins over topic fallback", () => {
  const q = question("q1");
  const result = videoForQuestion(q, [
    video({ slug: "topic", questionId: "other" }),
    video({ slug: "exact", questionId: "q1" }),
  ]);
  assert.equal(result?.slug, "exact");
});

test("topic-level video fallback works and missing video is safe", () => {
  const q = question("q1");
  assert.equal(videoForQuestion(q, [video({ questionId: "other" })])?.slug, "topic-video");
  assert.equal(videoForQuestion(q, []), undefined);
});

test("topic-level visual matching works and missing visual is safe", () => {
  const q = question("q1");
  assert.equal(visualForQuestion(q, () => [visual()])?.file, "topic-visual.html");
  assert.equal(visualForQuestion(q, () => []), undefined);
});

test("remediation remains useful when either resource is missing", () => {
  const missed = { question: question("q1"), misses: 1, latestMissAt: 10 };
  const result = remediationForQuestion(missed, {
    videos: [],
    visualsForTopic: () => [],
  });

  assert.equal(result.question.id, "q1");
  assert.equal(result.notesHref, "/notes/topic-a");
  assert.equal(result.video, undefined);
  assert.equal(result.visual, undefined);
});
