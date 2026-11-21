import test from "node:test";
import assert from "node:assert/strict";
import { flashcards, questions } from "../lib/content.ts";
import { parseProgress } from "../lib/progress.ts";
import { bossDeck, drillDecks } from "../lib/practice/drills.ts";
import { applyResult, finishForTime, startSession, SPEED_MS, SURVIVAL_LIVES } from "../lib/practice/drill-session.ts";
import { weakestSaaDomain } from "../lib/saa-study-loop.ts";
import { cheatSheet } from "../lib/study/records.ts";
import { GAME_IDS } from "../lib/study/game-ids.ts";
import { getTrack, toolStatuses, trackForPath } from "../lib/tracks.ts";
import objectives from "../content/objectives.json" with { type: "json" };
import expansion from "../content/saa-drill-expansion.json" with { type: "json" };
import pairs from "../content/study-pairs.json" with { type: "json" };

const cueDecks = [
  "aws-saa-secure-cues",
  "aws-saa-resilient-cues",
  "aws-saa-performance-cues",
  "aws-saa-cost-cues",
  "aws-saa-service-compare",
];
const floors = {
  "1.1": 7, "1.2": 5, "1.3": 6,
  "2.1": 7, "2.2": 9,
  "3.1": 5, "3.2": 5, "3.3": 5, "3.4": 5, "3.5": 5,
  "4.1": 5, "4.2": 7, "4.3": 2, "4.4": 2,
};
const domains = objectives.exams.find((exam) => exam.code === "saa-c03").domains.map((domain) => ({
  id: domain.id,
  title: domain.title,
}));

test("speed run scores a rising combo and ends at 60 seconds", () => {
  assert.equal(SPEED_MS, 60_000);
  let session = startSession("speed", 0);
  session = applyResult(session, true, 1_000);
  assert.equal(session.score, 1);
  assert.equal(session.combo, 1);
  session = applyResult(session, true, 2_000);
  assert.equal(session.score, 3);
  assert.equal(session.combo, 2);
  session = applyResult(session, false, 3_000);
  assert.equal(session.combo, 0);
  assert.equal(session.finished, false);
  assert.equal(finishForTime(session, 60_000).finished, true);
  const late = applyResult(startSession("speed", 0), true, 60_000);
  assert.equal(late.finished, true);
  assert.equal(late.score, 0);
});

test("survival has three lives and ends when the last one is lost", () => {
  let session = startSession("survival", 0);
  assert.equal(session.lives, SURVIVAL_LIVES);
  session = applyResult(session, false, 1);
  assert.equal(session.lives, 2);
  assert.equal(session.finished, false);
  session = applyResult(session, true, 2);
  session = applyResult(session, true, 3);
  assert.equal(session.bestStreak, 2);
  session = applyResult(session, false, 4);
  session = applyResult(session, false, 5);
  assert.equal(session.lives, 0);
  assert.equal(session.finished, true);
  assert.equal(session.bestStreak, 2);
  assert.equal(applyResult(session, true, 6).correct, session.correct);
});

test("missed drill cues survive a reload", () => {
  const raw = JSON.stringify({
    studyFocus: "saa-c03",
    knownCards: {},
    unknownCards: {},
    quizAttempts: [],
    mockAttempts: [],
    schedules: {},
    drillPractice: { missedIds: ["aws-saa-secure-cues/temporary", "not-an-id", "aws-saa-secure-cues/temporary"], bestStreak: 4 },
  });
  const { progress, problems } = parseProgress(raw);
  assert.deepEqual(progress.drillPractice.missedIds, ["aws-saa-secure-cues/temporary"]);
  assert.equal(progress.drillPractice.bestStreak, 4);
  assert.ok(problems.includes("repaired"));
  const clean = parseProgress(JSON.stringify({ ...JSON.parse(raw), drillPractice: { missedIds: ["aws-saa-cost-cues/steady"], bestStreak: 2 } }));
  assert.deepEqual(clean.problems, []);
  assert.equal(clean.progress.drillPractice.bestStreak, 2);
});

test("the five SAA decks are 15 items and the thin tasks get the planned floor", () => {
  const counts = Object.fromEntries(Object.keys(floors).map((task) => [task, 0]));
  for (const id of cueDecks) {
    const deck = drillDecks.find((item) => item.id === id);
    assert.equal(deck.items.length, 15, id);
    assert.ok(deck.modes.length >= 2, id);
    for (const item of deck.items) {
      assert.ok(counts[item.objective] !== undefined, `${id}/${item.id} ${item.objective}`);
      counts[item.objective] += 1;
    }
  }
  assert.deepEqual(counts, floors);
  const added = Object.values(expansion.cues).flat();
  assert.equal(added.length, 41);
  for (const item of added) assert.ok(item.docsUrl.startsWith("https://docs.aws.amazon.com/"), item.id);
});

