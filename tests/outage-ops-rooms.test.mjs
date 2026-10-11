import assert from "node:assert/strict";
import test from "node:test";
import twilio from "twilio";
import { RoomService } from "../lib/game/room-service.ts";
import { cantReachWebsiteIncident as incident } from "../lib/game/incidents.ts";
import { DailyUsageGuard, TwilioRoomStore, PAUSED_MESSAGE } from "../lib/game/room-store.ts";
import { handleUsageTrigger } from "../lib/game/usage-webhook.ts";

class Documents {
  values = new Map();
  revision = 0;
  writes = 0;
  async fetch(name) {
    const value = this.values.get(name);
    if (!value) throw Object.assign(new Error("Not found"), { status: 404 });
    return structuredClone(value);
  }
  async create(name, data, ttl) {
    if (this.values.has(name)) throw Object.assign(new Error("Conflict"), { status: 409 });
    this.values.set(name, { data: structuredClone(data), revision: String(++this.revision), ttl });
    this.writes++;
  }
  async update(name, data, revision, ttl) {
    if (this.values.get(name)?.revision !== revision) throw Object.assign(new Error("Stale revision"), { status: 412 });
    this.values.set(name, { data: structuredClone(data), revision: String(++this.revision), ttl });
    this.writes++;
  }
}

function fixture() {
  let now = Date.parse("2026-10-10T12:00:00Z");
  const documents = new Documents();
  const guard = new DailyUsageGuard(documents, () => now);
  const service = () => new RoomService(new TwilioRoomStore(documents, guard), incident, { now: () => now, code: () => "ABC234" });
  return { documents, guard, service, tick: (ms) => { now += ms; }, now: () => now };
}
const fails = (status, text) => (error) => error.status === status && (!text || error.message.includes(text));

async function players(f) {
  const host = await f.service().create("Laptop");
  const guest = await f.service().join("ABC234", "Phone");
  return { host, guest };
}
async function start(f, host, guest) {
  await f.service().ready("ABC234", host.token, true);
  if (guest) await f.service().ready("ABC234", guest.token, true);
  return f.service().start("ABC234", host.token);
}

test("create and join from separate service instances share the room and redact credentials", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  const view = await f.service().get("ABC234", host.token);
  assert.equal(view.room.code.length, 6);
  assert.equal(view.room.players.length, 2);
  assert.equal(view.room.hostPlayerId, host.snapshot.viewerId);
  assert.equal(view.room.players[1].id, guest.snapshot.viewerId);
  assert.equal(view.room.expiresAt - view.room.createdAt, 30 * 60_000);
  assert.equal(f.documents.values.get("outage-ops-room-ABC234").ttl, 1800);
  assert.ok(!JSON.stringify(view).includes("tokenHash"));
  await assert.rejects(f.service().get("ABC234", null), fails(401));
  await assert.rejects(f.service().join("NOT!", "Player"), fails(400));
});

test("duplicate names are rejected case-insensitively, including simultaneous joins", async () => {
  const f = fixture(); await f.service().create("Laptop");
  await assert.rejects(f.service().join("ABC234", " laptop "), fails(409, "already in use"));
  const results = await Promise.allSettled([f.service().join("ABC234", "Phone"), f.service().join("ABC234", "phone")]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal((await f.documents.fetch("outage-ops-room-ABC234")).data.players.length, 2);
});

test("host start requires everyone ready, supports unready and synchronizes deadlines", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await assert.rejects(f.service().start("ABC234", guest.token), fails(403));
  await assert.rejects(f.service().start("ABC234", host.token), fails(409));
  await f.service().ready("ABC234", host.token, true);
  await f.service().ready("ABC234", guest.token, true);
  await f.service().ready("ABC234", guest.token, false);
  await assert.rejects(f.service().start("ABC234", host.token), fails(409));
  const hostView = await start(f, host, guest);
  const phoneView = await f.service().get("ABC234", guest.token);
  assert.deepEqual(hostView.room, phoneView.room);
  assert.equal(hostView.room.phase, "briefing");
  f.tick(5000);
  const playing = await f.service().get("ABC234", guest.token);
  assert.equal(playing.room.phase, incident.steps[0].phase);
  assert.equal(playing.room.endsAt, hostView.room.endsAt);
  assert.equal(playing.room.selectedActions.length, 0, "No answers selected automatically");
  assert.ok(!JSON.stringify(playing.step).includes("correctAnswerId"));
});

