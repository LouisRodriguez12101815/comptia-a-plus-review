import assert from 'node:assert/strict';
import test from 'node:test';
import { RoomService } from '../lib/game/room-service.ts';
import { multiplayerIncidents } from '../lib/game/cooperative.ts';

function fixture() {
  let now = Date.parse('2026-10-11T12:00:00Z');
  let raw;
  const store = {
    async assertActive() {}, async read() { return raw ?? null; },
    async create(code, value) { raw = value; return true; },
    async compareAndSwap(code, previous, next) { if (raw !== previous) return false; raw = next; return true; },
  };
  const service = () => new RoomService(store, multiplayerIncidents, { now: () => now, code: () => 'ABC234' });
  return { service, tick: ms => { now += ms; }, saved: () => JSON.parse(raw), seed: change => { const room = JSON.parse(raw); change(room); raw = JSON.stringify(room); } };
}
async function pair(f) {
  const host = await f.service().create('Laptop');
  const guest = await f.service().join('ABC234', 'Phone');
  await f.service().ready('ABC234', host.token, true);
  return { host, guest };
}

test('ready host recovers an absent unready guest at the server absence threshold', async () => {
  const f = fixture(); const { host, guest } = await pair(f);
  f.tick(30_000);
  const view = await f.service().start('ABC234', host.token, true);
  assert.equal(view.room.status, 'playing');
  assert.equal(view.room.players.find(p => p.id === guest.snapshot.viewerId).excludedFromMission, true);
});

const fails = status => error => error.status === status;
test('connected unready guest blocks both normal and recovery start, including before threshold', async () => {
  const f = fixture(); const { host, guest } = await pair(f);
  f.tick(29_999);
  await f.service().get('ABC234', host.token);
  let view = await f.service().get('ABC234', host.token);
  assert.equal(view.lobbyGate.canContinue, false);
  for (const recovery of [false, true]) await assert.rejects(f.service().start('ABC234', host.token, recovery), fails(409));
  f.tick(1);
  view = await f.service().get('ABC234', host.token);
  assert.equal(view.lobbyGate.canContinue, true);
  assert.deepEqual(view.lobbyGate.excluded.map(p => p.id), [guest.snapshot.viewerId]);
  await assert.rejects(f.service().start('ABC234', guest.token, true), fails(403));
  await assert.rejects(f.service().start('ABC234', host.token, 'true'), fails(400));
  // A request from the returning guest is server proof of presence.
  await f.service().get('ABC234', guest.token);
  view = await f.service().get('ABC234', host.token);
  assert.equal(view.lobbyGate.canContinue, false);
  assert.deepEqual(view.lobbyGate.unready.map(p => p.id), [guest.snapshot.viewerId]);
  await assert.rejects(f.service().start('ABC234', host.token, true), fails(409));
  await f.service().ready('ABC234', guest.token, true);
  view = await f.service().start('ABC234', host.token);
  assert.ok(view.room.players.every(p => !p.excludedFromMission));
  assert.ok(view.room.evidenceAssignments.every(a => a.itemIds.length > 0));
});

test('late reconnect preserves identity and contributions but cannot add requirements or score', async () => {
  const f = fixture(); const { host, guest } = await pair(f);
  // Existing persisted values must survive recovery; do not assume they are zero.
  f.seed(room => { const player = room.players.find(p => p.id === guest.snapshot.viewerId); player.score = 120; player.contributions.answers = 100; player.contributions.actions = 20; });
  f.tick(30_000);
  await f.service().start('ABC234', host.token, true); f.tick(5000);
  const before = f.saved();
  const returned = await f.service().join('ABC234', 'Phone', guest.token);
  assert.equal(returned.snapshot.viewerId, guest.snapshot.viewerId);
  const observer = returned.snapshot.room.players.find(p => p.id === returned.snapshot.viewerId);
  assert.equal(observer.excludedFromMission, true);
  assert.deepEqual(observer.contributions, before.players.find(p => p.id === observer.id).contributions);
  assert.equal(observer.score, before.players.find(p => p.id === observer.id).score);
  assert.deepEqual(returned.snapshot.step.assignedEvidence, []);
  assert.equal(observer.evidenceStatus.assigned, 0);
  assert.equal(observer.evidenceStatus.state, 'not-required');
  assert.equal(returned.snapshot.evidenceGate.canAnswer, false);
  assert.ok(!returned.snapshot.evidenceGate.outstandingAnswers.includes('Phone'));
  const service = f.service();
  await assert.rejects(service.discover('ABC234', guest.token, 0), fails(403));
  await assert.rejects(service.answer('ABC234', guest.token, 0, multiplayerIncidents[0].steps[0].correctAnswerId), fails(403));
  await assert.rejects(service.hint('ABC234', guest.token, 0), fails(403));
  await assert.rejects(service.usefulAction('ABC234', guest.token, 0, 'restart-shared-equipment'), fails(403));
  assert.deepEqual(f.saved().players.find(p => p.id === observer.id).contributions, observer.contributions);
});

