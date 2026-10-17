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

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const list = (data, key) => (Array.isArray(data) ? data : data[key] ?? []);
const topicIds = (item) => (Array.isArray(item.topicId) ? item.topicId : [item.topicId]);

export function buildCoverage() {
  const objectives = read('content/objectives.json');
  const topics = [...read('content/topics.json'), ...read('content/topics-network-plus.json')];
  const questions = list(read('content/questions.json'), 'questions');
  const cards = list(read('content/flashcards.json'), 'cards');
  const labs = list(read('content/labs.json'), 'labs');
  const visuals = read('content/track-visuals.json');

  const count = (items, ids, pick) => items.filter((item) => pick(item).some((id) => ids.has(id))).length;
  const rows = [];
  for (const exam of objectives.exams) {
    for (const domain of exam.domains) {
      for (const objective of domain.objectives) {
        const ids = new Set(objective.topics);
        rows.push({
          exam: exam.code,
          domain: domain.id,
          domainTitle: domain.title,
          weight: domain.weight,
          id: objective.id,
          title: objective.title,
          status: objective.status,
          note: objective.note ?? '',
          topics: objective.topics,
          notes: topics.filter((t) => ids.has(t.id)).reduce((sum, t) => sum + t.sections.length, 0),
          cards: count(cards, ids, topicIds),
          quiz: count(questions, ids, topicIds),
          labs: count(labs, ids, (lab) => lab.relatedTopicIds ?? []),
          visuals: objective.topics.reduce((sum, id) => sum + (visuals[id]?.length ?? 0), 0),
        });
      }
    }
  }
  return { objectives, rows };
}

const statusRank = { missing: 0, partial: 1, covered: 2 };

export function renderReport({ objectives, rows }) {
  const lines = ['# Exam objective coverage', '', objectives.note, ''];
  for (const exam of objectives.exams) {
    const own = rows.filter((r) => r.exam === exam.code);
    const tally = (s) => own.filter((r) => r.status === s).length;
    const score = exam.domains.reduce((sum, d) => {
      const inDomain = own.filter((r) => r.domain === d.id);
      const credit = inDomain.reduce((c, r) => c + (r.status === 'covered' ? 1 : r.status === 'partial' ? 0.5 : 0), 0);
      return sum + (d.weight * credit) / inDomain.length;
    }, 0);
    lines.push(`## ${exam.name} (${exam.code})`, '');
    lines.push(`${tally('covered')} covered, ${tally('partial')} partial, ${tally('missing')} missing of ${own.length} objectives. Weighted coverage about ${Math.round(score)}% (covered counts 1, partial 0.5).`, '');
    lines.push('| Objective | Weight | Status | Notes sections | Cards | Quiz | Labs | Visuals | Topics |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of own) {
      lines.push(`| ${r.id} ${r.title} | ${r.weight}% | ${r.status} | ${r.notes} | ${r.cards} | ${r.quiz} | ${r.labs} | ${r.visuals} | ${r.topics.join(', ') || '-'} |`);
    }
    lines.push('');
  }
  const gaps = rows
    .filter((r) => r.status !== 'covered')
    .sort((a, b) => b.weight - a.weight || statusRank[a.status] - statusRank[b.status] || a.exam.localeCompare(b.exam));
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
