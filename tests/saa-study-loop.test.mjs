import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseProgress } from "../lib/progress.ts";
import { nextSaaQuestionIds, saaDomainSummary, saaNextSession } from "../lib/saa-study-loop.ts";
import { SAA_CONTRAST_DELAY, SAA_CONTRAST_GROUPS, saaContrastHistory, saaContrastTarget, saaMockDebrief } from "../lib/saa-contrast.ts";

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


test("next session distinguishes missing and limited evidence", () => {
  assert.equal(saaNextSession([]).kind, "empty");
  const one = { id: "1.0", title: "One", correct: 0, answered: 1, percent: 0, sittings: 1, weak: true };
  assert.equal(saaNextSession([one]).kind, "limited");
});

test("next session selects the lowest supported domain deterministically", () => {
  const limited = { id: "1.0", title: "One", correct: 0, answered: 1, percent: 0, sittings: 1, weak: true };
  const supported = { id: "2.0", title: "Two", correct: 3, answered: 5, percent: 60, sittings: 1, weak: true };
  assert.deepEqual(saaNextSession([limited, supported]), { kind: "review", domain: supported });
  assert.deepEqual(saaNextSession([supported, limited]), { kind: "review", domain: supported });
  const strong = { ...supported, correct: 5, percent: 100, weak: false };
  assert.equal(saaNextSession([strong]).kind, "practice");
});

test("authored contrast drills reuse valid SAA questions and prefer a different decision", () => {
  const ids = Object.values(SAA_CONTRAST_GROUPS).flatMap((group) => Object.values(group).flat());
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(saa.some((question) => question.id === id), id);
  const seen = new Set(["q-saa-practice-19", "q-saa-costbatch-013"]);
  assert.equal(saaContrastTarget("q-saa-practice-19", questions, new Set(), seen), "q-saa-core-23");
  assert.equal(saaContrastTarget("q-saa-practice-25", questions, new Set(), new Set()), "q-saa-chapter-19");
  assert.equal(saaContrastTarget("q-aws-review-saa-c03-4-4", questions, new Set(), new Set()), "q-aws-found-19");
  assert.equal(saaContrastTarget("q-saa-practice-19", [{ ...saa.find((q) => q.id === "q-saa-core-23"), examCodes: ["clf-c02"] }], new Set(), new Set()), undefined);
  assert.equal(saaContrastTarget("q-saa-practice-19", questions, new Set(ids), seen), undefined);
});

function contrastAttempt(at, id, { correct = false, ...metadata } = {}) {
  return { exam: "saa-c03", at, questionIds: [id], wrongChoices: correct ? {} : { [id]: 1 }, missedIds: correct ? [] : [id], ...metadata };
}

test("a saved miss produces a fresh delayed check even after a successful immediate drill", () => {
  const start = 1_000;
  const dueAt = start + SAA_CONTRAST_DELAY;
  const source = contrastAttempt(start, "q-saa-practice-19");
  const retry = contrastAttempt(start + 60, "q-saa-costbatch-013", { correct: true, mode: "contrast" });
  const mirror = { ...source, topicId: "exam-test:saa-c03" };
  assert.deepEqual(saaContrastHistory([retry, mirror, source], dueAt - 1, questions).due, []);
  const due = saaContrastHistory([retry, mirror, source], dueAt, questions);
  assert.deepEqual(due.due, [{ group: "database", id: "q-saa-core-23" }]);
  assert.deepEqual(due.counts.first, { correct: 0, answered: 1 });
  assert.deepEqual(due.counts.contrast, { correct: 1, answered: 1 });

  const checked = contrastAttempt(dueAt, due.due[0].id, { correct: true, mode: "delayed" });
  const repeated = { ...checked, at: dueAt + 1 };
  const after = saaContrastHistory([checked, retry, source, repeated], dueAt + 1, questions);
  assert.deepEqual(after.due, []);
  assert.deepEqual(after.counts.delayed, { correct: 1, answered: 1 });
});

test("a delayed miss restarts the window; unanswered and exhausted questions are not recycled", () => {
  const start = 1_000;
  const dueAt = start + SAA_CONTRAST_DELAY;
  const source = contrastAttempt(start, "q-aws-review-saa-c03-4-4");
  const failedCheck = contrastAttempt(dueAt, "q-aws-found-19", { mode: "delayed" });
  const unanswered = { ...contrastAttempt(start, "q-saa-bank-016"), correctIds: [], wrongChoices: {} };
  const attempts = [source, failedCheck, unanswered];
  assert.deepEqual(saaContrastHistory(attempts, dueAt, questions).due, []);
  const after = saaContrastHistory(attempts, dueAt + SAA_CONTRAST_DELAY, questions);
  assert.deepEqual(after.due, [{ group: "egress", id: "q-aws-review-saa-c03-1-2" }]);
  assert.deepEqual(after.counts.delayed, { correct: 0, answered: 1 });
  assert.deepEqual(after.counts.first, { correct: 0, answered: 1 });
  assert.deepEqual(saaContrastHistory(attempts, dueAt + SAA_CONTRAST_DELAY, questions.filter((q) => q.id !== "q-aws-review-saa-c03-1-2" && q.id !== "q-saa-guide-06")).due, []);
});

test("mock debrief distinguishes exposure, wrong answers, uncertain correct answers and blanks", () => {
  const rows = [
    { id: "seen", objectiveId: "2.1", answered: true, correct: false, confidence: "sure" },
    { id: "new-a", objectiveId: "2.1", answered: true, correct: false },
    { id: "new-b", objectiveId: "1.1", answered: true, correct: true, confidence: "unsure" },
    { id: "blank", objectiveId: "3.1", answered: false, correct: false, confidence: "sure" },
  ];
  assert.deepEqual(saaMockDebrief(rows, new Set(["seen"])), {
    fresh: 3, unanswered: 1, confidentMisses: 1, uncertainCorrect: 1, priorities: [["2.1", 2]],
  });
});

test("all SAA contrast messages have the same keys and interpolation arguments", () => {
  function leaves(messages, result = {}, prefix = "") {
    for (const [key, val] of Object.entries(messages)) {
      if (typeof val === "string") result[prefix + key] = [...val.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
      else leaves(val, result, prefix + key + ".");
    }
    return result;
  }
  const read = (locale) => JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")).saaContrast;
  for (const locale of ["es", "fr", "pt"]) assert.deepEqual(leaves(read(locale)), leaves(read("en")), locale);
});


test("the saved progress parser preserves both contrast review modes", () => {
  const quizAttempts = ["contrast", "delayed"].map((mode, i) => ({
    topicId: "all", exam: "saa-c03", mode, correct: 1, total: 1, missedIds: [], at: i + 1,
  }));
  const { progress, problems } = parseProgress(JSON.stringify({ ...parseProgress(null).progress, quizAttempts }));
  assert.deepEqual(problems, []);
  assert.deepEqual(progress.quizAttempts.map(({ mode }) => mode), ["contrast", "delayed"]);
});
