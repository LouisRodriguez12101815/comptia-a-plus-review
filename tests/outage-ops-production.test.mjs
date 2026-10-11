import assert from "node:assert/strict";
import test from "node:test";
import { providerFailure, syncCall } from "../lib/game/provider-errors.ts";
import { syncInfrastructure, syncServiceVerifier, TwilioRoomStore, DailyUsageGuard } from "../lib/game/room-store.ts";
import { roomRequest } from "../lib/game/room-api.ts";
import { GET as tokenGET } from "../app/api/game/rooms/[code]/token/route.ts";
import { probeRooms } from "../scripts/probe-outage-ops.mjs";

const secretMarker = "test-secret-must-not-appear";
const upstream = (status, code) => Object.assign(new Error(secretMarker), { status, code, headers: { Authorization: secretMarker }, body: secretMarker, stack: secretMarker });

test("public probe reports sanitized diagnostics without response bodies, cookies, or tokens", async () => {
  const reports = [], requests = [];
  await probeRooms("https://example.test", { report: (v) => reports.push(v), fetchImpl: async (url, options) => {
    requests.push([url.pathname, options.method]);
    return new Response(JSON.stringify({ error: secretMarker, token: secretMarker, diagnostic: { reason: "authentication_rejected", stage: "service.fetch", providerStatus: 401, providerCode: 20003, variables: ["TWILIO_API_KEY_SECRET", secretMarker] } }), { status: 503, headers: { "set-cookie": secretMarker } });
  } });
  assert.ok(!JSON.stringify(reports).includes(secretMarker));
  assert.equal(reports[0].providerStatus, 401);
  assert.deepEqual(reports[0].variables, ["TWILIO_API_KEY_SECRET"]);
  assert.ok(requests.some(([path, method]) => path.endsWith("/token") && method === "GET"));
  assert.ok(requests.slice(1).every(([path]) => path.includes("/INVALID")));
});

test("public probe distinguishes transport failure and rejects credential-bearing URLs", async () => {
  const reports = [];
  await probeRooms("https://example.test", { report: (v) => reports.push(v), fetchImpl: async () => { throw new Error(secretMarker); } });
  assert.equal(reports[0].status, null);
  assert.equal(reports[0].reason, "network_or_proxy_failure");
  assert.ok(!JSON.stringify(reports).includes(secretMarker));
  await assert.rejects(probeRooms("https://user:password@example.test"));
  await assert.rejects(probeRooms("http://example.test"));
});

