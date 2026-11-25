import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createDiagnosticsGet } from "../lib/learner/diagnostics-route.ts";
import { createReportGet } from "../lib/learner/report-route.ts";
import { sameOrigin } from "../lib/learner/api.ts";
import { createHealthGet } from "../lib/learner/health-route.ts";
import { learnerId, sessionCookie, signSession } from "../lib/learner/session.ts";

const secret = "q".repeat(32);
const phone = "+13055550199";
const ownerId = learnerId(phone, secret);
const envKeys = ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_SYNC_SERVICE_SID", "TWILIO_VERIFY_SERVICE_SID", "LEARNER_SESSION_SECRET", "LEARNER_ALLOWED_PHONES"];
const previous = {};

function cookie() {
  return `learner_session=${signSession({ id: ownerId, last4: "0199", exp: Date.now() + 3_600_000 }, secret)}`;
}

function get(path, headers = {}) {
  return new Request(`https://example.test${path}`, { headers: { cookie: cookie(), ...headers } });
}

function handlers() {
  const calls = [];
  return {
    calls,
    routes: {
      "/api/learner/report?exam=saa-c03&days=30": createReportGet({
        assertActive: async () => {},
        loadContent: async () => ({ questions: [], topics: [], objectives: { exams: [] }, concepts: {} }),
        readItems: async () => { calls.push("report"); return []; },
      }),
      "/api/learner/diagnostics": createDiagnosticsGet({
        assertActive: async () => {},
        read: async () => {
          calls.push("diagnostics");
          return {
            accountFriendlyName: "Lab", accountSidLast4: "aaaa", subaccount: false, parentFriendlyName: null,
            syncServiceFriendlyName: "Sync", accountMatchesCivicPath: false, parentMatchesCivicPath: false,
            usage: [], usageStart: "2026-11-01T00:00:00.000Z", usageEnd: "2026-11-21T00:00:00.000Z",
          };
        },
      }),
      "/api/learner/health": createHealthGet({
        client: {
          async fetchAccount() { calls.push("health"); return { friendlyName: "Lab" }; },
          async fetchSyncService() { return { friendlyName: "Sync" }; },
          async listLearner() { return []; },
          async fetchVerify() { return { friendlyName: "Verify" }; },
          async listUsage() {},
          async fetchTrigger() {},
          async probe() { throw new Error("GET must not write"); },
        },
      }),
    },
  };
}

before(() => {
  for (const key of envKeys) previous[key] = process.env[key];
  process.env.TWILIO_ACCOUNT_SID = `AC${"a".repeat(32)}`;
  process.env.TWILIO_API_KEY_SID = `SK${"b".repeat(32)}`;
  process.env.TWILIO_API_KEY_SECRET = "secret-value-not-for-output";
  process.env.TWILIO_SYNC_SERVICE_SID = `IS${"c".repeat(32)}`;
  process.env.TWILIO_VERIFY_SERVICE_SID = `VA${"d".repeat(32)}`;
  process.env.LEARNER_SESSION_SECRET = secret;
  process.env.LEARNER_ALLOWED_PHONES = "3055550199";
});

after(() => {
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

test("the session cookie is HttpOnly and SameSite=Lax, and Secure only on HTTPS", () => {
  const secure = sessionCookie("token", true);
  assert.match(secure, /HttpOnly/);
  assert.match(secure, /SameSite=Lax/);
  assert.match(secure, /Secure/);
  assert.equal(secure.includes("SameSite=Strict"), false);
  const local = sessionCookie("token", false);
  assert.match(local, /HttpOnly/);
  assert.match(local, /SameSite=Lax/);
  assert.equal(local.includes("Secure"), false);
});

test("POST still requires a matching Origin or Sec-Fetch-Site same-origin", () => {
  const url = "https://example.test/api/learner/sync";
  assert.equal(sameOrigin(new Request(url, { method: "POST" })), false);
  assert.equal(sameOrigin(new Request(url, { method: "GET" })), false);
  assert.equal(sameOrigin(new Request(url, { method: "GET", headers: { referer: "https://example.test/account/report" } })), false);
  assert.equal(sameOrigin(new Request(url, { method: "POST", headers: { referer: "https://example.test/account/report" } })), false);
  assert.equal(sameOrigin(new Request(url, { method: "POST", headers: { origin: "https://evil.test" } })), false);
  assert.equal(sameOrigin(new Request(url, { method: "POST", headers: { origin: "https://example.test" } })), true);
  assert.equal(sameOrigin(new Request(url, { method: "POST", headers: { "sec-fetch-site": "same-origin" } })), true);
});

test("owner GETs accept a real browser and reject a missing or cross-site fetch", async () => {
  const cases = [
    [{ "sec-fetch-site": "same-origin" }, 200],
    [{ referer: "https://example.test/account/report" }, 403],
    [{ "sec-fetch-site": "cross-site" }, 403],
    [{ origin: "https://evil.test" }, 403],
    [{}, 403],
  ];
  for (const [headers, status] of cases) {
    const { routes, calls } = handlers();
    for (const [path, handler] of Object.entries(routes)) {
      const before = calls.length;
      const response = await handler(get(path, headers));
      assert.equal(response.status, status, `${path} ${JSON.stringify(headers)}`);
      const body = await response.json();
      if (status === 403) {
        assert.deepEqual(body, { error: "forbidden" });
        assert.equal(calls.length, before, path);
      }
    }
  }
});
