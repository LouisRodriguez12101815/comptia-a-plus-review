import test from "node:test";
import assert from "node:assert/strict";
import { saaReviewMisses } from "../lib/saa-test-skills.ts";
import {
  filterMistakeRows,
  localDayKey,
  mistakeCardHref,
  mistakeDrillLinks,
  mistakeRetestIds,
  mistakeSummary,
  saaMistakeLog,
} from "../lib/saa-mistake-log.ts";

const day = (iso) => Date.parse(iso);
const q = (id, task, prompt = `Prompt for ${id}`) => ({
  id,
  prompt,
  objectiveIds: { "saa-c03": [task] },
  examCodes: ["saa-c03"],
});

function sitting(over) {
  return {
    exam: "saa-c03",
    topicId: "topic",
    at: day("2026-11-01T12:00:00Z"),
    questionIds: [],
    missedIds: [],
    mode: "quiz",
    ...over,
  };
}

test("status stays open after one Sure day, then Mastered on a later UTC day, and a miss reopens it", () => {
  const questions = [q("q-sure", "1.1"), q("q-other", "1.2"), q("q-lucky", "2.1")];
  const opened = saaMistakeLog([
    sitting({ questionIds: ["q-sure"], missedIds: ["q-sure"], sureIds: ["q-sure"], missReasons: { "q-sure": "qualifier" } }),
    sitting({ questionIds: ["q-other"], missedIds: ["q-other"], guessedIds: ["q-other"], missReasons: { "q-other": "time" } }),
    sitting({ questionIds: ["q-lucky"], luckyIds: ["q-lucky"], unsureIds: ["q-lucky"] }),
  ], questions, { timeZone: "UTC" });
  const sure = opened.find((row) => row.id === "q-sure");
  const other = opened.find((row) => row.id === "q-other");
  const lucky = opened.find((row) => row.id === "q-lucky");
  assert.equal(sure.status, "misconception");
  assert.equal(sure.kind, "misconception");
  assert.equal(sure.timesMissed, 1);
  assert.equal(sure.correctSinceLastMiss, 0);
  assert.equal(sure.missReason, "qualifier");
  assert.equal(other.status, "active");
  assert.equal(other.kind, "wrong");
  assert.equal(lucky.status, "active");
  assert.equal(lucky.kind, "lucky");
  assert.equal(lucky.timesMissed, 0);
  assert.deepEqual(opened.map((row) => row.id), ["q-sure", "q-other", "q-lucky"]);

  const sameDay = saaMistakeLog([
    sitting({ questionIds: ["q-sure"], missedIds: ["q-sure"], confidenceByQuestion: { "q-sure": "sure" } }),
    sitting({ at: day("2026-11-01T18:00:00Z"), questionIds: ["q-sure"], sureIds: ["q-sure"] }),
    sitting({ at: day("2026-11-01T23:00:00Z"), questionIds: ["q-sure"], sureIds: ["q-sure"] }),
  ], questions, { timeZone: "UTC" });
  assert.equal(sameDay[0].status, "misconception");
  assert.equal(sameDay[0].correctSinceLastMiss, 2);
  assert.equal(sameDay[0].masteredAt, null);

  const masteredAt = day("2026-11-03T12:00:00Z");
  const mastered = saaMistakeLog([
    sitting({ questionIds: ["q-sure"], missedIds: ["q-sure"], sureIds: ["q-sure"] }),
    sitting({ at: day("2026-11-01T18:00:00Z"), questionIds: ["q-sure"], sureIds: ["q-sure"] }),
    sitting({ at: masteredAt, questionIds: ["q-sure"], sureIds: ["q-sure"] }),
    sitting({ at: day("2026-11-04T12:00:00Z"), questionIds: ["q-sure"], luckyIds: ["q-sure"], guessedIds: ["q-sure"] }),
  ], questions, { timeZone: "UTC" });
  assert.equal(mastered[0].status, "mastered");
  assert.equal(mastered[0].wasMisconception, true);
  assert.equal(mastered[0].masteredAt, masteredAt);
  assert.equal(mastered[0].lastResult, "correct");
  assert.equal(mastered[0].lastConfidence, "guess");
  assert.equal(mastered[0].correctSinceLastMiss, 3);

  const reopened = saaMistakeLog([
    ...[
      sitting({ questionIds: ["q-sure"], missedIds: ["q-sure"], sureIds: ["q-sure"] }),
      sitting({ at: day("2026-11-02T12:00:00Z"), questionIds: ["q-sure"], sureIds: ["q-sure"] }),
      sitting({ at: masteredAt, questionIds: ["q-sure"], sureIds: ["q-sure"] }),
    ],
    sitting({ at: day("2026-11-05T12:00:00Z"), questionIds: ["q-sure"], missedIds: ["q-sure"], guessedIds: ["q-sure"] }),
  ], questions, { timeZone: "UTC" });
  assert.equal(reopened[0].status, "active");
  assert.equal(reopened[0].kind, "wrong");
  assert.equal(reopened[0].wasMisconception, true);
  assert.equal(reopened[0].masteredAt, null);
  assert.equal(reopened[0].timesMissed, 2);
  assert.equal(reopened[0].correctSinceLastMiss, 0);

  const reset = saaMistakeLog([
    sitting({ questionIds: ["q-other"], missedIds: ["q-other"] }),
    sitting({ at: day("2026-11-02T12:00:00Z"), questionIds: ["q-other"], sureIds: ["q-other"] }),
    sitting({ at: day("2026-11-03T12:00:00Z"), questionIds: ["q-other"], missedIds: ["q-other"] }),
    sitting({ at: day("2026-11-04T12:00:00Z"), questionIds: ["q-other"], sureIds: ["q-other"] }),
  ], questions, { timeZone: "UTC" });
  assert.equal(reset[0].status, "active");
  assert.equal(reset[0].masteredAt, null);
});

