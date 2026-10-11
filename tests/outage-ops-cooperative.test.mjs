import assert from "node:assert/strict";
import test from "node:test";
import { RoomService } from "../lib/game/room-service.ts";
import { multiplayerIncidents, roleFor } from "../lib/game/cooperative.ts";
import { TwilioRoomStore, DailyUsageGuard } from "../lib/game/room-store.ts";

class Store {
  data = null;
  paused = false;
  async assertActive() { if (this.paused) throw Object.assign(new Error("paused"), { status: 423 }); }
  async read() { return this.data; }
  async create(code, data) { await this.assertActive(); if (this.data) return false; this.data = data; return true; }
  async compareAndSwap(code, previous, next) {
    await this.assertActive(); if (previous !== this.data) return false; this.data = next; return true;
  }
}
async function fixture(count = 2) {
  let now = 100000;
  const store = new Store();
  const service = () => new RoomService(store, multiplayerIncidents, { now: () => now, code: () => "ABC234" });
  const members = [await service().create("Host")];
  for (let i = 1; i < count; i++) members.push(await service().join("ABC234", `Player ${i}`));
  for (const p of members) await service().ready("ABC234", p.token, true);
  await service().start("ABC234", members[0].token);
  const tick = (ms) => { now += ms; }; tick(5000);
  const view = () => service().get("ABC234", members[0].token);
  const discover = async (step, incident = 0) => {
    for (const p of members) await service().discover("ABC234", p.token, step, incident);
  };
  const answer = (p, step, incident = 0, id = multiplayerIncidents[incident].steps[step].correctAnswerId) =>
    service().answer("ABC234", p.token, step, id, incident);
  const advance = (step, incident = 0) => service().advance("ABC234", members[0].token, step, incident);
  return { service, store, members, tick, now: () => now, view, discover, answer, advance };
}
const rejects = (status) => (error) => error.status === status;

test("private complementary evidence gates answers and discovery retries cannot farm points", async () => {
  const f = await fixture(); const [host, guest] = f.members;
  const initial = await f.view();
  assert.equal(initial.step.evidence, undefined);
  assert.equal(initial.step.hint, null);
  await assert.rejects(f.answer(host, 0), rejects(409));
  const a = await f.service().discover("ABC234", host.token, 0, 0);
  await assert.rejects(f.answer(host, 0), rejects(409));
  const b = await f.service().discover("ABC234", guest.token, 0, 0);
  assert.notEqual(a.step.evidence, b.step.evidence);
  assert.equal(a.room.players[0].contributions.evidence, 10);
  await Promise.all(Array.from({ length: 4 }, () => f.service().discover("ABC234", host.token, 0, 0)));
  assert.equal((await f.view()).room.players[0].score, 10);
  assert.ok(!JSON.stringify(JSON.parse(f.store.data)).includes(a.step.evidence));
  assert.ok(!JSON.stringify(JSON.parse(f.store.data)).includes(b.step.evidence));
  const solo = await fixture(1); await solo.discover(0);
  assert.ok((await solo.view()).step.evidence.includes(a.step.evidence));
  assert.ok((await solo.view()).step.evidence.includes(b.step.evidence));
});

test("team scoring is independent of team size; contributions reward evidence, role action, answers, and resolution", async () => {
  for (const count of [1, 2, 8]) {
    const f = await fixture(count);
    for (let step = 0; step < 5; step++) {
      await f.discover(step);
      for (const [index, p] of f.members.entries()) {
        await f.service().usefulAction("ABC234", p.token, step, roleFor(index, 0).actionId, 0);
        await f.answer(p, step);
      }
      await f.advance(step);
    }
    const snapshot = await f.view();
    assert.equal(snapshot.room.score, 1200);
    assert.equal(snapshot.room.result, "resolved");
    for (const p of snapshot.room.players) {
      assert.deepEqual(p.contributions, { evidence: 50, actions: 100, answers: 500, resolution: 25 });
      assert.equal(p.score, 675);
    }
    assert.equal(snapshot.debrief.uptimeScore, 1000);
    assert.equal(snapshot.debrief.teamOutcome, "resolved");
    assert.ok(Buffer.byteLength(f.store.data) < 16384);
  }
});

