import assert from "node:assert/strict";
import { test } from "node:test";
import { controlledQuestionIds } from "../lib/controlled-question-pool.ts";

const topics = [
  { id: "networking", examCodes: ["n10-009"] },
  { id: "aws", examCodes: ["clf-c02"] },
];
const questions = [
  { id: "n10-q1", topicId: "networking" },
  { id: "aws-q1", topicId: "aws" },
];

test("controlled pools retain valid IDs, remove duplicates, and ignore unknown IDs", () => {
  assert.deepEqual(
    controlledQuestionIds(["n10-q1", "n10-q1", "missing"], questions, topics, "n10-009"),
    ["n10-q1"],
  );
});

test("an N10 controlled pool excludes an unrelated certification question", () => {
  assert.deepEqual(
    controlledQuestionIds(["n10-q1", "aws-q1"], questions, topics, "n10-009"),
    ["n10-q1"],
  );
  assert.deepEqual(
    controlledQuestionIds(["n10-q1", "aws-q1"], questions, topics),
    ["n10-q1", "aws-q1"],
  );
});