test("a later Sure-correct stays in the log and sittings from every mode add up once", () => {
  const questions = [q("q1", "3.1", "Keep this question even after a sure answer."), q("q2", "4.2")];
  const attempts = [
    sitting({ mode: "quiz", questionIds: ["q1"], missedIds: ["q1"], sureIds: ["q1"], missReasons: { q1: "confused" } }),
    sitting({ mode: "topic", at: day("2026-11-02T12:00:00Z"), questionIds: ["q1"], missedIds: ["q1"], missReasons: { q1: "confused" } }),
    sitting({ mode: "twin", at: day("2026-11-03T12:00:00Z"), questionIds: ["q1"], luckyIds: ["q1"], unsureIds: ["q1"] }),
    sitting({ mode: "drill", at: day("2026-11-04T12:00:00Z"), questionIds: ["q2"], missedIds: ["q2"], missReasons: { q2: "unknown" } }),
    {
      exam: "saa-c03",
      at: day("2026-11-05T12:00:00Z"),
      topicId: "exam-test:saa-c03",
      mode: "quiz",
      questionIds: ["q1"],
      missedIds: ["q1"],
    },
    {
      exam: "saa-c03",
      at: day("2026-11-05T12:00:00Z"),
      mode: "mini",
      questionIds: ["q1"],
      missedIds: [],
      sureIds: ["q1"],
    },
    sitting({ exam: "clf-c02", mode: "mock", questionIds: ["q2"], missedIds: ["q2"] }),
  ];
  const rows = saaMistakeLog(attempts, questions);
  const review = saaReviewMisses(attempts, questions);
  assert.equal(review.find((row) => row.id === "q1"), undefined);
  const first = rows.find((row) => row.id === "q1");
  const second = rows.find((row) => row.id === "q2");
  assert.equal(first.timesMissed, 2);
  assert.equal(first.correctSinceLastMiss, 2);
  assert.equal(first.lastResult, "correct");
  assert.equal(first.lastConfidence, "sure");
  assert.equal(first.missReason, "confused");
  assert.equal(first.task, "3.1");
  assert.equal(first.domain, "3.0");
  assert.equal(first.prompt, "Keep this question even after a sure answer.");
  assert.equal(second.timesMissed, 1);
  assert.equal(second.status, "active");
  assert.equal(second.kind, "wrong");
  assert.deepEqual(rows.map((row) => row.id), ["q1", "q2"]);
  assert.deepEqual(JSON.parse(JSON.stringify(rows)), rows);

  const summary = mistakeSummary(rows, day("2026-11-06T12:00:00Z"));
  assert.equal(summary.misconceptions, 1);
  assert.equal(summary.active, 1);
  assert.deepEqual(summary.weakestTasks, [
    { task: "3.1", count: 1 },
    { task: "4.2", count: 1 },
  ]);
  const week = saaMistakeLog([
    sitting({ questionIds: ["q2"], missedIds: ["q2"] }),
    sitting({ at: day("2026-11-02T12:00:00Z"), questionIds: ["q2"], sureIds: ["q2"] }),
    sitting({ at: day("2026-11-03T12:00:00Z"), questionIds: ["q2"], sureIds: ["q2"] }),
  ], questions, { timeZone: "UTC" });
  assert.equal(mistakeSummary(week, day("2026-11-06T12:00:00Z")).masteredThisWeek, 1);
  assert.equal(mistakeSummary(week, day("2026-11-20T12:00:00Z")).masteredThisWeek, 0);
  assert.deepEqual(filterMistakeRows(rows, { domain: "4.0", status: "active", reason: "unknown" }).map((row) => row.id), ["q2"]);
});

