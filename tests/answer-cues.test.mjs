import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("a distractor that contradicts the stem, or a bare key beside qualified distractors, is reported", () => {
  const windows = analyzeItem({
    id: "q-win", exams: ["saa-c03"], source: "questions.json", answer: 2,
    prompt: "Managed Windows file system?",
    choices: ["Amazon FSx for Lustre scratch files", "Amazon EFS for Linux NFS shares", "Amazon FSx for Windows File Server", "S3 File Gateway SMB to object storage"],
  });
  assert.ok(windows.selfDisqualifying.some((hit) => hit.label === "windows"));
  assert.ok(windows.selfDisqualifying.some((hit) => hit.label === "file"));
  assert.equal(windows.notParallel, true);
  const parallel = analyzeItem({
    id: "q-plain", exams: ["saa-c03"], source: "questions.json", answer: 2,
    prompt: "Managed Windows file system?",
    choices: ["Amazon FSx for Lustre", "Amazon EFS", "Amazon FSx for Windows File Server", "Amazon S3 File Gateway"],
  });
  assert.deepEqual(parallel.selfDisqualifying, []);
  assert.equal(parallel.notParallel, false);
  const qualifiedKey = analyzeItem({
    id: "q-long-key", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which control fits?",
    choices: ["Deny the request when transport is insecure for this bucket policy", "SQS", "SNS", "WAF"],
  });
  assert.equal(qualifiedKey.notParallel, true);
});

test("keyword echo, odd-one-out openings, and a strictly shortest key are measured", () => {
  const echo = analyzeItem({
    id: "q-echo", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which design gives the archive durability?",
    choices: ["Durable archive storage", "A queue", "A function", "A cache"],
  });
  assert.equal(echo.keywordEcho, "archive");
  assert.equal(echo.strictlyShortest, false);
  const generic = analyzeItem({
    id: "q-generic", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which design lowers the storage cost for this team?",
    choices: ["Lower storage cost", "Amazon SQS", "AWS Lambda", "Amazon ElastiCache"],
  });
  assert.equal(generic.keywordEcho, null);
  const technical = analyzeItem({
    id: "q-subnet", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which option isolates the subnet?",
    choices: ["Private subnet routing", "Amazon SQS", "AWS Lambda", "Amazon ElastiCache"],
  });
  assert.equal(technical.keywordEcho, "subnet");
  const conditional = analyzeItem({
    id: "q-conditional", exams: ["saa-c03"], source: "questions.json", answer: 3,
    prompt: "What is the effective result?",
    choices: ["The call is allowed", "The call is allowed later", "The call is rejected when the caller uses the console", "The call is rejected"],
  });
  assert.equal(conditional.trueConditional, "The call is rejected when the caller uses the console");
  const category = analyzeItem({
    id: "q-queue", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which queue should sit between the producers and the consumers?",
    choices: ["Amazon SQS", "Amazon SNS", "Amazon EventBridge", "Amazon Kinesis Data Streams"],
  });
  assert.equal(category.categoryOnlyKey, "queue");
  const rates = rateFailures(summarize([generic, conditional, category]));
  assert.deepEqual(rates, []);
  const shared = analyzeItem({
    id: "q-shared", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which archive design fits?",
    choices: ["Archive in vault A", "Archive in vault B", "Archive in vault C", "Archive in vault D"],
  });
  assert.equal(shared.keywordEcho, null);
  const odd = analyzeItem({
    id: "q-odd", exams: ["saa-c03"], source: "questions.json", answer: 3,
    prompt: "What is the result?",
    choices: ["The call is allowed", "The call is allowed later", "The call is allowed here", "The request is rejected"],
  });
  assert.equal(odd.oddOneOut, "the call is");
  const shortest = analyzeItem({
    id: "q-short", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which service fits?",
    choices: ["Amazon S3", "A longer queue for orders", "A longer function for events", "A longer cache for reads"],
  });
  assert.equal(shortest.strictlyShortest, true);
  const summary = summarize([shortest]);
  assert.equal(summary["saa-c03"].shortest, 1);
});

test("the answer-cue gate fixtures are wired into checks", () => {
  const workflow = readFileSync(new URL("../.github/workflows/checks.yml", import.meta.url), "utf8");
  assert.match(workflow, /npm run test:answer-cue-gates/);
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
