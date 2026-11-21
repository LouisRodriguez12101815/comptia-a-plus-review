import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const scripts = Object.values(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts);
const scriptText = scripts.join("\n");

function globToRegExp(token) {
  const body = token.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${body}$`);
}

function referenced(file) {
  if (scriptText.includes(file)) return true;
  const tokens = scriptText.match(/tests\/[^\s"']+/g) ?? [];
  return tokens.some((token) => token.includes("*") && globToRegExp(token).test(file));
}

test("every SAA and practice test file is named by a package.json script", () => {
  const files = readdirSync(new URL("../tests", import.meta.url))
    .filter((name) => /^(saa|practice)-.+\.test\.mjs$/.test(name))
    .map((name) => `tests/${name}`);
  const missing = files.filter((file) => !referenced(file));
  assert.deepEqual(missing, [], `not referenced by a package.json script: ${missing.join(", ")}`);
  assert.ok(files.includes("tests/saa-service-facts.test.mjs"));
  assert.ok(files.includes("tests/practice-drills.test.mjs"));
  assert.ok(scriptText.includes("--import ./tests/register.mjs"));
  assert.ok(scriptText.includes("tests/saa-service-facts.test.mjs"));
  assert.ok(scriptText.includes("tests/practice-drills.test.mjs"));
});