test("shared hints charge exactly once under concurrency and do not alter individual credit", async () => {
  const f = await fixture(); await f.discover(0);
  await Promise.all(f.members.map((p) => f.service().hint("ABC234", p.token, 0, 0)));
  const hinted = await f.view();
  assert.equal(hinted.room.score, -25);
  assert.equal(hinted.room.hintPenalties, 25);
  assert.equal(hinted.room.hintsUsed, 1);
  assert.ok(hinted.step.hint);
  assert.equal((await f.service().get("ABC234", f.members[1].token)).step.hint, hinted.step.hint);
  for (const p of f.members) await f.answer(p, 0);
  const next = await f.advance(0);
  assert.equal(next.room.score, 75);
  assert.equal(next.room.hintUsed, false);
  assert.equal(next.step.hint, null);
  assert.ok(next.room.players.every((p) => p.contributions.answers === 100));
  await assert.rejects(f.service().hint("ABC234", f.members[0].token, 0, 0), rejects(409));
});

test("streaks multiply clean decisions, cap at three, and mistakes reset them with uptime and time penalties", async () => {
  const f = await fixture();
  for (let step = 0; step < 3; step++) {
    await f.discover(step);
    for (const p of f.members) await f.answer(p, step);
    await f.advance(step);
  }
  const before = await f.view();
  assert.equal(before.room.score, 600); assert.equal(before.room.streak, 3);
  await f.discover(3);
  const wrong = multiplayerIncidents[0].steps[3].choices.find((c) => c.id !== multiplayerIncidents[0].steps[3].correctAnswerId).id;
  await f.answer(f.members[0], 3, 0, wrong);
  const penalty = await f.view();
  assert.equal(penalty.room.streak, 0); assert.equal(penalty.room.uptime, 95);
  assert.equal(penalty.room.endsAt, before.room.endsAt - 5000);
  await f.answer(f.members[1], 3);
  assert.equal((await f.advance(3)).room.score, 650);
  await f.discover(4); for (const p of f.members) await f.answer(p, 4);
  const final = await f.advance(4);
  assert.equal(final.room.score, 750); assert.equal(final.room.streak, 1);
  assert.equal(final.room.bestStreak, 3);
  assert.equal(final.room.outcomes[0].mistakes, 1);
  assert.ok(final.debrief.reviewTopics.includes("DNS configuration and name resolution"));
});

test("role actions reject another role and duplicate submissions never earn points or repeat penalties", async () => {
  const f = await fixture(); const [host, guest] = f.members;
  await assert.rejects(f.service().usefulAction("ABC234", host.token, 0, roleFor(0, 0).actionId, 0), rejects(409));
  await f.discover(0);
  await assert.rejects(f.service().usefulAction("ABC234", host.token, 0, roleFor(1, 0).actionId, 0), rejects(400));
  const attempts = await Promise.allSettled([1, 2].map(() => f.service().usefulAction("ABC234", host.token, 0, roleFor(0, 0).actionId, 0)));
  assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
  await f.service().usefulAction("ABC234", guest.token, 0, "restart-shared-equipment", 0);
  const before = await f.view();
  await assert.rejects(f.service().usefulAction("ABC234", guest.token, 0, "restart-shared-equipment", 0), rejects(409));
  for (const p of f.members) await f.answer(p, 0);
  const submissions = await Promise.allSettled([1, 2].map(() => f.advance(0)));
  assert.equal(submissions.filter((r) => r.status === "fulfilled").length, 1);
  const after = await f.view();
  assert.equal(after.room.score, 50); assert.equal(after.room.streak, 0);
  assert.equal(after.room.uptime, before.room.uptime);
  assert.equal(after.room.endsAt, before.room.endsAt);
  assert.equal(after.room.players[0].contributions.actions, 20);
  assert.equal(after.room.players[1].contributions.actions, 0);
  await assert.rejects(f.answer(host, 0), rejects(409));
});

