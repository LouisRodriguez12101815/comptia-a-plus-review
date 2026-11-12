import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("homepage certification path keeps the requested progression first", () => {
  const source = readFileSync(new URL("../lib/tracks.ts", import.meta.url), "utf8");
  const tracksSource = source.slice(source.indexOf("export const tracks"), source.indexOf("export const networkingChapters"));
  const ids = [...tracksSource.matchAll(/\n    id: "([^"]+)"/g)].map((match) => match[1]);
  const codes = [...tracksSource.matchAll(/\n    code: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(
    ids.slice(0, 5).map((id, index) => [id, codes[index]]),
    [
      ["core1", "220-1201"],
      ["core2", "220-1202"],
      ["networking", "N10-009"],
      ["aws-clf", "CLF-C02"],
      ["aws-saa", "SAA-C03"],
    ],
  );
});
