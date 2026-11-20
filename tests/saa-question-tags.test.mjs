import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertSaaQuestionTags, saaDomainFromTask } from "../lib/saa-tags.ts";

const questions = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));
const saa = questions.filter((question) => question.examCodes?.includes("saa-c03"));

const base = {
  id: "sample",
  prompt: "A short stem.",
  choices: ["one", "two", "three", "four"],
  answer: 0,
  explanation: "one",
  services: [],
  difficulty: "easy",
};

test("every SAA question has one legal task and study tags that match the item text", () => {
  assert.equal(saa.length, 314);
  for (const question of saa) assertSaaQuestionTags(question);
  for (const question of questions) {
    if (question.examCodes?.includes("saa-c03")) continue;
    assert.equal(question.services, undefined, question.id);
    assert.equal(question.difficulty, undefined, question.id);
    assert.equal(question.domain, undefined, question.id);
  }
});

test("a missing or illegal task id fails", () => {
  assert.throws(() => assertSaaQuestionTags({ ...base, objectiveIds: {} }), /missing SAA task id/);
  assert.throws(() => assertSaaQuestionTags({ ...base, objectiveIds: { "saa-c03": [] } }), /missing SAA task id/);
  assert.throws(() => assertSaaQuestionTags({ ...base, objectiveIds: { "saa-c03": ["1.1", "1.2"] } }), /missing SAA task id/);
  assert.throws(() => assertSaaQuestionTags({ ...base, objectiveIds: { "saa-c03": ["9.9"] } }), /illegal SAA task id 9.9/);
});

test("a stored domain that disagrees with the task fails", () => {
  assert.equal(saaDomainFromTask("1.1"), "D1");
  assert.equal(saaDomainFromTask("2.2"), "D2");
  assert.equal(saaDomainFromTask("3.5"), "D3");
  assert.equal(saaDomainFromTask("4.4"), "D4");
  assert.throws(
    () => assertSaaQuestionTags({ ...base, objectiveIds: { "saa-c03": ["1.1"] }, domain: "D2" }),
    /stored domain D2 disagrees with task 1.1/,
  );
  assert.doesNotThrow(() => assertSaaQuestionTags({ ...base, objectiveIds: { "saa-c03": ["4.4"] }, domain: "D4" }));
  assert.doesNotThrow(() => assertSaaQuestionTags({ ...base, objectiveIds: { "saa-c03": ["4.4"] } }));
});
