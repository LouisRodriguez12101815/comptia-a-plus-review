import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isCorrect } from "../lib/exam-test.mjs";
import { answerLabel, correctIndices, isCorrectPick, mapAuthoredAnswersToDisplayed } from "../lib/quiz-feedback.ts";

const bank = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));

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

test("shuffled multiple-answer keys map authored choices to displayed positions", () => {
  const choiceOrder = [3, 0, 4, 1, 2];
  const displayedAnswer = mapAuthoredAnswersToDisplayed(choiceOrder, [1, 3]);
  assert.deepEqual(displayedAnswer, [0, 3]);
  const shuffled = { ...multi, choices: choiceOrder.map(index => multi.choices[index]), answer: displayedAnswer };
  assert.equal(isCorrectPick(shuffled, [0, 3]), true);
});

test("shuffled multiple-answer grading rejects partial, wrong, and extra selections", () => {
  const choiceOrder = [3, 0, 4, 1, 2];
  const shuffled = {
    ...multi,
    choices: choiceOrder.map(index => multi.choices[index]),
    answer: mapAuthoredAnswersToDisplayed(choiceOrder, [0, 1]),
  };
  assert.deepEqual(shuffled.answer, [1, 3]);
  assert.equal(isCorrectPick(shuffled, [1]), false);
  assert.equal(isCorrectPick(shuffled, [0, 3]), false);
  assert.equal(isCorrectPick(shuffled, [1, 3, 4]), false);
});

test("shuffled single-answer key remains the displayed position", () => {
  const choiceOrder = [3, 0, 4, 1, 2];
  const answer = mapAuthoredAnswersToDisplayed(choiceOrder, 1);
  assert.equal(answer, 3);
  const shuffled = { ...single, choices: choiceOrder.map(index => single.choices[index]), answer };
  assert.equal(isCorrectPick(shuffled, 3), true);
  assert.equal(isCorrectPick(shuffled, 1), false);
});

function texts(question, indexes) {
  const list = Array.isArray(indexes) ? indexes : [indexes];
  return list.map((index) => question.choices[index]).sort();
}

test("disputed multi-select keys stay on the authored choices after a forced shuffle", () => {
  const disputed = {
    "q-as1201-30": ["SSH", "HTTPS"],
    "q-n10c7-32": ["An IPv4 address is 32 bits long and written in decimal", "An IPv6 address is 128 bits long and written in hexadecimal"],
    "q-cls-041": ["High combustion temperature", "Reduces toxic gas released during a fire"],
  };
  for (const [id, expected] of Object.entries(disputed)) {
    const question = bank.find((item) => item.id === id);
    assert.ok(question, id);
    assert.deepEqual(texts(question, question.answer), [...expected].sort());
    const choiceOrder = [...question.choices.keys()].reverse();
    const displayed = {
      ...question,
      choices: choiceOrder.map((index) => question.choices[index]),
      answer: mapAuthoredAnswersToDisplayed(choiceOrder, question.answer),
    };
    const displayedPicks = displayed.answer;
    assert.equal(isCorrectPick(displayed, displayedPicks), true, id);
    assert.deepEqual(texts(displayed, correctIndices(displayed)), [...expected].sort(), id);
    assert.deepEqual(answerLabel(displayed, displayedPicks).split(" · ").sort(), [...expected].sort(), id);
    const displayedPositions = question.answer.map((authored) => choiceOrder.indexOf(authored));
    const stored = displayedPositions.map((position) => choiceOrder[position]);
    assert.equal(isCorrect(question, stored), true, id);
    assert.deepEqual(stored.map((index) => question.choices[index]).sort(), [...expected].sort(), id);
    const sameSet = displayedPositions.length === question.answer.length && displayedPositions.every((index) => question.answer.includes(index));
    if (!sameSet) {
      assert.equal(isCorrect(question, displayedPositions), false, id);
      assert.equal(isCorrectPick(displayed, question.answer), false, id);
      assert.notDeepEqual(texts(displayed, question.answer), [...expected].sort(), id);
    }
  }
  const single = bank.find((item) => item.id === "q-as1201-31");
  const choiceOrder = [2, 0, 3, 1];
  const displayed = {
    ...single,
    choices: choiceOrder.map((index) => single.choices[index]),
    answer: mapAuthoredAnswersToDisplayed(choiceOrder, single.answer),
  };
  assert.equal(isCorrectPick(displayed, displayed.answer), true);
  assert.equal(answerLabel(displayed, displayed.answer), single.choices[single.answer]);
  assert.equal(isCorrect(single, choiceOrder[displayed.answer]), true);
  assert.equal(isCorrectPick(displayed, single.answer), false);
});

test("answer labels preserve selected and correct answer text", () => {
  assert.equal(answerLabel(single, 1), "Identify");
  assert.equal(answerLabel(multi, [0, 1]), "Physical · Data Link");
});
