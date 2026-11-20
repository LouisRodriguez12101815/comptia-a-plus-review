import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getQuestions } from "../lib/content.ts";
import { getTrack, progressExamFocus, trackCounts } from "../lib/tracks.ts";

test("a track progress panel counts the track exam when the saved focus is another exam", () => {
  assert.equal(progressExamFocus("220-1201", "saa-c03"), "saa-c03");
  assert.equal(progressExamFocus("220-1201", null), "220-1201");
  const track = getTrack("aws-saa");
  const focus = progressExamFocus("220-1201", track.focus);
  const progressCount = getQuestions("all", focus).length;
  assert.equal(progressCount, trackCounts(track).questions);
  assert.notEqual(progressCount, getQuestions("all", "220-1201").length);

  const hub = readFileSync(new URL("../app/components/TrackHub.tsx", import.meta.url), "utf8");
  const uses = hub.match(/<ProgressDashboard\b[^>]*>/g);
  assert.equal(uses.length, 2);
  assert.ok(uses.every((tag) => tag.includes("examFocus={track.focus}")));
});
