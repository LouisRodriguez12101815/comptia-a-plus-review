#!/usr/bin/env node
/**
 * Deterministic content checker for the CompTIA review site.
 *
 *   npm run check:content
 *   npm run check:content -- --topic n10-ch7,n10-ch10
 *   npm run check:content -- --json
 *   npm run check:content -- --strict      (warnings also fail)
 *
 * It does NOT prove content is true. It catches the mistakes a machine can catch:
 * broken answer keys, notes/cards/quiz/visuals that contradict each other, numeric
 * claims that disagree with scripts/content-facts.json, and worked examples whose
 * math is wrong. Facts in content-facts.json are the author-confirmed source of
 * truth (your book and notes win). Edit that file when the book says otherwise.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const only = value("--topic")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const asJson = flag("--json");
const strict = flag("--strict");

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const findings = [];
const add = (level, check, where, message) => findings.push({ level, check, where, message });

const topics = [...readJson("content/topics.json"), ...readJson("content/topics-network-plus.json")];
const questions = readJson("content/questions.json");
const cards = readJson("content/flashcards.json");
const trackVisuals = readJson("content/track-visuals.json");
const factsFile = readJson("scripts/content-facts.json");
const topicIds = new Set(topics.map((t) => t.id));
const inScope = (id) => !only || only.includes(id);
const idsOf = (x) => (Array.isArray(x.topicId) ? x.topicId : [x.topicId]);

/* ---------- build the text corpus ---------- */
const docs = [];
const pushDoc = (topic, kind, label, text) => docs.push({ topic, kind, label, text });

function blockLines(block) {
  switch (block.type) {
    case "bullets":
      return block.items;
    case "paragraph":
      return [block.text];
    case "callout":
      return [block.text];
    case "code":
      return [block.text ?? block.code ?? ""];
    case "table":
      return [block.headers.join(" | "), ...block.rows.map((r) => r.join(" | "))];
    default:
      return [];
  }
}

for (const t of topics) {
  for (const s of t.sections ?? []) {
    pushDoc(t.id, "notes", `notes:${t.id}/${s.id}`, [s.title, ...s.blocks.flatMap(blockLines)].join("\n"));
  }
}
for (const c of cards) for (const id of idsOf(c)) pushDoc(id, "card", `card:${c.id}`, `${c.front}\n${c.back}`);
for (const q of questions) {
  for (const id of idsOf(q)) {
    pushDoc(id, "question", `question:${q.id}`, q.prompt);
    pushDoc(id, "question-explanation", `explanation:${q.id}`, q.explanation ?? "");
    pushDoc(id, "question-choice", `choices:${q.id}`, q.choices.join("\n"));
  }
}

const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const visualFiles = new Map();
for (const [topicId, list] of Object.entries(trackVisuals)) {
  for (const v of list) {
    const file = path.join(root, "public/visuals", v.file);
    if (!fs.existsSync(file)) {
      if (inScope(topicId)) add("error", "visual-missing", `track-visuals:${topicId}`, `${v.file} is listed but not found in public/visuals`);
      continue;
    }
    if (!visualFiles.has(`${topicId}:${v.file}`)) {
      const html = fs.readFileSync(file, "utf8").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
      visualFiles.set(`${topicId}:${v.file}`, true);
      pushDoc(topicId, "visual", `visual:${v.file}`, decode(html).replace(/[ \t]+/g, " "));
    }
  }
}
const flatten = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => flatten(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => flatten(x, out));
  return out;
};
for (const [file, topic] of [["ch9.json", "n10-ch9"], ["ch10.json", "n10-ch10"], ["ch11.json", "n10-ch11"]]) {
  const p = path.join(root, "content/network-plus", file);
  if (fs.existsSync(p)) pushDoc(topic, "chapter-json", `network-plus/${file}`, flatten(JSON.parse(fs.readFileSync(p, "utf8"))).join("\n"));
}

/* ---------- 1. structural integrity ---------- */
const seen = (arr, label, key = (x) => x.id) => {
  const set = new Set();
  for (const x of arr) {
    if (set.has(key(x))) add("error", "duplicate-id", label, `duplicate id ${key(x)}`);
    set.add(key(x));
  }
};
seen(topics, "topics");
seen(questions, "questions");
seen(cards, "flashcards");

