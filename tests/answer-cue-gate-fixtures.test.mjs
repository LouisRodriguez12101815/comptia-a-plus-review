import assert from "node:assert/strict";
import { test } from "node:test";
import { loadCueItems } from "../scripts/audit-answer-cues.mjs";
import { analyzeItem, rateFailures, summarize } from "../scripts/lib/answer-cues.mjs";

function item(id, answer, choices, prompt = "Which option keeps the archive available for this team?") {
  return { id, exams: ["saa-c03"], source: "fixture", prompt, choices, answer };
}

const longest = item("fixture-longest", 3, [
  "Store the archive in the primary vault for the team",
  "Store the archive in the second vault for the team",
  "Store the archive in the third vault for the team",
  "Store the archive in the primary vault for the team today",
]);
const notLongest = item("fixture-shorter", 0, [
  "Store the archive in the primary vault for the team",
  "Store the archive in the second vault for the team today",
  "Store the archive in the third vault for the team",
  "Store the archive in the fourth vault for the team",
]);
const strong = item("fixture-strong", 0, [
  "Store the archive in the primary vault for the team and keep a second copy in another vault for the same team",
  "Store the archive in the second vault for the team",
  "Store the archive in the third vault for the team",
  "Store the archive in the fourth vault for the team",
]);
const selfDisqualifying = item(
  "fixture-self",
  2,
  [
    "Amazon EFS for Linux NFS shares in the private subnet beside the archive",
    "Amazon FSx for Windows File Server in a second subnet for the same team",
    "Amazon FSx for Windows File Server for the share",
    "Amazon FSx for Windows File Server for one department",
  ],
  "Which service provides a managed Windows file share for this team?",
);
const notParallel = item("fixture-parallel", 0, [
  "Amazon S3",
  "A queue for the orders with a long retention setting today",
  "A function for the API with a reserved concurrency setting",
  "A cache for the hot keys with a second node attached",
], "Which service fits this workload?");

function failuresOf(records) {
  return rateFailures(summarize(records.map((record) => analyzeItem(record))), ["saa-c03"]);
}

test("one fixture fails each SAA answer-cue gate and no other gate", () => {
  const longestRows = [...Array.from({ length: 4 }, (_, index) => ({ ...longest, id: `fixture-longest-${index}` })), ...Array.from({ length: 6 }, (_, index) => ({ ...notLongest, id: `fixture-shorter-${index}` }))];
  const longestFailures = failuresOf(longestRows);
  assert.deepEqual(longestFailures, ["saa-c03: key-is-longest 40.0% (4/10) exceeds 35%"]);

  const strongRows = [...Array.from({ length: 2 }, (_, index) => ({ ...strong, id: `fixture-strong-${index}` })), ...Array.from({ length: 8 }, (_, index) => ({ ...notLongest, id: `fixture-strong-short-${index}` }))];
  const strongFailures = failuresOf(strongRows);
  assert.deepEqual(strongFailures, ["saa-c03: strongly length-biased 20.0% (2/10) exceeds 10%"]);

  const selfFailures = failuresOf([selfDisqualifying]);
  assert.deepEqual(selfFailures, ["saa-c03: self-disqualifying 1 exceeds 0"]);

  const parallelFailures = failuresOf([notParallel]);
  assert.deepEqual(parallelFailures, ["saa-c03: choices not parallel 1 exceeds 0"]);
});

test("the live SAA single-answer set passes the four enforced gates", async () => {
  const summary = summarize((await loadCueItems()).map(analyzeItem));
  assert.deepEqual(rateFailures(summary, ["saa-c03"]), []);
});
