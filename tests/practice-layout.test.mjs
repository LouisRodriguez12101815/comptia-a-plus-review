import test from "node:test";
import assert from "node:assert/strict";
import { drillDecks } from "../lib/practice/drills.ts";
import { certificationForFocus, groupDrills, parseObjectiveIds, recommendDrills } from "../lib/practice/grouping.ts";
import { weakObjectiveIds } from "../lib/weakness.ts";
import objectives from "../content/objectives.json" with { type: "json" };

const titles = (exam, major) => objectives.exams.find((e) => e.code.toLowerCase() === exam.toLowerCase())?.domains.find((d) => d.id === `${major}.0`)?.title;
const labels = { mixed: "Mixed review", other: "Other drills" };

test("objective text parses lists and ranges", () => {
  assert.deepEqual(parseObjectiveIds("1.1, 1.2"), ["1.1", "1.2"]);
  assert.deepEqual(parseObjectiveIds("3.1–3.3"), ["3.1", "3.2", "3.3"]);
  assert.deepEqual(parseObjectiveIds("1.1–1.3, 5.4"), ["1.1", "1.2", "1.3", "5.4"]);
  assert.deepEqual(parseObjectiveIds("2.7, 2.8, 2.9, 2.10"), ["2.7", "2.8", "2.9", "2.10"]);
  assert.deepEqual(parseObjectiveIds("Domain notes"), []);
});

test("the study focus picks the matching certification filter", () => {
  assert.equal(certificationForFocus("220-1202"), "A+ Core 2");
  assert.equal(certificationForFocus("n10-009"), "Network+");
  assert.equal(certificationForFocus("all"), "all");
  const known = new Set(drillDecks.map((d) => d.certification));
  assert.ok(known.has(certificationForFocus("220-1202")) && known.has(certificationForFocus("220-1201")));
});

test("every Core 2 drill lands in a named domain or the mixed group, and none is lost", () => {
  const core2 = drillDecks.filter((d) => d.certification === "A+ Core 2");
  const groups = groupDrills(core2, titles, labels, false);
  assert.equal(groups.flatMap((g) => g.decks).length, core2.length);
  assert.deepEqual(groups.map((g) => g.title), ["Operating systems", "Security", "Software troubleshooting", "Operational procedures", "Mixed review"]);
  const os = groups[0].decks.map((d) => d.id);
  assert.ok(os.includes("c2-windows-tools") && os.includes("c2-linux"));
  assert.ok(groups.at(-1).decks.some((d) => d.id === "c2-assessment-security"), "decks that span domains go in the mixed group");
  assert.ok(os.includes("c2-assessment-os"), "a single-domain assessment deck sits with its domain");
});

test("with several certifications, group titles carry the certification", () => {
  const groups = groupDrills(drillDecks, titles, labels, true);
  assert.equal(groups.flatMap((g) => g.decks).length, drillDecks.length);
  assert.ok(groups.every((g) => g.title.includes("·")));
  assert.ok(groups.findIndex((g) => g.title.startsWith("A+ Core 1")) < groups.findIndex((g) => g.title.startsWith("A+ Core 2")));
});

test("weak objectives suggest the drills that cover them, most covered first", () => {
  const core2 = drillDecks.filter((d) => d.certification === "A+ Core 2");
  const picks = recommendDrills(core2, ["3.1"]);
  assert.ok(picks.length > 0 && picks.every((p) => p.objectiveIds.includes("3.1")));
  assert.equal(picks[0].deck.id, "c2-troubleshoot-windows");
  assert.deepEqual(recommendDrills(core2, []), []);
  assert.ok(recommendDrills(core2, ["1.1", "1.2", "1.3"])[0].objectiveIds.length >= 2);
});

test("weak objectives come from recent sittings, lowest accuracy first, and need three answers", () => {
  const sitting = (at, byQuestion, missed) => ({ exam: "220-1202", at, questionIds: Object.keys(byQuestion), objectiveByQuestion: byQuestion, missedIds: missed });
  const attempts = [
    sitting(1, { a: "3.1", b: "3.1", c: "3.1", d: "2.4", e: "2.4", f: "2.4", g: "1.1" }, ["a", "b", "d", "e", "f", "g"]),
    { ...sitting(2, { h: "3.1" }, []), exam: "220-1201" },
  ];
  assert.deepEqual(weakObjectiveIds(attempts, "220-1202"), ["2.4", "3.1"]);
  assert.deepEqual(weakObjectiveIds([], "220-1202"), []);
  assert.deepEqual(weakObjectiveIds([{ exam: "220-1202", at: 1, questionIds: ["a", "b", "c"], missedIds: ["a", "b", "c"] }], "220-1202"), []);
});