test("roles rotate between real incidents; stale requests cannot score in a new incident, and reconnect preserves everything", async () => {
  const f = await fixture(4);
  for (let step = 0; step < 5; step++) {
    await f.discover(step); for (const p of f.members) await f.answer(p, step); await f.advance(step);
  }
  const before = await f.view();
  assert.equal(new Set(before.room.players.map((p) => p.role)).size, 4);
  await assert.rejects(f.service().nextIncident("ABC234", f.members[1].token, 0), rejects(403));
  const next = await f.service().nextIncident("ABC234", f.members[0].token, 0);
  assert.equal(next.room.incidentIndex, 1); assert.equal(next.room.incidentId, "dhcp-relay-route");
  assert.equal(next.room.phase, "briefing"); assert.equal(next.room.score, before.room.score);
  assert.deepEqual(next.room.players.map((p) => p.role), before.room.players.map((p, i) => roleFor(i, 1).id));
  assert.ok(next.room.players.every((p, i) => p.role !== before.room.players[i].role));
  await assert.rejects(f.service().nextIncident("ABC234", f.members[0].token, 0), rejects(409));
  f.tick(5000);
  await assert.rejects(f.service().discover("ABC234", f.members[0].token, 0, 0), rejects(409));
  await f.discover(0, 1);
  await f.service().hint("ABC234", f.members[0].token, 0, 1);
  await f.answer(f.members[1], 0, 1);
  const recorded = await f.view();
  f.tick(31000);
  const resumed = await f.service().join("ABC234", "Player 1", f.members[1].token);
  assert.equal(resumed.snapshot.viewerId, f.members[1].snapshot.viewerId);
  assert.deepEqual(resumed.snapshot.room.players[1].contributions, recorded.room.players[1].contributions);
  assert.equal(resumed.snapshot.room.players[1].role, recorded.room.players[1].role);
  assert.equal(resumed.snapshot.room.hintPenalties, 25);
  await assert.rejects(f.answer(f.members[1], 0, 1), rejects(409));
  for (const p of f.members) await f.service().get("ABC234", p.token);
  for (const p of f.members.filter((_, i) => i !== 1)) await f.answer(p, 0, 1);
  await f.advance(0, 1);
  for (let step = 1; step < 5; step++) {
    await f.discover(step, 1); for (const p of f.members) await f.answer(p, step, 1); await f.advance(step, 1);
  }
  const final = await f.view();
  assert.equal(final.room.outcomes.length, 2);
  assert.equal(final.room.result, "resolved"); assert.equal(final.debrief.teamOutcome, "resolved");
  assert.ok(final.debrief.objectives.length >= 3);
  assert.ok(final.debrief.reviewTopics.includes("DHCP relay and giaddr"));
  assert.ok(final.debrief.sources.some((source) => source.href === "/labs/cant-reach-website"));
  assert.ok(final.debrief.sources.some((source) => source.href === "/labs/dhcp-relay-three-site"));
  assert.ok(final.debrief.sources.some((source) => source.href === "/notes/networking-dns-dhcp"));
  assert.equal(final.room.players[1].contributions.resolution, 50);
  await assert.rejects(f.service().nextIncident("ABC234", f.members[0].token, 1), rejects(409));
  const settled = final.room.players[1].score;
  assert.equal((await f.view()).room.players[1].score, settled, "Repeated debrief reads never award resolution again");
});

