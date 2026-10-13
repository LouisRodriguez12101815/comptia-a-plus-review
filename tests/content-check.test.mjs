import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repo = process.cwd();
const script = path.join(repo, "scripts/check-content.mjs");
const run = (cwd, ...extra) => spawnSync(process.execPath, [script, ...extra], { cwd, encoding: "utf8" });

test("shipped content passes the deterministic content check", () => {
  const result = run(repo, "--json");
  const report = JSON.parse(result.stdout);
  const errors = report.findings.filter((f) => f.level === "error");
  assert.deepEqual(errors, [], errors.map((e) => `[${e.check}] ${e.where}: ${e.message}`).join("\n"));
  assert.equal(result.status, 0);
});

test("the checker still catches seeded mistakes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-check-"));
  try {
    fs.cpSync(path.join(repo, "content"), path.join(dir, "content"), { recursive: true });
    fs.cpSync(path.join(repo, "scripts/content-facts.json"), path.join(dir, "scripts/content-facts.json"));
    fs.cpSync(path.join(repo, "public/visuals"), path.join(dir, "public/visuals"), { recursive: true });

    const qPath = path.join(dir, "content/questions.json");
    const questions = JSON.parse(fs.readFileSync(qPath, "utf8"));
    questions[questions.length - 1].answer = 9;
    const pinned = questions.find((q) => q.id === "q-n10c11-03");
    pinned.answer = (pinned.answer + 1) % pinned.choices.length;
    fs.writeFileSync(qPath, JSON.stringify(questions));

    const fPath = path.join(dir, "scripts/content-facts.json");
    const facts = JSON.parse(fs.readFileSync(fPath, "utf8"));
    facts.computed.find((c) => c.id === "ch8-slash25").hosts = 128;
    fs.writeFileSync(fPath, JSON.stringify(facts));

    const tPath = path.join(dir, "content/topics-network-plus.json");
    fs.writeFileSync(tPath, fs.readFileSync(tPath, "utf8").replace("inserts FF:FE", "inserts FF:FF"));

    const result = run(dir, "--json");
    assert.equal(result.status, 1);
    const checks = new Set(JSON.parse(result.stdout).findings.map((f) => f.check));
    assert.ok(checks.has("answer-key"), "invalid answer index should be caught");
    assert.ok(checks.has("fact-forbidden"), "FF:FF in the EUI-64 notes should be caught");
    assert.ok(checks.has("answer-pin"), "a valid-looking but wrong answer key should be caught");
    assert.ok(checks.has("computed"), "a wrong subnet worked example should be caught");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
