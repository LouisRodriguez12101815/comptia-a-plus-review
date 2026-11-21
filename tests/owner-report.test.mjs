import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createDiagnosticsGet } from "../app/api/learner/diagnostics/route.ts";
import { createReportGet } from "../app/api/learner/report/route.ts";
import { publicDiagnostics } from "../lib/learner/diagnostics.ts";
import { summarizeItems } from "../lib/learner/owner-report.ts";
import { learnerId, signSession } from "../lib/learner/session.ts";

const secret = "q".repeat(32);
const phone = "+13055550123";
const ownerId = learnerId(phone, secret);
const fullSid = `AC${"a".repeat(32)}`;
const parentSid = `AC${"e".repeat(32)}`;
const secretValue = "secret-value-not-for-output";
const envKeys = ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_SYNC_SERVICE_SID", "TWILIO_VERIFY_SERVICE_SID", "LEARNER_SESSION_SECRET", "LEARNER_ALLOWED_PHONES"];
const previous = {};

const content = {
  questions: [
    { id: "q-sure", topicId: "t1", prompt: "What stays in the summary?", choices: ["SECRET_ANSWER_TEXT", "other"], answer: 0, explanation: "SECRET_EXPLANATION", examCodes: ["saa-c03"], objectiveIds: { "saa-c03": ["1.1"] } },
    { id: "q-lucky", topicId: "t1", prompt: "Which guess was lucky?", choices: ["SECRET_ANSWER_TEXT", "kept"], answer: 1, explanation: "SECRET_EXPLANATION", examCodes: ["saa-c03"], objectiveIds: { "saa-c03": ["1.1"] } },
  ],
  topics: [{ id: "t1", title: "Storage", examCodes: ["saa-c03"] }],
  objectives: { exams: [{ code: "saa-c03", name: "Solutions Architect", domains: [{ id: "1", title: "Design secure architectures", objectives: [{ id: "1.1", title: "Design secure access" }] }] }] },
  concepts: { concepts: [] },
};

const at = Date.parse("2026-11-20T15:00:00.000Z");
const items = [{
  key: "progress",
  data: { s: JSON.stringify({ quizAttempts: [{ topicId: "t1", exam: "saa-c03", correct: 1, total: 2, questionIds: ["q-sure", "q-lucky"], missedIds: ["q-sure"], sureIds: ["q-sure"], guessedIds: ["q-lucky"], at }], mockAttempts: [] }) },
}];

before(() => {
  for (const key of envKeys) previous[key] = process.env[key];
  process.env.TWILIO_ACCOUNT_SID = fullSid;
  process.env.TWILIO_API_KEY_SID = `SK${"b".repeat(32)}`;
  process.env.TWILIO_API_KEY_SECRET = secretValue;
  process.env.TWILIO_SYNC_SERVICE_SID = `IS${"c".repeat(32)}`;
  process.env.TWILIO_VERIFY_SERVICE_SID = `VA${"d".repeat(32)}`;
  process.env.LEARNER_SESSION_SECRET = secret;
  process.env.LEARNER_ALLOWED_PHONES = "3055550123";
});

after(() => {
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

function call(path, id) {
  const headers = { origin: "https://example.test" };
  if (id) headers.cookie = `learner_session=${signSession({ id, last4: "0123", exp: Date.now() + 3_600_000 }, secret)}`;
  return new Request(`https://example.test${path}`, { headers });
}

test("owner report and diagnostics stay private", async () => {
  const summary = summarizeItems(items, content, { exam: "saa-c03", days: 30, asOf: Date.parse("2026-11-21T12:00:00.000Z") });
  const summaryText = JSON.stringify(summary);
  assert.equal(summary.overall.correct, 1);
  assert.equal(summary.overall.total, 2);
  assert.equal(summary.sureButWrong[0].questionId, "q-sure");
  assert.equal(summary.luckyGuesses[0].questionId, "q-lucky");
  assert.match(summary.sureButWrong[0].prompt, /What stays/);
  assert.equal(summary.pacing.recorded, false);
  assert.equal(summary.domains[0].title, "Design secure architectures");
  assert.ok(summary.followups.every((path) => path.startsWith("/quiz?")));
  for (const forbidden of ["SECRET_ANSWER_TEXT", "SECRET_EXPLANATION", phone, "learner-", "correctAnswer", "selectedAnswer", fullSid, secretValue]) {
    assert.equal(summaryText.includes(forbidden), false, forbidden);
  }

  let reads = 0;
  const report = createReportGet({
    assertActive: async () => {},
    loadContent: async () => content,
    readItems: async (mapName) => { reads += 1; assert.match(mapName, /^learner-[0-9a-f]{40}$/); return items; },
  });
  assert.equal((await report(call("/api/learner/report?exam=saa-c03&days=30"))).status, 401);
  assert.equal((await report(call("/api/learner/report?exam=saa-c03&days=30", "b".repeat(40)))).status, 403);
  assert.equal(reads, 0);
  const ok = await report(call("/api/learner/report?exam=saa-c03&days=30", ownerId));
  assert.equal(ok.status, 200);
  const body = await ok.json();
  const bodyText = JSON.stringify(body);
  assert.equal(body.sureButWrong[0].questionId, "q-sure");
  for (const forbidden of ["SECRET_ANSWER_TEXT", "SECRET_EXPLANATION", phone, "learner-", "correctAnswer", fullSid, secretValue]) {
    assert.equal(bodyText.includes(forbidden), false, forbidden);
  }
  const offOrigin = new Request("https://example.test/api/learner/report?exam=saa-c03&days=30", {
    headers: { origin: "https://evil.test", cookie: `learner_session=${signSession({ id: ownerId, last4: "0123", exp: Date.now() + 60_000 }, secret)}` },
  });
  assert.equal((await report(offOrigin)).status, 403);

  const diagnosticsBody = publicDiagnostics({
    accountFriendlyName: "Civic Path Lab",
    accountSid: fullSid,
    ownerAccountSid: parentSid,
    parentFriendlyName: "Parent Co",
    syncServiceFriendlyName: "Outage Ops",
    records: [
      { category: "sync-actions", count: "3", usage: "3", price: "0.01" },
      { category: "sms", count: "9", usage: "9", price: "1" },
      { category: "verify-sms", count: "1", usage: "1", price: "0.05" },
    ],
    now: Date.parse("2026-11-21T00:00:00.000Z"),
  });
  assert.equal(diagnosticsBody.accountMatchesCivicPath, true);
  assert.equal(diagnosticsBody.parentMatchesCivicPath, false);
  assert.equal(diagnosticsBody.accountSidLast4, "aaaa");
  assert.equal(diagnosticsBody.subaccount, true);
  assert.deepEqual(diagnosticsBody.usage.map((row) => row.category), ["sync-actions", "verify-sms"]);
  const diagnosticsText = JSON.stringify(diagnosticsBody);
  assert.equal(diagnosticsText.includes(fullSid), false);
  assert.equal(diagnosticsText.includes(parentSid), false);
  assert.equal(diagnosticsText.includes(secretValue), false);

  const diagnostics = createDiagnosticsGet({
    assertActive: async () => {},
    read: async () => diagnosticsBody,
  });
  assert.equal((await diagnostics(call("/api/learner/diagnostics"))).status, 401);
  assert.equal((await diagnostics(call("/api/learner/diagnostics", "c".repeat(40)))).status, 403);
  const shown = await (await diagnostics(call("/api/learner/diagnostics", ownerId))).json();
  assert.equal(JSON.stringify(shown).includes(fullSid), false);
  assert.equal(shown.accountSidLast4, "aaaa");
});
