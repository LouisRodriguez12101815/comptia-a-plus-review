import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomService } from '../lib/game/room-service.ts';
import { multiplayerIncidents, evidenceItemsFor, learningFor, roleFor } from '../lib/game/cooperative.ts';
import { roundLearning, transferQuestion } from '../lib/game/round-learning.ts';

async function fixture(count = 2) {
  let now = 100000, data = null;
  const store = { async assertActive() {}, async read() { return data; }, async create(code, next) { if (data) return false; assert.ok(Buffer.byteLength(next) < 16384, "Shared room must fit Sync document"); data = next; return true; }, async compareAndSwap(code, previous, next) { if (previous !== data) return false; assert.ok(Buffer.byteLength(next) < 16384, "Shared room must fit Sync document"); data = next; return true; } };
  const service = () => new RoomService(store, multiplayerIncidents, { now: () => now, code: () => 'ABC234' });
  const members = [await service().create('Host')];
  for (let i = 1; i < count; i++) members.push(await service().join('ABC234', `Player ${i}`));
  for (const member of members) await service().ready('ABC234', member.token, true);
  await service().start('ABC234', members[0].token); now += 5000;
  return { members, service, tick(ms) { now += ms; }, get(i = 0) { return service().get('ABC234', members[i].token); },
    discover(i, step = 0, incident = 0) { return service().discover('ABC234', members[i].token, step, incident); },
    answer(i, id, step = 0, incident = 0) { return service().answer('ABC234', members[i].token, step, id, incident); },
    advance(step = 0) { return service().advance('ABC234', members[0].token, step, 0); } };
}
const rejected = (error) => error.status === 409;

test('shared findings reveal only discovered clues to both players, without automatic points or consequences', async () => {
  const f = await fixture();
  assert.deepEqual((await f.get()).sharedFindings, []);
  assert.equal((await f.get()).step.consequence, null);
  assert.equal((await f.get()).step.learning.learned, '');
  await f.discover(0);
  const guest = await f.get(1);
  assert.deepEqual(guest.sharedFindings.map((i) => i.id), [evidenceItemsFor(multiplayerIncidents[0], 0)[0].id]);
  assert.equal(guest.step.assignedEvidence[0].text, undefined);
  assert.equal(guest.room.players[1].score, 0);
  assert.equal(guest.evidenceGate.canAnswer, false);
  await f.discover(1);
  assert.equal((await f.get()).sharedFindings.length, 2);
});

test('incorrect decisions allow a distinct diagnostic opportunity; concurrent retries score only once and preserve penalties', async () => {
  const f = await fixture(); await f.discover(0); await f.discover(1);
  const wrong = await f.answer(0, 'router');
  assert.match(wrong.room.selectedActions[0].explanation, /disrupt/);
  assert.equal(wrong.step.consequence, null);
  assert.equal(wrong.room.uptime, 95);
  await assert.rejects(f.answer(0, 'router'), rejected);
  assert.equal((await f.get()).room.uptime, 95);
  const retries = await Promise.allSettled([f.answer(0, 'scope'), f.answer(0, 'scope')]);
  assert.equal(retries.filter((r) => r.status === 'fulfilled').length, 1);
  const recovered = await f.get();
  assert.equal(recovered.room.players[0].contributions.answers, 100);
  assert.equal(recovered.room.incidentMistakes, 1);
  assert.match(recovered.step.consequence, /PC2/);
  assert.match(recovered.step.learning.learned, /PC1/);
  await assert.rejects(f.answer(0, 'cable'), rejected);
  await f.answer(1, 'scope'); await f.advance();
  assert.equal((await f.get()).room.score, 50, 'Recovered rounds do not become clean streak bonuses');
  assert.deepEqual((await f.get()).sharedFindings, [], 'Next question does not expose unopened clues');
});

