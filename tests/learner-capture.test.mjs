import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { saveRemote } from "../lib/learner/store.ts";
import { syncLearnerProgress } from "../lib/learner/sync.ts";
import { LEARNER_SAVE_DELAY_MS, bindLearnerPersistence } from "../lib/learner/persistence.ts";
import { localDayKey, saaMistakeLog } from "../lib/saa-mistake-log.ts";
import { getProgressSnapshot, parseProgress, recordMatchMiss, recordMock, recordQuiz, saveProgress, subscribeProgress } from "../lib/progress.ts";

const at = Date.parse("2026-11-21T03:30:00.000Z");
const empty = () => parseProgress(null).progress;

function memoryMap() {
  const items = new Map();
  const revisions = new Map();
  let version = 0;
  return {
    async get(key) {
      return items.has(key) ? { data: structuredClone(items.get(key)), revision: revisions.get(key) } : null;
    },
    async list() { return [...items].map(([key, data]) => ({ key, data: structuredClone(data) })); },
    async set(key, data) { items.set(key, structuredClone(data)); revisions.set(key, String(++version)); },
    async remove(key) { items.delete(key); revisions.delete(key); },
    async removeAll() { items.clear(); revisions.clear(); },
    async create(key, data) {
      if (items.has(key)) throw Object.assign(new Error("conflict"), { status: 409 });
      items.set(key, structuredClone(data));
      revisions.set(key, String(++version));
    },
    async replace(key, data, revision) {
      if (revisions.get(key) !== revision) return false;
      items.set(key, structuredClone(data));
      revisions.set(key, String(++version));
      return true;
    },
  };
}

beforeEach(() => {
  const storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    addEventListener() {},
    removeEventListener() {},
  };
  saveProgress(empty());
});

test("a quiz, a mock, and a memory miss reach sync and survive the server merge on the local instant", async (t) => {
  t.mock.method(Date, "now", () => at);
  recordQuiz({ topicId: "quiz-1", exam: "saa-c03", correct: 0, total: 1, questionIds: ["q-1"], missedIds: ["q-1"], objectiveByQuestion: { "q-1": "1.1" } });
  recordMock({ exam: "saa-c03", full: false, correct: 1, total: 1, percent: 100, domains: [], multiCorrect: 0, multiTotal: 0, missedIds: [], questionIds: ["q-2"], correctIds: ["q-2"] });
  recordMatchMiss({ id: "pair-1", task: "1.1", prompt: "memory pair" }, new Date(at));

  const snapshot = getProgressSnapshot();
  assert.equal(snapshot.quizAttempts[0].at, at);
  assert.equal(snapshot.mockAttempts[0].at, at);
  assert.equal(snapshot.memoryGames.misses[0].at, at);
  assert.equal(localDayKey(at, "America/New_York"), "2026-11-20");
  assert.equal(localDayKey(at, "UTC"), "2026-11-21");
  const rows = saaMistakeLog(snapshot.quizAttempts, [], { timeZone: "America/New_York" });
  assert.equal(rows.length, 1);
  assert.equal(localDayKey(rows[0].lastSeen, "America/New_York"), "2026-11-20");

  const map = memoryMap();
  let posted;
  await syncLearnerProgress(async (local) => {
    posted = local;
    const parsed = parseProgress(JSON.stringify(local)).progress;
    const saved = await saveRemote(map, parsed);
    return { ok: true, status: 200, data: { progress: saved, savedAt: at } };
  }, () => {});

  assert.equal(posted.quizAttempts[0].topicId, "quiz-1");
  assert.equal(posted.quizAttempts[0].at, at);
  assert.equal(posted.mockAttempts[0].at, at);
  assert.equal(posted.memoryGames.misses[0].id, "pair-1");
  const stored = await saveRemote(map, empty());
  assert.equal(stored.quizAttempts.some((item) => item.topicId === "quiz-1" && item.at === at), true);
  assert.equal(stored.mockAttempts.some((item) => item.at === at), true);
  assert.equal(stored.memoryGames.misses.some((item) => item.id === "pair-1" && item.at === at), true);
});

test("finish flushes immediately, other edits wait 8 seconds, and pagehide flushes", () => {
  const modes = [];
  let scheduled = null;
  let cancelled = 0;
  const listeners = {};
  const target = {
    addEventListener(type, fn) { listeners[type] = fn; },
    removeEventListener(type) { delete listeners[type]; },
  };
  let current = "";
  const unbind = bindLearnerPersistence({
    signedIn: true,
    lastSynced: () => "",
    snapshot: () => current,
    save: (mode) => { modes.push(mode); },
    subscribe: (listener) => subscribeProgress(listener),
    target,
    schedule: (fn, ms) => { scheduled = { fn, ms }; return 1; },
    cancel: () => { cancelled += 1; scheduled = null; },
  });
  current = "quiz-finished";
  recordQuiz({ topicId: "flush", correct: 1, total: 1, questionIds: ["q"], missedIds: [] });
  assert.deepEqual(modes, ["now"]);
  assert.equal(scheduled, null);
  assert.equal(cancelled > 0, true);
  assert.equal(LEARNER_SAVE_DELAY_MS, 8000);

  modes.length = 0;
  current = "card-rated";
  const seen = scheduled;
  assert.equal(seen, null);
  const holder = [];
  const unbindEdit = bindLearnerPersistence({
    signedIn: true,
    lastSynced: () => "old",
    snapshot: () => "card-rated",
    save: (mode) => { modes.push(mode); },
    subscribe: (listener) => { holder.push(listener); return () => {}; },
    target,
    schedule: (fn, ms) => { scheduled = { fn, ms }; return 7; },
    cancel: () => { cancelled += 1; },
  });
  holder[0]();
  assert.equal(scheduled.ms, 8000);
  assert.deepEqual(modes, []);
  scheduled.fn();
  assert.deepEqual(modes, ["debounced"]);
  modes.length = 0;
  listeners.pagehide();
  assert.deepEqual(modes, ["now"]);

  const signedOutCalls = [];
  bindLearnerPersistence({
    signedIn: false,
    lastSynced: () => "",
    snapshot: () => "x",
    save: () => signedOutCalls.push("save"),
    subscribe: () => { signedOutCalls.push("subscribe"); return () => {}; },
    target,
  });
  assert.deepEqual(signedOutCalls, []);
  unbind();
  unbindEdit();
});
