import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { scene, mobileScene } from "../lib/network-environment.ts";

test("infrastructure traffic stays connected and bounded on desktop and mobile", () => {
  for (const field of [scene, mobileScene]) {
    const ids = new Set(field.nodes.map(n => n.id));
    assert.equal(ids.size, field.nodes.length);
    assert.ok(field.nodes.length >= 5 && field.nodes.length <= 50);
    assert.ok(field.edges.length >= 4 && field.edges.length <= 60);
    for (const e of field.edges) {
      assert.ok(ids.has(e.from) && ids.has(e.to));
      assert.notEqual(e.from, e.to);
      assert.ok(e.duration >= 2 && Number.isFinite(e.bend));
    }
    const visited = new Set([field.nodes[0].id]);
    while (true) {
      const before = visited.size;
      for (const e of field.edges) if (visited.has(e.from) || visited.has(e.to)) { visited.add(e.from); visited.add(e.to); }
      if (visited.size === before) break;
    }
    assert.equal(visited.size, ids.size, "all nodes participate in a connected infrastructure field");
    for (const kind of ["device", "cloud", "firewall", "database"]) assert.ok(field.nodes.some(n => n.kind === kind));
  }
  assert.ok(mobileScene.nodes.length < scene.nodes.length);
  assert.ok(mobileScene.edges.length < scene.edges.length);
});

test("homepage exposes the certification catalog, study loop, and reduced-motion contract", async () => {
  const page = await readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/components/NetworkEnvironment.module.css", import.meta.url), "utf8");
  assert.match(page, /data-testid=\"home-network-experience\"/);
  assert.match(page, /id=\"tracks-heading\"/);
  for (const href of ["\/notes", "\/quiz", "\/test", "\/weak-areas", "\/performance", "\/scorecard"]) {
    assert.match(page, new RegExp(`\"${href.replace("/", "\\/")}\"`));
  }
  assert.match(styles, /prefers-reduced-motion/);
});
