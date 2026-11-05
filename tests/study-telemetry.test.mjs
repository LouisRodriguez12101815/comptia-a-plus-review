import assert from "node:assert/strict";
import { test } from "node:test";
import questions from "../content/questions.json" with { type: "json" };
import { appendTelemetry, loadTelemetry, parseStudyEvent, TELEMETRY_MAX_EVENTS } from "../lib/learner/telemetry.ts";
import { buildStudyEvent, isN10Question, objectiveForStudyQuestion, sendStudyEvent } from "../lib/study-telemetry.ts";

const event = (overrides = {}) => ({
  v: 1,
  type: "question_answered",
  at: Date.now(),
  exam: "n10-009",
  sessionId: "session-1234567890",
  questionId: "q-n10c7-16",
  topicId: "n10-ch7",
  correct: false,
  missCount: 1,
  ...overrides,
});

function fakeMap() {
  const items = new Map();
  return {
    items,
    async list() { return [...items].map(([key, data]) => ({ key, data })); },
    async set(key, data) { items.set(key, data); },
    async remove(key) { items.delete(key); },
    async removeAll() { items.clear(); },
  };
}

test("valid study events parse with only approved learning metadata", () => {
  const parsed = parseStudyEvent(event({ type: "remediation_resource_opened", resourceType: "visual" }));
  assert.equal(parsed.exam, "n10-009");
  assert.equal(parsed.resourceType, "visual");
  assert.equal("phone" in parsed, false);
});

test("unknown event types and arbitrary client fields are rejected", () => {
  assert.throws(() => parseStudyEvent(event({ type: "page_view" })), /invalid_event_type/);
  assert.throws(() => parseStudyEvent(event({ learnerText: "secret" })), /unknown_event_field/);
  assert.throws(() => parseStudyEvent(event({ email: "learner@example.com" })), /unknown_event_field/);
});

test("Network+ question metadata is available without instrumenting other exams", () => {
  const n10 = questions.find((question) => question.id === "q-n10c7-16");
  const other = { ...n10, id: "other-q", topicId: "core2-ch1", examCodes: ["220-1202"] };
  assert.ok(n10 && isN10Question(n10));
  assert.equal(objectiveForStudyQuestion(n10), undefined);
  assert.equal(isN10Question(other), false);
});

test("answer and completion payloads preserve correct/incorrect and aggregate metadata", () => {
  const n10 = questions.find((question) => question.id === "q-n10c7-16");
  const incorrect = buildStudyEvent({ type: "question_answered", question: n10, correct: false, missCount: 2 }, "session-1234567890", 10);
  const correct = buildStudyEvent({ type: "question_answered", question: n10, correct: true }, "session-1234567890", 11);
  const completed = buildStudyEvent({ type: "quiz_completed", exam: "n10-009", questionCount: 5, correctCount: 4, missedCount: 1 }, "session-1234567890", 12);
  assert.deepEqual({ correct: incorrect.correct, missCount: incorrect.missCount }, { correct: false, missCount: 2 });
  assert.equal(correct.correct, true);
  assert.deepEqual({ questionCount: completed.questionCount, correctCount: completed.correctCount, missedCount: completed.missedCount }, { questionCount: 5, correctCount: 4, missedCount: 1 });
});

test("telemetry storage is bounded and separate from progress items", async () => {
  const map = fakeMap();
  await map.set("progress-0", { s: "progress" });
  for (let i = 0; i < TELEMETRY_MAX_EVENTS + 20; i += 1) {
    await appendTelemetry(map, parseStudyEvent(event({ at: Date.now() + i, questionId: `q-${i}` })));
  }
  const stored = await loadTelemetry(map);
  assert.equal(stored.length, TELEMETRY_MAX_EVENTS);
  assert.equal(map.items.has("progress-0"), true);
  for (const [key, value] of map.items) {
    if (key.startsWith("telemetry-")) assert.ok(JSON.stringify(value).length < 16 * 1024);
  }
  await map.removeAll();
  assert.deepEqual(await loadTelemetry(map), []);
});

test("telemetry submission is best effort when the network fails", async () => {
  const previousWindow = global.window;
  const previousFetch = global.fetch;
  global.window = { sessionStorage: { getItem: () => null, setItem: () => undefined } };
  global.fetch = () => Promise.reject(new Error("offline"));
  assert.doesNotThrow(() => sendStudyEvent({ type: "quiz_started", exam: "n10-009" }));
  await new Promise((resolve) => setImmediate(resolve));
  global.window = previousWindow;
  global.fetch = previousFetch;
});

test("non-Network+ activity is not submitted", async () => {
  const previousWindow = global.window;
  const previousFetch = global.fetch;
  const calls = [];
  const other = { id: "other-q", topicId: "core2-ch1", examCodes: ["220-1202"], choices: [], answer: 0, prompt: "", explanation: "" };
  global.window = { sessionStorage: { getItem: () => null, setItem: () => undefined } };
  global.fetch = (...args) => { calls.push(args); return Promise.resolve({ ok: true }); };
  sendStudyEvent({ type: "question_answered", question: other, correct: false });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 0);
  global.window = previousWindow;
  global.fetch = previousFetch;
});
