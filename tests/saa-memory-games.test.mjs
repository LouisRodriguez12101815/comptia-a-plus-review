import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flashcards } from "../lib/content.ts";
import { SAA_TASK_IDS, saaDomainFromTask } from "../lib/saa-tags.ts";
import { trackForPath } from "../lib/tracks.ts";
import { drillDecks } from "../lib/practice/drills.ts";
import {
  applyKey,
  checkAnswer,
  choose,
  concentrationPairs,
  finishRound,
  finishWithButtons,
  pressNext,
  retryMissed,
  GAME_IDS,
  gameCatalogItems,
  nextStreak,
  PILLARS,
  PRINCIPLES,
  startGame,
  twoSidedPairs,
} from "../lib/study/games.ts";

const gamesSource = readFileSync(new URL("../lib/study/games.ts", import.meta.url), "utf8");

test("game items carry a real task, a docs URL, and an explanation", () => {
  const items = gameCatalogItems();
  assert.ok(items.length >= 8);
  for (const item of items) {
    assert.ok(SAA_TASK_IDS.includes(item.taskId), item.id);
    assert.ok(item.docsUrl.startsWith("https://"), item.id);
    assert.ok(item.explanation.length > 20, item.id);
    const card = flashcards.find((card) => card.id === item.cardId);
    assert.equal(card?.retired, undefined, item.cardId);
    assert.equal(card?.taskId, item.taskId, item.id);
  }
});

test("each game finishes a round from buttons and from the keyboard", () => {
  for (const game of GAME_IDS) {
    const board = game === "concentration" ? "D4" : "all";
    const clicked = finishWithButtons(startGame(game, "saa", "D4", board));
    assert.equal(clicked.phase, "done", game);
    assert.ok(clicked.log.length > 0, game);
    if (game !== "concentration") assert.equal(clicked.log.length, clicked.steps.length, game);
    const typed = finishRound(startGame(game, "saa", "D4", board));
    assert.equal(typed.phase, "done", game);
  }
});

test("retry missed serves only the missed items and every result is listed", () => {
  let round = startGame("lightning", "buttons");
  const wrong = round.steps[0].choices.find((choice) => choice.key !== round.steps[0].answerKey);
  round = checkAnswer(choose(round, wrong.key));
  assert.equal(round.phase, "feedback");
  assert.equal(round.log.length, 1);
  round = finishWithButtons(pressNext(round));
  assert.equal(round.phase, "done");
  assert.equal(round.log.length, round.steps.length);
  assert.equal(round.misses.length, 1);
  const retry = retryMissed(round);
  assert.equal(retry.steps.length, 1);
  assert.equal(retry.steps[0].cardId, round.misses[0]);
  assert.equal(retry.log.length, 0);
});

test("no SAA game choice is only a task id, and daily mix is learner-facing", () => {
  const taskOnly = /^\d\.\d+$/;
  for (const game of GAME_IDS) {
    if (game === "concentration") continue;
    for (const step of startGame(game, "labels", "D4").steps) {
      for (const choice of step.choices) assert.equal(taskOnly.test(choice.label.trim()), false, `${game} ${choice.label}`);
    }
  }
  const builder = startGame("builder", "labels");
  assert.ok(builder.steps.some((step) => step.answerKey !== "1"), "builder choices are shuffled, so the key is not always shown first");
  assert.equal(startGame("builder", "labels").steps[0].answerKey, builder.steps[0].answerKey);
  const sorter = startGame("sorter", "labels");
  assert.match(sorter.steps[0].choices[0].label, /^\d\.\d · .+/);
  assert.match(sorter.steps[0].explanation, /[1-4]\.0 /);
  const daily = startGame("daily", "mix", "D1");
  assert.equal(daily.steps.length, 10);
  const kinds = new Set(daily.steps.map((step) => step.id.split("-")[0]));
  for (const kind of ["recall", "keyword", "odd", "lightning", "fact"]) assert.equal(kinds.has(kind), true, kind);
  const weak = daily.steps.filter((step) => saaDomainFromTask(step.taskId) === "D1").length;
  assert.ok(weak >= 5, `expected the mix to lean on D1, got ${weak}`);
});

test("each game finishes a round from the keyboard", () => {
  assert.equal(gamesSource.includes("dueReviews"), false);
  for (const game of GAME_IDS) {
    const board = game === "concentration" ? "D4" : "all";
    const finished = finishRound(startGame(game, "saa", "D4", board));
    assert.equal(finished.phase, "done", game);
    if (game !== "concentration") assert.ok(finished.steps.length > 0, game);
  }
  const missed = applyKey(startGame("lightning"), "x");
  assert.equal(missed.phase, "ask");
  const wrong = applyKey(startGame("lightning"), startGame("lightning").steps[0].answerKey === "t" ? "f" : "t");
  assert.equal(wrong.phase, "feedback");
  assert.equal(wrong.misses.length, 1);
});

