import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const agents = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
const roadmap = readFileSync(new URL("../docs/saa-roadmap.md", import.meta.url), "utf8");

const headings = [
  "No new cue",
  "Nothing outside the checks",
  "No silent deferrals",
  "Plausibility",
  "End to end",
  "Computed, not hand-set",
  "Sourced and current",
  "Stop at each open PR",
  "SAA only",
];

const shaped = [
  /\bSID-[A-Za-z0-9]/,
  /\b(?:AC|SK|IS|VA|UT)[0-9a-f]{32}\b/i,
  /\+\d{10,15}\b/,
  /\b\d{3}-\d{3}-\d{4}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:sk|ghp|xox[baprs])-[A-Za-z0-9]{10,}\b/,
];

test("AGENTS.md names every standing rule and stays short", () => {
  for (const heading of headings) assert.match(agents, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(agents, /REPORT FORMAT/);
  assert.match(agents, /LEARNER_SESSION_SECRET/);
  assert.ok(agents.trim().length > 0);
  assert.ok(agents.split("\n").length <= 120);
});

test("the roadmap exists and neither file contains SID, phone, or secret-shaped strings", () => {
  assert.match(roadmap, /## Queue/);
  assert.match(roadmap, /## Done/);
  for (const pattern of shaped) {
    assert.equal(pattern.test(agents), false, String(pattern));
    assert.equal(pattern.test(roadmap), false, String(pattern));
  }
});

test("the standing-rules test is wired into checks", () => {
  const workflow = readFileSync(new URL("../.github/workflows/checks.yml", import.meta.url), "utf8");
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(workflow, /npm run test:standing-rules/);
  assert.match(pkg.scripts["test:standing-rules"], /tests\/standing-rules\.test\.mjs/);
});
