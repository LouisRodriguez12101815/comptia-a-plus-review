import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { RoomService, EVIDENCE_WAIT } from "../lib/game/room-service.ts";
import { multiplayerIncidents, legacyDhcpIncident, learningFor } from "../lib/game/cooperative.ts";
import { roomRequest } from "../lib/game/room-api.ts";

class Store {
  data = null;
  async assertActive() {}
  async read() { return this.data; }
  async create(code, data) { if (this.data) return false; this.data = data; return true; }
  async compareAndSwap(code, previous, next) {
    if (previous !== this.data) return false;
    this.data = next; return true;
  }
}
const fails = (status) => (error) => error.status === status;
async function fixture(count = 2) {
  let now = 100000;
  const store = new Store();
  const service = () => new RoomService(store, multiplayerIncidents, { now: () => now, code: () => "ABC234" });
  const members = [await service().create("Host")];
  for (let i = 1; i < count; i++) members.push(await service().join("ABC234", `Player ${i}`));
  for (const member of members) await service().ready("ABC234", member.token, true);
  await service().start("ABC234", members[0].token); now += 5000;
  const view = (i = 0) => service().get("ABC234", members[i].token);
  const discover = (i = 0, step = 0) => service().discover("ABC234", members[i].token, step, 0);
  const answer = (i = 0, step = 0) => service().answer("ABC234", members[i].token, step, multiplayerIncidents[0].steps[step].correctAnswerId, 0);
  const resume = (i = 0, step = 0) => service().continueEvidence("ABC234", members[i].token, step, 0);
  const advance = (step = 0) => service().advance("ABC234", members[0].token, step, 0);
  return { store, service, members, view, discover, answer, resume, advance, tick: (ms) => { now += ms; }, now: () => now };
}

test("one player discovers all required evidence and can immediately submit and advance once", async () => {
  const f = await fixture(1);
  assert.equal((await f.view()).evidenceGate.canAnswer, false);
  const discovered = await f.discover();
  assert.ok(discovered.evidenceGate.items.every((i) => i.discovered));
  assert.equal(discovered.evidenceGate.canAnswer, true);
  assert.ok(discovered.evidenceGate.continueAvailableAt > f.now());
  const attempts = await Promise.allSettled([f.answer(), f.answer()]);
  assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
  const answered = await f.view();
  assert.equal(answered.room.players[0].contributions.answers, 100);
  assert.equal(answered.evidenceGate.canAdvance, true);
  await f.advance();
  assert.equal((await f.view()).room.score, 100);
  await assert.rejects(f.answer(), fails(409));
});

test("two players show missing evidence and owners, then both can answer without waiting for timeout", async () => {
  const f = await fixture();
  const first = await f.discover();
  const missing = first.evidenceGate.items.filter((i) => !i.discovered);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].owners[0].nickname, "Player 1");
  assert.equal(missing[0].owners[0].connected, true);
  assert.equal(first.evidenceGate.canAnswer, false);
  await assert.rejects(f.answer(), fails(409));
  const second = await f.discover(1);
  assert.equal(second.evidenceGate.canAnswer, true);
  assert.equal((await f.view()).evidenceGate.canAnswer, true);
  await f.answer(); await f.answer(1); await f.advance();
  assert.equal((await f.view()).room.stepIndex, 1);
});

test("redundant evidence owners do not block answering after every distinct item is discovered", async () => {
  const f = await fixture(3);
  await f.discover(); const ready = await f.discover(1);
  assert.ok(ready.evidenceGate.items.every((i) => i.discovered));
  assert.equal(ready.room.evidenceDiscoveries.length, 2);
  assert.equal(ready.evidenceGate.canAnswer, true);
  await f.answer();
  assert.equal((await f.view()).room.players[0].contributions.answers, 100);
  assert.equal((await f.view(2)).evidenceGate.canAnswer, false, "Every submitter still discovers their own evidence");
});

test("disconnected evidence owner remains visible and host can continue after timeout without awarding absent points", async () => {
  const f = await fixture(); await f.discover();
  f.tick(31000);
  const waiting = await f.view();
  const missing = waiting.evidenceGate.items.find((i) => !i.discovered);
  assert.equal(missing.owners[0].connected, false);
  assert.equal(waiting.evidenceGate.canAnswer, false);
  const continued = await f.resume();
  assert.equal(continued.evidenceGate.canAnswer, true);
  assert.equal(continued.room.players[1].score, 0);
  await f.answer(); await f.advance();
  assert.equal((await f.view()).room.stepIndex, 1);
  assert.equal((await f.view()).evidenceGate.continued, false);
  await assert.rejects(f.answer(0, 1), fails(409));
});

test("idle connected teammate cannot permanently block the host even while heartbeats continue", async () => {
  const f = await fixture(); await f.discover();
  f.tick(EVIDENCE_WAIT - 1); await f.view(1);
  await assert.rejects(f.resume(), fails(409));
  f.tick(1);
  const resumed = await f.resume();
  assert.equal(resumed.room.players[1].connected, true);
  assert.equal(resumed.evidenceGate.continued, true);
  assert.equal(resumed.evidenceGate.items.filter((i) => !i.discovered).length, 1);
  await f.answer();
  assert.equal((await f.view()).evidenceGate.canAdvance, true);
  await f.advance();
  assert.equal((await f.view()).room.score, 100);
});

test("idle answer submission after complete evidence has a host escape and never skips the host's answer", async () => {
  const f = await fixture(); await f.discover(); await f.discover(1);
  f.tick(EVIDENCE_WAIT); await f.view(1); await f.resume();
  await assert.rejects(f.advance(), fails(409));
  await f.answer(); await f.advance();
  assert.equal((await f.view()).room.stepIndex, 1);
  await assert.rejects(f.answer(1), fails(409), "Late answers cannot score on the next question");
});

