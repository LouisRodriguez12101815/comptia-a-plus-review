import assert from 'node:assert/strict';
import test from 'node:test';
import { evidenceModel, assignEvidence } from '../lib/game/evidence-model.ts';
import { networkDiagramFor } from '../lib/game/network-diagram.ts';
import { multiplayerIncidents, learningFor } from '../lib/game/cooperative.ts';
import { roomRequest } from '../lib/game/room-api.ts';
import { ROOM_PROTOCOL_VERSION } from '../lib/game/version.ts';
import { RoomService } from '../lib/game/room-service.ts';
import { readFile } from 'node:fs/promises';

test('canonical model removes malformed, duplicate, invalid and departed entries; valid cards equal requirements', () => {
  const catalog = [{ id: 'a', label: 'Clue', text: 'Private' }, { id: 'b', label: 'Other', text: 'Private 2' }];
  const members = [{ id: 'host', nickname: 'Host', seat: 0, lastSeenAt: 100 }, { id: 'join', nickname: 'Joining', seat: 4, lastSeenAt: 100 }];
  assert.deepEqual(assignEvidence(catalog, members), assignEvidence(catalog, [...members].reverse()));
  const model = evidenceModel(catalog, members, [null, {}, { playerId: 'host', itemIds: ['old', null] },
    { playerId: 'join', itemIds: ['b', 'b'] }, { playerId: 'departed', itemIds: ['a'] }], ['old', 'b', null, 'b'], 100);
  assert.deepEqual(model.forPlayer('host'), []); assert.ok(model.complete('host'));
  assert.deepEqual(model.discoveredIds, ['b']);
  assert.deepEqual(model.assignments, [{ playerId: 'host', itemIds: [] }, { playerId: 'join', itemIds: ['b'] }]);
  assert.equal(model.coverage[0].required, false); assert.equal(model.coverage[1].required, true);
  assert.equal(model.forPlayer('join').length, 1); assert.ok(model.complete('join'));
  assert.deepEqual(evidenceModel(catalog, members, null, {}, 100).discoveredIds, []);
});

test('shared discovery completes every owner; disconnected and missing players are never required', () => {
  const catalog = [{ id: 'a', label: 'Clue', text: 'Private' }];
  const members = ['host', 'join'].map((id, seat) => ({ id, nickname: id, seat, lastSeenAt: 0 }));
  const assignments = assignEvidence(catalog, members);
  const model = evidenceModel(catalog, members, assignments, ['a'], 10);
  for (const member of members) assert.equal(model.complete(member.id), true);
  assert.equal(model.coverage[0].owners.length, 2);
  assert.equal(evidenceModel(catalog, members, assignments, [], 31000).coverage[0].required, false);
  assert.equal(evidenceModel(catalog, [], assignments, [], 10).coverage[0].required, false);
});

test('diagram annotations contain only discovered, owned cards and map to real lab sections', async () => {
  const labs = JSON.parse(await readFile(new URL('../content/labs.json', import.meta.url)));
  for (const incident of multiplayerIncidents) {
    const learning = learningFor(incident);
    const cards = [{ id: 'hidden', label: 'Hidden', discovered: false, text: 'must-not-leak' }, { id: 'visible', label: 'Visible', discovered: true, text: 'Owned discovered clue' }];
    const diagram = networkDiagramFor(incident.id, cards, learning.sources);
    assert.equal(diagram.annotations.length, 1); assert.ok(!JSON.stringify(diagram).includes('must-not-leak'));
    assert.ok(!JSON.stringify(diagram).includes('194.168.50.0')); assert.ok(!JSON.stringify(diagram).includes('192.168.20.100'));
    const source = diagram.sources.find((s) => s.path === 'content/labs.json');
    const lab = labs.find((l) => source.href === `/labs/${l.slug}`);
    assert.ok(source.sections.every((s) => lab.sections.some((section) => section.id === s)));
    // Every address displayed in the diagram must occur in its mapped factual lab.
    for (const address of JSON.stringify(diagram).match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? []) assert.ok(JSON.stringify(lab).includes(address), address);
  }
});

test('incompatible client version rejects before infrastructure access and does not log headers', async () => {
  let accessed = false;
  const response = await roomRequest(new Request('https://example.test/api/game/rooms', { method: 'POST', headers: { 'X-Outage-Ops-Protocol': String(ROOM_PROTOCOL_VERSION - 1), 'Content-Type': 'application/json' }, body: '{}' }), 'create', '', () => { accessed = true; });
  assert.equal(response.status, 409); assert.equal(accessed, false);
  assert.equal((await response.json()).diagnostic.reason, 'version_mismatch');
  assert.equal(response.headers.get('X-Outage-Ops-Protocol'), String(ROOM_PROTOCOL_VERSION));
});

test('malformed persisted host assignments are repaired through CAS and render Complete 0/0', async () => {
  let data, now = 100000;
  const store = { assertActive: async () => {}, read: async () => data,
    create: async (_code, value) => { data = value; return true; },
    compareAndSwap: async (_code, previous, next) => { if (data !== previous) return false; data = next; return true; } };
  const rooms = new RoomService(store, multiplayerIncidents, { code: () => 'ABC234', now: () => now });
  const host = await rooms.create('Host'); await rooms.ready('ABC234', host.token, true); await rooms.start('ABC234', host.token);
  now += 5000;
  const stored = JSON.parse(data); stored.evidenceAssignments = [null, {}, { playerId: host.snapshot.viewerId, itemIds: ['stale:item'] }]; stored.discoveredEvidenceIds = {};
  data = JSON.stringify(stored);
  const view = await rooms.get('ABC234', host.token);
  assert.equal(view.step.assignedEvidence.length, 0);
  assert.deepEqual(view.room.players[0].evidenceStatus, { state: 'not-required', assigned: 0, discovered: 0 });
  assert.deepEqual(JSON.parse(data).evidenceAssignments, [{ playerId: host.snapshot.viewerId, itemIds: [] }]);
  assert.equal(view.evidenceGate.canAnswer, true);
  assert.equal(view.room.players[0].score, 0);
});
