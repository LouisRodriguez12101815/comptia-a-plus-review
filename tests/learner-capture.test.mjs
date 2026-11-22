import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { saveRemote } from "../lib/learner/store.ts";
import { syncLearnerProgress } from "../lib/learner/sync.ts";
import { mergeProgress } from "../lib/learner/merge.ts";
import { makeSnapshot } from "../lib/learner/progress-snapshot.mjs";
import { summarizeItems } from "../lib/learner/owner-report.ts";
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

const captureContent = {
  questions: [{ id: "q-1", topicId: "t1", prompt: "Which control stays?", choices: ["one", "two"], answer: 0, explanation: "Because.", examCodes: ["saa-c03"], objectiveIds: { "saa-c03": ["1.1"] } }],
  topics: [{ id: "t1", title: "Storage", examCodes: ["saa-c03"] }],
  objectives: { exams: [{ code: "saa-c03", name: "Solutions Architect", domains: [{ id: "1", title: "Design secure architectures", objectives: [{ id: "1.1", title: "Design secure access" }] }] }] },
  concepts: { concepts: [] },
};

test("timestamps survive local save, the sync payload, mergeProgress, and the report", async (t) => {
  t.mock.method(Date, "now", () => at);
  const started = at - 60_000;
  recordQuiz({
    topicId: "quiz-1", exam: "saa-c03", correct: 0, total: 1, questionIds: ["q-1"], missedIds: ["q-1"],
    startedAt: started, answeredAt: { "q-1": 15_000 },
  });
  recordMock({
    exam: "saa-c03", full: false, correct: 1, total: 1, percent: 100, domains: [{ id: "1", title: "Design", correct: 1, total: 1 }],
    multiCorrect: 0, multiTotal: 0, missedIds: [], questionIds: ["q-1"], correctIds: ["q-1"],
    startedAt: started, answeredAt: { "q-1": 20_000 },
  });
  const saved = parseProgress(JSON.stringify(getProgressSnapshot()));
  assert.deepEqual(saved.problems, []);
  assert.equal(saved.progress.quizAttempts[0].startedAt, started);
  assert.deepEqual(saved.progress.quizAttempts[0].answeredAt, { "q-1": 15_000 });
  assert.equal(saved.progress.quizAttempts[0].at, at);
  assert.equal(saved.progress.mockAttempts[0].startedAt, started);
  assert.deepEqual(saved.progress.mockAttempts[0].answeredAt, { "q-1": 20_000 });

  const remoteOnly = parseProgress(JSON.stringify({
    ...empty(),
    quizAttempts: [{ topicId: "remote", exam: "saa-c03", correct: 1, total: 1, questionIds: ["q-1"], missedIds: [], startedAt: started, answeredAt: { "q-1": 5_000 }, at: at - 1 }],
  })).progress;
  const merged = mergeProgress(empty(), remoteOnly);
  assert.equal(merged.quizAttempts[0].startedAt, started);
  assert.deepEqual(merged.quizAttempts[0].answeredAt, { "q-1": 5_000 });
  const localWins = mergeProgress(saved.progress, {
    ...remoteOnly,
    quizAttempts: [{ ...saved.progress.quizAttempts[0], startedAt: started - 10, answeredAt: { "q-1": 1 } }],
  });
  assert.equal(localWins.quizAttempts.find((item) => item.topicId === "quiz-1").startedAt, started);
  assert.deepEqual(localWins.quizAttempts.find((item) => item.topicId === "quiz-1").answeredAt, { "q-1": 15_000 });

  const raw = JSON.stringify(saved.progress);
  const snap = makeSnapshot(raw);
  assert.ok(snap.chunks.length <= 40);
  const syncedAt = "2026-11-21T03:30:12.000Z";
  const summary = summarizeItems([
    { key: "progress", data: { s: raw }, dateUpdated: syncedAt },
  ], captureContent, { exam: "saa-c03", days: 30, asOf: at + 86_400_000 });
  const quiz = summary.captures.find((row) => row.kind === "quiz");
  const mock = summary.captures.find((row) => row.kind === "mock");
  assert.equal(quiz.startedAt, started);
  assert.equal(quiz.finishedAt, at);
  assert.equal(quiz.syncedAt, syncedAt);
  assert.equal(quiz.delayMs, 12_000);
  assert.equal(mock.delayMs, 12_000);
  assert.match(summary.markdown, /delay 12s/);
  assert.match(summary.markdown, /synced 2026-11-21T03:30:12.000Z/);

  const legacy = summarizeItems([{
    key: "progress",
    data: { s: JSON.stringify({ quizAttempts: [{ topicId: "old", exam: "saa-c03", correct: 1, total: 1, questionIds: ["q-1"], missedIds: [], at }], mockAttempts: [] }) },
  }], captureContent, { exam: "saa-c03", days: 30, asOf: at + 86_400_000 });
  assert.equal(legacy.captures[0].startedAt, null);
  assert.equal(legacy.captures[0].finishedAt, at);
  assert.equal(legacy.captures[0].syncedAt, null);
  assert.match(legacy.markdown, /start not recorded/);
  assert.match(legacy.markdown, /not synced yet/);
});

test("answer offsets fit the existing snapshot cap and stay smaller than absolute times", () => {
  const questions = Array.from({ length: 65 }, (_, index) => `q-${index}`);
  const startedAt = 1_700_000_000_000;
  const offsets = Object.fromEntries(questions.map((id, index) => [id, index * 1000]));
  const absolute = Object.fromEntries(questions.map((id, index) => [id, startedAt + index * 1000]));
  const attempt = (at) => ({
    topicId: `t-${at}`, exam: "saa-c03", correct: 1, total: 65, questionIds: questions, missedIds: questions.slice(1),
    startedAt, answeredAt: offsets, at,
  });
  const mock = (at) => ({
    exam: "saa-c03", full: true, correct: 1, total: 65, percent: 2, domains: [{ id: "1", title: "Design", correct: 1, total: 65 }],
    multiCorrect: 0, multiTotal: 0, questionIds: questions, missedIds: questions.slice(1), correctIds: ["q-0"],
    startedAt, answeredAt: offsets, at,
  });
  const progress = {
    ...empty(),
    quizAttempts: Array.from({ length: 40 }, (_, index) => attempt(startedAt + 120_000 + index)),
    mockAttempts: Array.from({ length: 30 }, (_, index) => mock(startedAt + 200_000 + index)),
  };
  const raw = JSON.stringify(progress);
  const withAbsolute = JSON.stringify({
    ...progress,
    quizAttempts: progress.quizAttempts.map((item) => ({ ...item, answeredAt: absolute })),
    mockAttempts: progress.mockAttempts.map((item) => ({ ...item, answeredAt: absolute })),
  });
  assert.ok(raw.length < withAbsolute.length);
  const snap = makeSnapshot(raw);
  assert.ok(snap.chunks.length >= 1);
  assert.ok(snap.chunks.length <= 40);
});
