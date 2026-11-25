#!/usr/bin/env node
/** Measure test-wise answer cues. `--check` enforces the landed exam gates and edited-item rule. */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { qualifierTwins } from "../content/saa-qualifier-twins.ts";
import {
  COMPTIA_EXAMS, ECHO_MAX, ENFORCED_EXAMS, LONGEST_MAX, SHORTEST_MAX, SHORTEST_MIN, STRONG_MAX,
  analyzeItem, itemFailures, rateFailures, summarize,
} from "./lib/answer-cues.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const check = process.argv.includes("--check");

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
}

function item(source, record, exams, lengthGate = true) {
  return { ...record, source, exams, lengthGate };
}

function gameItems(catalog) {
  const groups = ["keywords", "odd", "builder", "pillars", "lightning"];
  const rows = [];
  for (const group of groups) {
    for (const record of catalog[group] ?? []) {
      if (!Array.isArray(record.choices) && typeof record.answer !== "boolean") continue;
      const choices = Array.isArray(record.choices) ? record.choices : ["True", "False"];
      const answer = typeof record.answer === "boolean" ? (record.answer ? 0 : 1) : record.answer;
      rows.push(item(`study-games.json:${group}`, { ...record, choices, answer }, ["saa-c03"], false));
    }
  }
  return rows;
}

export async function loadCueItems() {
  const questions = await readJson("content/questions.json");
  const fill = await readJson("content/saa-high-yield-fill.json");
  const games = await readJson("content/study-games.json");
  return [
    ...questions.map((record) => item("questions.json", record, record.examCodes ?? [])),
    ...(fill.questions ?? []).map((record) => item("saa-high-yield-fill.json", record, record.examCodes ?? [])),
    ...qualifierTwins.map((record) => item("saa-qualifier-twins.ts", record, record.examCodes ?? ["saa-c03"])),
    ...gameItems(games),
  ];
}

