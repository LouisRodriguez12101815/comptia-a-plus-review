import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHealthGet } from "../lib/learner/health-route.ts";
import { HEALTH_PROBE_MAP, probeHealthMap } from "../lib/learner/health-twilio.ts";
import { createDiagnosticsGet } from "../app/api/learner/diagnostics/route.ts";
import { createReportGet } from "../app/api/learner/report/route.ts";
import { readPublicDiagnostics } from "../lib/learner/diagnostics-read.ts";
import { makeSnapshot, PROGRESS_HEAD, snapshotKeys } from "../lib/learner/progress-snapshot.mjs";
import { learnerId, signSession } from "../lib/learner/session.ts";
import { sectionResult } from "../lib/learner/section-result.ts";

const secret = "q".repeat(32);
const phone = "+13055550199";
const ownerId = learnerId(phone, secret);
const fullSid = `AC${"a".repeat(32)}`;
const keySid = `SK${"b".repeat(32)}`;
const syncSid = `IS${"c".repeat(32)}`;
const verifySid = `VA${"d".repeat(32)}`;
const secretValue = "secret-value-not-for-output";
const leak = `LEAK ${fullSid} ${keySid} ${syncSid} ${verifySid} ${phone} ${secretValue} SECRET_QUESTION_TEXT`;
const envKeys = ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_SYNC_SERVICE_SID", "TWILIO_VERIFY_SERVICE_SID", "TWILIO_DAILY_USAGE_TRIGGER_SID", "LEARNER_SESSION_SECRET", "LEARNER_ALLOWED_PHONES"];
const previous = {};
const logs = [];
const originalError = console.error;

const progress = {
  studyFocus: "saa-c03",
  knownCards: {},
  unknownCards: {},
  schedules: {},
  quizAttempts: [{ topicId: "t", exam: "saa-c03", correct: 0, total: 1, questionIds: ["q-1"], missedIds: ["q-1"], at: Date.parse("2026-11-20T15:00:00.000Z") }],
  mockAttempts: [{ exam: "saa-c03", full: true, correct: 0, total: 1, percent: 0, domains: [], multiCorrect: 0, multiTotal: 0, missedIds: [], at: Date.parse("2026-11-20T16:00:00.000Z") }],
  memoryGames: { streak: 0, bestMs: {}, misses: [{ id: "pair", task: "1.1", prompt: "SECRET_QUESTION_TEXT", at: 1, times: 1 }] },
};
const snap = makeSnapshot(JSON.stringify(progress));
const storedItems = [
  { key: PROGRESS_HEAD, data: snap.head, dateUpdated: "2026-11-21T12:00:00.000Z" },
  ...snapshotKeys(snap.head).map((key, index) => ({ key, data: { s: snap.chunks[index] }, dateUpdated: "2026-11-21T11:00:00.000Z" })),
];

function assertClean(text) {
  assert.equal(/\b(?:SK|AC|IS|VA)[0-9a-f]{32}\b/i.test(text), false, "sid appeared");
  assert.equal(/\+\d{10,15}\b/.test(text), false, "phone appeared");
  assert.equal(text.includes(secretValue), false, "secret appeared");
  assert.equal(text.includes("SECRET_QUESTION_TEXT"), false, "question text appeared");
  assert.equal(text.includes("3055550199"), false, "allowlist appeared");
}

function boom(name, fail) {
  if (!fail[name]) return;
  const error = new Error(leak);
  error.status = fail[name].status;
  error.code = fail[name].code;
  throw error;
}

function fakeClient(fail = {}) {
  const calls = [];
  return {
    calls,
    async fetchAccount() { calls.push("account"); boom("account", fail); return { friendlyName: "My Lab" }; },
    async fetchSyncService() { calls.push("sync"); boom("sync", fail); return { friendlyName: "Study Sync" }; },
    async listLearner(mapName) { calls.push(mapName); boom("sync read", fail); return storedItems; },
    async fetchVerify() { calls.push("verify"); boom("verify", fail); return { friendlyName: "Sign-in" }; },
    async listUsage() { calls.push("usage"); boom("usage", fail); },
    async fetchTrigger() { calls.push("trigger"); boom("trigger", fail); },
    async probe() {
      calls.push("probe");
      boom("probe", fail);
      return [
        { name: "write", ok: true, code: null, status: null, hint: "Wrote the probe item." },
        { name: "read", ok: true, code: null, status: null, hint: "Read the probe item back." },
        { name: "delete", ok: true, code: null, status: null, hint: "Deleted the probe item and map." },
      ];
    },
  };
}

function call(path, id = ownerId) {
  const headers = { origin: "https://example.test" };
  if (id) headers.cookie = `learner_session=${signSession({ id, last4: "0199", exp: Date.now() + 3_600_000 }, secret)}`;
  return new Request(`https://example.test${path}`, { headers });
}