test("answers use stable IDs, score once, and don't advance until the host chooses", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await start(f, host, guest); f.tick(5000);
  const step = incident.steps[0];
  const correct = await f.service().answer("ABC234", host.token, 0, step.correctAnswerId);
  assert.equal(correct.room.score, 100);
  assert.equal(correct.room.stepIndex, 0);
  assert.equal(correct.room.selectedActions[0].correct, true);
  await assert.rejects(f.service().answer("ABC234", host.token, 0, step.correctAnswerId), fails(409));
  await assert.rejects(f.service().advance("ABC234", host.token, 0), fails(409));
  const incorrectId = step.choices.find((choice) => choice.id !== step.correctAnswerId).id;
  const incorrect = await f.service().answer("ABC234", guest.token, 0, incorrectId);
  assert.equal(incorrect.room.score, 100);
  assert.equal(incorrect.room.stepIndex, 0);
  assert.ok(incorrect.room.selectedActions[1].explanation);
  assert.equal((await f.service().advance("ABC234", host.token, 0)).room.stepIndex, 1);
  await assert.rejects(f.service().answer("ABC234", guest.token, 0, incorrectId), fails(409));
});

test("concurrent readiness and answers preserve both writes with revision retries", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await Promise.all([host, guest].map((p) => f.service().ready("ABC234", p.token, true)));
  assert.ok((await f.service().get("ABC234", host.token)).room.players.every((p) => p.ready));
  await f.service().start("ABC234", host.token); f.tick(5000);
  await Promise.all([host, guest].map((p) => f.service().answer("ABC234", p.token, 0, incident.steps[0].correctAnswerId)));
  assert.equal((await f.service().get("ABC234", host.token)).room.score, 200);
});

test("rooms expire after 30 minutes regardless of activity, and invalid codes fail gracefully", async () => {
  const f = fixture(); const host = await f.service().create("Laptop");
  f.tick(29 * 60_000); await f.service().get("ABC234", host.token);
  assert.equal(f.documents.values.get("outage-ops-room-ABC234").ttl, 60);
  f.tick(60_000);
  await assert.rejects(f.service().get("ABC234", host.token), fails(410));
  await assert.rejects(f.service().join("ABC234", "Phone"), fails(410));
  await assert.rejects(f.service().get("ZZZ999", host.token), fails(404));
});

test("reconnect preserves player identity, readiness, scores and answer state", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await start(f, host, guest); f.tick(5000);
  await f.service().answer("ABC234", guest.token, 0, incident.steps[0].correctAnswerId);
  f.tick(31_000);
  assert.equal((await f.service().get("ABC234", host.token)).room.players[1].connected, false);
  const resume = await f.service().join("ABC234", "Phone", guest.token);
  assert.equal(resume.snapshot.viewerId, guest.snapshot.viewerId);
  assert.equal(resume.snapshot.room.players.length, 2);
  assert.equal(resume.snapshot.room.players[1].score, 100);
  assert.equal(resume.snapshot.room.players[1].ready, true);
  assert.equal(resume.snapshot.room.players[1].connected, true);
  assert.equal(resume.snapshot.room.selectedActions.length, 1);
});

test("leave transfers host and revokes room membership; empty rooms expire", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await f.service().leave("ABC234", host.token);
  const view = await f.service().get("ABC234", guest.token);
  assert.equal(view.room.hostPlayerId, guest.snapshot.viewerId);
  await assert.rejects(f.service().get("ABC234", host.token), fails(401));
  await f.service().leave("ABC234", guest.token);
  await assert.rejects(f.service().get("ABC234", guest.token), fails(410));
});

test("timer expiry is authoritative on every device", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await start(f, host, guest); f.tick(125_000);
  const view = await f.service().get("ABC234", guest.token);
  assert.equal(view.room.result, "timeout");
  assert.equal(view.room.phase, "debrief");
  await assert.rejects(f.service().answer("ABC234", host.token, 0, incident.steps[0].correctAnswerId), fails(409));
});

test("daily pause blocks creation, joins and every room write across server instances", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await start(f, host, guest); f.tick(5000);
  await f.guard.pause("2026-10-10", 5);
  const writes = f.documents.writes;
  const operations = [
    () => f.service().create("Other"), () => f.service().join("ABC234", "Phone", guest.token),
    () => f.service().ready("ABC234", host.token, true),
    () => f.service().answer("ABC234", host.token, 0, incident.steps[0].correctAnswerId),
    () => f.service().leave("ABC234", guest.token),
  ];
  await assert.rejects(operations[0](), fails(423, PAUSED_MESSAGE));
  await assert.rejects(operations[1](), fails(423, PAUSED_MESSAGE));
  await assert.rejects(operations[2](), fails(423, PAUSED_MESSAGE));
  await assert.rejects(operations[3](), fails(423, PAUSED_MESSAGE));
  await assert.rejects(operations[4](), fails(423, PAUSED_MESSAGE));
  assert.equal(f.documents.writes, writes);
  await assert.rejects(f.guard.assertActive(), fails(423));
  await f.guard.pause("2026-10-09", 6); // late/replayed callbacks never unpause today
  await assert.rejects(f.guard.assertActive(), fails(423));
  f.tick(12 * 60 * 60_000);
  await f.guard.assertActive(); // UTC daily reset, no environment-variable mutation
});

