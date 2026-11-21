import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { qualifierTwins } from "../content/saa-qualifier-twins.ts";
import { flashcards, questions } from "../lib/content.ts";
import { drillDecks } from "../lib/practice/drills.ts";
import { assertSaaCardTags, assertSaaQuestionTags } from "../lib/saa-tags.ts";
import { highYieldClusterCounts } from "../lib/saa-test-skills.ts";

const fill = JSON.parse(readFileSync(new URL("../content/saa-high-yield-fill.json", import.meta.url), "utf8"));
const bank = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));
const cards = JSON.parse(readFileSync(new URL("../content/flashcards.json", import.meta.url), "utf8"));
const pairs = JSON.parse(readFileSync(new URL("../content/study-pairs.json", import.meta.url), "utf8"));
const objectives = JSON.parse(readFileSync(new URL("../content/objectives.json", import.meta.url), "utf8"));
const tasks = new Set(objectives.exams.find((exam) => exam.code === "saa-c03").domains.flatMap((domain) => domain.objectives.map((objective) => objective.id)));

const questionIds = [
  "q-saa-hy-mgn-01", "q-saa-hy-transfer-01", "q-saa-hy-dms-sct-01", "q-saa-hy-snow-01",
  "q-saa-hy-quicksight-01", "q-saa-hy-emr-01", "q-saa-hy-opensearch-01",
  "q-saa-hy-s3-bpa-01", "q-saa-hy-s3-presign-01", "q-saa-hy-s3-ap-01",
  "q-saa-hy-ddb-streams-01", "q-saa-hy-ddb-ttl-01", "q-saa-hy-sqs-dlq-01",
  "q-saa-hy-aurora-sv2-01", "q-saa-hy-aurora-global-01", "q-saa-hy-backup-01",
];
const cardIds = [
  "fc-saa-hy-elb-compare", "fc-saa-hy-asg-lifecycle", "fc-saa-hy-lambda-concurrency", "fc-saa-hy-lambda-vpc",
  "fc-saa-hy-apigw", "fc-saa-hy-step-functions", "fc-saa-hy-parameter-store", "fc-saa-hy-kms-key-policy",
  "fc-saa-hy-mgn", "fc-saa-hy-dms-sct", "fc-saa-hy-trusted-advisor", "fc-saa-hy-control-tower",
  "fc-saa-hy-athena", "fc-saa-hy-glue", "fc-saa-hy-lake-formation", "fc-saa-hy-quicksight",
  "fc-saa-hy-s3-bpa", "fc-saa-hy-s3-presign", "fc-saa-hy-s3-ap", "fc-saa-hy-ddb-streams", "fc-saa-hy-ddb-ttl",
  "fc-saa-hy-sqs-dlq", "fc-saa-hy-aurora-sv2", "fc-saa-hy-aurora-global", "fc-saa-hy-backup",
];
const drillIds = ["hy-dms", "hy-datasync", "hy-cloudwatch", "hy-trusted-advisor", "hy-organizations"];