test("timeout and all-wrong decisions produce honest debriefs; all cooperative writes respect the cost guard", async () => {
  const f = await fixture(1);
  for (let step = 0; step < 5; step++) {
    await f.discover(step);
    const wrong = multiplayerIncidents[0].steps[step].choices.find((c) => c.id !== multiplayerIncidents[0].steps[step].correctAnswerId).id;
    await f.answer(f.members[0], step, 0, wrong); await f.advance(step);
  }
  const fail = await f.view();
  assert.equal(fail.room.result, "unresolved"); assert.equal(fail.debrief.teamOutcome, "unresolved");
  assert.equal(fail.room.players[0].contributions.resolution, 0);
  assert.ok(fail.debrief.reviewTopics.length);
  const timed = await fixture(1); timed.tick(120000);
  assert.equal((await timed.view()).room.result, "timeout");
  await assert.rejects(timed.service().hint("ABC234", timed.members[0].token, 0, 0), rejects(409));
  await assert.rejects(timed.service().nextIncident("ABC234", timed.members[0].token, 0), rejects(409));
  const paused = await fixture(1); paused.store.paused = true;
  const raw = paused.store.data;
  for (const run of [
    () => paused.service().hint("ABC234", paused.members[0].token, 0, 0),
    () => paused.service().discover("ABC234", paused.members[0].token, 0, 0),
    () => paused.service().continueEvidence("ABC234", paused.members[0].token, 0, 0),
    () => paused.service().usefulAction("ABC234", paused.members[0].token, 0, "compare-scope", 0),
    () => paused.service().nextIncident("ABC234", paused.members[0].token, 0),
  ]) await assert.rejects(run(), rejects(423));
  assert.equal(paused.store.data, raw);
});

test("HTTP cooperative controls authenticate cookies and return role-specific evidence and server scores", async () => {
  const { roomRequest } = await import("../lib/game/room-api.ts");
  const f = await fixture();
  // Exercise the production API against the shared store, with a real-world clock.
  const stored = JSON.parse(f.store.data); stored.expiresAt = Date.now() + 1800000;
  stored.startsAt = Date.now() - 5000; stored.endsAt = Date.now() + 120000;
  stored.players.forEach((p) => { p.lastSeenAt = Date.now(); });
  f.store.data = JSON.stringify(stored);
  const infrastructure = () => ({ store: f.store });
  const api = (operation, member, payload = {}) => roomRequest(new Request("https://example.invalid/api/game/rooms/ABC234", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: member ? `outage_ops_ABC234=${member.token}` : "" },
    body: JSON.stringify({ stepIndex: 0, incidentIndex: 0, ...payload }),
  }), operation, "ABC234", infrastructure);
  for (const operation of ["discover", "hint", "role-action", "next"]) assert.equal((await api(operation)).status, 401);
  assert.equal((await api("discover", f.members[0])).status, 200);
  assert.equal((await api("discover", f.members[1])).status, 200);
  assert.equal((await api("role-action", f.members[0], { actionId: "compare-scope", points: 99999 })).status, 200);
  assert.equal((await api("hint", f.members[0], { penalty: 0 })).status, 200);
  const answer = await api("answer", f.members[0], { answerId: multiplayerIncidents[0].steps[0].correctAnswerId, score: 99999 });
  const result = await answer.json();
  assert.equal(answer.status, 200); assert.equal(result.room.score, -25);
  assert.equal(result.room.players[0].score, 130);
  assert.equal((await api("answer", f.members[0], { answerId: multiplayerIncidents[0].steps[0].correctAnswerId })).status, 409);
});

test("eight players complete both incidents through the Twilio store under its 16KiB limit", async () => {
  const f = await fixture(8);
  // Use the actual Sync adapter; fake only the external REST transport.
  let document = { data: JSON.parse(f.store.data), revision: "1" };
  const documents = {
    async fetch(name) { if (!name.includes("room")) throw Object.assign(new Error("missing"), { status: 404 }); return structuredClone(document); },
    async update(name, data, revision) {
      assert.equal(revision, document.revision);
      assert.ok(Buffer.byteLength(JSON.stringify(data)) < 16384);
      document = { data, revision: String(Number(revision) + 1) };
    },
  };
  const service = new RoomService(new TwilioRoomStore(documents, new DailyUsageGuard(documents)), multiplayerIncidents, { now: f.now });
  assert.equal(new Set(document.data.players.map((p) => p.role)).size, 8);
  for (let incident = 0; incident < 2; incident++) {
    for (let step = 0; step < 5; step++) {
      for (const p of f.members) await service.discover("ABC234", p.token, step, incident);
      await service.hint("ABC234", f.members[0].token, step, incident);
      for (const [index, p] of f.members.entries()) {
        await service.usefulAction("ABC234", p.token, step, roleFor(index, incident).actionId, incident);
        await service.answer("ABC234", p.token, step, multiplayerIncidents[incident].steps[step].correctAnswerId, incident);
      }
      await service.advance("ABC234", f.members[0].token, step, incident);
    }
    if (!incident) {
      await service.nextIncident("ABC234", f.members[0].token, 0);
      f.tick(5000);
    }
  }
  const result = await service.get("ABC234", f.members[0].token);
  assert.equal(result.room.score, 2450); // 2700 clean team points - 10 shared hints.
  assert.ok(result.room.players.every((p) => p.score === 1350));
  assert.equal(result.room.outcomes.length, 2);
});

