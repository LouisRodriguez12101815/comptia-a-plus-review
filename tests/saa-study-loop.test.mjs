import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nextSaaQuestionIds, saaDomainSummary } from "../lib/saa-study-loop.ts";

const questions = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));
const objectives = JSON.parse(readFileSync(new URL("../content/objectives.json", import.meta.url), "utf8"));
const domains = objectives.exams.find((exam) => exam.code === "saa-c03").domains.map((domain) => ({
  id: domain.id,
  title: domain.title,
}));
const saa = questions.filter((question) => question.examCodes?.includes("saa-c03"));

function task(id) {
  return saa.filter((question) => question.objectiveIds["saa-c03"][0] === id);
}

test("an abandoned quiz does not raise a domain percent", () => {
  const domainOne = saa.filter((question) => question.objectiveIds["saa-c03"][0].startsWith("1."));
  const shown = domainOne.slice(0, 4).map((question) => question.id);
  const abandoned = { exam: "saa-c03", at: 1, questionIds: shown, missedIds: [] };
  assert.equal(saaDomainSummary([abandoned], questions, domains).length, 0);

  const target = shown[0];
  const wrong = {
    exam: "saa-c03",
    at: 2,
    questionIds: [target],
    missedIds: [target],
    wrongChoices: { [target]: 1 },
  };
  const [domain] = saaDomainSummary([abandoned, wrong], questions, domains);
  assert.equal(domain.id, "1.0");
  assert.equal(domain.answered, 1);
  assert.equal(domain.correct, 0);
  assert.equal(domain.percent, 0);
  assert.equal(domain.sittings, 1);
});

test("next questions come from the weakest tasks, misses before unseen", () => {
  const task12 = task("1.2").map((question) => question.id).sort();
  const task11 = task("1.1").map((question) => question.id).sort();
  const missed12 = task12.slice(0, 2);
  const missed11 = task11[0];
  const correct11 = task11[1];
  const strong = task("2.1")[0].id;
  const attempt = {
    exam: "saa-c03",
    at: 3,
    questionIds: [...missed12, missed11, correct11, strong],
    missedIds: [...missed12, missed11],
    wrongChoices: Object.fromEntries([...missed12, missed11].map((id) => [id, 0])),
  };
  const next = nextSaaQuestionIds([attempt], questions, domains);
  assert.deepEqual(next.slice(0, 3), [...missed12, missed11]);
  assert.equal(next.includes(correct11), false);
  assert.equal(next.includes(strong), false);
  assert.equal(next.length, 10);
  const unseen12 = task12.filter((id) => !missed12.includes(id));
  assert.deepEqual(next.slice(3, 3 + Math.min(7, unseen12.length)), unseen12.slice(0, 7));
});

test("next questions are sure-but-wrong, other wrong, lucky guesses, then unseen", () => {
  const ids = task("1.2").map((question) => question.id).sort();
  const [sure, wrong, lucky, unseen] = ids;
  const attempt = {
    exam: "saa-c03",
    at: 1,
    questionIds: [sure, wrong, lucky],
    missedIds: [sure, wrong],
    wrongChoices: { [sure]: 0, [wrong]: 1 },
    luckyIds: [lucky],
    sureIds: [sure],
    confidenceByQuestion: { [sure]: "sure", [lucky]: "guess" },
  };
  const next = nextSaaQuestionIds([attempt], questions, domains);
  assert.deepEqual(next.slice(0, 4), [sure, wrong, lucky, unseen]);
});

test("the domain percent counts only answered questions and a lucky guess stays correct", () => {
  const ids = task("1.2").map((question) => question.id).sort();
  const [lucky, unanswered] = ids;
  const sitting = {
    exam: "saa-c03",
    at: 4,
    questionIds: [lucky, unanswered],
    missedIds: [unanswered],
    luckyIds: [lucky],
    confidenceByQuestion: { [lucky]: "guess" },
  };
  const [domain] = saaDomainSummary([sitting], questions, domains);
  assert.equal(domain.answered, 1);
  assert.equal(domain.correct, 1);
  assert.equal(domain.percent, 100);

  const wrong = ids[2];
  const mixed = {
    exam: "saa-c03",
    at: 5,
    questionIds: [wrong, lucky, unanswered],
    missedIds: [wrong, unanswered],
    wrongChoices: { [wrong]: 0 },
    luckyIds: [lucky],
  };
  const [mixedDomain] = saaDomainSummary([mixed], questions, domains);
  assert.equal(mixedDomain.answered, 2);
  assert.equal(mixedDomain.correct, 1);
  assert.equal(mixedDomain.percent, 50);
});
