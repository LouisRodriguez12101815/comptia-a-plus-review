import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildExamPool, draftTest } from "../lib/exam-test.mjs";
import { isCorrect } from "../lib/exam-test.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const questions = read("questions");
const objectives = read("objectives");
const topics = [...read("topics"), ...read("topics-network-plus")];
const topicById = new Map(topics.map((topic) => [topic.id, topic]));
const clfQuestions = questions.filter((question) => question.examCodes?.includes("clf-c02"));
const newIds = [
  "q-clf31-15", "q-clf31-16", "q-clf32-15", "q-clf32-16",
  "q-clf33-15", "q-clf33-16", "q-clf34-15", "q-clf34-16",
  "q-clf35-15", "q-clf35-16", "q-clf36-15", "q-clf36-16",
];

test("technology-service additions are explicitly mapped to CLF-C02 objectives", () => {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const expected = Object.fromEntries(newIds.map((id) => [id, `3.${id[6]}`]));
  for (const [id, objective] of Object.entries(expected)) {
    const question = byId.get(id);
    assert.ok(question, `${id} exists`);
    assert.deepEqual(question.objectiveIds?.["clf-c02"], [objective]);
    assert.equal(question.examCodes.includes("n10-009"), false);
    assert.ok(topicById.has(question.topicId), `${id} topic resolves`);
    assert.ok(question.sourceUrls?.every((url) => /^https:\/\//.test(url)), `${id} uses HTTPS sources`);
  }
});

test("CLF technology objectives have distinct, answerable questions", () => {
  const counts = Object.fromEntries(["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"].map((id) => [id, 0]));
  const prompts = new Map();
  for (const question of clfQuestions) {
    const objectiveIds = question.objectiveIds?.["clf-c02"] ?? [];
    for (const objectiveId of objectiveIds) if (objectiveId in counts) counts[objectiveId] += 1;
    const normalized = question.prompt.trim().toLowerCase().replace(/\s+/g, " ");
    assert.equal(prompts.has(normalized), false, `duplicate CLF prompt: ${question.prompt}`);
    prompts.set(normalized, question.id);
    const answer = Array.isArray(question.answer) ? question.answer : [question.answer];
    assert.ok(answer.length > 0 && answer.every((index) => Number.isInteger(index) && index >= 0 && index < question.choices.length), `${question.id} answer indices are valid`);
    assert.ok(question.explanation?.trim(), `${question.id} has feedback explanation`);
  }
  for (const objectiveId of Object.keys(counts)) assert.ok(counts[objectiveId] >= 16, `${objectiveId} has sufficient practice coverage`);
});

test("domain drafting stays CLF-only and objective-scoped", () => {
  const pool = buildExamPool({ objectives, questions, topics, examCode: "clf-c02" });
  const domain = pool.domains.find((item) => item.id === "3.0");
  assert.ok(domain);
  const focused = { ...pool, domains: [domain], totalUnique: domain.available };
  const picks = draftTest(focused, Math.min(20, domain.available), () => 0.41);
  assert.ok(picks.length > 0);
  assert.ok(picks.every((pick) => pick.domainId === "3.0"));
  assert.ok(picks.every((pick) => domain.objectives.some((objective) => objective.id === pick.objectiveId && objective.questionIds.includes(pick.questionId))));
  const network = buildExamPool({ objectives, questions, topics, examCode: "n10-009" });
  const networkIds = new Set(network.domains.flatMap((item) => item.objectives.flatMap((objective) => objective.questionIds)));
  assert.ok(picks.every((pick) => !networkIds.has(pick.questionId)));
});

test("feedback grading preserves single and multiple-response semantics", () => {
  const single = { choices: ["wrong", "right"], answer: 1 };
  const multi = { choices: ["one", "two", "three"], answer: [0, 2] };
  assert.equal(isCorrect(single, 1), true);
  assert.equal(isCorrect(single, 0), false);
  assert.equal(isCorrect(multi, [2, 0]), true);
  assert.equal(isCorrect(multi, [0]), false);
  assert.equal(isCorrect(multi, [0, 1]), false);
});
