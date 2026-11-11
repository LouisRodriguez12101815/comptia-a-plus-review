import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { syncLearnerProgress } from "../lib/learner/sync.ts";
import { getProgressSnapshot, parseProgress, recordQuiz, saveProgress, subscribeProgress } from "../lib/progress.ts";

const empty = () => parseProgress(null).progress;
const quiz = (id, at) => ({ topicId: id, correct: 1, total: 1, questionIds: [id], missedIds: [], at });
const successful = (progress) => ({ ok: true, status: 200, data: { progress, savedAt: 123 } });
const schedule = (iso) => ({ due: iso, last_review: iso, stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 1, reps: 1, lapses: 0, state: 2 });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let writes;
let acknowledgements;
beforeEach(() => {
  const storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => { storage.set(key, value); writes += 1; },
    },
    addEventListener() {},
    removeEventListener() {},
  };
  writes = 0;
  saveProgress(empty());
  writes = 0;
  acknowledgements = [];
});
const acknowledge = (raw) => acknowledgements.push(raw);

test("a delayed differing response preserves intervening local progress and server additions", async (t) => {
  t.mock.method(Date, "now", () => 100);
  const reply = deferred();
  let sent;
  const pending = syncLearnerProgress((local) => { sent = local; return reply.promise; }, acknowledge);
  recordQuiz({ topicId: "new-local", correct: 1, total: 1, questionIds: ["q-new"], missedIds: [] });
  const newer = { ...getProgressSnapshot(), studyFocus: "n10-009", unknownCards: { reviewed: true } };
  saveProgress(newer);
  const remote = { ...sent, knownCards: { "server-only": true } };
  reply.resolve(successful(remote));
  await pending;
  const final = getProgressSnapshot();
  assert.deepEqual(final.quizAttempts, newer.quizAttempts);
  assert.equal(final.studyFocus, "n10-009");
  assert.deepEqual(final.unknownCards, { reviewed: true });
  assert.equal(final.knownCards["server-only"], true);
});

test("a response identical to the sent snapshot leaves newer local progress intact", async () => {
  const reply = deferred();
  let sent;
  const pending = syncLearnerProgress((local) => { sent = local; return reply.promise; }, acknowledge);
  saveProgress({ ...getProgressSnapshot(), quizAttempts: [quiz("local", 10)] });
  const writesBeforeReply = writes;
  reply.resolve(successful(sent));
  await pending;
  assert.deepEqual(getProgressSnapshot().quizAttempts, [quiz("local", 10)]);
  assert.equal(writes, writesBeforeReply, "no redundant save when reconciliation is unchanged");
});

test("B can apply before A without the older response rolling back B", async () => {
  const a = deferred(), b = deferred();
  let sentA, sentB;
  const first = syncLearnerProgress((local) => { sentA = local; return a.promise; }, acknowledge);
  saveProgress({ ...getProgressSnapshot(), quizAttempts: [quiz("local-b", 20)], studyFocus: "n10-009" });
  const second = syncLearnerProgress((local) => { sentB = local; return b.promise; }, acknowledge);
  b.resolve(successful({ ...sentB, knownCards: { "remote-b": true }, mockAttempts: [{
    exam: "n10-009", full: true, correct: 1, total: 1, percent: 100,
    domains: [{ id: "1", title: "Synthetic", correct: 1, total: 1 }],
    multiCorrect: 0, multiTotal: 0, questionIds: ["remote-mock"], missedIds: [], at: 30,
  }] }));
  await second;
  assert.equal(getProgressSnapshot().knownCards["remote-b"], true);
  a.resolve(successful({ ...sentA, knownCards: { "remote-a": true } }));
  await first;
  const final = getProgressSnapshot();
  assert.deepEqual(final.quizAttempts, [quiz("local-b", 20)]);
  assert.equal(final.mockAttempts[0].at, 30);
  assert.deepEqual(final.knownCards, { "remote-a": true, "remote-b": true });
  assert.equal(final.studyFocus, "n10-009");
});

test("ordinary sync applies server progress and an unchanged response does not write", async () => {
  const remote = { ...empty(), knownCards: { cloud: true }, quizAttempts: [quiz("remote", 12)] };
  const response = successful(remote);
  assert.equal(await syncLearnerProgress(async () => response, acknowledge), response);
  assert.deepEqual(getProgressSnapshot(), remote);
  assert.deepEqual(acknowledgements, [JSON.stringify(remote)]);
  const previousWrites = writes;
  await syncLearnerProgress(async (local) => successful(local), acknowledge);
  assert.equal(writes, previousWrites);
});