test('role finding requires a supported decision and is credited only once; history survives role rotation', async () => {
  const f = await fixture(1); await f.discover(0);
  const role = roleFor(0, 0);
  await assert.rejects(f.service().usefulAction('ABC234', f.members[0].token, 0, role.actionId, 0), rejected);
  await f.answer(0, 'router'); await f.answer(0, 'scope');
  await f.service().usefulAction('ABC234', f.members[0].token, 0, role.actionId, 0);
  await assert.rejects(f.service().usefulAction('ABC234', f.members[0].token, 0, role.actionId, 0), rejected);
  await f.advance();
  for (let step = 1; step < 5; step++) { await f.discover(0, step); await f.answer(0, multiplayerIncidents[0].steps[step].correctAnswerId, step); await f.advance(step); }
  const done = await f.get();
  assert.equal(done.room.result, 'resolved');
  assert.equal(done.learningDebrief.length, 5);
  assert.equal(done.learningDebrief[0].decisions.length, 2);
  assert.ok(done.learningDebrief[0].decisions.some((d) => !d.correct));
  assert.equal(done.learningDebrief[0].evidence.length, 2);
  assert.equal(done.room.players[0].contributions.actions, 20);
  assert.match(done.transferQuestion, /resolves a hostname/);
  const next = await f.service().nextIncident('ABC234', f.members[0].token, 0);
  assert.equal(next.room.learningHistory.length, 5);
  assert.equal(next.room.players[0].role, roleFor(0, 1).id);
});

test('ten-minute practice deadline remains authoritative and timeout recap acknowledges unavailable evidence', async () => {
  const f = await fixture(1); const start = await f.get();
  assert.equal(start.room.roundSeconds, 600);
  f.tick(599999); assert.equal((await f.get()).room.status, 'playing');
  f.tick(1); const end = await f.get();
  assert.equal(end.room.result, 'timeout');
  assert.deepEqual(end.learningDebrief[0].evidence, []);
  assert.deepEqual(end.learningDebrief[0].decisions, []);
  await assert.rejects(f.answer(0, 'scope'), rejected);
});

test('every scored round has a source-mapped observable goal, alternative, consequence and transfer task', () => {
  for (const incident of multiplayerIncidents) {
    assert.ok(learningFor(incident).sources.some((s) => s.path === 'content/labs.json'));
    incident.steps.forEach((step, index) => {
      const lesson = roundLearning(incident, index);
      for (const field of ['goal', 'competingExplanation', 'result', 'learned']) assert.ok(lesson[field].length > 30);
      assert.ok(evidenceItemsFor(incident, index).length);
      assert.ok(step.choices.every((choice) => choice.explanation));
    });
    assert.ok(transferQuestion(incident.id).endsWith('?'));
  }
});

test('eight-player recovery and both incidents retain compact receipts within Sync document size', async () => {
  const f = await fixture(8);
  for (let incident = 0; incident < 2; incident++) {
    for (let step = 0; step < 5; step++) {
      for (let i = 0; i < 8; i++) await f.discover(i, step, incident);
      for (let i = 0; i < 8; i++) {
        if (!incident && !step) { await f.answer(i, 'router'); await f.answer(i, 'server'); }
        await f.answer(i, multiplayerIncidents[incident].steps[step].correctAnswerId, step, incident);
        await f.service().usefulAction('ABC234', f.members[i].token, step, roleFor(i, incident).actionId, incident);
      }
      await f.service().advance('ABC234', f.members[0].token, step, incident);
    }
    if (!incident) { await f.service().nextIncident('ABC234', f.members[0].token, 0); f.tick(5000); }
  }
  const done = await f.get();
  assert.equal(done.room.uptime, 20);
  assert.equal(done.room.result, 'resolved');
  assert.equal(done.learningDebrief.length, 10);
  assert.equal(done.learningDebrief[0].decisions.filter((d) => !d.correct).length, 2);
  assert.ok(done.room.players.every((p) => p.contributions.answers === 1000));
});