test("which TWO and spot-the-wrong have one defensible set in each domain", () => {
  for (const [id, correctCount] of [["aws-saa-which-two", 2], ["aws-saa-spot-wrong", 1]]) {
    const deck = drillDecks.find((item) => item.id === id);
    for (const domain of ["D1", "D2", "D3", "D4"]) {
      assert.equal(deck.items.filter((item) => item.objective.startsWith(`${domain.slice(1)}.`)).length, 6, `${id} ${domain}`);
    }
    const keyed = deck.items.map((item) => item.select.filter((choice) => choice.correct).map((choice) => choice.text).sort().join("\n"));
    assert.equal(new Set(keyed).size, keyed.length, id);
    for (const item of deck.items) {
      assert.equal(item.select.filter((choice) => choice.correct).length, correctCount, item.id);
      assert.ok(item.select.every((choice) => choice.why && choice.text), item.id);
      assert.equal(new Set(item.select.map((choice) => choice.text)).size, item.select.length, item.id);
      assert.ok(item.docsUrl.startsWith("https://docs.aws.amazon.com/"), item.id);
    }
  }
});

test("confusion pairs cover the 15 SAA study pairs in both directions", () => {
  const saa = pairs.filter((pair) => pair.exam === "saa-c03");
  const deck = drillDecks.find((item) => item.id === "aws-saa-confusion-pairs");
  assert.equal(deck.items.length, saa.length);
  assert.deepEqual(deck.items.map((item) => item.id).sort(), saa.map((pair) => pair.id).sort());
  for (const mode of deck.modes) {
    const prompts = deck.items.map((item) => item.fields[mode.from]);
    assert.equal(new Set(prompts).size, prompts.length, mode.id);
    assert.ok(prompts.every((prompt) => prompt), mode.id);
  }
});

test("a boss round stays inside one domain", () => {
  for (const domain of ["D1", "D2", "D3", "D4"]) {
    const deck = bossDeck(domain);
    assert.ok(deck.items.length >= 2, domain);
    assert.ok(deck.items.every((item) => item.objective.startsWith(`${domain.slice(1)}.`)), domain);
    const prompts = deck.items.map((item) => item.fields.prompt);
    assert.equal(new Set(prompts).size, prompts.length, domain);
  }
  assert.equal(drillDecks.some((deck) => deck.id.startsWith("aws-saa-domain-boss")), false);
});

test("Play my weakest uses the lowest domain percent and Domain 1 with no history", () => {
  assert.equal(weakestSaaDomain([], questions, domains), "D1");
  const domainQuestion = (prefix) => questions.find((question) => question.objectiveIds?.["saa-c03"]?.[0]?.startsWith(prefix));
  const easy = domainQuestion("1.");
  const hard = domainQuestion("3.");
  assert.equal(weakestSaaDomain([{
    exam: "saa-c03",
    questionIds: [easy.id, hard.id],
    answeredIds: [easy.id, hard.id],
    missedIds: [hard.id],
  }], questions, domains), "D3");
});

test("the cheat sheet follows the exam query and a saved Core 1 focus does not override it", () => {
  assert.equal(trackForPath("/flashcards/cheat-sheet", "220-1201")?.id, "aws-saa");
  assert.equal(trackForPath("/flashcards/cheat-sheet", "220-1201", "clf-c02")?.id, "aws-clf");
  assert.equal(trackForPath("/flashcards/cheat-sheet", "clf-c02", "saa-c03")?.id, "aws-saa");
  assert.ok(cheatSheet("D1").cards.length > 0);
  const clf = ["D1", "D2", "D3", "D4"].flatMap((domain) => cheatSheet(domain, "clf-c02").cards);
  const expected = flashcards.filter((card) => !card.retired && card.examCodes?.includes("clf-c02") && !card.examCodes.includes("saa-c03"));
  assert.equal(clf.length, expected.length);
  assert.equal(clf.some((card) => card.front.includes("name the key design constraint")), false);
  assert.equal(flashcards.some((card) => card.front?.includes("name the key design constraint")), false);
});

test("the SAA games chip counts the game registry", () => {
  const chip = toolStatuses(getTrack("aws-saa")).find((tool) => tool.id === "game");
  assert.equal(chip.chip.count, GAME_IDS.length);
  assert.equal(GAME_IDS.length, 9);
});
