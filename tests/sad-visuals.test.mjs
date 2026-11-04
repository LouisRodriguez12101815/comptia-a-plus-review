import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { buildAll } from "../tools/sad-visuals/build.mjs";
import { checkFacts } from "../scripts/audit-visuals.mjs";

const root = new URL("../", import.meta.url);
const text = (rel) => readFileSync(new URL(rel, root), "utf8");
const json = (rel) => JSON.parse(text(rel));
const sources = readdirSync(new URL("tools/sad-visuals/sources/", root), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const trackVisuals = json("content/track-visuals.json");
const objectiveKeys = new Set(json("content/objectives.json").exams.flatMap((e) => e.domains.flatMap((d) => d.objectives.map((o) => `${e.code} ${o.id}`))));
const SECTIONS = [
  "## 1. Executive Summary & System Context",
  "## 2. Logical & Building Block View",
  "## 3. Runtime & Process View",
  "## 4. Deployment View",
  "## 5. Architecture Decision Records & Tradeoffs",
];

test("there is at least one architecture document source", () => {
  assert.ok(sources.length >= 2);
});

test("built pages match their sources", () => {
  for (const page of buildAll()) {
    assert.ok(existsSync(new URL(page.out, root)), `${page.out} is missing. Run: node tools/sad-visuals/build.mjs`);
    assert.equal(text(page.out), page.html, `${page.out} is out of date. Run: node tools/sad-visuals/build.mjs`);
  }
});

for (const slug of sources) {
  const dir = `tools/sad-visuals/sources/${slug}`;
  const md = text(`${dir}/SAD.md`);
  const diagrams = text(`${dir}/diagrams.js`);
  const meta = json(`${dir}/meta.json`);

  test(`${slug}: document starts with the title and has the five sections in order`, () => {
    assert.match(md, /^# .+: System Architecture Document\n/);
    let at = -1;
    for (const heading of SECTIONS) {
      const i = md.indexOf(`\n${heading}\n`);
      assert.ok(i > at, `missing or out of order: ${heading}`);
      at = i;
    }
  });

  test(`${slug}: every diagram marker has a mount call`, () => {
    const markers = [...md.matchAll(/<!--diagram:(\w+)-->/g)].map((m) => m[1]);
    assert.ok(markers.length >= 5);
    for (const name of markers) assert.ok(diagrams.includes(`q('${name}')`), `no q('${name}') in diagrams.js`);
  });

  test(`${slug}: every ADR has status, options, decision and consequences`, () => {
    const adrs = md.split(/\n#### ADR-/).slice(1);
    assert.ok(adrs.length >= 3);
    for (const adr of adrs) {
      const title = adr.split("\n")[0];
      for (const need of ["**Status:**", "**Context:**", "**Decision:**", "**Consequences (+):**", "**Consequences (−):**"]) assert.ok(adr.includes(need), `ADR-${title} lacks ${need}`);
      assert.ok((adr.match(/\*\*Option [A-Z]/g) ?? []).length >= 2, `ADR-${title} needs two options`);
    }
  });

  test(`${slug}: fact block is valid and the page is registered for a real topic`, () => {
    const html = text(`public/visuals/${meta.out}`);
    assert.deepEqual(checkFacts(html, objectiveKeys), []);
    const registered = Object.entries(trackVisuals).filter(([, list]) => list.some((v) => v.file === meta.out));
    assert.equal(registered.length, 1, `${meta.out} must be listed once in content/track-visuals.json`);
    const topicIds = new Set([...json("content/topics.json"), ...json("content/topics-network-plus.json")].map((t) => t.id));
    assert.ok(topicIds.has(registered[0][0]), `${registered[0][0]} is not a topic id`);
  });

  test(`${slug}: the page labels itself a model and does not claim readiness`, () => {
    assert.match(md + diagrams, /assumed|Teaching model/i);
    assert.doesNotMatch(md, /exam[- ]ready|guarantee(s|d)? (a )?pass/i);
  });
}