test('concurrent recovery and normal starts commit exactly one start and no extra scoring', async () => {
  const f = fixture(); const { host } = await pair(f); f.tick(30_000);
  const attempts = await Promise.allSettled([
    f.service().start('ABC234', host.token, true), f.service().start('ABC234', host.token, true), f.service().start('ABC234', host.token),
  ]);
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1);
  assert.ok(attempts.filter(r => r.status === 'rejected').every(r => r.reason.status === 409));
  const before = f.saved();
  await assert.rejects(f.service().start('ABC234', host.token, true), fails(409));
  assert.deepEqual(f.saved(), before);
  assert.equal(before.score, 0);
  assert.equal(before.players.filter(p => p.excludedFromMission).length, 1);
});

test('a reconnect racing recovery is either a ready-required member or a persistent observer', async () => {
  for (const reconnectFirst of [true, false]) {
    const f = fixture(); const { host, guest } = await pair(f); f.tick(30_000);
    const reconnect = () => f.service().join('ABC234', 'Phone', guest.token);
    const recover = () => f.service().start('ABC234', host.token, true);
    await Promise.allSettled(reconnectFirst ? [reconnect(), recover()] : [recover(), reconnect()]);
    const room = f.saved();
    assert.equal(room.players.length, 2);
    if (room.status === 'lobby') {
      assert.equal(room.players.find(p => p.id === guest.snapshot.viewerId).excludedFromMission, undefined);
      await assert.rejects(f.service().start('ABC234', host.token), fails(409));
    } else {
      assert.equal(room.players.find(p => p.id === guest.snapshot.viewerId).excludedFromMission, true);
      assert.ok(room.evidenceAssignments.every(a => a.playerId === host.snapshot.viewerId || a.itemIds.length === 0));
    }
  }
});

test('recovered host receives all actionable evidence and progresses through final debrief with a connected observer', async () => {
  const f = fixture(); const { host, guest } = await pair(f); f.tick(30_000);
  await f.service().start('ABC234', host.token, true); f.tick(5000);
  await f.service().join('ABC234', 'Phone', guest.token);
  for (let incidentIndex = 0; incidentIndex < multiplayerIncidents.length; incidentIndex++) {
    const incident = multiplayerIncidents[incidentIndex];
    for (let stepIndex = 0; stepIndex < incident.steps.length; stepIndex++) {
      const view = await f.service().get('ABC234', host.token);
      assert.ok(view.step.assignedEvidence.length > 0);
      assert.ok(view.room.evidenceAssignments.find(a => a.playerId === guest.snapshot.viewerId).itemIds.length === 0);
      await f.service().discover('ABC234', host.token, stepIndex, incidentIndex);
      const ready = await f.service().get('ABC234', host.token);
      assert.equal(ready.evidenceGate.canAnswer, true);
      await f.service().answer('ABC234', host.token, stepIndex, incident.steps[stepIndex].correctAnswerId, incidentIndex);
      const before = f.saved();
      await assert.rejects(f.service().answer('ABC234', host.token, stepIndex, incident.steps[stepIndex].correctAnswerId, incidentIndex), fails(409));
      assert.deepEqual(f.saved(), before);
      await f.service().advance('ABC234', host.token, stepIndex, incidentIndex);
    }
    if (incidentIndex + 1 < multiplayerIncidents.length) {
      await f.service().nextIncident('ABC234', host.token, incidentIndex); f.tick(5000);
    }
  }
  const view = await f.service().get('ABC234', guest.token);
  assert.equal(view.room.phase, 'debrief');
  assert.equal(view.room.outcomes.length, multiplayerIncidents.length);
  assert.ok(view.room.outcomes.every(o => o.result === 'resolved'));
  assert.equal(view.room.players.find(p => p.id === guest.snapshot.viewerId).score, 0);
});
