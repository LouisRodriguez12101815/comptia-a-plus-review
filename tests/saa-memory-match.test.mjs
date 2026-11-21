import test from "node:test";
import assert from "node:assert/strict";
import { mergeProgress } from "../lib/learner/merge.ts";
import { progressAfterMatchMiss, parseProgress } from "../lib/progress.ts";
import { saaMistakeLog } from "../lib/saa-mistake-log.ts";
import { serviceFacts, serviceFactItems } from "../lib/study/service-facts.ts";
import {
  MATCH_MISS_CAP,
  OUT_OF_SCOPE_NOTE,
  filterMatchPairs,
  matchRoundSize,
  memoryMatchPairs,
  mergeMatchMisses,
  questionsFromMemoryMisses,
  sittingsFromMemoryMisses,
  takeMatchRound,
} from "../lib/study/memory-match.ts";

const OUT = [
  ["route53", "AZ-affinity routing"],
  ["kinesis", "Kinesis Data Streams on-demand Advantage"],
  ["savings-plans", "Database Savings Plans"],
];

test("out-of-scope classes stay on the record and stay out of drills and match rounds", () => {
  for (const [id, name] of OUT) {
    const entry = serviceFacts.find((fact) => fact.id === id).classes.find((item) => item.name === name);
    assert.equal(entry.inScope, false, name);
    assert.equal(entry.note, OUT_OF_SCOPE_NOTE, name);
  }
  const cues = serviceFactItems().map((item) => item.fields.cue);
  const hidden = memoryMatchPairs().filter((pair) => pair.field === "class").map((pair) => pair.left);
  const shown = memoryMatchPairs(serviceFacts, { includeOutOfScope: true }).filter((pair) => pair.field === "class").map((pair) => pair.left);
  for (const [, name] of OUT) {
    assert.equal(cues.some((cue) => cue.includes(name)), false, name);
    assert.equal(hidden.includes(name), false, name);
    assert.equal(shown.includes(name), true, name);
  }
  assert.equal(hidden.includes("Simple routing"), true);
  assert.equal(cues.some((cue) => cue.includes("Simple routing")), true);
  const coreClasses = filterMatchPairs(memoryMatchPairs(), { domain: "", task: "", tier: "core", field: "class" });
  const allClasses = filterMatchPairs(memoryMatchPairs(), { domain: "", task: "", tier: "all", field: "class" });
  assert.equal(coreClasses.some((pair) => pair.left === "REST API"), false);
  assert.equal(allClasses.some((pair) => pair.left === "REST API"), true);
});

test("cost pairs use the anchor when one was stored, and the band otherwise", () => {
  const costs = memoryMatchPairs().filter((pair) => pair.field === "cost");
  const anchored = costs.filter((pair) => pair.id.endsWith("-cost-anchor"));
  assert.equal(anchored.length, 13);
  const s3 = anchored.find((pair) => pair.id === "s3-cost-anchor");
  assert.equal(s3.left, "Amazon S3");
  assert.match(s3.right, /\$0\.023 per GB/);
  assert.match(s3.right, /GB-month and requests, by storage class/);
  const iam = costs.find((pair) => pair.id === "iam-cost-band");
  assert.equal(iam.right, "n/a · n/a");
  const coreCosts = filterMatchPairs(costs, { domain: "", task: "", tier: "core", field: "cost" });
  assert.equal(coreCosts.length, 55);
  const domainCosts = filterMatchPairs(costs, { domain: "D1", task: "1.3", tier: "all", field: "cost" });
  assert.ok(domainCosts.length > 0);
  assert.ok(domainCosts.every((pair) => pair.task === "1.3" && pair.domain === "D1"));
});

