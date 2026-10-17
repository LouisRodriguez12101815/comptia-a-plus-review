/**
 * Coverage report: how well the site teaches each official exam objective.
 *
 *   npm run report:objectives
 *   npm run report:objectives -- --out objective-coverage.md
 *
 * Reads content/objectives.json (objective → topics and a reviewed status) and counts the
 * notes sections, flashcards, quiz questions, labs and visuals in the mapped topics.
 * Gaps are ranked by domain weight so the heaviest missing objectives come first.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { buildCoverageFromContent, examCoverage, rankGaps } from '../lib/objective-coverage.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const list = (data, key) => (Array.isArray(data) ? data : data[key] ?? []);

export function buildCoverage() {
  const objectives = read('content/objectives.json');
  const topics = [...read('content/topics.json'), ...read('content/topics-network-plus.json')];
  const questions = list(read('content/questions.json'), 'questions');
  const cards = list(read('content/flashcards.json'), 'cards');
  const labs = list(read('content/labs.json'), 'labs');
  const visuals = read('content/track-visuals.json');

  return buildCoverageFromContent({ objectives, topics, cards, questions, labs, visuals });
}

export function renderReport({ objectives, rows }) {
  const lines = ['# Exam objective coverage', '', objectives.note, '', 'Domain weights apply to whole domains. Weighted coverage is a preliminary content-planning estimate, not learner readiness.', ''];
  for (const exam of objectives.exams) {
    const own = rows.filter((r) => r.exam === exam.code);
    const summary = examCoverage(exam, rows);
    const tally = (s) => summary[s];
    const score = summary.weighted;
    lines.push(`## ${exam.name} (${exam.code})`, '');
    lines.push(`${tally('covered')} covered, ${tally('partial')} partial, ${tally('missing')} missing of ${own.length} objectives. Weighted coverage about ${Math.round(score)}% (covered counts 1, partial 0.5).`, '');
    lines.push('| Objective | Domain weight | Status | Notes sections | Cards | Quiz | Labs | Visuals | Topics |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of own) {
      lines.push(`| ${r.id} ${r.title} | ${r.weight}% | ${r.status} | ${r.notes} | ${r.cards} | ${r.quiz} | ${r.labs} | ${r.visuals} | ${r.topics.join(', ') || '-'} |`);
    }
    lines.push('');
  }
  const gaps = rankGaps(rows);
  lines.push('## Gaps, heaviest domain first', '');
  gaps.forEach((r, i) => lines.push(`${i + 1}. ${r.exam} ${r.id} (${r.domainTitle}, ${r.weight}%): ${r.title}. ${r.status}.${r.note ? ` ${r.note}` : ''}`));
  lines.push('');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = renderReport(buildCoverage());
  const outAt = process.argv.indexOf('--out');
  if (outAt > -1 && process.argv[outAt + 1]) {
    writeFileSync(process.argv[outAt + 1], report);
    console.log(`Wrote ${process.argv[outAt + 1]}`);
  } else {
    console.log(report);
  }
}
