import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import questions from "../content/questions.json" with { type: "json" };
import { selectInlineRemediation } from "../lib/inline-remediation.ts";

const question = questions.find((item) => item.id === "q-n10c7-16");
assert.ok(question);

const cards = [0, 1, 2, 3].map((index) => ({
  id: `card-${index}`,
  topicId: question.topicId,
  front: `Front ${index}`,
  back: `Back ${index}`,
}));

const videos = [{
  slug: "eui64-video",
  title: "EUI-64",
  description: "EUI-64",
  exam: "n10-009",
  objective: "1.7",
  topicId: question.topicId,
  questionId: question.id,
  duration: 60,
  published: "2026-01-01",
  takeaway: "Flip U/L.",
  transcript: "Flip U/L.",
}];

test("inline remediation selects authored guidance, exact video, visual, notes, and a capped first-miss card set", () => {
  const result = selectInlineRemediation(question, {
    flashcards: cards,
    videos,
    visualsForTopic: () => [{ file: "eui64.html", title: "EUI-64", description: "", group: "" }],
    questions,
  });

  assert.equal(result.examClueKey, "eui64BitFlip");
  assert.equal(result.memoryRuleKey, "eui64BitFlip");
  assert.equal(result.whyWrongKey, "eui64BitFlip");
  assert.equal(result.flashcards.length, 1);
  assert.equal(result.video?.questionId, question.id);
  assert.equal(result.visual?.file, "eui64.html");
  assert.equal(result.notesHref, "/notes/n10-ch7");
  assert.equal(result.retryQuestionIds.includes(question.id), false);
});

test("repeated misses escalate only the existing flashcard selection", () => {
  const result = selectInlineRemediation(question, { flashcards: cards, priorMisses: 1, questions });
  assert.equal(result.priorMisses, 1);
  assert.equal(result.flashcards.length, 3);
});

test("weak or missing resource matches are omitted", () => {
  const unrelated = { ...cards[0], topicId: "other-topic" };
  const result = selectInlineRemediation(question, {
    flashcards: [unrelated],
    videos: [],
    visualsForTopic: () => [],
    questions,
  });
  assert.deepEqual(result.flashcards, []);
  assert.equal(result.video, undefined);
  assert.equal(result.visual, undefined);
});

test("inline remediation UI keys are present in every supported locale", () => {
  const keys = [
    "learnThisNow",
    "learnThisNowIntro",
    "repeatedMiss",
    "whyWrong",
    "examClue",
    "memoryRule",
    "viewVisual",
    "flashcards",
    "watchVideo",
    "reviewNotes",
    "trySimilar",
  ];

  for (const locale of ["en", "es", "fr", "pt"]) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
    for (const key of keys) {
      assert.equal(typeof messages.quizRunner[key], "string", `${locale}.quizRunner.${key}`);
    }
  }
});
