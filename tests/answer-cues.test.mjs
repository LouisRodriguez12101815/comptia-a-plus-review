import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyzeItem, countsAsEcho, equalizeStrongCue, itemFailures, labelEchoWords, LEGACY_STEM_ECHO_IDS, rateFailures, summarize } from "../scripts/lib/answer-cues.mjs";

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
  assert.deepEqual(rates, [
    "saa-c03: true conditional distractor 1 exceeds 0",
    "saa-c03: category word only the key matches 1 exceeds 0",
    "saa-c03: key-is-shortest 0.0% (0/3) is outside 15–35%",
  ]);
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

test("self-out clauses and stem copies in the key are reported", () => {
  const refused = analyzeItem({
    id: "q-refuse", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which change lets the partner read?",
    choices: [
      "A bucket policy that names the partner role",
      "An identity permission for a role the partner will not use",
      "Rotate imported material on a key this application does not use",
      "Enable rotation on a key this application does not use",
    ],
  });
  assert.ok(refused.selfDisqualifying.filter((hit) => hit.label === "refuses").length >= 2);
  const nullAction = analyzeItem({
    id: "q-null", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "How is the existing database encrypted?",
    choices: [
      "Copy a snapshot to an encrypted snapshot and restore it",
      "Turn on default encryption and restore nothing",
      "Require TLS and leave the stored files unchanged",
      "Modify the database and enable storage encryption",
    ],
  });
  assert.ok(nullAction.selfDisqualifying.some((hit) => hit.label === "nothing"));
  assert.ok(nullAction.selfDisqualifying.some((hit) => hit.label === "unchanged-data"));
  const omitted = analyzeItem({
    id: "q-omit", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which design meets the landing zone and the upload rule?",
    choices: [
      "AWS Control Tower with a landing zone and account factory",
      "An SCP in AWS Organizations, without the landing zone",
      "Default encryption at AES256, without a deny for other headers",
      "A conformance pack evaluated after the fact",
    ],
  });
  assert.ok(omitted.selfDisqualifying.some((hit) => hit.label === "without-the"));
  assert.ok(omitted.selfDisqualifying.some((hit) => hit.label === "without-deny"));
  assert.ok(omitted.selfDisqualifying.some((hit) => hit.label === "after-the-fact"));
  const hedge = analyzeItem({
    id: "q-hedge", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which certificate renews, and which assignment grants the job?",
    choices: [
      "An ACM certificate on the load balancer",
      "An imported certificate renewed by hand",
      "An SCP attached to both accounts that is meant to allow the job",
      "A second SAML role in each account",
    ],
  });
  assert.ok(hedge.selfDisqualifying.some((hit) => hit.label === "manual-renewal"));
  assert.ok(hedge.selfDisqualifying.some((hit) => hit.label === "meant-to"));
  const copied = analyzeItem({
    id: "q-copy", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "The team must download the provider SOC report and agreement and recover any second in the past 14 days.",
    choices: [
      "AWS Artifact for the provider SOC report and agreement, covering at least 14 days",
      "AWS Config rules for the account",
      "A weekly on-demand backup",
      "AWS CloudTrail records of API calls",
    ],
  });
  assert.match(copied.stemEcho, /provider soc report and/);
  const numbered = analyzeItem({
    id: "q-days", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Recover the table to any second in the past 14 days.",
    choices: [
      "Point-in-time recovery covering at least 14 days",
      "An on-demand backup captured once each week",
      "A global table that keeps another live copy",
      "An export of the table from last night",
    ],
  });
  assert.equal(numbered.stemEcho, "at least 14");
  const pointed = analyzeItem({
    id: "q-point", exams: ["saa-c03"], source: "questions.json", answer: 0,
    prompt: "Which permission names the SAML provider?",
    choices: [
      "An IAM role whose trust policy names that SAML provider",
      "An Amazon Cognito user pool",
      "An IAM user for each employee",
      "An SCP for the account",
    ],
  });
  assert.equal(pointed.deicticEcho, "that saml");
  assert.equal(countsAsEcho(pointed), true);
  assert.equal(countsAsEcho({ id: "q-saa-guide-10", keywordEcho: null, stemEcho: null, deicticEcho: "this password" }), false);
  assert.equal(LEGACY_STEM_ECHO_IDS.has("q-copy"), false);
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

test("a hint fails when it repeats a word unique to its own label", () => {
  const examples = [
    ["gp3", "The volume needs gp3 IOPS", "io2", "The volume needs sustained provisioned IOPS"],
    ["Amazon ECS", "The team will deploy the containers with ECS task definitions", "Amazon EKS", "The team will deploy the containers with Kubernetes manifests"],
    ["Kinesis Data Streams API", "Producers and consumers will call the Kinesis API", "Amazon MSK", "Producers and consumers will keep their Kafka client libraries"],
    ["Managed NAT gateway", "Private subnets need a managed IPv4 path", "NAT instance", "The translator has to be a virtual machine you patch"],
    ["Amazon SQS queue API", "New code can send and receive with the SQS API", "Amazon MQ", "Existing code already speaks AMQP or MQTT"],
    ["DynamoDB Accelerator", "Table reads should be cached behind the DynamoDB API", "Amazon ElastiCache", "The application should read and write a cache through the cache's own API"],
    ["FSx for Windows File Server", "Windows clients need an SMB file system", "FSx for Lustre", "Compute jobs need a high-throughput file system"],
    ["AWS Backup plan", "Supported resources need recovery points kept by a backup plan", "S3 replication", "Newly written objects should show up in a second bucket"],
  ];
  for (const [label, pickWhen, otherLabel, otherHint] of examples) {
    const hits = labelEchoWords([
      { label, pickWhen },
      { label: otherLabel, pickWhen: otherHint },
    ]);
    assert.ok(hits.some((hit) => hit.label === label && hit.words.length > 0), pickWhen);
  }
  const shared = labelEchoWords([
    { label: "Bucket policy", pickWhen: "The caller must be named in the policy." },
    { label: "Identity policy", pickWhen: "The caller must be allowed by the policy." },
  ]);
  assert.deepEqual(shared, []);
});