test("host override validates membership, role, deadline, discovery, phase, and indices; retries give no points", async () => {
  const f = await fixture(); await f.discover(1);
  await assert.rejects(f.service().continueEvidence("ABC234", "invalid", 0, 0), fails(401));
  await assert.rejects(f.resume(1), fails(403));
  f.tick(EVIDENCE_WAIT);
  await assert.rejects(f.resume(), fails(409), "Host must discover first");
  await f.discover();
  await assert.rejects(f.service().continueEvidence("ABC234", f.members[0].token, 0, 1), fails(409));
  const before = await f.view();
  await Promise.all([f.resume(), f.resume(), f.resume()]);
  const after = await f.view();
  assert.equal(after.room.score, before.room.score);
  assert.deepEqual(after.room.players.map((p) => p.contributions), before.room.players.map((p) => p.contributions));
  await f.answer(); await f.advance();
  await assert.rejects(f.resume(), fails(409));
  await assert.rejects(f.resume(0, 1), fails(409), "Timeout is reset on the next phase");
});

test("leave makes the remaining player self-sufficient; reconnect keeps the override and existing points", async () => {
  const f = await fixture(); await f.discover();
  await f.service().leave("ABC234", f.members[1].token);
  assert.equal((await f.view()).evidenceGate.canAnswer, true);
  assert.ok((await f.view()).evidenceGate.items.every((i) => i.discovered));
  await f.answer(); await f.advance();
  const other = await fixture(); await other.discover(); other.tick(EVIDENCE_WAIT); await other.resume(); await other.answer();
  const rejoined = await other.service().join("ABC234", "Player 1", other.members[1].token);
  assert.equal(rejoined.snapshot.evidenceGate.continued, true);
  assert.equal(rejoined.snapshot.viewerId, other.members[1].snapshot.viewerId);
  assert.equal(rejoined.snapshot.evidenceGate.canAnswer, false);
  await other.discover(1); await other.answer(1);
  await assert.rejects(other.answer(), fails(409));
  await other.advance();
  assert.equal((await other.view()).room.score, 100);
});

test("HTTP host override uses authenticated cookies and the same authoritative timeout", async () => {
  // roomRequest uses the production clock, so shift the fixture's timestamps to Date.now().
  const f = await fixture(); await f.discover();
  const data = JSON.parse(f.store.data), shift = Date.now() - f.now();
  for (const key of ["createdAt", "updatedAt", "startsAt", "endsAt", "expiresAt", "evidenceContinueAt"]) data[key] += shift;
  data.players.forEach((p) => { p.lastSeenAt += shift; });
  f.store.data = JSON.stringify(data);
  const call = (token, payload = { incidentIndex: 0, stepIndex: 0 }) => roomRequest(new Request("https://example.test/api/game/rooms/ABC234/continue-evidence", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: `outage_ops_ABC234=${token}` }, body: JSON.stringify(payload),
  }), "continue-evidence", "ABC234", () => ({ store: f.store }));
  assert.equal((await call("invalid")).status, 401);
  assert.equal((await call(f.members[1].token)).status, 403);
  assert.equal((await call(f.members[0].token)).status, 409);
  data.evidenceContinueAt = Date.now() - 1; f.store.data = JSON.stringify(data);
  const response = await call(f.members[0].token);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).evidenceGate.canAnswer, true);
});

test("scenario source mappings exist, relay evidence matches the actual lab, and legacy rooms keep answer IDs", async () => {
  const labs = JSON.parse(await readFile(new URL("../content/labs.json", import.meta.url)));
  const topics = JSON.parse(await readFile(new URL("../content/topics.json", import.meta.url)));
  for (const incident of multiplayerIncidents) {
    for (const source of learningFor(incident).sources) {
      const item = source.path === "content/labs.json" ? labs.find((l) => source.href === `/labs/${l.slug}`) : topics.find((t) => source.href === `/notes/${t.id}`);
      assert.ok(item, source.href);
      for (const section of source.sections) assert.ok(item.sections.some((s) => s.id === section), section);
    }
  }
  const relaySource = labs.find((l) => l.slug === "dhcp-relay-three-site");
  assert.ok(JSON.stringify(relaySource).includes("194.168.50.0"));
  assert.ok(JSON.stringify(relaySource).includes("ip route 192.168.50.0 255.255.255.0 10.0.2.2"));
  assert.ok(relaySource.status.includes("lease test in progress"));
  const f = await fixture(1);
  const legacy = JSON.parse(f.store.data);
  legacy.incidentIndex = 1; legacy.incidentId = legacyDhcpIncident.id;
  legacy.answerOrders = legacyDhcpIncident.steps.map((s) => s.choices.map((c) => c.id));
  delete legacy.evidenceAssignments; delete legacy.evidenceContinueAt; delete legacy.evidenceContinued;
  f.store.data = JSON.stringify(legacy);
  const migrated = await f.view();
  assert.equal(migrated.incident.title, legacyDhcpIncident.title);
  assert.deepEqual(migrated.step.choices.map((c) => c.id), legacyDhcpIncident.steps[0].choices.map((c) => c.id));
  await f.service().discover("ABC234", f.members[0].token, 0, 1);
  const submitted = await f.service().answer("ABC234", f.members[0].token, 0, legacyDhcpIncident.steps[0].correctAnswerId, 1);
  assert.equal(submitted.room.selectedActions[0].correct, true);
});