function pct(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

function examples(rows, pick, label, limit = 5) {
  return rows.filter(pick).slice(0, limit).map((row) => `- ${row.id}: ${label(row)}`);
}

function saaWarnSection(rows, summary) {
  const saa = rows.filter((row) => row.exams.includes("saa-c03") && row.single && row.lengthGate);
  const row = summary["saa-c03"];
  const echo = examples(saa, (item) => item.keywordEcho || item.stemEcho || item.deicticEcho, (item) => item.keywordEcho || item.stemEcho || item.deicticEcho, 10);
  const conditional = examples(saa, (item) => item.trueConditional, (item) => item.trueConditional, 10);
  const category = examples(saa, (item) => item.categoryOnlyKey, (item) => item.categoryOnlyKey, 10);
  const odd = examples(saa, (item) => item.oddOneOut, (item) => item.oddOneOut);
  const shortest = examples(saa, (item) => item.strictlyShortest, (item) => `key length ${item.keyLength}`);
  return [
    "## SAA cue counts",
    "",
    `These five checks are enforced for saa-c03 and stay warn-only for every other exam. True conditional distractor must be 0. Category word only the key matches must be 0. Odd-one-out opening must be 0. Keyword echo must stay at or under ${ECHO_MAX} (ratchet down later, never up). Key-is-shortest must stay inside ${pct(SHORTEST_MIN)}–${pct(SHORTEST_MAX)}. Keyword echo is an AWS-specific or technical question term in the key and in no distractor, a stem phrase of four or more words copied into only the key, "at least" plus a stem number copied into only the key, or a this/that/these/those pointer used only by the key. Generic nouns (location, customer, average, storage, data, application, user, cost) do not count as the technical-term kind, nor do stopwords or a term that appears in every choice. A locked set of older questions keeps a stem copy or a pointer; those ids are listed in LEGACY_STEM_ECHO_IDS and do not raise the count. A true-conditional pattern is a wrong choice that starts with the key and adds when, if, after, unless, only, or while. That pattern still needs a human truth check. A category word only the key matches is a named category such as queue, file system, certificate, load balancer, placement group, or purchase option when no distractor belongs to it. Odd-one-out opening means every distractor shares its first three words and the key does not. Key-is-shortest uses the same strict comparison as key-is-longest.`,
    "",
    `Key-is-longest: ${row.longest} (${pct(row.longestRate)}). Key-is-shortest: ${row.shortest} (${pct(row.shortestRate)}). Shortest target band: ${pct(SHORTEST_MIN)}–${pct(SHORTEST_MAX)}.`,
    "",
    `### Keyword echo`,
    "",
    `Count: ${row.keywordEcho}.`,
    "",
    ...echo,
    "",
    `### True conditional distractor`,
    "",
    `Count: ${row.trueConditional}.`,
    "",
    ...conditional,
    "",
    `### Category word only the key matches`,
    "",
    `Count: ${row.categoryOnlyKey}.`,
    "",
    ...category,
    "",
    `### Odd-one-out opening`,
    "",
    `Count: ${row.oddOneOut}.`,
    "",
    ...odd,
    "",
    `### Key is shortest`,
    "",
    `Count: ${row.shortest} (${pct(row.shortestRate)} of ${row.single}).`,
    "",
    ...shortest,
    "",
  ];
}

function markdown(summary, rows) {
  const exams = ["saa-c03", "clf-c02", "comptia", ...COMPTIA_EXAMS];
  const lines = [
    "# Answer-cue audit",
    "",
    "Single-answer question items only for the length rates (questions.json, the high-yield fill, and qualifier twins). Game items are in the CSV and are not in these rates. A key is longest when it is strictly longer than every other choice. Strongly length-biased means that and at least 1.3 times the mean wrong-choice length. Chance for a four-choice item to be the unique longest is 25%.",
    "",
    `Enforced now: ${ENFORCED_EXAMS.join(", ") || "none"}. Targets for an enforced exam: key-is-longest ≤ ${pct(LONGEST_MAX)}, strongly length-biased ≤ ${pct(STRONG_MAX)}, self-disqualifying 0, choices not parallel 0, true conditional distractor 0, category word only the key matches 0, odd-one-out opening 0, keyword echo ≤ ${ECHO_MAX}, and key-is-shortest inside ${pct(SHORTEST_MIN)}–${pct(SHORTEST_MAX)}. CLF and CompTIA stay warn-only against the first four targets. Self-disqualifying means a wrong choice names the opposite of a stem requirement. Not parallel means a bare key beside qualified distractors, or the reverse.`,
    "",
    "| Exam | Single-answer | Key longest | Strongly biased | Key at A | Stem-word | Absolute words only on wrong choices | All/none of the above | Only complete key | Near-duplicate choices | Self-disqualifying distractor | Choices not parallel |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const exam of exams) {
    const row = summary[exam];
    if (!row) continue;
    lines.push(`| ${exam} | ${row.single} | ${row.longest} (${pct(row.longestRate)}) | ${row.strong} (${pct(row.strongRate)}) | ${row.positions.A ?? 0} | ${row.stemWord} | ${row.absoluteWords} | ${row.allNone} | ${row.onlyComplete} | ${row.nearDuplicate} | ${row.selfDisqualifying} | ${row.notParallel} |`);
  }
  lines.push("", "The full per-item CSV is written to ignored `tmp/answer-cue-audit.csv` when the audit runs. Authored key position is reported here and does not affect display: quiz, timed test, twin, topic, mini-mock, mistake-log retest, drills, choice games, subnet concept and reason, and the optional IPv6 review shuffle choices when the sitting is shown.", "");
  lines.push(...saaWarnSection(rows, summary));
  return `${lines.join("\n")}\n`;
}

function csv(rows) {
  const header = ["exam", "id", "source", "single", "keyLetter", "keyLength", "lengthRank", "ratio", "strictlyLongest", "stronglyBiased", "stemWord", "absoluteWords", "allNone", "onlyComplete", "nearDuplicate", "selfDisqualifying", "notParallel"];
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [header.join(",")];
  for (const row of rows) {
    for (const exam of row.exams.length ? row.exams : ["unassigned"]) {
      lines.push([exam, row.id, row.source, row.single, row.keyLetter, row.keyLength, row.lengthRank, row.ratio === null ? "" : row.ratio.toFixed(3), row.strictlyLongest, row.stronglyBiased, row.stemWord ?? "", row.absoluteWords.join(" "), row.allNone, row.onlyComplete, row.nearDuplicate, row.selfDisqualifying.map((hit) => hit.label).join(" "), row.notParallel].map(cell).join(","));
    }
  }
  return `${lines.join("\n")}\n`;
}

function baseRef() {
  if (process.env.GITHUB_BASE_REF) return `origin/${process.env.GITHUB_BASE_REF}`;
  return "origin/main";
}

function show(ref, path) {
  try { return execFileSync("git", ["show", `${ref}:${path}`], { cwd: ROOT, encoding: "utf8" }); }
  catch { return null; }
}

function recordsIn(value, path) {
  if (path.endsWith("questions.json")) return value;
  if (path.endsWith("saa-high-yield-fill.json")) return value.questions ?? [];
  return ["keywords", "odd", "builder", "pillars", "lightning"].flatMap((group) => value[group] ?? []);
}

async function changedIds(ref) {
  const ids = new Set();
  const files = ["content/questions.json", "content/saa-high-yield-fill.json", "content/study-games.json"];
  for (const path of files) {
    const before = show(ref, path);
    if (before === null) continue;
    const previous = JSON.parse(before);
    const current = JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
    const prior = new Map(recordsIn(previous, path).map((record) => [record.id, JSON.stringify([record.choices, record.answer, record.prompt])]));
    for (const record of recordsIn(current, path)) {
      const fingerprint = JSON.stringify([record.choices, record.answer, record.prompt]);
      if (prior.get(record.id) !== fingerprint) ids.add(record.id);
    }
  }
  const twinDiff = execFileSync("git", ["diff", "--name-only", ref, "HEAD", "--", "content/saa-qualifier-twins.ts"], { cwd: ROOT, encoding: "utf8" });
  if (twinDiff.trim()) {
    for (const twin of qualifierTwins) ids.add(twin.id);
  }
  return ids;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const items = await loadCueItems();
const rows = items.map(analyzeItem);
const summary = summarize(rows);
const report = markdown(summary, rows);
if (!check) {
  await mkdir(resolve(ROOT, "tmp"), { recursive: true });
  await writeFile(resolve(ROOT, "tmp/answer-cue-audit.csv"), csv(rows));
  await writeFile(resolve(ROOT, "tmp/answer-cue-audit.md"), report);
  await writeFile(resolve(ROOT, "docs/answer-cue-audit.md"), report);
  console.log(report);
} else {
  const failures = [
    ...rateFailures(summary),
    ...itemFailures(rows, await changedIds(baseRef()), new Map((await readJson("content/answer-cue-exceptions.json")).map((row) => [row.id, row.reason]))),
  ];
  for (const exam of ["saa-c03", "clf-c02", "comptia"]) {
    const row = summary[exam];
    if (!row || ENFORCED_EXAMS.includes(exam)) continue;
    console.log(`${exam} warn-only: key-is-longest ${pct(row.longestRate)} (target ≤ 35%), strongly biased ${pct(row.strongRate)} (target ≤ 10%), self-disqualifying descriptors ${row.selfDisqualifying}, choices not parallel ${row.notParallel}.`);
  }
  const saa = summary["saa-c03"];
  if (saa) {
    const band = saa.shortestRate < SHORTEST_MIN || saa.shortestRate > SHORTEST_MAX ? " outside 15–35%" : " inside 15–35%";
    console.log(`saa-c03 enforced: keyword echo ${saa.keywordEcho} (max ${ECHO_MAX}), true conditional distractor ${saa.trueConditional}, category word only the key matches ${saa.categoryOnlyKey}, odd-one-out opening ${saa.oddOneOut}, key-is-shortest ${pct(saa.shortestRate)} (${saa.shortest}/${saa.single})${band}. Key-is-longest is ${pct(saa.longestRate)}.`);
  }
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}
}
