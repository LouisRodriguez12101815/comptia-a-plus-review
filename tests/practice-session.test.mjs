import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { challenges, sources } from '../lib/practice/catalog.ts';
import { advance, isComplete, newSession, readinessLine, requestHint, restoreSession, shuffle, solved, submit, summarize } from '../lib/practice/session.ts';

for (const challenge of challenges) {
  test(`${challenge.id}: content IDs, sources and learning objectives cover every scored match`, async () => {
    assert.equal(new Set(challenge.rounds.map((r) => r.id)).size, challenge.rounds.length);
    for (const round of challenge.rounds) {
      assert.equal(new Set(round.choices.map((c) => c.id)).size, round.choices.length);
      assert.equal(round.choices.filter((c) => c.id === round.correctAnswerId).length, 1);
      assert.ok(round.choices.every((c) => c.explanation && c.label));
      assert.ok(round.objective && round.hint && round.success);
      assert.ok(round.examMappings.some((m) => m.exam === challenge.exam));
      assert.ok(round.sourceIds.length);
      for (const id of round.sourceIds) { const source = sources.find((s) => s.id === id); assert.ok(source); await readFile(source.path); }
      if (challenge.kind === 'packet') {
        const scenario = challenge.scenarios.find((s) => s.id === round.scenarioId);
        assert.ok(scenario.nodes.some((node) => node.id === round.effect.nodeId));
        assert.match(scenario.assumptions, /IPv4/); assert.match(scenario.assumptions, /Ethernet/); assert.match(scenario.assumptions, /no NAT/); assert.match(scenario.assumptions, /ARP cache/);
      }
    }
  });
  test(`${challenge.id}: shuffled IDs retain correctness and feedback under all three-card permutations`, () => {
    for (const round of challenge.rounds) {
      const orders = new Set();
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
        let i = 0; const draws = [a/3,b/2];
        const result = shuffle(round.choices, () => draws[i++]);
        orders.add(result.map((c) => c.id).join(','));
        assert.notEqual(result, round.choices);
        assert.deepEqual(new Set(result.map((c) => c.id)), new Set(round.choices.map((c) => c.id)));
        assert.equal(result.filter((c) => c.id === round.correctAnswerId).length, 1);
        assert.ok(result.every((c) => c.explanation === round.choices.find((original) => original.id === c.id).explanation));
      }
      assert.equal(orders.size, 6);
    }
  });
  test(`${challenge.id}: recovery, hint accounting, stale events and duplicate scoring remain independent of final completion`, () => {
    let state = newSession(challenge);
    const first = challenge.rounds[0], wrong = first.choices.find((c) => c.id !== first.correctAnswerId);
    assert.equal(advance(state, challenge), state);
    assert.equal(submit(state, challenge, first.id, 'forged'), state);
    const failed = submit(state, challenge, first.id, wrong.id);
    assert.equal(submit(failed, challenge, first.id, wrong.id), failed);
    assert.equal(summarize(failed, challenge).points, 0);
    assert.equal(summarize(failed, challenge).fullAwards, 0);
    assert.equal(summarize(failed, challenge).hintedAwards, 0);
    assert.equal(readinessLine(summarize(failed, challenge).completed, challenge.rounds.length, summarize(failed, challenge).hints), 'this run is not finished.');
    state = requestHint(failed, challenge);
    assert.equal(requestHint(state, challenge), state);
    state = submit(state, challenge, first.id, first.correctAnswerId);
    assert.equal(solved(state, challenge), true);
    assert.equal(submit(state, challenge, first.id, first.correctAnswerId), state);
    assert.equal(submit(state, challenge, first.id, wrong.id), state);
    assert.equal(summarize(state, challenge).points, 75);
    state = advance(state, challenge);
    assert.equal(submit(state, challenge, first.id, wrong.id), state);
    for (const round of challenge.rounds.slice(1)) { state = submit(state, challenge, round.id, round.correctAnswerId); state = advance(state, challenge); }
    assert.equal(isComplete(state, challenge), true);
    const report = summarize(state, challenge);
    assert.equal(report.completed, challenge.rounds.length);
    assert.equal(report.points, challenge.rounds.length * 100 - 25);
    assert.equal(report.fullAwards, challenge.rounds.length - 1);
    assert.equal(report.hintedAwards, 1);
    assert.equal(report.fullAwards * 100 + report.hintedAwards * 75, report.points);
    assert.equal(report.firstCorrect, challenge.rounds.length - 1);
    assert.equal(report.hints, 1);
    assert.equal(readinessLine(report.completed, challenge.rounds.length, report.hints), 'finished with a hint.');
    assert.deepEqual(report.recommendations, [{ objective: first.objective, sourceIds: first.sourceIds }]);
    assert.equal(report.rows[0].misconceptions[0].explanation, wrong.explanation);
    assert.equal(advance(state, challenge), state);
  });
  test(`${challenge.id}: versioned restore rejects inconsistent/future receipts and recomputes progress`, () => {
    const initial = newSession(challenge), first = challenge.rounds[0];
    const state = advance(submit(initial, challenge, first.id, first.correctAnswerId), challenge);
    assert.deepEqual(restoreSession(JSON.stringify(state), challenge), state);
    for (const invalid of [null, '{', JSON.stringify({...state, version: 99}), JSON.stringify({...initial, roundIndex: 2}), JSON.stringify({...initial, receipts:{[challenge.rounds[1].id]:{attemptedIds:[],hintUsed:false}}}), JSON.stringify({...initial, receipts:{[first.id]:{attemptedIds:[first.correctAnswerId,first.correctAnswerId],hintUsed:false}}})]) assert.equal(restoreSession(invalid, challenge), null);
    assert.equal(submit({...initial,challengeId:'other'},challenge,first.id,first.correctAnswerId).receipts[first.id], undefined);
    assert.equal(requestHint({...initial,challengeId:'other'},challenge).receipts[first.id], undefined);
  });
}
test('packet journeys cover local/routed/transfer semantics and distinguish address layers and TTL', () => {
  const game = challenges.find((c) => c.id === 'follow-packet');
  const round = (id) => game.rounds.find((r) => r.id === id);
  assert.equal(game.rounds[0].scenarioId, 'local'); assert.equal(game.rounds.at(-1).scenarioId,'transfer');
  assert.equal(round('local-forward').effect.ttl, 64);
  assert.equal(round('route-first-frame').effect.frameDestination, '02:00:00:00:10:01');
  assert.equal(round('route-ttl').effect.ttl, 63);
  assert.equal(round('route-reframe').effect.frameSource,'02:00:00:00:30:01');
  assert.equal(round('route-deliver').effect.frameSource,null);
  assert.match(round('route-lookup').choices.find((c) => c.id === 'place').label,/\/24/);
  assert.match(round('transfer-prefix').choices.find((c) => c.id === 'place').label,/\/26/);
  assert.match(round('transfer-next-hop').success,/valid gateway mapping/);
});
test('hint use is separate from first-attempt accuracy and a clean completion yields no review mistakes', () => {
  const game=challenges[0]; let state=newSession(game); state=requestHint(state,game);
  for(const round of game.rounds) {state=submit(state,game,round.id,round.correctAnswerId);state=advance(state,game);}
  const report=summarize(state,game);assert.equal(report.firstAttemptAccuracy,100);assert.equal(report.hints,1);assert.equal(report.recommendations.length,1);
  assert.equal(report.fullAwards * 100 + report.hintedAwards * 75, report.points);
  state=newSession(game);for(const round of game.rounds) {state=submit(state,game,round.id,round.correctAnswerId);state=advance(state,game);}
  const clean=summarize(state,game);
  assert.deepEqual(clean.recommendations,[]);
  assert.equal(clean.fullAwards, game.rounds.length);
  assert.equal(clean.hintedAwards, 0);
  assert.equal(clean.fullAwards * 100 + clean.hintedAwards * 75, clean.points);
  assert.equal(readinessLine(report.completed, game.rounds.length, report.hints), 'finished with a hint.');
  assert.equal(readinessLine(clean.completed, game.rounds.length, clean.hints), 'finished with no hints.');
});
test('readiness keeps the first true branch and does not treat zero as missing', () => {
  const total = challenges[0].rounds.length;
  assert.equal(readinessLine(total, total, 0), 'finished with no hints.');
  assert.equal(readinessLine(total, total, 1), 'finished with a hint.');
  assert.equal(readinessLine(total - 1, total, 0), 'this run is not finished.');
  assert.equal(readinessLine(total, total, 0), 'finished with no hints.');
  assert.equal(readinessLine(total + 1, total, 0), 'this run is not finished.');
  assert.equal(readinessLine(null, total, 0), 'this run is not finished.');
  assert.equal(readinessLine(total, total, null), 'this run is not finished.');
  assert.equal(readinessLine(total, total, ''), 'this run is not finished.');
  assert.equal(readinessLine(0, 0, 0), 'this run is not finished.');
  assert.equal(readinessLine(String(total), total, 0), 'this run is not finished.');
  assert.equal(readinessLine(total, total, '0'), 'this run is not finished.');
});