test("two Sure answers on one New York date do not master, and a later miss reopens as Active", () => {
  const zone = { timeZone: "America/New_York" };
  const questions = [q("q-ny", "1.1")];
  const sameEvening = Date.parse("2026-11-21T23:30:00Z");
  const laterSameEvening = Date.parse("2026-11-22T01:30:00Z");
  const nextLocalDay = Date.parse("2026-11-22T23:30:00Z");
  assert.equal(localDayKey(sameEvening, "America/New_York"), "2026-11-21");
  assert.equal(localDayKey(laterSameEvening, "America/New_York"), "2026-11-21");
  assert.equal(localDayKey(nextLocalDay, "America/New_York"), "2026-11-22");
  const miss = sitting({
    at: Date.parse("2026-11-20T16:00:00Z"),
    questionIds: ["q-ny"],
    missedIds: ["q-ny"],
    sureIds: ["q-ny"],
  });
  const held = saaMistakeLog([
    miss,
    sitting({ at: sameEvening, questionIds: ["q-ny"], sureIds: ["q-ny"] }),
    sitting({ at: laterSameEvening, questionIds: ["q-ny"], sureIds: ["q-ny"] }),
  ], questions, zone);
  assert.equal(held[0].status, "misconception");
  assert.equal(held[0].masteredAt, null);
  assert.equal(held[0].wasMisconception, true);

  const masteredPath = [
    miss,
    sitting({ at: sameEvening, questionIds: ["q-ny"], sureIds: ["q-ny"] }),
    sitting({ at: nextLocalDay, questionIds: ["q-ny"], sureIds: ["q-ny"] }),
  ];
  const mastered = saaMistakeLog(masteredPath, questions, zone);
  assert.equal(mastered[0].status, "mastered");
  assert.equal(mastered[0].wasMisconception, true);

  const reopened = saaMistakeLog([
    ...masteredPath,
    sitting({ at: Date.parse("2026-11-23T16:00:00Z"), questionIds: ["q-ny"], missedIds: ["q-ny"], guessedIds: ["q-ny"] }),
  ], questions, zone);
  assert.equal(reopened[0].status, "active");
  assert.equal(reopened[0].wasMisconception, true);

  const sureAgain = saaMistakeLog([
    ...masteredPath,
    sitting({ at: Date.parse("2026-11-23T16:00:00Z"), questionIds: ["q-ny"], missedIds: ["q-ny"], sureIds: ["q-ny"] }),
  ], questions, zone);
  assert.equal(sureAgain[0].status, "misconception");
  assert.equal(sureAgain[0].wasMisconception, true);
});

test("retest leads with misconceptions and rotates the other open rows by shared history", () => {
  const questions = [q("miss", "1.1"), q("seen", "1.1"), q("fresh", "1.2"), q("done", "1.3")];
  const rows = saaMistakeLog([
    sitting({ questionIds: ["miss"], missedIds: ["miss"], sureIds: ["miss"] }),
    sitting({ questionIds: ["seen"], missedIds: ["seen"] }),
    sitting({ questionIds: ["fresh"], missedIds: ["fresh"] }),
    sitting({ questionIds: ["done"], missedIds: ["done"] }),
    sitting({ at: day("2026-11-02T12:00:00Z"), questionIds: ["done"], sureIds: ["done"] }),
    sitting({ at: day("2026-11-03T12:00:00Z"), questionIds: ["done"], sureIds: ["done"] }),
  ], questions, { timeZone: "UTC" });
  const ids = mistakeRetestIds(rows, ["seen"], () => 0);
  assert.equal(ids[0], "miss");
  assert.ok(ids.indexOf("fresh") < ids.indexOf("seen"));
  assert.equal(ids.includes("done"), false);
  assert.equal(mistakeCardHref(["1.2"]), "/flashcards?exam=saa-c03&task=1.2&topic=due");
  assert.equal(mistakeCardHref(["3.2", "1.1"]), "/flashcards?exam=saa-c03&topic=due");
  const links = mistakeDrillLinks(["1.1"]);
  assert.ok(links.some((link) => link.id === "aws-saa-service-facts"));
  assert.ok(links.every((link) => link.href === `/practice-games/drills/${link.id}` && link.tasks.includes("1.1")));
  assert.deepEqual(mistakeDrillLinks(["9.9"]), []);
});
