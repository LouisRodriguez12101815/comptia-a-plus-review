import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  EXAM_FORMATS,
  MIXED_PRACTICE_QUESTION_COUNT,
  allocateByWeight,
  buildExamPool,
  draftTest,
  freshFirstIds,
  gradeTest,
  isCorrect,
  mulberry32,
  questionsForLength,
} from "../lib/exam-test.mjs";

const read = (file) => JSON.parse(readFileSync(new URL(`../content/${file}.json`, import.meta.url)));
const objectives = read("objectives");
const questions = read("questions");
const topics = [...read("topics"), ...read("topics-network-plus")];

const clfPool = buildExamPool({ objectives, questions, topics, examCode: "clf-c02" });
const n10Pool = buildExamPool({ objectives, questions, topics, examCode: "n10-009" });

test("CLF mixed practice drafts exactly 20 unique questions across all four domains", () => {
  assert.equal(MIXED_PRACTICE_QUESTION_COUNT, 20);
  assert.ok(clfPool.totalUnique >= 20);
  assert.deepEqual(allocateByWeight(clfPool.domains, 20), { "1.0": 5, "2.0": 6, "3.0": 7, "4.0": 2 });
  const draft = draftTest(clfPool, MIXED_PRACTICE_QUESTION_COUNT, mulberry32(20));
  assert.equal(draft.length, 20);
  assert.equal(new Set(draft.map((pick) => pick.questionId)).size, 20);
  assert.deepEqual(new Set(draft.map((pick) => pick.domainId)), new Set(["1.0", "2.0", "3.0", "4.0"]));
  assert.ok(draft.every((pick) => clfPool.domains.some((domain) => domain.id === pick.domainId && domain.objectives.some((objective) => objective.id === pick.objectiveId && objective.questionIds.includes(pick.questionId)))));
});

test("CLF mixed practice prioritizes unseen IDs and then older history", () => {
  const all = clfPool.domains.flatMap((domain) => domain.objectives.flatMap((objective) => objective.questionIds));
  const history = all.slice(0, 40);
  const historicalMiss = history[0];
  const ordered = freshFirstIds(all, history, mulberry32(2));
  assert.ok(ordered.slice(0, all.length - history.length).every((id) => !history.includes(id)));
  const draft = draftTest(clfPool, 20, mulberry32(8), { history });
  assert.equal(new Set(draft.map((pick) => pick.questionId)).size, 20);
  assert.ok(draft.some((pick) => !history.includes(pick.questionId)), "unseen questions should be used before history is exhausted");
  assert.equal(history[0], historicalMiss, "selection must not rewrite retained history");
});

test("CLF mixed practice preserves single and multiple response correctness", () => {
  const single = questions.find((question) => question.examCodes?.includes("clf-c02") && !Array.isArray(question.answer));
  const multi = questions.find((question) => question.examCodes?.includes("clf-c02") && Array.isArray(question.answer));
  assert.ok(single && multi);
  assert.equal(isCorrect(single, single.answer), true);
  assert.equal(isCorrect(single, (single.answer + 1) % single.choices.length), false);
  assert.equal(isCorrect(multi, multi.answer), true);
  assert.equal(isCorrect(multi, [multi.answer[0]]), false);
});

test("CLF mixed practice results grade correct and missed answers without fabrication", () => {
  const draft = draftTest(clfPool, 20, mulberry32(12));
  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));
  const responses = Object.fromEntries(draft.map((pick, index) => [pick.questionId, { answer: index === 0 ? undefined : questionsById[pick.questionId].answer, timedOut: index === 0 }]));
  const result = gradeTest({ pool: clfPool, picks: draft, questionsById, responses });
  assert.equal(result.total, 20);
  assert.equal(result.correct, 19);
  assert.equal(result.percent, 95);
  assert.equal(result.domains.reduce((sum, domain) => sum + domain.total, 0), 20);
  assert.equal(result.domains.reduce((sum, domain) => sum + domain.correct, 0), 19);
});

test("existing full, half, and quick lengths remain unchanged", () => {
  assert.equal(questionsForLength("clf-c02", "full"), EXAM_FORMATS["clf-c02"].maxQuestions);
  assert.equal(questionsForLength("clf-c02", "half"), 33);
  assert.equal(questionsForLength("clf-c02", "quick"), 15);
});

test("Network+ pool remains isolated from CLF mixed practice", () => {
  const draft = draftTest(n10Pool, 20, mulberry32(13));
  const byId = new Map(questions.map((question) => [question.id, question]));
  const topicCodes = new Map(topics.map((topic) => [topic.id, topic.examCodes]));
  const codesFor = (pick) => byId.get(pick.questionId)?.examCodes ?? topicCodes.get(byId.get(pick.questionId)?.topicId) ?? [];
  assert.ok(draft.every((pick) => codesFor(pick).includes("n10-009")));
  assert.ok(draft.every((pick) => !codesFor(pick).includes("clf-c02")));
});

