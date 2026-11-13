import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildExamPool, draftTest } from "../lib/exam-test.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const objectives = read("objectives");
const questions = read("questions");
const topics = [...read("topics"), ...read("topics-network-plus")];
const pool = buildExamPool({ objectives, questions, topics, examCode: "clf-c02" });

test("CLF-C02 uses the four official domains and weights", () => {
  assert.deepEqual(pool.domains.map(({ id, title, weight }) => ({ id, title, weight })), [
    { id: "1.0", title: "Cloud Concepts", weight: 24 },
    { id: "2.0", title: "Security and Compliance", weight: 30 },
    { id: "3.0", title: "Cloud Technology and Services", weight: 34 },
    { id: "4.0", title: "Billing, Pricing, and Support", weight: 12 },
  ]);
});

test("a focused domain draft contains no questions from another domain", () => {
  const domain = pool.domains.find((item) => item.id === "2.0");
  assert.ok(domain);
  const focused = { ...pool, domains: [domain], totalUnique: domain.available };
  const picks = draftTest(focused, Math.min(10, domain.available), () => 0.25);
  assert.ok(picks.length > 0);
  assert.ok(picks.every((pick) => pick.domainId === "2.0"));
  assert.ok(picks.every((pick) => domain.objectives.some((objective) => objective.id === pick.objectiveId && objective.questionIds.includes(pick.questionId))));
});

test("AWS mixed practice remains separate from Network+", () => {
  const networkPool = buildExamPool({ objectives, questions, topics, examCode: "n10-009" });
  const mixedIds = new Set(pool.domains.flatMap((domain) => domain.objectives.flatMap((objective) => objective.questionIds)));
  const networkIds = networkPool.domains.flatMap((domain) => domain.objectives.flatMap((objective) => objective.questionIds));
  assert.ok(networkIds.some((id) => !mixedIds.has(id)));
});