const stop = new Set("the and of to is are for in on it with by an or that this as be from at not".split(" "));
const promptSeen = new Map();
for (const q of questions) {
  const ids = idsOf(q);
  if (!ids.some(inScope)) continue;
  const where = `question:${q.id}`;
  for (const id of ids) if (!topicIds.has(id)) add("error", "unknown-topic", where, `topicId ${id} does not exist`);
  if (!Array.isArray(q.choices) || q.choices.length < 2) {
    add("error", "choices", where, "needs at least two choices");
    continue;
  }
  if (q.choices.length !== 4) add("warn", "choices", where, `${q.choices.length} choices (site convention is 4)`);
  const key = Array.isArray(q.answer) ? q.answer : [q.answer];
  if (!key.length || !key.every((i) => Number.isInteger(i) && i >= 0 && i < q.choices.length) || new Set(key).size !== key.length) {
    add("error", "answer-key", where, `answer ${JSON.stringify(q.answer)} is not a valid choice index`);
    continue;
  }
  const dup = q.choices.filter((c, i) => q.choices.findIndex((d) => d.trim().toLowerCase() === c.trim().toLowerCase()) !== i);
  if (dup.length) add("error", "duplicate-choice", where, `repeated choice text: ${dup.join(" / ")}`);
  if (!q.explanation || q.explanation.trim().length < 20) add("error", "explanation", where, "missing or too-short explanation");
  else if (!Array.isArray(q.answer)) {
    const tokens = (q.choices[key[0]].toLowerCase().match(/[a-z0-9.:/\-]{2,}/g) ?? []).filter((w) => !stop.has(w));
    const ex = q.explanation.toLowerCase();
    if (tokens.length && !tokens.some((w) => ex.includes(w))) {
      add("warn", "explanation-vs-key", where, `explanation never mentions the keyed answer ("${q.choices[key[0]]}"); check the key and explanation agree`);
    }
  }
  const p = q.prompt.trim().toLowerCase();
  if (promptSeen.has(p)) add("warn", "duplicate-prompt", where, `same prompt as ${promptSeen.get(p)}`);
  else promptSeen.set(p, q.id);
}
for (const c of cards) {
  if (!idsOf(c).some(inScope)) continue;
  for (const id of idsOf(c)) if (!topicIds.has(id)) add("error", "unknown-topic", `card:${c.id}`, `topicId ${id} does not exist`);
  if (!c.front?.trim() || !c.back?.trim()) add("error", "card-empty", `card:${c.id}`, "front or back is empty");
}

/* answer-position balance and coverage per topic */
for (const t of topics) {
  if (!inScope(t.id)) continue;
  const qs = questions.filter((q) => idsOf(q).includes(t.id));
  const cs = cards.filter((c) => idsOf(c).includes(t.id));
  const single = qs.filter((q) => Number.isInteger(q.answer));
  if (single.length >= 12) {
    for (let pos = 0; pos < 4; pos++) {
      const share = single.filter((q) => q.answer === pos).length / single.length;
      if (share > 0.4 || share < 0.1) add("warn", "answer-balance", t.id, `position ${"ABCD"[pos]} is ${Math.round(share * 100)}% of ${single.length} single-answer questions`);
    }
  }
  if (/-ch\d+$/.test(t.id) && t.id.startsWith("n10")) {
    if (qs.length < 15) add("warn", "coverage", t.id, `${qs.length} quiz questions (target 15 or more)`);
    if (cs.length < 10) add("warn", "coverage", t.id, `${cs.length} flashcards (target 10 or more)`);
  }
}

/* "(Notes: ...)" descriptions must point at real section titles */
for (const [topicId, list] of Object.entries(trackVisuals)) {
  if (!inScope(topicId)) continue;
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) continue;
  const titles = new Set(topic.sections.map((s) => s.title.toLowerCase()));
  for (const v of list) {
    const m = /\(Notes: ([^)]*)\)\s*$/.exec(v.description ?? "");
    if (!m || /^all sections$/i.test(m[1].trim())) continue;
    for (const ref of m[1].split(";").map((s) => s.trim()).filter(Boolean)) {
      if (!titles.has(ref.toLowerCase())) add("warn", "notes-reference", `visual:${v.file}`, `description cites notes section "${ref}" which is not a section title in ${topicId}`);
    }
  }
}

