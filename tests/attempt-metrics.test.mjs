import assert from "node:assert/strict";
import { test } from "node:test";
import { extendFirstSeen, firstAttemptSummary, mergeFirstSeen, mockSeenByTimestamp, shareForMock } from "../lib/attempt-metrics.ts";
import { mergeProgress } from "../lib/learner/merge.ts";
import { summarizeItems } from "../lib/learner/owner-report.ts";
import { parseProgress } from "../lib/progress.ts";

const empty = () => parseProgress(null).progress;

test("first exposures keep the earliest outcome and a later repeat does not replace it", () => {
  const seeded = extendFirstSeen(empty(), {
    exam: "saa-c03", at: 10, questionIds: ["a", "b"], missedIds: ["b"],
  });
  const progress = { ...empty(), firstSeen: seeded, quizAttempts: [{ topicId: "t", exam: "saa-c03", correct: 1, total: 2, questionIds: ["a", "b"], missedIds: ["b"], at: 10 }] };
  const next = extendFirstSeen(progress, { exam: "saa-c03", at: 20, questionIds: ["b", "c"], missedIds: [] });
  assert.equal(next["saa-c03:a"].correct, true);
  assert.equal(next["saa-c03:b"].correct, false);
  assert.equal(next["saa-c03:b"].at, 10);
  assert.equal(next["saa-c03:c"].correct, true);
  const summary = firstAttemptSummary({ ...progress, firstSeen: next }, "saa-c03", 0, 100);
  assert.deepEqual(summary, { correct: 2, total: 3, accuracy: 0.667 });
});

test("a mock seen-share uses earlier SAA quizzes and survives a merge", () => {
  const progress = {
    ...empty(),
    quizAttempts: [{ topicId: "t", exam: "saa-c03", correct: 1, total: 1, questionIds: ["a"], missedIds: [], at: 5 }],
    mockAttempts: [{ exam: "saa-c03", full: false, correct: 1, total: 2, percent: 50, domains: [{ id: "1.0", title: "Secure", correct: 1, total: 2 }], multiCorrect: 0, multiTotal: 0, questionIds: ["a", "b"], missedIds: ["b"], at: 4 }],
  };
  assert.equal(shareForMock(progress, "saa-c03", ["a", "b", "c"]), 67);
  const local = { ...empty(), mockAttempts: [{ ...progress.mockAttempts[0], at: 8 }] };
  const remote = { ...empty(), mockAttempts: [{ ...progress.mockAttempts[0], at: 8, seenShare: 25 }], firstSeen: { "saa-c03:a": { exam: "saa-c03", correct: true, at: 3 } } };
  const merged = mergeProgress(local, remote);
  assert.equal(merged.mockAttempts[0].seenShare, 25);
  assert.equal(merged.firstSeen["saa-c03:a"].at, 3);
  const earlierWrong = mergeFirstSeen(
    { "saa-c03:a": { exam: "saa-c03", correct: false, at: 2 } },
    { "saa-c03:a": { exam: "saa-c03", correct: true, at: 9 } },
  );
  assert.equal(earlierWrong["saa-c03:a"].correct, false);
});

test("the report shows stored mock seen-share and ignores a later repeat", () => {
  const content = {
    questions: [
      { id: "q-sure", topicId: "t1", prompt: "What stays in the summary?", choices: ["one", "two"], answer: 0, explanation: "Because the requirement names it.", examCodes: ["saa-c03"], objectiveIds: { "saa-c03": ["1.1"] } },
      { id: "q-lucky", topicId: "t1", prompt: "Which guess was lucky?", choices: ["one", "two"], answer: 1, explanation: "Because the other choice misses it.", examCodes: ["saa-c03"], objectiveIds: { "saa-c03": ["1.1"] } },
    ],
    topics: [{ id: "t1", title: "Storage", examCodes: ["saa-c03"] }],
    objectives: { exams: [{ code: "saa-c03", name: "Solutions Architect", domains: [{ id: "1", title: "Design secure architectures", objectives: [{ id: "1.1", title: "Design secure access" }] }] }] },
    concepts: { concepts: [] },
  };
  const quizAt = Date.parse("2026-11-20T15:00:00.000Z");
  const mockAt = Date.parse("2026-11-20T16:00:00.000Z");
  const summary = summarizeItems([{
    key: "progress",
    data: { s: JSON.stringify({
      quizAttempts: [{ topicId: "t1", exam: "saa-c03", correct: 1, total: 2, questionIds: ["q-sure", "q-lucky"], missedIds: ["q-sure"], at: quizAt }],
      mockAttempts: [{ exam: "saa-c03", full: true, correct: 2, total: 2, percent: 100, domains: [{ id: "1", title: "Design secure architectures", correct: 2, total: 2 }], multiCorrect: 0, multiTotal: 0, questionIds: ["q-sure", "q-lucky"], missedIds: [], seenShare: 50, at: mockAt }],
      firstSeen: {
        "saa-c03:q-sure": { exam: "saa-c03", correct: false, at: quizAt },
        "saa-c03:q-lucky": { exam: "saa-c03", correct: true, at: quizAt },
      },
    }) },
  }], content, { exam: "saa-c03", days: 30, asOf: Date.parse("2026-11-21T12:00:00.000Z") });
  assert.equal(summary.firstAttempt.correct, 1);
  assert.equal(summary.firstAttempt.total, 2);
  const mockSitting = summary.sittings.find((sitting) => sitting.at === new Date(mockAt).toISOString());
  assert.equal(mockSitting.seenShare, 50);
  assert.match(summary.markdown, /50% already seen/);
  const saved = parseProgress(JSON.stringify({ studyFocus: "saa-c03", knownCards: {}, unknownCards: {}, quizAttempts: [], mockAttempts: [{ exam: "saa-c03", full: true, correct: 1, total: 1, percent: 100, domains: [{ id: "1.0", title: "Secure", correct: 1, total: 1 }], multiCorrect: 0, multiTotal: 0, questionIds: ["q-sure"], missedIds: [], seenShare: 50, at: 1 }], schedules: {}, firstSeen: { "saa-c03:q-sure": { exam: "saa-c03", correct: true, at: 1 }, bad: { exam: 1 } } }));
  assert.equal(saved.problems.includes("repaired"), true);
  assert.equal(saved.progress.mockAttempts[0].seenShare, 50);
  assert.equal(saved.progress.firstSeen["saa-c03:q-sure"].correct, true);
  assert.equal(saved.progress.firstSeen.bad, undefined);
});

test("mock seen-share timestamps line up with the report window", () => {
  const at = Date.parse("2026-11-20T16:00:00.000Z");
  const shares = mockSeenByTimestamp({
    mockAttempts: [{ exam: "saa-c03", at, questionIds: ["a"], seenShare: 0 }],
  }, "saa-c03", at - 1000, at + 1000);
  assert.equal(shares.get(new Date(at).toISOString()), 0);
});
