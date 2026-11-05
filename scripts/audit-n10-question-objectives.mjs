import { readFileSync } from 'node:fs';
import { objectiveTopicMap, questionObjectiveIds } from '../lib/question-objectives.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

export function auditQuestionObjectives({ objectives, questions, topics, examCode = 'n10-009' }) {
  const exam = objectives.exams.find((item) => item.code === examCode);
  if (!exam) throw new Error(`Unknown exam: ${examCode}`);
  const validIds = new Set(exam.domains.flatMap((domain) => domain.objectives.map((objective) => objective.id)));
  const topicCodes = new Map(topics.map((topic) => [topic.id, topic.examCodes ?? []]));
  const topicObjectives = objectiveTopicMap(exam);
  const eligible = questions.filter((question) => (question.examCodes ?? topicCodes.get(question.topicId) ?? []).includes(examCode));
  const eligibleIds = new Set(eligible.map((question) => question.id));
  const rows = eligible.map((question) => {
    const hasExplicit = Array.isArray(question.objectiveIds?.[examCode]);
    const explicit = hasExplicit ? [...question.objectiveIds[examCode]] : [];
    const inferred = [...(topicObjectives.get(question.topicId) ?? [])];
    const effective = questionObjectiveIds(question, examCode, topicObjectives);
    return {
      id: question.id,
      topicId: question.topicId,
      explicit,
      inferred,
      effective,
      invalid: explicit.filter((id) => !validIds.has(id)),
      topicOnly: !hasExplicit && inferred.length > 0,
      unresolved: !hasExplicit && inferred.length !== 1,
    };
  });
  const explicitRows = rows.filter((row) => row.explicit.length > 0);
  const counts = (key) => Object.fromEntries([...validIds].sort().map((id) => [id, rows.filter((row) => row[key].includes(id)).length]));
  return {
    examCode,
    total: rows.length,
    explicit: rows.filter((row) => Array.isArray(questions.find((question) => question.id === row.id)?.objectiveIds?.[examCode])).length,
    topicOnly: rows.filter((row) => row.topicOnly).length,
    multiObjective: explicitRows.filter((row) => row.explicit.length > 1).length,
    invalid: rows.filter((row) => row.invalid.length > 0).length,
    mappedOutsideExam: questions.filter((question) => Array.isArray(question.objectiveIds?.[examCode]) && !eligibleIds.has(question.id)).length,
    unresolved: rows.filter((row) => row.unresolved).length,
    explicitObjectiveCounts: counts('explicit'),
    effectiveObjectiveCounts: counts('effective'),
    rows: rows.sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function renderAudit(report) {
  const lines = [
    `N10-009 question-objective audit`,
    `Total eligible N10-009 questions: ${report.total}`,
    `Explicit mappings: ${report.explicit}`,
    `Topic-only/inferred mappings: ${report.topicOnly}`,
    `Multiple-objective mappings: ${report.multiObjective}`,
    `Invalid objective mappings: ${report.invalid}`,
    `Mapped outside exam: ${report.mappedOutsideExam}`,
    `Unresolved mappings: ${report.unresolved}`,
    '',
    'Explicit objective counts:',
  ];
  for (const [id, count] of Object.entries(report.explicitObjectiveCounts)) lines.push(`  ${id}: ${count}`);
  lines.push('', 'Effective objective counts (including legacy topic fallback):');
  for (const [id, count] of Object.entries(report.effectiveObjectiveCounts)) lines.push(`  ${id}: ${count}`);
  return `${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = auditQuestionObjectives({
    objectives: read('content/objectives.json'),
    questions: read('content/questions.json'),
    topics: [...read('content/topics.json'), ...read('content/topics-network-plus.json')],
  });
  console.log(renderAudit(report));
  if (report.invalid || report.mappedOutsideExam) process.exitCode = 1;
}
