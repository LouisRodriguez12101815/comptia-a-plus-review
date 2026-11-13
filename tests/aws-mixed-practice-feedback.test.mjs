import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { mixedPracticeFeedback } from "../lib/mixed-practice-feedback.ts";

const single = { id: "single", topicId: "topic", prompt: "Which?", choices: ["Correct", "Wrong"], answer: 0, explanation: "The authored explanation.", examCodes: ["clf-c02"], objectiveIds: { "clf-c02": ["1.1"] } };
const multi = { id: "multi", topicId: "topic", prompt: "Select all.", choices: ["A", "B", "C", "D"], answer: [0, 2], explanation: "Both authored choices apply.", examCodes: ["clf-c02"], objectiveIds: { "clf-c02": ["3.6"] } };

test("correct feedback preserves the authored answer and explanation", () => {
  assert.deepEqual(mixedPracticeFeedback(single, 0), { correct: true, selectedIndices: [0], correctIndices: [0], missingIndices: [], incorrectIndices: [] });
});

test("incorrect single-answer feedback identifies the selected wrong choice", () => {
  assert.deepEqual(mixedPracticeFeedback(single, 1), { correct: false, selectedIndices: [1], correctIndices: [0], missingIndices: [0], incorrectIndices: [1] });
});

test("multiple-response feedback identifies missing and extra selections", () => {
  assert.deepEqual(mixedPracticeFeedback(multi, [0, 1]), { correct: false, selectedIndices: [0, 1], correctIndices: [0, 2], missingIndices: [2], incorrectIndices: [1] });
  assert.equal(mixedPracticeFeedback(multi, [2, 0]).correct, true);
});

test("feedback is gated behind submission and locks choices in Mixed Practice", () => {
  const source = readFileSync(new URL("../app/[locale]/test/ExamTest.tsx", import.meta.url), "utf8");
  assert.match(source, /feedbackVisible/);
  assert.match(source, /disabled=\{isMixedPractice && feedbackVisible\}/);
  assert.match(source, /isMixedPractice \? feedbackVisible/);
  assert.match(source, /aria-live="polite"/);
});

test("full exam and Network+ paths retain the existing delayed lock-in flow", () => {
  const source = readFileSync(new URL("../app/[locale]/test/ExamTest.tsx", import.meta.url), "utf8");
  assert.match(source, /isMixedPractice && !feedbackVisible/);
  assert.match(source, /sessionDurationSeconds\(exam, draft.length\)/);
  assert.match(source, /exam === "n10-009"/);
});

test("feedback and advancing do not create duplicate persistence writes", () => {
  const source = readFileSync(new URL("../app/[locale]/test/ExamTest.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(completed\.current\) return/);
  assert.equal((source.match(/recordMock\(/g) ?? []).length, 1);
  assert.equal((source.match(/recordQuiz\(/g) ?? []).length, 1);
});
