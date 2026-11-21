import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flashcards, questions as servedQuestions, topics } from "../lib/content.ts";
import { drillItem, pairSourcesFor, resolvedPairs, studyRecord, studyRecords } from "../lib/study/records.ts";
import { cardsForQuestion, clozeForCard, termMatches } from "../lib/study/memory.ts";
import { displayBox, reviewCard } from "../lib/study/schedule.ts";
import { dueReviews } from "../lib/weakness.ts";

const objectives = JSON.parse(readFileSync(new URL("../content/objectives.json", import.meta.url), "utf8"));
const pairFile = readFileSync(new URL("../content/study-pairs.json", import.meta.url), "utf8");
const examOf = (card) => card.examCodes ?? topics.find((topic) => topic.id === card.topicId)?.examCodes ?? [];
const copiedCues = [
  "Stateful resource-level network filtering",
  "Stateless subnet-level allow and deny rules",
  "Buffer bursty asynchronous work",
  "Maximum acceptable recovery duration",
  "Maximum acceptable data-loss window",
  "Cache content close to global users",
  "Improve global path to regional TCP/UDP endpoints",
  "Real-time streaming records with custom consumers",
  "Managed delivery of streaming data to S3",
  "Discounted spare EC2 capacity for interruption-tolerant batch work",
  "Predictable steady compute commitment",
  "Dedicated private connectivity from on-premises to AWS",
];

test("comparison pairs link existing drill items and add only the six missing contrasts", () => {
  const pairs = pairSourcesFor("saa-c03");
  assert.equal(pairs.length, 33);
  const linked = pairs.filter((pair) => !pair.difference);
  const written = pairs.filter((pair) => pair.difference);
  assert.equal(linked.length, 5);
  assert.equal(written.length, 28);
  for (const id of ["pair-boundary-scp", "pair-role-user", "pair-nat-gateway-endpoint"]) {
    assert.ok(written.some((pair) => pair.id === id), id);
  }
  for (const cue of copiedCues) assert.equal(pairFile.includes(cue), false, cue);
  for (const pair of pairs) {
    assert.ok(pair.docsUrl.startsWith("https://"), pair.id);
    assert.ok(pair.questionIds.length >= 2, pair.id);
    assert.ok(pair.sides.length >= 2, pair.id);
    for (const id of pair.questionIds) {
      const question = servedQuestions.find((item) => item.id === id);
      assert.ok(question?.examCodes?.includes("saa-c03"), `${pair.id} ${id}`);
    }
    const resolved = resolvedPairs("saa-c03").find((item) => item.id === pair.id);
    for (const side of resolved.sides) {
      assert.ok(side.label.length > 0, pair.id);
      assert.ok(side.pickWhen.length > 0, pair.id);
    }
    if (!pair.difference) {
      assert.ok(pair.sides.every((side) => side.ref && !side.label && !side.pickWhen), pair.id);
    }
  }
  const spot = pairs.find((pair) => pair.id === "pair-ri-savings-spot");
  assert.ok(spot.sides.some((side) => side.ref === "aws-saa-service-compare/spot"));
  assert.ok(spot.sides.some((side) => side.ref === "aws-saa-cost-cues/steady"));
  assert.equal(drillItem("aws-saa-resilient-cues/buffer").fields.answer, "Amazon SQS");
  assert.equal(drillItem("aws-saa-service-compare/directconnect").fields.answer, "AWS Direct Connect");
});

test("one study record per id, with card, pair, and game-item variants", () => {
  const records = studyRecords();
  const ids = records.map((record) => record.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(records.filter((record) => record.kind === "card" && record.exam === "saa-c03").length, 145);
  assert.equal(records.filter((record) => record.kind === "pair").length, 33);
  assert.equal(records.some((record) => record.id === "fc-saa-nat-gw"), false);
  assert.ok(records.some((record) => record.kind === "game-item" && record.id === "aws-saa-service-compare/spot"));
  const card = studyRecord("fc-aws-iam-role");
  assert.equal(card.kind, "card");
  assert.equal(card.taskId, "1.1");
  assert.equal(card.docsUrl.startsWith("https://"), true);
  assert.ok(card.questionIds.length > 0);
});

test("type, cloze, and the exam switch work for the existing CLF deck", () => {
  const clf = flashcards.filter((card) => examOf(card).includes("clf-c02"));
  assert.equal(clf.length, 287);
  for (const card of clf) {
    assert.equal(termMatches(card.front, card), true, card.id);
    assert.equal(termMatches("not the term", card), false, card.id);
    const cloze = clozeForCard(card);
    assert.match(cloze.prompt, /_____/);
    assert.ok(cloze.answer.length > 0, card.id);
  }
  const alias = flashcards.find((card) => card.id === "fc-saa-acm");
  assert.equal(termMatches("ACM", alias), true);
  const exam = objectives.exams.find((item) => item.code === "clf-c02");
  const security = exam.domains.find((domain) => domain.id === "2.0");
  assert.equal(security.weight, 30);
  const topicIds = new Set(security.objectives.flatMap((objective) => objective.topics));
  const domainCards = clf.filter((card) => topicIds.has(card.topicId));
  assert.equal(domainCards.length, 58);
});

test("a missed question selects cards by its SAA task and does not enter due reviews", () => {
  const cards = cardsForQuestion("q-aws-found-20");
  assert.ok(cards.length > 0);
  assert.ok(cards.every((card) => card.taskId === "1.2"));
  assert.equal(cardsForQuestion("q-01").length, 0);
  const now = new Date("2026-11-20T12:00:00Z");
  const again = reviewCard(undefined, "again", now);
  const hard = reviewCard(again, "hard", now);
  const good = reviewCard(hard, "good", now);
  const easy = reviewCard(good, "easy", now);
  assert.ok(easy.due);
  assert.equal(displayBox(undefined), 1);
  assert.ok(displayBox(easy) >= 1);
  assert.deepEqual(dueReviews([], "saa-c03", now.getTime()), []);
});