test("guard fails closed on provider errors; CAS detects stale revisions", async () => {
  const documents = new Documents();
  const guard = new DailyUsageGuard(documents);
  const a = new TwilioRoomStore(documents, guard), b = new TwilioRoomStore(documents, guard);
  assert.equal(await a.create("ABC234", '{"version":1}', 1800), true);
  assert.equal(await a.create("ABC234", '{"version":1}', 1800), false);
  const previous = await a.read("ABC234"); await b.read("ABC234");
  assert.equal(await b.compareAndSwap("ABC234", previous, '{"version":2}', 1800), true);
  assert.equal(await a.compareAndSwap("ABC234", previous, '{"version":3}', 1800), false);
  documents.fetch = async () => { throw new Error("Provider unavailable"); };
  await assert.rejects(a.create("XYZ234", "{}", 1800), /Provider unavailable/);
});

// These are synthetic signing fixtures, not real credentials or usable Twilio accounts.
const config = { accountSid: "test-account", authToken: "test-signing-key", webhookUrl: "https://example.invalid/api/game/usage-trigger", triggerSid: "test-trigger" };
function callback(overrides = {}, signed = true) {
  const params = { AccountSid: config.accountSid, UsageTriggerSid: config.triggerSid, CurrentValue: "5", DateFired: "2026-10-10T12:00:00Z", TriggerBy: "price", UsageCategory: "totalprice", ...overrides };
  return new Request(config.webhookUrl, { method: "POST", headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Twilio-Signature": signed ? twilio.getExpectedTwilioSignature(config.authToken, config.webhookUrl, params) : "invalid",
  }, body: new URLSearchParams(params) });
}
test("signed webhook pauses at $5, rejects tampering, and doesn't pause below $5", async () => {
  const f = fixture(); const settings = { ...config, guard: f.guard };
  await handleUsageTrigger(callback({ CurrentValue: "4.99" }), settings, f.now());
  await f.guard.assertActive();
  await assert.rejects(handleUsageTrigger(callback({}, false), settings, f.now()), fails(403));
  await assert.rejects(handleUsageTrigger(callback({ UsageTriggerSid: "other" }), settings, f.now()), fails(403));
  await assert.rejects(handleUsageTrigger(callback({ CurrentValue: "NaN" }), settings, f.now()), fails(400));
  await handleUsageTrigger(callback(), settings, f.now());
  await assert.rejects(f.guard.assertActive(), fails(423));
  const writes = f.documents.writes;
  await handleUsageTrigger(callback(), settings, f.now());
  assert.equal(f.documents.writes, writes, "Duplicate callbacks do not write repeatedly");
});

test("a delayed previous-day webhook doesn't pause the current UTC day", async () => {
  const f = fixture();
  await handleUsageTrigger(callback({ DateFired: "2026-10-09T23:59:59Z" }), { ...config, guard: f.guard }, f.now());
  await f.guard.assertActive();
});

test("eight-player full mission fits document limits and awards consistent final scores", async () => {
  const f = fixture(); const host = await f.service().create("Host");
  const members = [host];
  for (let i = 1; i < 8; i++) members.push(await f.service().join("ABC234", `Player ${i}`));
  await assert.rejects(f.service().join("ABC234", "Ninth"), fails(409, "full"));
  for (const member of members) await f.service().ready("ABC234", member.token, true);
  await f.service().start("ABC234", host.token); f.tick(5000);
  for (let stepIndex = 0; stepIndex < incident.steps.length; stepIndex++) {
    for (const member of members) await f.service().answer("ABC234", member.token, stepIndex, incident.steps[stepIndex].correctAnswerId);
    await f.service().advance("ABC234", host.token, stepIndex);
  }
  const view = await f.service().get("ABC234", host.token);
  assert.equal(view.room.result, "resolved");
  assert.equal(view.room.score, 4000);
  assert.ok(view.room.players.every((p) => p.score === 500));
  assert.ok(Buffer.byteLength(JSON.stringify((await f.documents.fetch("outage-ops-room-ABC234")).data)) < 16384);
});

test("paused lobby rejects readiness, host start, permission gate and heartbeat writes", async () => {
  const f = fixture(); const { host, guest } = await players(f);
  await f.service().ready("ABC234", host.token, true);
  await f.service().ready("ABC234", guest.token, true);
  await f.guard.pause("2026-10-10", 5); f.tick(10_000);
  const writes = f.documents.writes;
  await assert.rejects(f.service().ready("ABC234", guest.token, false), fails(423));
  await assert.rejects(f.service().start("ABC234", host.token), fails(423));
  await assert.rejects(f.service().get("ABC234", host.token), fails(423));
  await assert.rejects(f.guard.assertActive(), fails(423)); // Same gate used before permission writes.
  assert.equal(f.documents.writes, writes);
});

