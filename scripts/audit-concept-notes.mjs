#!/usr/bin/env node
/*
 * Lists Network+ questions whose correct answer shares no key term with the study notes of the
 * question's chapter, grouped by concept. It is a hint for where notes may be missing, not a verdict:
 * a note can teach a fact in different words.
 *   node scripts/audit-concept-notes.mjs          print the report
 *   node scripts/audit-concept-notes.mjs --check  also exit 1 when any concept has more than half its questions flagged
 */
import { readFileSync } from "node:fs";

const read = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const concepts = read("content/network-plus-concepts.json").concepts;
const raw = read("content/questions.json");
const questions = new Map((Array.isArray(raw) ? raw : raw.questions).map((q) => [q.id, q]));
const topics = new Map([...read("content/topics.json"), ...read("content/topics-network-plus.json")].map((t) => [t.id, JSON.stringify(t).toLowerCase()]));

const STOP = new Set(["which", "should", "their", "there", "these", "those", "other", "using", "about", "would", "could", "between", "traffic", "network"]);
function keyTerms(text) {
  const found = new Set();
  for (const m of text.matchAll(/\d[\d.,/]*\d|\b[A-Z][A-Za-z0-9+]*[A-Z0-9+][A-Za-z0-9+]*\b|[a-z]{6,}/g)) {
    const term = m[0].toLowerCase();
    if (/^\d+\.\d+\.\d+\.\d+/.test(term)) continue; // dotted IPv4 literals are examples, not terms
    if (!STOP.has(term)) found.add(term);
  }
  return [...found];
}
function correctText(q) {
  const picks = Array.isArray(q.answer) ? q.answer : [q.answer];
  return picks.map((i) => q.choices[i]).join(" ");
}

let worst = 0;
const rows = [];
for (const concept of concepts) {
  const flagged = [];
  for (const id of concept.questionIds) {
    const q = questions.get(id);
    const notes = topics.get(q?.topicId);
    if (!q || notes === undefined) continue;
    const terms = keyTerms(correctText(q));
    if (terms.length && !terms.some((term) => notes.includes(term))) flagged.push(id);
  }
  if (flagged.length) rows.push({ concept, flagged });
  worst = Math.max(worst, flagged.length / concept.questionIds.length);
}
rows.sort((a, b) => b.flagged.length / b.concept.questionIds.length - a.flagged.length / a.concept.questionIds.length);
console.log("Concepts with questions whose correct answer is not echoed in the chapter notes (a hint, not a verdict):\n");
for (const { concept, flagged } of rows) console.log(`${concept.objective}  ${concept.title}: ${flagged.length}/${concept.questionIds.length}  ${flagged.join(" ")}`);
if (!rows.length) console.log("None.");
if (process.argv.includes("--check") && worst > 0.5) process.exit(1);
