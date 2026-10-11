import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoomClient, createRoomReconciler, RoomApiError, validateRoomSnapshot } from '../lib/game/room-client.ts';
import { RoomService } from '../lib/game/room-service.ts';
import { roomRequest } from '../lib/game/room-api.ts';
import { multiplayerIncidents } from '../lib/game/cooperative.ts';

async function fixture() {
  let data, now = Date.now();
  const store = { assertActive: async () => {}, read: async () => data, create: async (code, value) => { data = value; return true; }, compareAndSwap: async (code, previous, next) => { if (data !== previous) return false; data = next; return true; } };
  const service = new RoomService(store, multiplayerIncidents, { code: () => 'ABC234', now: () => now });
  const a = await service.create('Player A'), b = await service.join('ABC234', 'Player B');
  await service.ready('ABC234', a.token, true); await service.ready('ABC234', b.token, true); await service.start('ABC234', a.token);
  now += 5000;
  return { service, a, b, store, tick: (ms) => { now += ms; } };
}

test('failed token request is reported separately; a valid room GET still reports available storage', async () => {
  const f = await fixture(), logs = [], snapshot = { ...await f.service.get('ABC234', f.b.token), storageAvailable: true };
  const client = createRoomClient({ log: (e) => logs.push(e), fetchImpl: async (path) => path.endsWith('/token') ? Response.json({ error: 'Room storage is unavailable.', diagnostic: { reason: 'permission_denied' }, token: 'synthetic-secret-marker' }, { status: 503 }) : Response.json(snapshot) });
  await assert.rejects(client('/ABC234/token', {}), (e) => e instanceof RoomApiError && e.status === 503 && e.operation === 'token');
  const value = await client('/ABC234');
  assert.equal(value.storageAvailable, true);
  assert.equal(value.viewerId, f.b.snapshot.viewerId);
  assert.deepEqual(logs.map((e) => e.event), ['started', 'failed']);
  assert.equal(logs[1].reason, 'permission_denied');
  assert.ok(!JSON.stringify(logs).includes('synthetic-secret-marker'));
});

test('malformed token success and network failure cannot silently become a Sync success', async () => {
  for (const fetchImpl of [async () => Response.json({ token: 'synthetic-secret-marker' }), async () => { throw new Error('synthetic-secret-marker'); }]) {
    const logs = [], client = createRoomClient({ fetchImpl, log: (e) => logs.push(e) });
    await assert.rejects(client('/ABC234/token', {}), (e) => e instanceof RoomApiError && (e.reason !== 'invalid_response' || e.httpStatus === 200));
    assert.equal(logs.at(-1).event, 'failed');
    assert.ok(!JSON.stringify(logs).includes('synthetic-secret-marker'));
  }
});

test('actual token permission failure returns sanitized 503 while the same member can GET shared state', async () => {
  const f = await fixture(), logs = [], originalError = console.error, originalInfo = console.info;
  console.error = (...args) => logs.push(args); console.info = (...args) => logs.push(args);
  try {
    const infra = () => ({ store: f.store, guard: { assertActive: async () => {} }, service: { fetch: async () => ({ aclEnabled: true }), documents: () => ({ documentPermissions: () => ({ update: async () => { throw Object.assign(new Error('synthetic-secret-marker'), { status: 403, code: 20403 }); } }) }) } });
    const request = () => new Request('https://example.test/api/game/rooms/ABC234', { headers: { Cookie: `outage_ops_ABC234=${f.b.token}` } });
    const denied = await roomRequest(request(), 'token', 'ABC234', infra);
    assert.equal(denied.status, 503);
    const body = await denied.json();
    assert.equal(body.diagnostic.stage, 'permissions.update'); assert.equal(body.diagnostic.providerStatus, 403);
    const success = await roomRequest(request(), 'get', 'ABC234', infra);
    assert.equal(success.status, 200); assert.equal((await success.json()).storageAvailable, true);
    assert.ok(!JSON.stringify(logs).includes('synthetic-secret-marker'));
    assert.ok(!JSON.stringify(logs).includes(f.b.token));
    assert.ok(logs.some(([name, event]) => name === 'outage_ops_room_request' && event.operation === 'token' && event.event === 'failed'));
  } finally { console.error = originalError; console.info = originalInfo; }
});

test('unavailable evidence is rejected instead of rendering an empty completed requirement; valid empty assignments work', async () => {
  const f = await fixture(), snapshot = await f.service.get('ABC234', f.b.token);
  for (const change of [(s) => { s.step.assignedEvidence = []; }, (s) => { delete s.step.assignedEvidence; }, (s) => { s.step.assignedEvidence[0].id = 'wrong-item'; }, (s) => { s.step.assignedEvidence[0].label = ''; }]) {
    const missing = structuredClone(snapshot); change(missing);
    assert.throws(() => validateRoomSnapshot(missing), (e) => e.reason === 'evidence_unavailable');
  }
  const empty = structuredClone(snapshot);
  empty.step.assignedEvidence = [];
  empty.room.players.find((p) => p.id === empty.viewerId).evidenceStatus.assigned = 0;
  empty.room.evidenceAssignments = empty.room.evidenceAssignments.filter((e) => e.playerId !== empty.viewerId);
  assert.equal(validateRoomSnapshot(empty), empty);
});