function norm(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("the high-yield fill is the approved 16 questions, 25 cards, and 5 drills", () => {
  assert.deepEqual(fill.questions.map((question) => question.id), questionIds);
  assert.deepEqual(fill.cards.map((card) => card.id), cardIds);
  assert.deepEqual(fill.drills.map((deck) => deck.id), drillIds);
  assert.equal(new Set(questionIds).size, 16);
  assert.equal(new Set(cardIds).size, 25);
  for (const id of questionIds) assert.equal(questions.some((question) => question.id === id), true, id);
  for (const id of cardIds) assert.equal(flashcards.some((card) => card.id === id), true, id);
  for (const id of drillIds) {
    const deck = drillDecks.find((item) => item.id === id);
    assert.ok(deck, id);
    assert.equal(deck.exam, "saa-c03");
    assert.ok(deck.items.length >= 6, id);
    assert.equal(new Set(deck.items.map((item) => item.fields.cue)).size, deck.items.length, id);
    assert.equal(new Set(deck.items.map((item) => item.fields.answer)).size, deck.items.length, id);
  }
});

test("each new question has an audit entry, a docs URL, a legal task, and a why on every option", () => {
  for (const question of fill.questions) {
    assertSaaQuestionTags(question);
    assert.equal(question.audit.taskId, question.objectiveIds["saa-c03"][0], question.id);
    assert.ok(tasks.has(question.audit.taskId), question.id);
    assert.equal(question.audit.retrievalDate, "2026-11-20", question.id);
    assert.ok(question.audit.docsUrl.startsWith("https://docs.aws.amazon.com/"), question.id);
    assert.ok(question.sourceUrls.includes(question.audit.docsUrl), question.id);
    assert.ok(question.sourceUrls.every((url) => url.startsWith("https://docs.aws.amazon.com/")), question.id);
    const lines = question.explanation.split("\n");
    assert.equal(lines.length, question.choices.length, question.id);
    question.choices.forEach((choice, index) => {
      const verdict = index === question.answer ? "Correct" : "Incorrect";
      assert.match(lines[index], new RegExp(`^Option: ${escapeRegExp(choice)} — ${verdict}: .{40,}$`), question.id);
    });
    assert.equal(/\b\d+\s*(minute|hour|day|second|gb|mb|tb|request|iops)\b/i.test(`${question.prompt}\n${question.explanation}`), false, question.id);
  }
  for (const card of fill.cards) {
    assertSaaCardTags(card);
    assert.ok(tasks.has(card.taskId), card.id);
    assert.ok(card.docsUrl.startsWith("https://docs.aws.amazon.com/"), card.id);
  }
});

test("new wording does not copy an existing question, card, drill cue, or pair", () => {
  const prompts = new Set([...bank, ...qualifierTwins].map((question) => norm(question.prompt)));
  const fronts = new Set(cards.map((card) => norm(card.front)));
  const backs = new Set(cards.map((card) => norm(card.back)));
  const cues = new Set();
  for (const deck of drillDecks) {
    if (drillIds.includes(deck.id)) continue;
    for (const item of deck.items) {
      for (const key of ["cue", "scenario", "prompt"]) {
        if (item.fields[key]) cues.add(norm(item.fields[key]));
      }
    }
  }
  const pairText = pairs.flatMap((pair) => [
    pair.difference,
    ...(pair.sides ?? []).map((side) => side.pickWhen),
  ].filter((text) => text && text.length > 40)).map(norm);
  for (const question of fill.questions) {
    assert.equal(prompts.has(norm(question.prompt)), false, question.id);
    for (const text of pairText) {
      assert.equal(norm(question.prompt).includes(text) || norm(question.explanation).includes(text), false, question.id);
    }
  }
  for (const card of fill.cards) {
    assert.equal(fronts.has(norm(card.front)), false, card.id);
    assert.equal(backs.has(norm(card.back)), false, card.id);
    for (const text of pairText) assert.equal(norm(`${card.front} ${card.back}`).includes(text), false, card.id);
  }
  for (const deck of fill.drills) {
    for (const item of deck.items) assert.equal(cues.has(norm(item.cue)), false, `${deck.id}/${item.id}`);
  }
  const globalPair = pairs.find((pair) => pair.id === "pair-aurora-global-replica");
  assert.ok(globalPair.questionIds.includes("q-saa-hy-aurora-global-01"));
});

test("the thin clusters clear the question, card, and drill floors", () => {
  const drillRows = drillDecks.flatMap((deck) => deck.items.map((item) => ({
    cue: item.fields.cue ?? item.fields.scenario ?? item.fields.prompt ?? "",
    answer: item.fields.answer ?? "",
  })));
  const after = highYieldClusterCounts({ questions, cards: flashcards, drills: drillRows });
  const row = (id) => after.find((item) => item.id === id);
  assert.ok(row("4").cards >= 6);
  assert.ok(row("12").cards >= 6);
  assert.ok(row("13").cards >= 6);
  assert.ok(row("14").questions >= 12 && row("14").cards >= 6 && row("14").drills >= 5);
  assert.ok(row("15").cards >= 6 && row("15").drills >= 5);
  assert.ok(row("16").questions >= 12 && row("16").cards >= 6);
});