function norm(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

test("the memory games meet the per-game floors and cover every task three times", () => {
  const catalog = JSON.parse(readFileSync(new URL("../content/study-games.json", import.meta.url), "utf8"));
  const pairs = JSON.parse(readFileSync(new URL("../content/study-pairs.json", import.meta.url), "utf8"));
  assert.equal(catalog.builder.length, 28);
  assert.equal(catalog.keywords.length, 24);
  assert.equal(catalog.pillars.length, 24);
  assert.equal(catalog.odd.length, 20);
  assert.equal(catalog.ladders.length, 8);
  assert.equal(catalog.lightning.length, 66);
  // Match batch 3 adds 50 two-sided pairs. 130 two-sided pairs remain from earlier batches, so the board source is 180.
  assert.equal(twoSidedPairs().length, 180);
  assert.equal(concentrationPairs("D1").length, 8);
  assert.equal(concentrationPairs("D2").length, 8);
  assert.equal(concentrationPairs("D3").length, 8);
  assert.equal(concentrationPairs("D4").length, 8);
  const gamesByTask = new Map(SAA_TASK_IDS.map((task) => [task, new Set()]));
  const groups = [
    ["builder", catalog.builder],
    ["keyword", catalog.keywords],
    ["pillars", catalog.pillars],
    ["odd", catalog.odd],
    ["ladder", catalog.ladders],
    ["lightning", catalog.lightning],
  ];
  for (const [game, items] of groups) {
    for (const item of items) gamesByTask.get(item.taskId).add(game);
  }
  for (const pair of pairs.filter((item) => item.sides.length === 2)) gamesByTask.get(pair.taskId).add("concentration");
  for (const [task, games] of gamesByTask) assert.ok(games.size >= 3, `${task} ${[...games].join(",")}`);
  const labels = {
    odd: (item) => item.choices,
    builder: (item) => item.choices,
    keywords: (item) => [...PRINCIPLES],
    pillars: (item) => [...PILLARS],
  };
  for (const [group, items] of [["odd", catalog.odd], ["builder", catalog.builder], ["keywords", catalog.keywords], ["pillars", catalog.pillars]]) {
    for (const item of items) {
      const choices = labels[group](item);
      assert.equal(item.choiceWhy.length, choices.length, item.id);
      choices.forEach((choice, index) => {
        if (index === item.answer) return;
        assert.ok(item.choiceWhy[index].length > 20, `${item.id} ${choice}`);
      });
    }
  }
  for (const item of catalog.odd.filter((entry) => !["odd-decouple", "odd-keys", "odd-recovery", "odd-purchase"].includes(entry.id))) {
    assert.match(item.explanation, /shared trait/i, item.id);
    assert.match(item.explanation, /outsider/i, item.id);
  }
  for (const ladder of catalog.ladders) {
    assert.equal(ladder.rungWhy.length, ladder.order.length, ladder.id);
    assert.equal(ladder.rungDocs.length, ladder.order.length, ladder.id);
    for (const why of ladder.rungWhy) assert.ok(why.length > 20, ladder.id);
  }
  const transfer = catalog.ladders.find((item) => item.id === "ladder-transfer");
  assert.match(transfer.rungWhy[0], /same Availability Zone is free/i);
  assert.equal(JSON.stringify(transfer).includes("$"), false);
  for (const ladder of catalog.ladders) {
    const urls = [ladder.docsUrl, ...ladder.rungDocs];
    for (const url of urls) {
      assert.equal(/docs\.aws\.amazon\.com\/cdk\//i.test(url), false, `${ladder.id} ${url}`);
    }
  }
  assert.equal(catalog.ladders.some((item) => item.id === "ladder-edge"), false);
  const glacier = catalog.ladders.find((item) => item.id === "ladder-glacier-flex");
  assert.equal(glacier.taskId, "4.1");
  assert.deepEqual(glacier.order, ["Expedited", "Standard", "Bulk"]);
  assert.match(glacier.docsUrl, /restoring-objects-retrieval-options\.html$/);
  assert.equal(/\b\d+\s*[-–]\s*\d+\s*(minute|hour)/i.test(JSON.stringify(glacier)), false);
  assert.equal(JSON.stringify(glacier).includes("$"), false);
  for (const item of catalog.lightning) {
    assert.match(item.docsUrl, /^https:\/\//, item.id);
    if (item.answer === false) {
      assert.equal(item.correction.includes("\n"), false, item.id);
      assert.ok(item.correction.length > 20, item.id);
      assert.equal(item.explanation.includes(item.correction), true, item.id);
    }
  }
  const domains = { D1: 0, D2: 0, D3: 0, D4: 0 };
  for (const item of catalog.lightning) domains[saaDomainFromTask(item.taskId)] += 1;
  assert.deepEqual(domains, { D1: 17, D2: 16, D3: 15, D4: 18 });
  const originalIds = new Set([
    "ladder-dr", "ladder-s3",
    "odd-decouple", "odd-keys", "odd-recovery", "odd-purchase",
    "builder-cross-account", "builder-private-objects", "builder-tiers", "builder-hsm", "builder-queue", "builder-fanout", "builder-multiaz", "builder-global",
    "keyword-overhead-copy", "keyword-overhead-fanout", "keyword-cost-baseline", "keyword-cost-reads", "keyword-rpo-az", "keyword-rpo-region",
    "pillar-operate", "pillar-security", "pillar-reliability", "pillar-performance", "pillar-cost", "pillar-sustain",
    "lightning-deny", "lightning-boundary", "lightning-spot", "lightning-replica", "lightning-one-zone", "lightning-cloudfront",
    "pair-sg-nacl", "pair-rds-failover-read", "pair-cloudfront-global-accelerator", "pair-kinesis-firehose", "pair-rto-rpo", "pair-sqs-sns-eventbridge", "pair-kms-cloudhsm", "pair-ebs-efs-fsx-s3", "pair-aurora-global-replica", "pair-vpn-direct-connect", "pair-ri-savings-spot", "pair-gateway-interface", "pair-s3-ia-one-zone", "pair-ondemand-spot", "pair-boundary-scp",
  ]);
  const taken = new Set();
  const add = (value) => {
    const text = norm(value);
    if (text.length >= 24) taken.add(text);
  };
  for (const card of flashcards) {
    add(card.front);
    add(card.back);
  }
  for (const deck of drillDecks) {
    for (const item of deck.items) {
      for (const key of ["cue", "scenario", "answer"]) add(item.fields?.[key]);
    }
  }
  for (const pair of pairs) {
    if (!originalIds.has(pair.id)) continue;
    add(pair.difference);
    for (const side of pair.sides) add(side.pickWhen);
  }
  for (const item of gameCatalogItems()) {
    if (!originalIds.has(item.id)) continue;
    add(item.prompt);
    add(item.explanation);
    for (const choice of item.choices ?? []) add(choice);
    for (const rung of item.order ?? []) add(rung);
  }
  const check = (value, owner) => {
    const text = norm(value);
    if (text.length < 24) return;
    assert.equal(taken.has(text), false, owner);
    taken.add(text);
  };
  for (const pair of pairs) {
    if (originalIds.has(pair.id)) continue;
    check(pair.difference, pair.id);
    for (const side of pair.sides) check(`${side.label} ${side.pickWhen}`, `${pair.id} ${side.label}`);
  }
  for (const item of gameCatalogItems()) {
    if (originalIds.has(item.id)) continue;
    check(item.prompt, item.id);
    check(item.explanation, item.id);
    check(item.correction, item.id);
    for (const choice of item.choices ?? []) {
      if (choice.split(" ").length >= 8) check(choice, `${item.id} ${choice}`);
    }
  }
});

test("concentration uses two-sided pair records and sizes the board from what is available", () => {
  const ids = new Set(twoSidedPairs().map((pair) => pair.id));
  // Match batch 3.
  assert.equal(ids.size, 180);
  for (const board of ["all", "D1", "D2", "D3", "D4"]) {
    const pairs = concentrationPairs(board);
    assert.ok(pairs.length > 0 && pairs.length <= 8, board);
    assert.ok(pairs.every((pair) => pair.sides.length === 2 && ids.has(pair.id)), board);
    const finished = finishRound(startGame("concentration", "saa", null, board));
    assert.equal(finished.phase, "done", board);
    assert.equal(finished.tiles.length, pairs.length * 2, board);
    assert.ok(finished.tiles.every((tile) => ids.has(tile.pairId)), board);
  }
  assert.equal(concentrationPairs("all").length, 8);
  assert.equal(concentrationPairs("D1").length, 8);
  assert.equal(concentrationPairs("D2").length, 8);
  assert.equal(concentrationPairs("D3").length, 8);
  assert.equal(concentrationPairs("D4").length, 8);
  assert.equal(nextStreak(undefined, 4, "2026-11-20"), 1);
  assert.equal(nextStreak("2026-11-20", 4, "2026-11-20"), 4);
  assert.equal(nextStreak("2026-11-19", 4, "2026-11-20"), 5);
});

test("the cheat sheet breadcrumb follows the SAA track", () => {
  assert.equal(trackForPath("/flashcards/cheat-sheet", "220-1201")?.id, "aws-saa");
});