test('reconnect uses the cookie-authenticated viewer, not a cached host identity', async () => {
  const f = await fixture();
  const resumed = await f.service.join('ABC234', 'Player B', f.b.token);
  assert.equal(validateRoomSnapshot(resumed.snapshot).viewerId, f.b.snapshot.viewerId);
  assert.notEqual(resumed.snapshot.viewerId, f.a.snapshot.viewerId);
  const invalid = structuredClone(resumed.snapshot); invalid.viewerId = 'missing-player';
  assert.throws(() => validateRoomSnapshot(invalid), (e) => e.reason === 'invalid_snapshot');
  invalid.viewerId = resumed.snapshot.viewerId; invalid.storageAvailable = false;
  assert.throws(() => validateRoomSnapshot(invalid), (e) => e.reason === 'storage_unavailable');
});

test('both players have actionable server assignments; evidence POST succeeds, disconnect stops blocking, and retries cannot score', async () => {
  const f = await fixture(), logs = [];
  // Move stored briefing into active time for the HTTP service's real clock.
  const raw = JSON.parse(await f.store.read()); raw.startsAt = Date.now() - 1;
  await f.store.compareAndSwap('ABC234', await f.store.read(), JSON.stringify(raw));
  const makeClient = (member) => createRoomClient({ log: (e) => logs.push(e), fetchImpl: async (path, options) => {
    const operation = path.endsWith('/evidence') ? 'discover' : path.endsWith('/actions') ? 'answer' : 'get';
    return roomRequest(new Request(`https://example.test${path}`, { ...options, headers: { ...options.headers, Cookie: `outage_ops_ABC234=${member.token}` } }), operation, 'ABC234', () => ({ store: f.store }));
  } });
  const a = makeClient(f.a), b = makeClient(f.b);
  const av = await a('/ABC234'), bv = await b('/ABC234');
  assert.equal(av.storageAvailable, true); assert.equal(bv.storageAvailable, true);
  assert.equal(av.step.assignedEvidence.length, 1); assert.equal(bv.step.assignedEvidence.length, 1);
  assert.notEqual(av.step.assignedEvidence[0].id, bv.step.assignedEvidence[0].id);
  const indices = { incidentIndex: 0, stepIndex: 0 };
  await a('/ABC234/evidence', { ...indices, itemId: av.step.assignedEvidence[0].id });
  const discovered = await b('/ABC234/evidence', { ...indices, itemId: bv.step.assignedEvidence[0].id });
  assert.ok(discovered.step.assignedEvidence[0].text); assert.equal(discovered.evidenceGate.canAnswer, true);
  await b('/ABC234/evidence', { ...indices, itemId: bv.step.assignedEvidence[0].id });
  assert.equal((await b('/ABC234')).room.players.find((p) => p.id === bv.viewerId).contributions.evidence, 10);
  await a('/ABC234/actions', { ...indices, answerId: multiplayerIncidents[0].steps[0].correctAnswerId });
  await assert.rejects(a('/ABC234/actions', { ...indices, answerId: multiplayerIncidents[0].steps[0].correctAnswerId }), (e) => e.status === 409);
  const currentRaw = await f.store.read(), current = JSON.parse(currentRaw);
  current.players[1].lastSeenAt = Date.now() - 31000; current.discoveredEvidenceIds = [av.step.assignedEvidence[0].id];
  await f.store.compareAndSwap('ABC234', currentRaw, JSON.stringify(current));
  const disconnected = await a('/ABC234');
  assert.equal(disconnected.room.players[1].evidenceStatus.state, 'disconnected');
  assert.equal(disconnected.evidenceGate.canAnswer, true);
  assert.ok(logs.some((e) => e.operation === 'evidence' && e.event === 'succeeded'));
  assert.ok(!JSON.stringify(logs).includes(f.b.token));
});

test('Sync storms, deadline requests, retries, and polling share one GET with two seconds between starts', async () => {
  let now = 0, sequence = 0, jobs = new Map(), release, interval = 10000;
  const starts = [];
  const loop = createRoomReconciler(async () => { starts.push(now); if (starts.length === 1) await new Promise((resolve) => { release = resolve; }); }, () => interval, {
    now: () => now, schedule: (fn, delay) => { const id = ++sequence; jobs.set(id, { fn, at: now + delay }); return id; }, cancel: (id) => jobs.delete(id),
  });
  const advance = async (ms) => { now += ms; const due = [...jobs].filter(([, j]) => j.at <= now); for (const [id, job] of due) { jobs.delete(id); job.fn(); } await Promise.resolve(); await Promise.resolve(); };
  loop.request(); await advance(0);
  for (let i = 0; i < 100; i++) loop.request();
  await advance(1000); assert.deepEqual(starts, [0]);
  release(); await advance(0); await advance(999); assert.deepEqual(starts, [0]);
  await advance(1); assert.deepEqual(starts, [0, 2000]);
  for (let i = 0; i < 100; i++) loop.request();
  await advance(1999); assert.equal(starts.length, 2);
  await advance(1); assert.deepEqual(starts, [0, 2000, 4000]);
  interval = 2000; loop.request(); await advance(2000); await advance(2000);
  assert.deepEqual(starts, [0, 2000, 4000, 6000, 8000]);
  loop.stop(); await advance(20000); assert.equal(starts.length, 5);
  // Resume already did a GET: even a token failure/Sync event must wait before reading again.
  const resumed = createRoomReconciler(async () => { starts.push(now); }, () => 10000, {
    now: () => now, lastRequestAt: now, schedule: (fn, delay) => { const id = ++sequence; jobs.set(id, { fn, at: now + delay }); return id; }, cancel: (id) => jobs.delete(id),
  });
  resumed.request(); await advance(0); await advance(1999); assert.equal(starts.length, 5);
  await advance(1); assert.equal(starts.length, 6); resumed.stop();
});
