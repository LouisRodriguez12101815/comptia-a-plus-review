import assert from "node:assert/strict";
import { test } from "node:test";
import { answerLabel, isCorrectPick } from "../lib/quiz-feedback.ts";

const single = {
  id: "single",
  topicId: "n10-troubleshoot-method",
  prompt: "Which step comes first?",
  choices: ["Plan", "Identify", "Verify", "Document"],
  answer: 1,
  explanation: "Identify the problem first.",
};

const multi = {
  id: "multi",
  topicId: "n10-troubleshoot-method",
  prompt: "Select the correct layers.",
  choices: ["Physical", "Data Link", "Application", "Printer"],
  answer: [0, 1],
  explanation: "Physical and Data Link are correct.",
};

test("single-answer correct and incorrect responses are distinguished", () => {
  assert.equal(isCorrectPick(single, 1), true);
  assert.equal(isCorrectPick(single, 0), false);
});

test("exact multi-answer set is correct", () => {
  assert.equal(isCorrectPick(multi, [0, 1]), true);
});

test("incomplete multi-answer set is incorrect", () => {
  assert.equal(isCorrectPick(multi, [0]), false);
});

test("multi-answer set with an incorrect extra choice is incorrect", () => {
  assert.equal(isCorrectPick(multi, [0, 1, 2]), false);
});

test("answer labels preserve selected and correct answer text", () => {
  assert.equal(answerLabel(single, 1), "Identify");
  assert.equal(answerLabel(multi, [0, 1]), "Physical · Data Link");
});