/* ---------- 2. author-confirmed facts ---------- */
const excerpt = (text, index, len) => text.slice(Math.max(0, index - 40), index + len + 40).replace(/\s+/g, " ").trim();
for (const fact of factsFile.facts ?? []) {
  const scope = fact.topics.includes("*") ? [...topicIds] : fact.topics;
  if (only && !scope.some(inScope)) continue;
  const scoped = docs.filter((d) => scope.includes(d.topic) && inScope(d.topic));
  const kinds = fact.kinds ?? ["notes", "card", "question", "question-explanation", "visual", "chapter-json"];
  for (const pattern of fact.require ?? []) {
    const re = new RegExp(pattern, "i");
    for (const topic of scope.filter(inScope)) {
      const notes = docs.filter((d) => d.topic === topic && d.kind === "notes");
      if (!notes.some((d) => re.test(d.text))) add("error", "fact-missing", `fact:${fact.id}`, `${topic} notes no longer state "${fact.statement}" (pattern ${pattern})`);
    }
  }
  for (const f of fact.forbid ?? []) {
    const re = new RegExp(f.pattern, "gi");
    for (const d of scoped.filter((x) => kinds.includes(x.kind))) {
      for (const m of d.text.matchAll(re)) add("error", "fact-forbidden", `fact:${fact.id}`, `${d.label}: "${excerpt(d.text, m.index, m[0].length)}" (${f.reason})`);
    }
  }
  for (const n of fact.numeric ?? []) {
    const allowed = new Set(n.allowed.map(Number));
    for (const pattern of n.patterns) {
      const re = new RegExp(pattern, "gim");
      for (const d of scoped.filter((x) => kinds.includes(x.kind))) {
        for (const m of d.text.matchAll(re)) {
          const num = Number(m[1]);
          if (!allowed.has(num)) add("error", "fact-numeric", `fact:${fact.id}`, `${d.label}: "${excerpt(d.text, m.index, m[0].length)}" says ${m[1]} (confirmed: ${n.allowed.join(" or ")})`);
        }
      }
    }
  }
}

/* verified answer keys: the correct choice TEXT must match what the author confirmed */
const pins = factsFile.answerKeys ?? {};
const questionById = new Map(questions.map((q) => [q.id, q]));
for (const [id, text] of Object.entries(pins)) {
  const q = questionById.get(id);
  if (!q) {
    if (!only) add("error", "answer-pin", `question:${id}`, "pinned question no longer exists");
    continue;
  }
  if (!idsOf(q).some(inScope)) continue;
  const keyed = Array.isArray(q.answer) ? q.answer.map((i) => q.choices[i]).join(" / ") : q.choices[q.answer];
  if (keyed?.trim() !== text.trim()) add("error", "answer-pin", `question:${id}`, `keyed answer is "${keyed}" but the verified answer is "${text}"`);
}
for (const q of questions) {
  if (pins[q.id] || !idsOf(q).some((t) => (factsFile.pinChapters ?? []).includes(t)) || !idsOf(q).some(inScope)) continue;
  add("warn", "answer-unpinned", `question:${q.id}`, "answer key has not been verified against the book (add it to answerKeys in scripts/content-facts.json)");
}