test("existing merge policy keeps the newest schedules and current local focus", async () => {
  const reply = deferred();
  let sent;
  const firstDate = "2026-10-01T00:00:00.000Z", lastDate = "2026-10-03T00:00:00.000Z";
  saveProgress({ ...empty(), knownCards: { changed: true }, schedules: { changed: schedule(firstDate) } });
  const pending = syncLearnerProgress((local) => { sent = local; return reply.promise; }, acknowledge);
  saveProgress({ ...sent, studyFocus: "clf-c02", knownCards: {}, unknownCards: { changed: true }, schedules: { changed: schedule(lastDate) } });
  reply.resolve(successful({ ...sent, schedules: { ...sent.schedules, "remote-only": schedule(lastDate) } }));
  await pending;
  const final = getProgressSnapshot();
  assert.equal(final.studyFocus, "clf-c02");
  assert.equal(final.unknownCards.changed, true);
  assert.equal(final.knownCards.changed, undefined);
  assert.equal(final.schedules.changed.last_review, lastDate);
  assert.equal(final.schedules["remote-only"].last_review, lastDate);
});

test("acknowledge the server snapshot before saving so unsent local changes remain dirty", async () => {
  const reply = deferred();
  let sent, observed;
  const pending = syncLearnerProgress((local) => { sent = local; return reply.promise; }, acknowledge);
  saveProgress({ ...getProgressSnapshot(), quizAttempts: [quiz("pending", 50)] });
  const unsubscribe = subscribeProgress(() => { observed = { ack: acknowledgements.at(-1), local: JSON.stringify(getProgressSnapshot()) }; });
  const remote = { ...sent, knownCards: { cloud: true } };
  try {
    reply.resolve(successful(remote));
    await pending;
    assert.equal(observed.ack, JSON.stringify(remote));
    assert.notEqual(observed.local, observed.ack, "local-only progress must not be marked as server-acknowledged");
  } finally { unsubscribe(); }
});

test("a legitimate newer server review still applies over an older local review", async () => {
  const older = "2026-10-01T00:00:00.000Z", newer = "2026-10-03T00:00:00.000Z";
  saveProgress({ ...empty(), unknownCards: { reviewed: true }, schedules: { reviewed: schedule(older) } });
  await syncLearnerProgress(async (local) => successful({
    ...local, unknownCards: {}, knownCards: { reviewed: true }, schedules: { reviewed: schedule(newer) },
  }), acknowledge);
  assert.equal(getProgressSnapshot().schedules.reviewed.last_review, newer);
  assert.equal(getProgressSnapshot().knownCards.reviewed, true);
  assert.equal(getProgressSnapshot().unknownCards.reviewed, undefined);
});

test("rejected requests and transport failure leave current state intact; retry sends latest state", async () => {
  for (const status of [0, 401, 429, 502]) {
    const reply = deferred();
    const pending = syncLearnerProgress(() => reply.promise, acknowledge);
    saveProgress({ ...empty(), quizAttempts: [quiz("after-request-" + status, status + 10)] });
    const current = getProgressSnapshot(), writesBeforeReply = writes;
    const response = { ok: false, status, data: { error: "unavailable" } };
    reply.resolve(response);
    assert.equal(await pending, response);
    assert.deepEqual(getProgressSnapshot(), current);
    assert.equal(writes, writesBeforeReply);
    assert.equal(acknowledgements.length, 0);
  }
  const current = getProgressSnapshot(), writesBeforeThrow = writes;
  await assert.rejects(syncLearnerProgress(async () => { throw new Error("transport failed"); }, acknowledge), /transport failed/);
  assert.deepEqual(getProgressSnapshot(), current);
  assert.equal(writes, writesBeforeThrow);
  await syncLearnerProgress(async (local) => {
    assert.deepEqual(local, current, "retry must capture the latest local snapshot");
    return successful({ ...local, knownCards: { "from-retry": true } });
  }, acknowledge);
  assert.deepEqual(getProgressSnapshot().quizAttempts, current.quizAttempts);
  assert.equal(getProgressSnapshot().knownCards["from-retry"], true);
});
