import assert from "node:assert/strict";
import test from "node:test";
import { shuffleAnswers } from "../lib/game/answers.ts";
import { cantReachWebsiteIncident } from "../lib/game/incidents.ts";

// Exercise every possible Fisher-Yates swap sequence, not just one lucky order.
function swapSequences(size) {
  if (size < 2) return [[]];
  return Array.from({ length: size }, (_, index) =>
    swapSequences(size - 1).map((rest) => [index / size, ...rest]),
  ).flat();
}

for (const step of cantReachWebsiteIncident.steps) {
  test(`${step.title}: answer IDs, explanations, and correctness survive every order`, () => {
    const original = structuredClone(step.choices);
    const correctAnswerId = step.correctAnswerId;
    const answersById = new Map(original.map((answer) => [answer.id, answer]));
    assert.equal(answersById.size, original.length, "IDs must be unique");
    assert.ok(answersById.has(correctAnswerId), "Correct answer must exist");
    const positions = new Set();
    const orders = new Set();
    for (const sequence of swapSequences(original.length)) {
      let draw = 0;
      const shuffled = shuffleAnswers(step.choices, () => sequence[draw++]);
      assert.notEqual(shuffled, step.choices);
      assert.equal(new Set(shuffled.map((answer) => answer.id)).size, original.length);
      for (const answer of shuffled) {
        assert.deepEqual(answer, answersById.get(answer.id));
        assert.ok(answer.explanation.trim(), "Every submitted answer needs feedback");
      }
      assert.equal(shuffled.filter((answer) => answer.id === correctAnswerId).length, 1);
      positions.add(shuffled.findIndex((answer) => answer.id === correctAnswerId));
      orders.add(shuffled.map((answer) => answer.id).join(","));
      assert.deepEqual(step.choices, original, "Shuffling must not mutate the incident");
      assert.equal(step.correctAnswerId, correctAnswerId);
    }
    assert.equal(positions.size, original.length, "Correctness must survive every position");
    assert.equal(orders.size, 24, "Four answers have 24 possible orders");
  });
}

test("empty and single-answer lists do not require random draws", () => {
  const fail = () => assert.fail("Unexpected random draw");
  assert.deepEqual(shuffleAnswers([], fail), []);
  const answer = { id: "only", label: "Only answer", explanation: "Only explanation" };
  assert.deepEqual(shuffleAnswers([answer], fail), [answer]);
});
