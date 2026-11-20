import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
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
