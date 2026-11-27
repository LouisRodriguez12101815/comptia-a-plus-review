import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { questions, topics } from "../lib/content.ts";
import { buildExamPool } from "../lib/exam-test.mjs";
import { domainQuizzes, getDomainQuiz } from "../lib/domain-quiz.ts";

test("SAA domain practice follows the exam and does not replace Network+", () => {
  const network = getDomainQuiz("1.0");
  const saa = getDomainQuiz("1.0", "saa-c03");
  assert.equal(network.title, "Networking concepts");
  assert.equal(saa.title, "Design Secure Architectures");
  assert.notDeepEqual(network.questionIds, saa.questionIds);
  assert.ok(network.questionIds.length > 0);
  assert.ok(saa.questionIds.length > 0);
  assert.equal(domainQuizzes("220-1201").length, 0);

  const page = readFileSync(new URL("../app/[locale]/quiz/page.tsx", import.meta.url), "utf8");
  assert.match(page, /examParam === "saa-c03" \? "saa-c03"/);
  assert.match(page, /examParam === "n10-009" \|\| examParam === undefined \? "n10-009"/);
});

test("all SAA domain quizzes contain exactly the questions eligible for that mock domain", () => {
  const objectives = JSON.parse(readFileSync(new URL("../content/objectives.json", import.meta.url), "utf8"));
  const exam = objectives.exams.find(({ code }) => code === "saa-c03");
  const pool = buildExamPool({ objectives, questions, topics, examCode: exam.code });
  const byId = new Map(questions.map((question) => [question.id, question]));
  const quizzes = domainQuizzes(exam.code);

  assert.deepEqual(quizzes.map(({ id, weight }) => ({ id, weight })), [
    { id: "1.0", weight: 30 }, { id: "2.0", weight: 26 },
    { id: "3.0", weight: 24 }, { id: "4.0", weight: 20 },
  ]);
  for (const quiz of quizzes) {
    const definition = exam.domains.find(({ id }) => id === quiz.id);
    const taskIds = new Set(definition.objectives.map(({ id }) => id));
    for (const id of quiz.questionIds) {
      assert.ok(byId.get(id)?.objectiveIds?.[exam.code]?.some((task) => taskIds.has(task)), `${id} is outside domain ${quiz.id}`);
    }
    assert.equal(new Set(quiz.questionIds).size, quiz.questionIds.length);
    const eligible = pool.domains.find(({ id }) => id === quiz.id).objectives.flatMap(({ questionIds }) => questionIds);
    assert.deepEqual(new Set(quiz.questionIds), new Set(eligible));
  }

  // A shared topic does not move a storage-design question into cost optimization.
  assert.ok(getDomainQuiz("3.0", exam.code).questionIds.includes("q-saa-core-10"));
  assert.ok(!getDomainQuiz("4.0", exam.code).questionIds.includes("q-saa-core-10"));
});