before(() => {
  for (const key of envKeys) previous[key] = process.env[key];
  process.env.TWILIO_ACCOUNT_SID = fullSid;
  process.env.TWILIO_API_KEY_SID = keySid;
  process.env.TWILIO_API_KEY_SECRET = secretValue;
  process.env.TWILIO_SYNC_SERVICE_SID = syncSid;
  process.env.TWILIO_VERIFY_SERVICE_SID = verifySid;
  process.env.LEARNER_SESSION_SECRET = secret;
  process.env.LEARNER_ALLOWED_PHONES = "3055550199";
  delete process.env.TWILIO_DAILY_USAGE_TRIGGER_SID;
  console.error = (...args) => { logs.push(args.map((part) => String(part)).join(" ")); };
});

after(() => {
  console.error = originalError;
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

test("health passes every check and the response has no secrets", async () => {
  logs.length = 0;
  const client = fakeClient();
  const health = createHealthGet({ client, now: () => Date.parse("2026-11-21T18:00:00.000Z") });
  const res = await health(call("/api/learner/health"));
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body.checks.map((row) => row.name), ["config", "account", "sync service", "sync read", "verify service", "usage records", "usage trigger", "session"]);
  assert.equal(body.checks.every((row) => row.ok), true);
  assert.equal(body.checks.find((row) => row.name === "account").friendlyName, "My Lab");
  assert.equal(body.checks.find((row) => row.name === "account").sidLast4, "aaaa");
  const read = body.checks.find((row) => row.name === "sync read");
  assert.equal(read.quizAttempts, 1);
  assert.equal(read.mockAttempts, 1);
  assert.equal(read.memoryMisses, 1);
  assert.equal(read.mistakeRows, 1);
  assert.equal(read.dateUpdated, "2026-11-21T12:00:00.000Z");
  assert.equal(client.calls.includes("probe"), false);
  assert.equal(client.calls.some((name) => String(name).startsWith("learner-") && !String(name).includes("health-probe")), true);
  const text = JSON.stringify(body) + logs.join("\n");
  assertClean(text);
});

test("each Twilio check can fail without leaking the provider message", async () => {
  const cases = [
    ["account", { account: { status: 401, code: 20003 } }, "needs Auth Token or Main key"],
    ["sync service", { sync: { status: 404, code: 20404 } }, "The Sync service request failed."],
    ["sync read", { "sync read": { status: 500, code: 20500 } }, "The learner map request failed."],
    ["verify service", { verify: { status: 403, code: 20403 } }, "The Verify service request failed. No code was sent."],
    ["usage records", { usage: { status: 401, code: 20003 } }, "needs Auth Token or Main key"],
    ["usage trigger", { trigger: { status: 403, code: 20403 } }, "needs Auth Token or Main key"],
  ];
  process.env.TWILIO_DAILY_USAGE_TRIGGER_SID = `UT${"e".repeat(32)}`;
  try {
    for (const [name, fail, hint] of cases) {
      logs.length = 0;
      const client = fakeClient(fail);
      const health = createHealthGet({ client });
      const body = await (await health(call("/api/learner/health"))).json();
      const row = body.checks.find((item) => item.name === name);
      assert.equal(row.ok, false, name);
      assert.equal(row.hint, hint, name);
      assert.equal(row.code, Object.values(fail)[0].code, name);
      assert.equal(row.status, Object.values(fail)[0].status, name);
      assert.equal(logs.some((line) => line.startsWith("learner/health")), true, name);
      assertClean(JSON.stringify(body) + logs.join("\n"));
    }
  } finally {
    delete process.env.TWILIO_DAILY_USAGE_TRIGGER_SID;
  }
});

test("the write probe runs only with write=1 and stays off the learner map", async () => {
  const idle = fakeClient();
  const health = createHealthGet({ client: idle });
  await health(call("/api/learner/health"));
  assert.equal(idle.calls.includes("probe"), false);

  const writing = fakeClient();
  const probe = createHealthGet({ client: writing, now: () => 100 });
  const body = await (await probe(call("/api/learner/health?write=1"))).json();
  const row = body.checks.find((item) => item.name === "sync write");
  assert.equal(row.ok, true);
  assert.deepEqual(row.steps.map((step) => step.name), ["write", "read", "delete"]);
  assert.equal(writing.calls.includes("probe"), true);
  assert.equal(writing.calls.some((name) => String(name).includes("health-probe")), false);
  assertClean(JSON.stringify(body));

  const broken = fakeClient();
  broken.probe = async () => [{ name: "write", ok: false, code: 20500, status: 500, hint: "The probe write failed." }];
  logs.length = 0;
  const failed = await (await createHealthGet({ client: broken })(call("/api/learner/health?write=1"))).json();
  const write = failed.checks.find((item) => item.name === "sync write");
  assert.equal(write.ok, false);
  assert.equal(write.code, 20500);
  assertClean(JSON.stringify(failed) + logs.join("\n"));
});

test("a missing session or a bad config does not call Twilio", async () => {
  const client = fakeClient();
  const health = createHealthGet({ client });
  const signedOut = await health(call("/api/learner/health", ""));
  assert.equal(signedOut.status, 401);
  assert.equal(client.calls.length, 0);
  assertClean(JSON.stringify(await signedOut.json()));

  const saved = process.env.LEARNER_ALLOWED_PHONES;
  process.env.LEARNER_ALLOWED_PHONES = "not a number";
  try {
    const blocked = fakeClient();
    const res = await createHealthGet({ client: blocked })(call("/api/learner/health"));
    const body = await res.json();
    assert.equal(res.status, 503);
    assert.equal(body.checks.find((row) => row.name === "config").ok, false);
    assert.match(body.checks.find((row) => row.name === "config").hint, /LEARNER_ALLOWED_PHONES/);
    assert.equal(blocked.calls.length, 0);
    assertClean(JSON.stringify(body));
  } finally {
    process.env.LEARNER_ALLOWED_PHONES = saved;
  }
});

test("diagnostics skips account and usage when the key cannot call them", async () => {
  logs.length = 0;
  const seen = [];
  const client = {
    api: { v2010: { accounts: () => ({ fetch: async () => { seen.push("account"); throw Object.assign(new Error(leak), { status: 401, code: 20003 }); } }) } },
    sync: { v1: { services: () => ({ fetch: async () => { seen.push("sync"); return { friendlyName: "Study Sync" }; } }) } },
    usage: { records: { list: async () => { seen.push("usage"); throw Object.assign(new Error(leak), { status: 403, code: 20403 }); } } },
  };
  const { learnerConfig } = await import("../lib/learner/twilio.ts");
  const body = await readPublicDiagnostics(learnerConfig(), Date.parse("2026-11-21T00:00:00.000Z"), client);
  assert.deepEqual(seen, ["account", "sync", "usage"]);
  assert.equal(body.syncServiceFriendlyName, "Study Sync");
  assert.equal(body.sections.find((row) => row.call === "account").hint, "needs Auth Token or Main key");
  assert.equal(body.sections.find((row) => row.call === "usage").hint, "needs Auth Token or Main key");
  assert.equal(body.sections.find((row) => row.call === "sync").ok, true);
  assert.equal(body.accountSidLast4, "aaaa");
  assertClean(JSON.stringify(body));

  const diagnostics = createDiagnosticsGet({
    assertActive: async () => {},
    read: async () => body,
  });
  const shown = await (await diagnostics(call("/api/learner/diagnostics"))).json();
  assert.equal(logs.some((line) => line === "learner/diagnostics account 20003"), true);
  assert.equal(logs.some((line) => line === "learner/diagnostics usage 20403"), true);
  assertClean(JSON.stringify(shown) + logs.join("\n"));
});

test("a report failure names the sync list call and hides the provider message", async () => {
  logs.length = 0;
  const report = createReportGet({
    assertActive: async () => {},
    loadContent: async () => { throw new Error("should not load"); },
    readItems: async () => { throw Object.assign(new Error(leak), { status: 503, code: 20500 }); },
  });
  const res = await report(call("/api/learner/report?exam=saa-c03&days=30"));
  const body = await res.json();
  assert.equal(res.status, 502);
  assert.equal(body.error, "unavailable");
  assert.deepEqual(body.reason, { call: "sync list", code: 20500, status: 503 });
  assert.equal(logs.some((line) => line === "learner/report sync list 20500"), true);
  assertClean(JSON.stringify(body) + logs.join("\n"));
});

test("the probe map is separate and its hint does not copy the provider message", async () => {
  const names = [];
  const service = {
    syncMaps: Object.assign((name) => {
      names.push(name);
      return {
        syncMapItems: Object.assign(() => ({
          fetch: async () => { throw Object.assign(new Error(leak), { status: 404, code: 20404 }); },
          remove: async () => {},
        }), {
          create: async () => { throw Object.assign(new Error(leak), { status: 401, code: 20003 }); },
        }),
        remove: async () => {},
      };
    }, { create: async ({ uniqueName }) => { names.push(`create:${uniqueName}`); } }),
  };
  const steps = await probeHealthMap(service, 50);
  assert.equal(steps[0].hint, "The probe write failed.");
  assert.equal(steps[0].code, 20003);
  assert.equal(names.every((name) => name === HEALTH_PROBE_MAP || name === `create:${HEALTH_PROBE_MAP}`), true);
  assert.equal(names.some((name) => String(name).startsWith("learner-") && !String(name).includes("health-probe")), false);
  assertClean(JSON.stringify(steps));
});

test("the report page keeps a successful section when the other fails", () => {
  assert.deepEqual(sectionResult(200, {}), { ok: true });
  assert.equal("signedOut" in sectionResult(401, { error: "signed_out" }), true);
  assert.deepEqual(sectionResult(502, { error: "unavailable", reason: { call: "usage", code: 20003, status: 401 } }), {
    ok: false, key: "unavailable", call: "usage", code: 20003,
  });
  assert.equal(sectionResult(403, { error: "forbidden" }).key, "forbidden");
  assert.equal(sectionResult(429, { error: "rate_limited" }).key, "rateLimited");
});
