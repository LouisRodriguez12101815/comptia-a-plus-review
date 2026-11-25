import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadCueItems } from "../scripts/audit-answer-cues.mjs";
import { analyzeItem, LEGACY_STEM_ECHO_IDS, rateFailures, summarize } from "../scripts/lib/answer-cues.mjs";

function item(id, answer, choices, prompt = "Which option keeps the archive available for this team?") {
  return { id, exams: ["saa-c03"], source: "fixture", prompt, choices, answer };
}

const longest = item("fixture-longest", 3, [
  "Store the archive in the primary vault for the team",
  "Store the archive in the second vault for the team",
  "Store the archive in the third vault for the team",
  "Store the archive in the primary vault for the team today",
]);
const neutral = item("fixture-neutral", 0, [
  "Store the archive in the primary vault for the team",
  "Store the archive in the second vault for the team today",
  "Store the archive in the third vault for the team",
  "Store the archive in the fourth vault for the team",
]);
const shortest = item("fixture-shortest", 0, [
  "Store the archive nearby",
  "Store the archive in the second vault for the team",
  "Place the archive in the third vault for the team",
  "Leave the archive in the fourth vault for the team",
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
    "Amazon FSx for Windows File Server for the department share",
    "Amazon FSx for Windows File Server for one department today",
  ],
  "Which service provides a managed Windows file share for this team?",
);
const notParallel = item("fixture-parallel", 0, [
  "Amazon S3",
  "A queue for the orders with a long retention setting today",
  "A function for the API with a reserved concurrency setting",
  "A cache for the hot keys with a second node attached",
], "Which service fits this workload?");
const conditional = item("fixture-conditional", 0, [
  "Store the archive nearby",
  "Store the archive nearby when the team asks",
  "Hold a shorter copy",
  "Leave the archive in the fourth vault for the team today",
]);
const category = item("fixture-category", 0, [
  "Amazon SQS",
  "Amazon Route 53",
  "AWS KMS",
  "Amazon SNS",
], "Which queue should hold this work for the team?");
const oddOneOut = item("fixture-odd", 0, [
  "Keep the archive in the vault",
  "Store the archive in the second vault for the team",
  "Store the archive in the third vault for the team",
  "Store the archive in the fourth vault for the team",
]);
const echo = item("fixture-echo", 0, [
  "Keep the archive copy in the vault",
  "Keep the primary copy in the vault",
  "Keep the second copy in the vault",
  "Keep the third copy in the vault",
]);

function copies(record, count, prefix) {
  return Array.from({ length: count }, (_, index) => ({ ...record, id: `${prefix}-${index}` }));
}

function failuresOf(records) {
  return rateFailures(summarize(records.map((record) => analyzeItem(record))), ["saa-c03"]);
}

test("one fixture fails each SAA answer-cue gate and no other gate", () => {
  const cases = [
    [copies(longest, 8, "longest").concat(copies(shortest, 4, "longest-short"), copies(neutral, 8, "longest-neutral")), "key-is-longest"],
    [copies(strong, 3, "strong").concat(copies(shortest, 4, "strong-short"), copies(neutral, 13, "strong-neutral")), "strongly length-biased"],
    [copies(selfDisqualifying, 1, "self").concat(copies(shortest, 4, "self-short"), copies(neutral, 15, "self-neutral")), "self-disqualifying"],
    [copies(notParallel, 1, "parallel").concat(copies(shortest, 3, "parallel-short"), copies(neutral, 16, "parallel-neutral")), "choices not parallel"],
    [copies(conditional, 1, "conditional").concat(copies(shortest, 4, "conditional-short"), copies(neutral, 15, "conditional-neutral")), "true conditional distractor"],
    [copies(category, 1, "category").concat(copies(shortest, 3, "category-short"), copies(neutral, 16, "category-neutral")), "category word only the key matches"],
    [copies(oddOneOut, 1, "odd").concat(copies(shortest, 3, "odd-short"), copies(neutral, 16, "odd-neutral")), "odd-one-out opening"],
    [copies(echo, 35, "echo").concat(copies(shortest, 8, "echo-short")), "keyword echo"],
    [copies(neutral, 20, "shortest-low"), "key-is-shortest"],
  ];
  for (const [records, gate] of cases) {
    const failures = failuresOf(records);
    assert.equal(failures.length, 1, `${gate}: ${failures.join(" | ")}`);
    assert.match(failures[0], new RegExp(`^saa-c03: ${gate}\\b`), failures[0]);
  }
});

test("stem copies and deictic keys outside the locked set are counted", async () => {
  const hits = (await loadCueItems()).map(analyzeItem)
    .filter((row) => row.exams.includes("saa-c03") && row.single && row.lengthGate && (row.stemEcho || row.deicticEcho))
    .map((row) => row.id)
    .sort();
  assert.deepEqual(hits, [...LEGACY_STEM_ECHO_IDS].sort());
});

test("the live SAA single-answer set passes the enforced gates", async () => {
  const summary = summarize((await loadCueItems()).map(analyzeItem));
  assert.deepEqual(rateFailures(summary, ["saa-c03"]), []);
});

test("the answer-cue gate fixtures stay on the checks workflow", () => {
  const workflow = readFileSync(new URL("../.github/workflows/checks.yml", import.meta.url), "utf8");
  assert.match(workflow, /npm run test:answer-cue-gates/);
});
