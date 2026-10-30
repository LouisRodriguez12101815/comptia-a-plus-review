// Pure coverage calculations shared by the Node report and Next.js dashboard.
// No filesystem, React, browser, or framework imports belong in this module.
export const objectiveKey = (row) => `${row.exam}:${row.id}`;
const topicIds = (item) => (Array.isArray(item.topicId) ? item.topicId : [item.topicId]);
export function buildCoverageFromContent({ objectives, topics, cards, questions, labs, visuals }) {
  const count = (items, ids, pick) => items.filter((item) => pick(item).some((id) => ids.has(id))).length;
  const rows = [];
  for (const exam of objectives.exams) {
    for (const domain of exam.domains) {
      for (const objective of domain.objectives) {
        const ids = new Set(objective.topics);
        rows.push({
          exam: exam.code,
          key: objectiveKey({ exam: exam.code, id: objective.id }),
          domain: domain.id,
          domainTitle: domain.title,
          weight: domain.weight,
          id: objective.id,
          title: objective.title,
          status: objective.status,
          missedOnExam: objective.missedOnExam === true,
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
export function rankGaps(rows) {
  // Stable ties preserve source matrix order, matching the original report.
  return rows.filter((r) => r.status !== 'covered').sort((a, b) =>
    b.weight - a.weight || statusRank[a.status] - statusRank[b.status] || a.exam.localeCompare(b.exam));
}
export function summarizeCoverage(rows) {
  return {
    total: rows.length,
    covered: rows.filter((r) => r.status === 'covered').length,
    partial: rows.filter((r) => r.status === 'partial').length,
    missing: rows.filter((r) => r.status === 'missing').length,
  };
}
export function examCoverage(exam, rows) {
  const own = rows.filter((r) => r.exam === exam.code);
  const weighted = exam.domains.reduce((sum, d) => {
    const inDomain = own.filter((r) => r.domain === d.id);
    const credit = inDomain.reduce((c, r) => c + (r.status === 'covered' ? 1 : r.status === 'partial' ? 0.5 : 0), 0);
    return sum + (inDomain.length ? d.weight * credit / inDomain.length : 0);
  }, 0);
  return { ...summarizeCoverage(own), weighted: Math.round(weighted) };
}
export const normalizeSearch = (value) => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, ' ');
export function filterCoverage(rows, { exam = 'all', status = 'all', search = '', missedOnly = false } = {}) {
  const terms = normalizeSearch(search).split(' ').filter(Boolean);
  return rows.filter((r) => (exam === 'all' || r.exam === exam) && (status === 'all' || r.status === status) && (!missedOnly || r.missedOnExam)
    && terms.every((term) => normalizeSearch(`${r.exam} ${r.id} ${r.title}`).includes(term)));
}