test("a departed contributor remains in the debrief and penalties can end the session immediately", async () => {
  const f = await fixture(); await f.discover(0);
  for (const p of f.members) await f.answer(p, 0);
  await f.service().leave("ABC234", f.members[1].token);
  await f.advance(0);
  for (let step = 1; step < 5; step++) {
    await f.service().discover("ABC234", f.members[0].token, step, 0);
    await f.answer(f.members[0], step); await f.advance(step);
  }
  const done = await f.view();
  assert.equal(done.room.departedPlayers[0].nickname, "Player 1");
  assert.equal(done.room.departedPlayers[0].score, 135);
  assert.deepEqual(done.room.departedPlayers[0].contributions, { evidence: 10, answers: 100, actions: 0, resolution: 25 });
  assert.ok(!JSON.stringify(done.room.departedPlayers).includes("tokenHash"));
  const timed = await fixture(1); await timed.discover(0); timed.tick(119000);
  const wrong = multiplayerIncidents[0].steps[0].choices.find((c) => c.id !== multiplayerIncidents[0].steps[0].correctAnswerId).id;
  const expired = await timed.answer(timed.members[0], 0, 0, wrong);
  assert.equal(expired.room.result, "timeout");
  assert.equal(expired.room.outcomes[0].mistakes, 1);
  const uptime = await fixture(1); await uptime.discover(0);
  const raw = JSON.parse(uptime.store.data); raw.uptime = 5; uptime.store.data = JSON.stringify(raw);
  const exhausted = await uptime.answer(uptime.members[0], 0, 0, wrong);
  assert.equal(exhausted.room.result, "uptime"); assert.equal(exhausted.debrief.uptimeScore, 0);
});

test("legacy rooms upgrade without losing member identity or credit; legacy failures stay unresolved", async () => {
  const f = await fixture(1);
  const raw = JSON.parse(f.store.data);
  const legacyKeys = ["streak", "bestStreak", "hintPenalties", "hintsUsed", "hintUsed", "evidenceDiscoveries", "usefulActions", "outcomes", "incidentStartScore", "incidentStartHints", "incidentMistakes", "departedPlayers"];
  for (const key of legacyKeys) delete raw[key];
  delete raw.players[0].role; delete raw.players[0].seat; delete raw.players[0].contributions;
  raw.players[0].score = 100; raw.score = 100;
  f.store.data = JSON.stringify(raw);
  const upgraded = await f.view();
  assert.equal(upgraded.viewerId, f.members[0].snapshot.viewerId);
  assert.equal(upgraded.room.players[0].score, 100);
  assert.equal(upgraded.room.players[0].contributions.answers, 100);
  assert.equal(upgraded.room.players[0].role, "coordinator");
  assert.equal(upgraded.room.score, 100);
  const failure = JSON.parse(f.store.data);
  failure.status = "results"; failure.phase = "debrief"; failure.result = "timeout";
  delete failure.outcomes; f.store.data = JSON.stringify(failure);
  const debrief = await f.view();
  assert.equal(debrief.debrief.teamOutcome, "unresolved");
  assert.equal(debrief.room.players[0].score, 100);
});
