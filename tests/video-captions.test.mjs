import { test } from "node:test";
import assert from "node:assert/strict";
import { notesFor, paragraphs, stamp, vttToLines } from "../scripts/video-captions-to-notes.mjs";

const sample = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:03.000 align:start position:0%
welcome<00:00:01.500><c> to</c><00:00:02.000><c> the</c> review

00:00:03.000 --> 00:00:05.000 align:start position:0%
welcome to the review
first up is malware removal

00:00:40.250 --> 00:00:42.000
step one &amp; identify symptoms
`;

test("rolling automatic captions are de-duplicated and tags removed", () => {
  assert.deepEqual(vttToLines(sample), [
    { start: 1, text: "welcome to the review" },
    { start: 3, text: "first up is malware removal" },
    { start: 40, text: "step one & identify symptoms" },
  ]);
});

test("paragraphs start a new [mm:ss] stamp every 30 seconds", () => {
  assert.deepEqual(paragraphs(vttToLines(sample)), [
    "[00:01] welcome to the review first up is malware removal",
    "[00:40] step one & identify symptoms",
  ]);
  assert.equal(stamp(3725), "1:02:05");
});

test("notes carry provenance and the private-file marker", () => {
  const notes = notesFor("abc123", { title: "Sample", channel: "Teacher", upload_date: "20260115", duration: 95 }, vttToLines(sample));
  assert.match(notes, /^<!-- Private source notes/);
  assert.match(notes, /Source title: Sample/);
  assert.match(notes, /Source date: 2026-01-15/);
  assert.match(notes, /URL or private file reference: https:\/\/www\.youtube\.com\/watch\?v=abc123/);
  assert.match(notes, /Length: 01:35/);
});
