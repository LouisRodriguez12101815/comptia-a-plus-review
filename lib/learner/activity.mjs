import questions from '../../content/questions.json' with { type: 'json' };
import topics from '../../content/topics.json' with { type: 'json' };
import networkTopics from '../../content/topics-network-plus.json' with { type: 'json' };
import objectives from '../../content/objectives.json' with { type: 'json' };
import concepts from '../../content/network-plus-concepts.json' with { type: 'json' };
import { collectActivity } from '../../scripts/lib/learner-activity-data.mjs';
import { analyzeActivity } from '../../scripts/lib/learner-activity-plan.mjs';
import { createActivityReader, readConsistentActivity } from './activity-reader.mjs';

const content = { questions, topics: [...topics, ...networkTopics], objectives, concepts };

/** Construct a response from an explicit allowlist, never the private exporter output. */
export function browserActivityDTO(items, asOf = Date.now()) {
  // collectActivity rejects an empty map; the sentinel carries no learner data.
  const report = collectActivity(items.length ? items : [{ key: '_empty', data: {} }], content, { days: 7, asOf });
  const summary = analyzeActivity(report);
  // A tied, contradictory latest result is one ambiguous outcome, not a
  // definite result. Earlier selected-stream outcomes remain unchanged.
  const questions = summary.questions.map(q => {
    if (q.mostRecentResult !== 'ambiguous') return { ...q, ambiguous: 0 };
    const tied = report.activity.filter(row => row.examId === q.examId && row.questionId === q.questionId
      && row.timestamp === q.lastAttemptedAt && row.scoringEvidence && typeof row.isCorrect === 'boolean');
    return { ...q, attempts: q.attempts - tied.length + 1,
      correct: q.correct - tied.filter(row => row.isCorrect).length,
      incorrect: q.incorrect - tied.filter(row => !row.isCorrect).length, ambiguous: 1 };
  });
  const groups = (rows, field) => rows.slice(0, 100).map(row => ({
    examId: row.examId, [field]: row[field], questionCount: row.questionCount,
    ...['attempts', 'correct', 'incorrect', 'ambiguous'].reduce((result, metric) => {
      result[metric] = questions.filter(q => q.examId === row.examId && q[field] === row[field]).reduce((sum, q) => sum + q[metric], 0);
      return result;
    }, {}),
    weaknessScore: Math.min(row.weaknessScore, 10000),
  }));
  return {
    window: { days: report.window.days, start: report.window.start, end: report.window.end },
    totals: { questions: questions.length, attempts: questions.reduce((n, q) => n + q.attempts, 0),
      correct: questions.reduce((n, q) => n + q.correct, 0), incorrect: questions.reduce((n, q) => n + q.incorrect, 0) },
    ambiguity: { count: questions.reduce((n, q) => n + q.ambiguous, 0),
      mixedObjectiveContexts: questions.filter(q => q.ambiguousObjectiveContext).length },
    topics: groups(summary.topics, 'topicId'), objectives: groups(summary.objectives, 'objectiveId'),
    limitations: { retainedHistoryOnly: true, excludedEvidence: Object.values(report.gaps).some(n => n > 0),
      truncatedGroups: summary.topics.length > 100 || summary.objectives.length > 100 },
  };
}

export async function getLearnerActivity(config, learnerId) {
  const reader = createActivityReader(config, learnerId);
  const asOf = Date.now();
  return readConsistentActivity(reader, items => browserActivityDTO(items, asOf));
}
