// Dump the memory-drill decks to JSON so the audit reads real data instead of
// guessing at TypeScript with regular expressions.
// Run from the repository root:
//   node --experimental-strip-types --import ./tests/register.mjs tools/rubric-audit/scripts/dump_drills.mjs <out.json>
import { writeFileSync } from "node:fs";
import { drillDecks } from "../../../lib/practice/drills.ts";

const out = process.argv[2];
if (!out) {
  console.error("usage: dump_drills.mjs <out.json>");
  process.exit(2);
}
const decks = drillDecks.map((d) => ({
  id: d.id,
  certification: d.certification,
  exam: d.exam,
  objective: d.objective,
  topic: d.topic,
  items: d.items.map((i) => ({ id: i.id, fields: i.fields, detail: i.detail ?? "", hook: i.hook ?? "" })),
}));
writeFileSync(out, JSON.stringify(decks, null, 2) + "\n");
console.log(`dumped ${decks.length} decks, ${decks.reduce((n, d) => n + d.items.length, 0)} items -> ${out}`);
