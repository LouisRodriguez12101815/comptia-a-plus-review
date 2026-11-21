import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeItem, equalizeStrongCue, itemFailures, rateFailures, summarize } from "../scripts/lib/answer-cues.mjs";

const longKey = {
  id: "q-long",
  source: "questions.json",
  exams: ["saa-c03"],
  prompt: "Which design keeps the archive durable?",
  choices: ["A short miss", "Another short miss", "A third short miss", "Glacier Flexible Retrieval with a vault lock"],
  answer: 3,
  explanation: [
    "Option: A short miss — Incorrect: This option is a short distractor that does not keep the archive.",
    "Option: Another short miss — Incorrect: This option is also a short distractor and does not keep the archive.",
    "Option: A third short miss — Incorrect: This option is a third short distractor and does not keep the archive.",
    "Option: Glacier Flexible Retrieval with a vault lock — Correct: Glacier Flexible Retrieval with a vault lock keeps the archive durable.",
  ].join("\n"),
};

test("length rank, strong bias, and the other cues are measured without treating a tie as longest", () => {
  const row = analyzeItem(longKey);
  assert.equal(row.strictlyLongest, true);
  assert.equal(row.stronglyBiased, true);
  assert.equal(row.lengthRank, 1);
  assert.equal(row.keyLetter, "D");
  const tie = analyzeItem({ ...longKey, choices: ["same length xx", "same length yy"] , answer: 0 });
  assert.equal(tie.strictlyLongest, false);
  const stem = analyzeItem({
    id: "q-stem", exams: ["clf-c02"], source: "questions.json", answer: 0,
    prompt: "Which service provides object durability?",
    choices: ["Object durability storage", "A queue", "A function", "A cache"],
  });
  assert.equal(stem.stemWord, "object");
  const absolute = analyzeItem({
    id: "q-abs", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which statement fits?",
    choices: ["Use two zones", "Always use one zone", "Never use a cache", "Only one subnet"],
  });
  assert.deepEqual(absolute.absoluteWords, ["always", "never", "only"]);
  const summary = summarize([row, stem]);
  assert.equal(summary["saa-c03"].strong, 1);
  assert.equal(rateFailures(summary, ["saa-c03"]).length > 0, true);
  assert.deepEqual(itemFailures([row], new Set(["q-long"]), new Map([["q-long", "documented"]])), []);
});

test("equalizing a strong cue uses the existing explanation and keeps the key", () => {
  const edited = equalizeStrongCue(longKey);
  assert.ok(edited);
  assert.equal(edited.answer, longKey.answer);
  assert.equal(edited.choices[3], longKey.choices[3]);
  assert.equal(analyzeItem({ ...edited, exams: ["saa-c03"], source: "questions.json" }).stronglyBiased, false);
  assert.match(edited.explanation, new RegExp(`Option: ${edited.choices[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — Incorrect:`));
  assert.equal(equalizeStrongCue(edited), null);
});
