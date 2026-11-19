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

const itemTopicIds = (item) => (Array.isArray(item.topicId) ? item.topicId : [item.topicId]).filter(Boolean);

/** Aggregate-only views for Insights. Topic associations come from objective mappings. */
export function buildInsightsFromCoverage({ objectives, rows, topics, cards, questions, labs }) {
  const topicCodes = new Map(topics.map((topic) => [topic.id, topic.examCodes ?? []]));
  const belongsToCode = (code, item, topicPicker) => Array.isArray(item.examCodes)
      ? item.examCodes.includes(code)
      : topicPicker(item).some((id) => topicCodes.get(id)?.includes(code));
  const countForCode = (code, items, topicPicker) => new Set(items
    .filter((item) => belongsToCode(code, item, topicPicker))
    .map((item) => item.id ?? item.slug ?? JSON.stringify(topicPicker(item)))).size;
  const byExam = objectives.exams.map((exam) => {
    const examRows = rows.filter((row) => row.exam === exam.code);
    const stats = examCoverage(exam, rows);
    const countTrackItems = (items, topicPicker) => new Set(items
      .filter((item) => belongsToCode(exam.code, item, topicPicker))
      .map((item) => item.id ?? item.slug ?? JSON.stringify(topicPicker(item)))).size;
    const countDomainItems = (items, ids, topicPicker) => new Set(items
      .filter((item) => belongsToCode(exam.code, item, topicPicker) && topicPicker(item).some((id) => ids.has(id)))
      .map((item) => item.id ?? item.slug ?? JSON.stringify(topicPicker(item)))).size;
    const resourceCounts = {
      questions: countTrackItems(questions, itemTopicIds),
      flashcards: countTrackItems(cards, itemTopicIds),
      labs: countTrackItems(labs, (lab) => lab.relatedTopicIds ?? []),
    };
    return {
      code: exam.code,
      name: exam.name,
      ...stats,
      ...resourceCounts,
      domains: exam.domains.map((domain) => {
        const domainRows = examRows.filter((row) => row.domain === domain.id);
        const domainTopicIds = new Set(domainRows.flatMap((row) => row.topics));
        return {
          id: domain.id,
          title: domain.title,
          weight: domain.weight,
          ...summarizeCoverage(domainRows),
          questions: countDomainItems(questions, domainTopicIds, itemTopicIds),
          flashcards: countDomainItems(cards, domainTopicIds, itemTopicIds),
          labs: countDomainItems(labs, domainTopicIds, (lab) => lab.relatedTopicIds ?? []),
        };
      }),
    };
  });
  const partialCandidates = rankGaps(rows)
    .filter((row) => row.status === 'partial')
    .map(({ exam, id, title, domain, domainTitle, weight, topics }) => ({ exam, id, title, domain, domainTitle, weight, topics }));
  const resourceTracks = [
    ...byExam.map(({ code, name, questions: questionCount, flashcards, labs: labCount, weighted }) => ({ code, name, questions: questionCount, flashcards, labs: labCount, weighted })),
    {
      code: '200-301',
      name: 'Cisco CCNA',
      questions: countForCode('200-301', questions, itemTopicIds),
      flashcards: countForCode('200-301', cards, itemTopicIds),
      // lib/tracks.ts exposes the shared lab collection in the CCNA hub.
      labs: labs.length,
      weighted: null,
    },
  ];
  return { exams: byExam, resourceTracks, partialCandidates };
}

export function renderInsightsJson({ objectives, rows, topics, cards, questions, labs }) {
  return JSON.stringify(buildInsightsFromCoverage({ objectives, rows, topics, cards, questions, labs }));
}
export const normalizeSearch = (value) => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, ' ');
export function filterCoverage(rows, { exam = 'all', status = 'all', search = '', missedOnly = false } = {}) {
  const terms = normalizeSearch(search).split(' ').filter(Boolean);
  return rows.filter((r) => (exam === 'all' || r.exam === exam) && (status === 'all' || r.status === status) && (!missedOnly || r.missedOnExam)
    && terms.every((term) => normalizeSearch(`${r.exam} ${r.id} ${r.title}`).includes(term)));
}