/* ---------- 3. worked examples recomputed ---------- */
const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
function eui64(mac) {
  const b = mac.split(/[:-]/).map((h) => parseInt(h, 16));
  const e = [b[0] ^ 0x02, b[1], b[2], 0xff, 0xfe, b[3], b[4], b[5]].map(hex2);
  return [e[0] + e[1], e[2] + e[3], e[4] + e[5], e[6] + e[7]].join(":");
}
const toInt = (ip) => ip.split(".").reduce((a, o) => a * 256 + Number(o), 0);
function ipv4Info(ip) {
  const [a, b] = ip.split(".").map(Number);
  let cls = "E";
  if (a >= 1 && a <= 126) cls = "A";
  else if (a === 127) cls = "loopback";
  else if (a >= 128 && a <= 191) cls = "B";
  else if (a >= 192 && a <= 223) cls = "C";
  else if (a >= 224 && a <= 239) cls = "D";
  let kind = "public";
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) kind = "private";
  else if (a === 169 && b === 254) kind = "apipa";
  else if (a === 127) kind = "loopback";
  return { cls, kind };
}
function cidrContains(cidr, ip) {
  const [net, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return ((toInt(ip) & mask) >>> 0) === ((toInt(net) & mask) >>> 0);
}
for (const ex of factsFile.computed ?? []) {
  if (ex.topic && !inScope(ex.topic)) continue;
  const where = `computed:${ex.id}`;
  const topicDocs = docs.filter((d) => d.topic === ex.topic && d.kind !== "question-choice");
  if (ex.type === "eui64") {
    const got = eui64(ex.mac);
    if (got !== ex.expect) add("error", "computed", where, `EUI-64 of ${ex.mac} is ${got}, but the facts file says ${ex.expect}`);
    if (ex.pinned !== false && !topicDocs.some((d) => d.text.toUpperCase().includes(ex.expect))) add("warn", "computed-unpinned", where, `${ex.expect} no longer appears in ${ex.topic} content`);
  } else if (ex.type === "ipv4") {
    const info = ipv4Info(ex.ip);
    if (ex.class && info.cls !== ex.class) add("error", "computed", where, `${ex.ip} is class ${info.cls}, facts file says ${ex.class}`);
    if (ex.kind && info.kind !== ex.kind) add("error", "computed", where, `${ex.ip} is ${info.kind}, facts file says ${ex.kind}`);
  } else if (ex.type === "subnet") {
    const host = 32 - ex.cidr;
    const classBits = ex.classBits ?? 24;
    const got = { subnets: 2 ** (ex.cidr - classBits), hosts: 2 ** host - 2, block: 2 ** (host % 8 === 0 ? 8 : host % 8) };
    if (host > 8) got.block = 2 ** host;
    for (const k of ["subnets", "hosts", "block"]) {
      if (ex[k] !== undefined && ex[k] !== got[k]) add("error", "computed", where, `/${ex.cidr}: ${k} is ${got[k]}, facts file says ${ex[k]}`);
    }
    const base = toInt(ex.network);
    const size = 2 ** host;
    const ipStr = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
    (ex.first ?? []).forEach((f, i) => {
      if (ipStr(base + i * size) !== f) add("error", "computed", where, `subnet ${i} of ${ex.network}/${ex.cidr} is ${ipStr(base + i * size)}, facts file says ${f}`);
    });
    (ex.broadcast ?? []).forEach((b, i) => {
      if (ipStr(base + (i + 1) * size - 1) !== b) add("error", "computed", where, `broadcast ${i} of ${ex.network}/${ex.cidr} is ${ipStr(base + (i + 1) * size - 1)}, facts file says ${b}`);
    });
  } else if (ex.type === "route-lookup") {
    for (const c of ex.cases) {
      const hit = ex.routes.filter((r) => cidrContains(r.cidr, c.ip)).sort((a, b) => Number(b.cidr.split("/")[1]) - Number(a.cidr.split("/")[1]))[0];
      const got = hit ? hit.exit : null;
      if (got !== c.exit) add("error", "computed", where, `${c.ip} matches ${got ?? "no route"}, facts file says ${c.exit ?? "no route"}`);
    }
  }
}

/* ---------- report ---------- */
const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");
if (asJson) {
  console.log(JSON.stringify({ scope: only ?? "all", errors: errors.length, warnings: warns.length, findings }, null, 2));
} else {
  console.log(`Content check (${only ? only.join(", ") : "all topics"}): ${errors.length} error(s), ${warns.length} warning(s)`);
  for (const f of [...errors, ...warns]) console.log(`${f.level === "error" ? "ERROR" : "WARN "} [${f.check}] ${f.where}: ${f.message}`);
  if (!findings.length) console.log("No problems found. This does not prove the content is true; see scripts/content-facts.json for what is pinned.");
}
process.exit(errors.length || (strict && warns.length) ? 1 : 0);
