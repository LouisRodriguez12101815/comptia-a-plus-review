import assert from "node:assert/strict";
import { test } from "node:test";
import { controlledQuestionIds, questionIdsFromParam } from "../lib/controlled-question-pool.ts";

const topics = [
  { id: "networking", examCodes: ["n10-009"] },
  { id: "aws", examCodes: ["clf-c02"] },
];
const questions = [
  { id: "n10-q1", topicId: "networking" },
  { id: "aws-q1", topicId: "aws" },
];

test("repeated query parameters normalize into one controlled ID list", () => {
  assert.deepEqual(questionIdsFromParam(["n10-q1", "n10-q1,n10-q2"]), ["n10-q1", "n10-q1", "n10-q2"]);
});

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
import { resolveExamParam } from "../lib/exam-route.ts";

test("exam route parameters reject unsupported and repeated values without selecting another exam", () => {
  assert.deepEqual(resolveExamParam(undefined, true), { kind: "absent" });
  assert.deepEqual(resolveExamParam("clf-c02", true), { kind: "valid", focus: "clf-c02" });
  assert.deepEqual(resolveExamParam("sy0-701", true), { kind: "invalid" });
  assert.deepEqual(resolveExamParam(["clf-c02", "220-1201"], true), { kind: "invalid" });
  assert.deepEqual(resolveExamParam("az-104"), { kind: "valid", focus: "az-104" });
  assert.deepEqual(resolveExamParam("no-such-exam"), { kind: "invalid" });
});
