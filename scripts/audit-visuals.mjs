/**
 * Visual audit: finds chapter visuals that teach mostly with words, and checks the
 * fact blocks of visuals revised with the exam-visual-designer skill.
 *
 *   npm run audit:visuals                 ranked list of the wordiest visuals
 *   npm run audit:visuals -- --top 40     longer list
 *   npm run audit:visuals -- --json       machine-readable rows
 *   npm run audit:visuals -- --check      exit 1 if any fact block is invalid
 *
 * Words-per-shape is a triage signal, not a quality score. A short text table can be
 * the right form; read the visual before deciding to redraw it.
 */
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const readJson = (path) => JSON.parse(read(path));

const SHAPE = /<(rect|circle|path|line|polygon|ellipse|polyline)\b/gi;
// Shapes built in script: createElementNS(ns, 'rect') or a helper such as el('rect', {...}).
const SHAPE_NS = /\(\s*(?:[\w.]+\s*,\s*)?['"](rect|circle|path|line|polygon|ellipse|polyline)['"]/g;
const FACTS = /<script\s+type="application\/json"\s+id="visual-facts">([\s\S]*?)<\/script>/i;

function countWords(html) {
  const withoutFacts = html.replace(FACTS, '');
  const body = withoutFacts.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  const markupWords = body.replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').split(/\s+/).filter(Boolean).length;
  // Text authored inside scripts (step explanations, quiz feedback) reaches the reader too.
  const scripts = (withoutFacts.match(/<script[\s\S]*?<\/script>/gi) ?? []).join(' ').replace(/<[^>]+>/g, ' ');
  const scriptWords = (scripts.match(/['"`]([^'"`\n]{25,})['"`]/g) ?? [])
    .reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0);
  return markupWords + scriptWords;
}

/** Which topic each visual belongs to, from the same lists the Visuals pages use. */
function visualTopics() {
  const map = {};
  const add = (topic, list) => (list ?? []).forEach((v) => { (map[v.file] ??= []).push(topic); });
  for (const [topic, list] of Object.entries(readJson('content/track-visuals.json'))) add(topic, list);
  for (const ch of ['ch9', 'ch10', 'ch11']) add(`n10-${ch}`, readJson(`content/network-plus/${ch}.json`).visuals);
  return map;
}

/** Objective keys ("220-1201 3.2") and their domain weights, by topic. */
function objectiveIndex(objectives) {
  const byTopic = {};
  const keys = new Map();
  for (const exam of objectives.exams) for (const domain of exam.domains) for (const o of domain.objectives) {
    const key = `${exam.code} ${o.id}`;
    keys.set(key, domain.weight);
    for (const t of o.topics) (byTopic[t] ??= []).push({ key, weight: domain.weight });
  }
  return { byTopic, keys };
}

/** Validates a visual's fact block. Returns a list of problems (empty when valid). */
export function checkFacts(html, objectiveKeys) {
  const match = FACTS.exec(html);
  if (!match) return null;
  let data;
  try { data = JSON.parse(match[1]); } catch (error) { return [`fact block is not valid JSON: ${error.message}`]; }
  const problems = [];
  if (!Array.isArray(data.facts) || data.facts.length === 0) problems.push('fact block needs a non-empty "facts" array');
  for (const [i, fact] of (data.facts ?? []).entries()) {
    const at = `facts[${i}]`;
    if (!fact.claim) problems.push(`${at} has no claim`);
    if (!Array.isArray(fact.objectives) || fact.objectives.length === 0) problems.push(`${at} has no objectives`);
    for (const key of fact.objectives ?? []) if (!objectiveKeys.has(key)) problems.push(`${at} names unknown objective "${key}"`);
    if (!Array.isArray(fact.sources) || fact.sources.length === 0) problems.push(`${at} has no sources`);
  }
  for (const [i, s] of (data.simplifications ?? []).entries()) if (typeof s !== 'string' || !s) problems.push(`simplifications[${i}] must be text`);
  if (data.kind === 'exercise') {
    if (!/<label[\s>]/i.test(html)) problems.push('exercise needs a <label> for each control');
    if (!/aria-live=/.test(html)) problems.push('exercise needs an aria-live region for feedback');
  } else {
    if (!/<figure[\s>]/i.test(html) || !/role="img"/.test(html)) problems.push('revised visual needs a <figure> with an svg role="img"');
    if (!/<figcaption[\s>]/i.test(html)) problems.push('revised visual needs a <figcaption>');
  }
  return problems;
}

export function auditVisuals() {
  const objectives = readJson('content/objectives.json');
  const { byTopic, keys } = objectiveIndex(objectives);
  const topicsOf = visualTopics();
  const files = readdirSync(new URL('public/visuals/', root)).filter((f) => f.endsWith('.html')).sort();
  return files.map((file) => {
    const html = read(`public/visuals/${file}`);
    const shapes = (html.match(SHAPE) ?? []).length + (html.match(SHAPE_NS) ?? []).length;
    const words = countWords(html);
    const topics = topicsOf[file] ?? [];
    const objectivesHit = topics.flatMap((t) => byTopic[t] ?? []);
    const weight = Math.max(0, ...objectivesHit.map((o) => o.weight));
    const ratio = Math.round((10 * words) / (shapes + 5)) / 10;
    const facts = checkFacts(html, keys);
    return {
      file, words, shapes, ratio, weight,
      priority: Math.round(ratio * (weight || 10)),
      graphic: /<svg|<canvas/i.test(html),
      revised: facts !== null,
      problems: facts ?? [],
      topics,
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const rows = auditVisuals();
  const bad = rows.filter((r) => r.problems.length);
  if (args.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else if (!args.includes('--check')) {
    const top = Number(args[args.indexOf('--top') + 1]) || 20;
    const queue = rows.filter((r) => !r.revised).sort((a, b) => b.priority - a.priority).slice(0, top);
    console.log(`${rows.length} visuals. ${rows.filter((r) => !r.graphic).length} draw nothing (no SVG or canvas). ${rows.filter((r) => r.revised).length} carry a checked fact block.\n`);
    console.log('Wordiest visuals first, weighted by exam domain weight. Read each before redrawing.\n');
    console.log('| Priority | Visual | Words | Shapes | Words per shape | Domain weight | Topics |');
    console.log('| --- | --- | --- | --- | --- | --- | --- |');
    for (const r of queue) console.log(`| ${r.priority} | ${r.file} | ${r.words} | ${r.shapes} | ${r.ratio} | ${r.weight || '-'}% | ${r.topics.join(', ') || 'unlisted'} |`);
  }
  for (const r of bad) console.error(`✗ ${r.file}\n  - ${r.problems.join('\n  - ')}`);
  if (args.includes('--check')) console.log(`${rows.filter((r) => r.revised).length} fact blocks checked, ${bad.length} with problems.`);
  if (bad.length) process.exitCode = 1;
}