test("unconfigured API explicitly reports unavailable multiplayer and preserves cache privacy", async () => {
  const { roomRequest } = await import("../lib/game/room-api.ts");
  const previous = process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_ACCOUNT_SID;
  try {
    const response = await roomRequest(new Request("https://example.invalid/api/game/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname: "Laptop" }),
    }), "create");
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /Multiplayer service not configured/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.get("set-cookie"), null);
    const proxyResponse = await roomRequest(new Request("http://localhost:3011/api/game/rooms", {
      method: "POST", headers: { "Content-Type": "application/json", Host: "127.0.0.1:3011", Origin: "http://127.0.0.1:3011" }, body: JSON.stringify({ nickname: "Laptop" }),
    }), "create");
    assert.equal(proxyResponse.status, 503, "Accept same-origin requests when Next uses an internal request hostname");
  } finally {
    if (previous !== undefined) process.env.TWILIO_ACCOUNT_SID = previous;
  }
});

test("HTTP membership, cookies, read-only tokens, ACL enforcement and pause protect every API", async (t) => {
  const { roomRequest } = await import("../lib/game/room-api.ts");
  const f = fixture(); f.tick(Date.now() - f.now());
  t.mock.method(Date, "now", () => f.now());
  let aclEnabled = true;
  const permissions = [];
  const infrastructure = () => ({
    ...config, keySid: "test-key", keySecret: "test-secret", serviceSid: "test-service",
    guard: f.guard, store: new TwilioRoomStore(f.documents, f.guard),
    service: {
      fetch: async () => ({ aclEnabled }),
      documents: (name) => ({ documentPermissions: (identity) => ({ update: async (value) => { permissions.push({ name, identity, ...value }); } }) }),
    },
  });
  let actualCode = "ABC234";
  const api = (operation, cookie = "", payload = {}, code = actualCode, origin = "https://example.invalid") => roomRequest(new Request(`https://example.invalid/api/game/rooms/${code}`, {
    method: operation === "get" ? "GET" : "POST", headers: { "Content-Type": "application/json", Cookie: cookie, Origin: origin },
    body: operation === "get" ? undefined : JSON.stringify(payload),
  }), operation, code, infrastructure);
  assert.equal((await api("create", "", { nickname: "Laptop" }, "", "https://attacker.invalid")).status, 403);
  const response = await api("create", "", { nickname: "Laptop" }, "");
  assert.equal(response.status, 201);
  actualCode = (await response.json()).room.code;
  const cookieHeader = response.headers.get("set-cookie");
  assert.match(cookieHeader, /HttpOnly; SameSite=Lax; Path=\/api\/game\/rooms\/[A-Z2-9]{6}; Max-Age=1800; Secure/);
  const cookie = cookieHeader.split(";")[0];
  assert.equal((await api("token")).status, 401);
  assert.equal(permissions.length, 0);
  aclEnabled = false;
  assert.equal((await api("token", cookie)).status, 503);
  assert.equal(permissions.length, 0);
  aclEnabled = true;
  const tokenResponse = await api("token", cookie);
  assert.equal(tokenResponse.status, 200);
  const credentials = await tokenResponse.json();
  const claims = JSON.parse(Buffer.from(credentials.token.split(".")[1], "base64url").toString());
  assert.equal(claims.grants.data_sync.service_sid, "test-service");
  assert.equal(credentials.document, `outage-ops-room-${actualCode}`);
  assert.equal(credentials.renewable, true);
  assert.deepEqual(permissions.map(({ read, write, manage }) => ({ read, write, manage })), [{ read: true, write: false, manage: false }]);
  f.tick(28 * 60_000);
  const finalCredentials = await (await api("token", cookie)).json();
  assert.equal(finalCredentials.renewable, false, "A token covering the remaining room lifetime must not be renewed in a loop");
  const finalClaims = JSON.parse(Buffer.from(finalCredentials.token.split(".")[1], "base64url").toString());
  assert.ok(finalClaims.exp - finalClaims.iat <= 120);
  assert.equal((await api("ready", cookie, { ready: true })).status, 200);
  await f.guard.pause(new Date(f.now()).toISOString().slice(0, 10), 5);
  const writes = f.documents.writes, permissionWrites = permissions.length;
  for (const operation of ["create", "join", "get", "ready", "start", "answer", "advance", "leave", "token"]) {
    const blocked = await api(operation, cookie, { nickname: "Phone", ready: true, stepIndex: 0, answerId: incident.steps[0].correctAnswerId });
    assert.equal(blocked.status, 423, operation);
    assert.equal((await blocked.json()).error, PAUSED_MESSAGE);
  }
  assert.equal(f.documents.writes, writes);
  assert.equal(permissions.length, permissionWrites);
});
