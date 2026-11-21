import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flashcards } from "../lib/content.ts";
import { SAA_TASK_IDS } from "../lib/saa-tags.ts";
import { trackForPath } from "../lib/tracks.ts";
import {
  applyKey,
  concentrationPairs,
  finishRound,
  GAME_IDS,
  gameCatalogItems,
  nextStreak,
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

test("concentration uses two-sided pair records and sizes the board from what is available", () => {
  const ids = new Set(twoSidedPairs().map((pair) => pair.id));
  assert.equal(ids.size, 12);
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
  assert.equal(concentrationPairs("D1").length, 3);
  assert.equal(concentrationPairs("D4").length, 3);
  assert.equal(nextStreak(undefined, 4, "2026-11-20"), 1);
  assert.equal(nextStreak("2026-11-20", 4, "2026-11-20"), 4);
  assert.equal(nextStreak("2026-11-19", 4, "2026-11-20"), 5);
});

test("the cheat sheet breadcrumb follows the SAA track", () => {
  assert.equal(trackForPath("/flashcards/cheat-sheet", "220-1201")?.id, "aws-saa");
});