for (const [status, code, reason] of [[401, 20003, "authentication_rejected"], [403, 20403, "permission_denied"], [404, 20404, "service_not_found"], [429, 20429, "rate_limited"], [500, 20500, "provider_unavailable"]]) {
  test(`provider ${status}/${code} yields sanitized HTTP 503 with exact upstream status/code`, async () => {
    const logs = [], original = console.error;
    console.error = (...args) => logs.push(args);
    try {
      const response = await roomRequest(new Request("https://example.test/api/game/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname: "Tester" }) }), "create", "", () => { throw providerFailure(upstream(status, code), "service.fetch"); });
      assert.equal(response.status, 503);
      const value = await response.json();
      assert.equal(value.diagnostic.reason, reason);
      assert.equal(value.diagnostic.providerStatus, status);
      assert.equal(value.diagnostic.providerCode, code);
      assert.equal(value.requestId, response.headers.get("X-Outage-Ops-Request-Id"));
      assert.ok(!JSON.stringify([value, logs]).includes(secretMarker));
      assert.equal(logs[0][0], "outage_ops_room_failure");
    } finally { console.error = original; }
  });
}

test("network and unexpected failures never expose provider text, headers, URLs or stack traces", () => {
  for (const [code, reason] of [["ETIMEDOUT", "network_failure"], [secretMarker, "unexpected_failure"], [NaN, "unexpected_failure"]]) {
    const failure = providerFailure(upstream(undefined, code), "documents.fetch");
    assert.equal(failure.diagnostic.reason, reason);
    assert.ok(!JSON.stringify(failure).includes(secretMarker));
    assert.ok(!failure.message.includes(secretMarker));
    assert.equal(failure.diagnostic.providerCode, undefined);
  }
});

test("service verification uses API-key fetch, checks account equality, and doesn't confuse missing service with missing daily document", async () => {
  let reads = 0;
  const verifier = syncServiceVerifier({ fetch: async () => { reads++; return { accountSid: "same-account", aclEnabled: true }; } }, "same-account");
  await Promise.all([verifier(), verifier()]); assert.equal(reads, 1);
  await assert.rejects(syncServiceVerifier({ fetch: async () => ({ accountSid: secretMarker, aclEnabled: true }) }, "different-account")(), (e) => e.status === 503 && e.diagnostic.reason === "account_mismatch" && !e.message.includes(secretMarker));
  const missing = syncServiceVerifier({ fetch: async () => { throw upstream(404, 20404); } }, "account");
  const documents = { fetch: async () => { await missing(); } };
  await assert.rejects(new DailyUsageGuard(documents).assertActive(), (e) => e.status === 503 && e.diagnostic.providerStatus === 404 && e.diagnostic.reason === "service_not_found");
  await assert.rejects(syncServiceVerifier({ fetch: async () => { throw upstream(403, 20403); } }, "account")(), (e) => e.diagnostic.reason === "permission_denied");
});

test("normal missing documents and CAS conflicts keep their existing semantics", async () => {
  for (const status of [404, 409, 412]) {
    const error = upstream(status, 20404);
    await assert.rejects(syncCall("documents.fetch", async () => { throw error; }, [404, 409, 412]), (e) => e === error);
  }
  const guard = new DailyUsageGuard({ fetch: async () => { throw upstream(404, 20404); } });
  await guard.assertActive();
});

test("seven variable names are checked without values; malformed resource identifiers identify only the names", () => {
  const names = ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_SYNC_SERVICE_SID", "TWILIO_AUTH_TOKEN", "TWILIO_USAGE_WEBHOOK_URL", "TWILIO_DAILY_USAGE_TRIGGER_SID"];
  const saved = new Map(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.throws(syncInfrastructure, (e) => e.status === 503 && e.diagnostic.reason === "configuration_missing" && e.diagnostic.variables.length === 7);
    for (const name of names) process.env[name] = secretMarker;
    assert.throws(syncInfrastructure, (e) => e.status === 503 && e.diagnostic.reason === "configuration_invalid" && e.diagnostic.variables.includes("TWILIO_SYNC_SERVICE_SID") && !JSON.stringify(e).includes(secretMarker));
  } finally { for (const [name, value] of saved) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } }
});

class Documents {
  values = new Map(); revision = 0;
  async fetch(name) { if (!this.values.has(name)) throw upstream(404, 20404); return structuredClone(this.values.get(name)); }
  async create(name, data) { if (this.values.has(name)) throw upstream(409, 20409); this.values.set(name, { data: structuredClone(data), revision: String(++this.revision) }); }
  async update(name, data, revision) { if (this.values.get(name)?.revision !== revision) throw upstream(412, 20412); this.values.set(name, { data: structuredClone(data), revision: String(++this.revision) }); }
}

test("HTTP two-player regression: stored assignments are actionable, discovery validates owners, GET token works, and disconnect stops blocking", async () => {
  const documents = new Documents(), guard = new DailyUsageGuard(documents), permissionWrites = [];
  const infra = () => ({ store: new TwilioRoomStore(documents, guard), guard,
    service: { fetch: async () => ({ aclEnabled: true }), documents: () => ({ documentPermissions: () => ({ update: async (value) => { permissionWrites.push(value); } }) }) },
    accountSid: "test-account", keySid: "test-key", keySecret: "test-signing-key", serviceSid: "test-service" });
  let code = "";
  const api = (operation, cookie = "", payload = {}, method = "POST") => roomRequest(new Request(`https://example.test/api/game/rooms/${code}`, { method, headers: { "Content-Type": "application/json", Cookie: cookie }, body: method === "GET" ? undefined : JSON.stringify(payload) }), operation, code, infra);
  const created = await api("create", "", { nickname: "Player A" }); assert.equal(created.status, 201);
  const aCookie = created.headers.get("set-cookie").split(";")[0]; code = (await created.json()).room.code;
  const joined = await api("join", "", { nickname: "Player B" }); assert.equal(joined.status, 200);
  const bCookie = joined.headers.get("set-cookie").split(";")[0];
  await api("ready", aCookie, { ready: true }); await api("ready", bCookie, { ready: true }); await api("start", aCookie);
  const document = documents.values.get(`outage-ops-room-${code}`); document.data.startsAt = Date.now() - 1;
  const a = await (await api("get", aCookie, {}, "GET")).json(), b = await (await api("get", bCookie, {}, "GET")).json();
  for (const snapshot of [a, b]) {
    assert.equal(snapshot.step.assignedEvidence.length, 1);
    assert.ok(snapshot.step.assignedEvidence[0].id && snapshot.step.assignedEvidence[0].label);
    assert.ok(document.data.evidenceAssignments.some((assignment) => assignment.playerId === snapshot.viewerId && assignment.itemIds.includes(snapshot.step.assignedEvidence[0].id)));
  }
  const indices = { incidentIndex: 0, stepIndex: 0 };
  assert.equal((await api("discover", aCookie, { ...indices, itemId: b.step.assignedEvidence[0].id })).status, 403);
  await api("discover", aCookie, { ...indices, itemId: a.step.assignedEvidence[0].id });
  assert.equal((await api("answer", aCookie, { ...indices, answerId: a.step.choices[0].id })).status, 409);
  const discovered = await (await api("discover", bCookie, { ...indices, itemId: b.step.assignedEvidence[0].id })).json();
  assert.ok(discovered.step.assignedEvidence[0].text);
  assert.equal(discovered.evidenceGate.canAnswer, true);
  const token = await api("token", bCookie, {}, "GET"); assert.equal(token.status, 200);
  assert.equal((await token.json()).document, `outage-ops-room-${code}`);
  assert.deepEqual(permissionWrites[0], { read: true, write: false, manage: false });
  assert.equal((await api("token", "", {}, "GET")).status, 401);
  const crossSite = await roomRequest(new Request("https://example.test/token", { headers: { "sec-fetch-site": "cross-site", Cookie: bCookie } }), "token", code, infra);
  assert.equal(crossSite.status, 403);
  const current = documents.values.get(`outage-ops-room-${code}`);
  current.data.discoveredEvidenceIds = [a.step.assignedEvidence[0].id];
  current.data.players[1].lastSeenAt = Date.now() - 31000;
  const afterDisconnect = await (await api("get", aCookie, {}, "GET")).json();
  assert.equal(afterDisconnect.evidenceGate.canAnswer, true);
  assert.equal(afterDisconnect.room.players[1].evidenceStatus.state, "disconnected");
  assert.equal((await api("answer", aCookie, { ...indices, answerId: a.step.choices[0].id })).status, 200);
  assert.equal((await api("answer", aCookie, { ...indices, answerId: a.step.choices[0].id })).status, 409);
  assert.equal(typeof tokenGET, "function");
});
