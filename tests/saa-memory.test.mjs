import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flashcards, questions as servedQuestions, topics } from "../lib/content.ts";
import { drillItem, pairSourcesFor, resolvedPairs, sampleMatchRound, studyRecord, studyRecords } from "../lib/study/records.ts";
import { cardsForQuestion, clozeForCard, termMatches } from "../lib/study/memory.ts";
import { displayBox, reviewCard } from "../lib/study/schedule.ts";
import { labelEchoWords, normalizedLabelSet } from "../scripts/lib/answer-cues.mjs";
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
  // Match batch 1 adds 50 contrasts. Match batch 2 adds 50 more. 33 original pairs remain, so the catalog is 133.
  assert.equal(pairs.length, 133);
  const linked = pairs.filter((pair) => !pair.difference);
  const written = pairs.filter((pair) => pair.difference);
  assert.equal(linked.length, 5);
  assert.equal(written.length, 128);
  for (const id of ["pair-boundary-scp", "pair-role-user", "pair-nat-gateway-endpoint"]) {
    assert.ok(written.some((pair) => pair.id === id), id);
  }
  for (const cue of copiedCues) assert.equal(pairFile.includes(cue), false, cue);
  for (const pair of pairs) {
    assert.ok(pair.docsUrl.startsWith("https://"), pair.id);
    assert.ok(Array.isArray(pair.questionIds), pair.id);
    // Match batch 1 and match batch 2 may leave questionIds empty when no question tests that exact distinction.
    if (!pair.id.startsWith("pair-m1-") && !pair.id.startsWith("pair-m2-")) assert.ok(pair.questionIds.length >= 2, pair.id);
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

test("resolved side labels are unique across the catalog", () => {
  const pairs = resolvedPairs("saa-c03");
  const seen = new Map();
  for (const pair of pairs) {
    const key = normalizedLabelSet(pair.sides.map((side) => side.label));
    const prior = seen.get(key);
    assert.equal(prior, undefined, `${pair.id} repeats the side labels of ${prior}`);
    seen.set(key, pair.id);
    for (const side of pair.sides) {
      assert.ok(side.label.length > 0, pair.id);
      assert.ok(side.pickWhen.length > 0, pair.id);
    }
  }
  assert.equal(pairSourcesFor("saa-c03").filter((pair) => pair.id.startsWith("pair-m1-")).length, 50);
  // Match batch 2.
  assert.equal(pairSourcesFor("saa-c03").filter((pair) => pair.id.startsWith("pair-m2-")).length, 50);
  assert.deepEqual(pairSourcesFor("saa-c03").find((pair) => pair.id === "pair-m1-06").services, ["Amazon VPC"]);
});

test("a flashcard match round stays at 20 and prefers weak tasks", () => {
  const pairs = pairSourcesFor("saa-c03");
  const round = sampleMatchRound(pairs, ["4.3"], 7);
  assert.equal(round.length, 20);
  assert.equal(new Set(round.map((pair) => pair.id)).size, 20);
  assert.equal(sampleMatchRound(pairs, ["4.3"], 7).map((pair) => pair.id).join(), round.map((pair) => pair.id).join());
  const oneTask = pairs.filter((pair) => pair.taskId === "2.1");
  assert.ok(oneTask.length < 20);
  assert.equal(sampleMatchRound(oneTask, [], 3).length, oneTask.length);
  assert.ok(sampleMatchRound(oneTask, [], 3).every((pair) => pair.taskId === "2.1"));
  assert.equal(round[0].taskId, "4.3");
  const small = pairs.filter((pair) => pair.taskId === "3.5");
  assert.equal(sampleMatchRound(small, [], 1).length, small.length);
  assert.equal(round.filter((pair) => pair.taskId === "4.3").length >= 1, true);
});

test("match batch 1 and match batch 2 cues stay parallel and are not copied from questions", () => {
  const questions = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));
  const grams = (text, size) => {
    const words = String(text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
    const found = [];
    for (let index = 0; index + size <= words.length; index += 1) found.push(words.slice(index, index + size).join(" "));
    return found;
  };
  const bank = new Set();
  for (const question of questions) {
    const blob = [question.prompt, ...(question.choices ?? []), question.explanation].filter(Boolean).join("\n");
    for (const gram of grams(blob, 6)) bank.add(gram);
  }
  const giveaway = /\b(instead of|rather than|because)\b|\b(?:and|with|but) no\b|\bdoes not\b|\bis not\b/i;
  for (const pair of pairSourcesFor("saa-c03").filter((item) => item.id.startsWith("pair-m1-") || item.id.startsWith("pair-m2-"))) {
    const lengths = pair.sides.map((side) => side.pickWhen.length);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    assert.ok(longest <= shortest * 1.5, `${pair.id} ${lengths.join("/")}`);
    for (const side of pair.sides) assert.equal(giveaway.test(side.pickWhen), false, `${pair.id} ${side.pickWhen}`);
    for (const text of [pair.difference, ...pair.sides.map((side) => side.pickWhen)]) {
      for (const gram of grams(text, 6)) assert.equal(bank.has(gram), false, `${pair.id} ${gram}`);
    }
    assert.deepEqual(labelEchoWords(pair.sides), [], pair.id);
  }
  const catalogEchoes = resolvedPairs("saa-c03").flatMap((pair) => labelEchoWords(pair.sides).map((hit) => pair.id + " " + hit.label));
  assert.deepEqual(catalogEchoes, []);
});

test("one study record per id, with card, pair, and game-item variants", () => {
  const records = studyRecords();
  const ids = records.map((record) => record.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(records.filter((record) => record.kind === "card" && record.exam === "saa-c03").length, 150);
  // Match batch 2 brings the pair catalog to 133.
  assert.equal(records.filter((record) => record.kind === "pair").length, 133);
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
