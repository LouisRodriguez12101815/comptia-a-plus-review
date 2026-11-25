import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skillSections = [
  "## Inputs",
  "## Sources",
  "## Pair rules",
  "## Schema",
  "## Game rules",
  "## Steps",
  "## Validation",
  "## Pull request report",
  "## Deployment",
];

const agentSections = ["## Steps", "## Flags", "## Output"];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

for (const path of [
  ".claude/skills/confusion-pair-builder/SKILL.md",
  ".agents/skills/confusion-pair-builder/SKILL.md",
]) {
  test(`${path} has the confusion-pair sections`, () => {
    const text = read(path);
    for (const section of skillSections) assert.match(text, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(text, /78e9aa30bd67653603a8a782aeeca1619a7576916fe9bb0588db49429e31033c/);
    assert.match(text, /de7456e3fd3f1e0ea24870ae6a8e73615baaf2199ae62a0a15e35fadadbd70fb/);
    assert.match(text, /batch size/i);
    assert.match(text, /Default 50/);
    assert.match(text, /one` counts|`one` counts/);
    assert.match(text, /comptia-a-plus-review-progress-v1/);
    assert.match(text, /git\.deploymentEnabled/);
    assert.match(text, /not live until/);
    assert.match(text, /whether anything was deployed/i);
  });
}

for (const path of [
  ".claude/agents/pair-contrast-auditor.md",
  ".agents/agents/pair-contrast-auditor.md",
]) {
  test(`${path} reports and does not edit`, () => {
    const text = read(path);
    for (const section of agentSections) assert.match(text, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(text, /Never edit/);
    assert.match(text, /blind/i);
    assert.match(text, /AGREE/);
    assert.match(text, /FLAG/);
    assert.match(text, /DISAGREE/);
    assert.match(text, /[Ll]abel echo/);
    assert.match(text, /`one` counts/);
  });
}

test("Cursor is pointed at the same confusion-pair rules", () => {
  const rule = read(".cursor/rules/confusion-pairs.mdc");
  assert.match(rule, /\.claude\/skills\/confusion-pair-builder\/SKILL\.md/);
  assert.match(rule, /\.claude\/agents\/pair-contrast-auditor\.md/);
  assert.match(rule, /`one` counts/);
  assert.match(rule, /manual deploy/);
});

test("the confusion-pair skill test is wired into checks", () => {
  const workflow = read(".github/workflows/checks.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(workflow, /npm run test:confusion-pair-skill/);
  assert.match(pkg.scripts["test:confusion-pair-skill"], /tests\/confusion-pair-skill\.test\.mjs/);
  assert.match(pkg.scripts.test, /test:confusion-pair-skill/);
});