test("a round holds 6 to 8 unique pairs and does not repeat a label", () => {
  assert.equal(matchRoundSize(55, 0), 6);
  assert.equal(matchRoundSize(55, 1), 7);
  assert.equal(matchRoundSize(55, 2), 8);
  assert.equal(matchRoundSize(3, 2), 3);
  const definitions = memoryMatchPairs().filter((pair) => pair.field === "definition");
  for (const seed of [0, 1, 2]) {
    const { round } = takeMatchRound(definitions, seed);
    assert.equal(round.length, 6 + seed);
    assert.equal(new Set(round.map((pair) => pair.id)).size, round.length);
    assert.equal(new Set(round.map((pair) => pair.left)).size, round.length);
    assert.equal(new Set(round.map((pair) => pair.right)).size, round.length);
  }
  const collided = definitions.slice(0, 10).map((pair) => ({ ...pair, right: "same answer" }));
  const narrow = takeMatchRound(collided, 1);
  assert.equal(narrow.round.length, 1);
  assert.equal(narrow.rest.length, 9);
  const seen = new Set(narrow.round.map((pair) => pair.id));
  const next = takeMatchRound(narrow.rest, 4);
  assert.equal(next.round.some((pair) => seen.has(pair.id)), false);
});

test("a match miss reaches the mistake log, FSRS, and the synced memoryGames record", () => {
  const now = new Date("2026-11-21T20:00:00.000Z");
  const empty = { studyFocus: "saa-c03", knownCards: {}, unknownCards: {}, quizAttempts: [], mockAttempts: [], schedules: {} };
  const once = progressAfterMatchMiss(empty, { id: "s3-cost-anchor", task: "3.1", prompt: "Amazon S3 → $0.023 per GB" }, now);
  assert.equal(once.unknownCards["s3-cost-anchor"], true);
  assert.equal(typeof once.schedules["s3-cost-anchor"].due, "string");
  assert.equal(once.schedules["s3-cost-anchor"].lapses >= 0, true);
  assert.equal(once.memoryGames.misses.length, 1);
  assert.equal(once.memoryGames.misses[0].times, 1);
  const twice = progressAfterMatchMiss(once, { id: "s3-cost-anchor", task: "3.1", prompt: "Amazon S3 → $0.023 per GB" }, new Date(now.getTime() + 1000));
  assert.equal(twice.memoryGames.misses[0].times, 2);

  const rows = saaMistakeLog(
    sittingsFromMemoryMisses(twice.memoryGames.misses),
    questionsFromMemoryMisses(twice.memoryGames.misses),
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "s3-cost-anchor");
  assert.equal(rows[0].timesMissed, 2);
  assert.equal(rows[0].task, "3.1");
  assert.equal(rows[0].domain, "3.0");
  assert.equal(rows[0].status, "active");
  assert.match(rows[0].prompt, /Amazon S3/);

  const remote = { ...empty, memoryGames: { streak: 1, bestMs: {}, misses: [{ id: "iam-cost-band", at: 5, task: "1.1", prompt: "IAM → n/a", times: 1 }] } };
  const merged = mergeProgress(twice, remote);
  assert.deepEqual(merged.memoryGames.misses.map((miss) => miss.id), ["s3-cost-anchor", "iam-cost-band"]);
  const capped = mergeMatchMisses(
    Array.from({ length: MATCH_MISS_CAP }, (_, index) => ({ id: `local-${index}`, at: index, task: "1.1", prompt: "local", times: 1 })),
    [{ id: "remote-only", at: 9, task: "1.1", prompt: "remote", times: 4 }],
  );
  assert.equal(capped.length, MATCH_MISS_CAP);
  assert.equal(capped[0].id, "local-0");
  assert.equal(capped.some((miss) => miss.id === "remote-only"), false);

  const saved = JSON.stringify({ memoryGames: twice.memoryGames });
  const parsed = parseProgress(JSON.stringify({ ...empty, memoryGames: twice.memoryGames }));
  assert.equal(parsed.problems.length, 0);
  assert.equal(parsed.progress.memoryGames.misses[0].times, 2);
  assert.equal(saved.includes("s3-cost-anchor"), true);
  const broken = parseProgress(JSON.stringify({ ...empty, memoryGames: { streak: 0, bestMs: {}, misses: [{ id: "" }] } }));
  assert.deepEqual(broken.problems, ["repaired"]);
  assert.equal(broken.progress.memoryGames.misses, undefined);
});
