import { bankIndex, cmp, DAY } from './learner-activity-data.mjs';
import { controlledQuestionIds } from '../../lib/controlled-question-pool.ts';
import { n10RemediationForQuestion } from '../../lib/n10-remediation.ts';

export const SCORE_FORMULA = '8*incorrect + 4*max(incorrect-1,0) + 5*missAfterReview + 4*recentMiss + 2*min(otherWeakQuestionsInObjective,3) - 4*latestCorrectAfterMiss; floor 2 if any scored or supplemental miss exists, otherwise 0. Supplemental misses never add attempts. Recent = last 72h of explicit window end; high >=16, medium >0, low =0.';
const key = row => `${row.examId}:${row.questionId}`;
const stamp = row => Date.parse(row.timestamp);
const sortScore = (a, b) => b.weaknessScore - a.weaknessScore || cmp(b.lastAttemptedAt, a.lastAttemptedAt) || cmp(a.questionId ?? a.key, b.questionId ?? b.key);

export function analyzeActivity(report) {
  const groups = new Map(), end = Date.parse(report.window.end);
  for (const row of report.activity) {
    if (!row.scoringEvidence || typeof row.isCorrect !== 'boolean') continue;
    const list = groups.get(key(row)) ?? [];
    list.push(row); groups.set(key(row), list);
  }
  const questions = [];
  for (const [id, history] of groups) {
    history.sort((a, b) => cmp(a.timestamp, b.timestamp) || cmp(JSON.stringify(a), JSON.stringify(b)));
    const latest = history.at(-1), first = history[0];
    // A conflicting result in another stream at the same instant cannot be
    // ordered, even though only one stream contributes attempt counts.
    const tiedLatest = report.activity.filter(row => key(row) === id && row.timestamp === latest.timestamp && typeof row.isCorrect === 'boolean');
    const latestCorrect = tiedLatest.every(row => row.isCorrect);
    const latestIncorrect = tiedLatest.every(row => !row.isCorrect);
    const objectiveContexts = new Set(history.map(row => row.objectiveId));
    const incorrect = history.filter(row => !row.isCorrect).length, correct = history.length - incorrect;
    const supplementalMiss = report.activity.some(row => key(row) === id && !row.scoringEvidence && row.isCorrect === false);
    const reviews = report.activity.filter(row => key(row) === id && ['remediation_opened', 'remediation_resource_opened'].includes(row.eventType));
    const misses = history.filter(row => !row.isCorrect);
    const missAfterReview = misses.some((miss, i) => i > 0 && reviews.some(review => stamp(review) > stamp(misses[0]) && stamp(review) < stamp(miss)));
    const recentMiss = misses.some(miss => end - stamp(miss) <= 3 * DAY);
    const improved = latestCorrect && report.activity.some(row => key(row) === id && row.isCorrect === false && row.timestamp < latest.timestamp);
    questions.push({ questionId: latest.questionId, examId: latest.examId, certification: latest.certification,
      topicId: latest.topicId, objectiveId: objectiveContexts.size === 1 ? latest.objectiveId : null, attempts: history.length, correct, incorrect,
      ambiguousObjectiveContext: objectiveContexts.size > 1,
      mostRecentResult: latestCorrect ? 'correct' : latestIncorrect ? 'incorrect' : 'ambiguous', firstAttemptedAt: first.timestamp, lastAttemptedAt: latest.timestamp,
      weaknessScore: 0, priorityTier: 'low', reasonCodes: [],
      supplementalMissObserved: supplementalMiss,
      factors: { repeatedMisses: Math.max(incorrect - 1, 0), missAfterReview: Number(missAfterReview), recentMiss: Number(recentMiss), latestCorrectAfterMiss: Number(improved), otherWeakQuestionsInObjective: 0 },
      recentlyImproved: improved,
      recentlyMasteredCandidate: incorrect === 0 && !supplementalMiss && correct >= 3 && history.slice(-3).every(row => row.isCorrect),
    });
  }
  for (const q of questions) {
    const neighbors = q.objectiveId ? questions.filter(other => other !== q && other.examId === q.examId && other.objectiveId === q.objectiveId && other.incorrect > 0).length : 0;
    q.factors.otherWeakQuestionsInObjective = Math.min(neighbors, 3);
    q.weaknessScore = q.incorrect || q.supplementalMissObserved ? Math.max(2, 8 * q.incorrect + 4 * q.factors.repeatedMisses + 5 * q.factors.missAfterReview
      + 4 * q.factors.recentMiss + 2 * q.factors.otherWeakQuestionsInObjective - 4 * q.factors.latestCorrectAfterMiss) : 0;
    q.priorityTier = q.weaknessScore >= 16 ? 'high' : q.weaknessScore > 0 ? 'medium' : 'low';
    q.reasonCodes = [q.incorrect ? 'incorrect-evidence' : q.correct === 1 ? 'first-observed-correct' : 'repeated-correct',
      ...(q.factors.repeatedMisses ? ['repeated-misses'] : []), ...(q.factors.missAfterReview ? ['miss-after-logged-review'] : []),
      ...(q.factors.recentMiss ? ['recent-miss'] : []), ...(neighbors && q.incorrect ? ['weak-objective-neighbors'] : []),
      ...(q.recentlyImproved ? ['improved-after-miss'] : []), ...(q.supplementalMissObserved ? ['supplemental-miss-not-added-to-counts'] : []),
      ...(q.ambiguousObjectiveContext ? ['mixed-objective-context-not-aggregated'] : [])];
  }
  questions.sort(sortScore);
  const aggregate = field => {
    const rows = new Map();
    for (const q of questions) {
      if (!q[field]) continue;
      const id = `${q.examId}:${q[field]}`;
      const value = rows.get(id) ?? { key: id, examId: q.examId, certification: q.certification, [field]: q[field],
        questionCount: 0, attempts: 0, correct: 0, incorrect: 0, weaknessScore: 0, lastAttemptedAt: q.lastAttemptedAt };
      for (const metric of ['attempts', 'correct', 'incorrect', 'weaknessScore']) value[metric] += q[metric];
      value.questionCount++; value.lastAttemptedAt = value.lastAttemptedAt > q.lastAttemptedAt ? value.lastAttemptedAt : q.lastAttemptedAt;
      rows.set(id, value);
    }
    return [...rows.values()].sort(sortScore);
  };
  return { window: report.window, formula: SCORE_FORMULA, evidencePolicy: report.evidencePolicy, questions,
    topics: aggregate('topicId'), objectives: aggregate('objectiveId'),
    repeatedMisses: questions.filter(q => q.incorrect > 1).map(q => ({ examId: q.examId, questionId: q.questionId })),
    recentlyImproved: questions.filter(q => q.recentlyImproved).map(q => ({ examId: q.examId, questionId: q.questionId })),
    recentlyMasteredCandidates: questions.filter(q => q.recentlyMasteredCandidate).map(q => ({ examId: q.examId, questionId: q.questionId })),
    gaps: report.gaps, limitations: report.limitations, qualification: 'Observed retained evidence only; no readiness score or global mastery claim.' };
}

function conceptsFor(id, content) {
  const values = (content.concepts?.concepts ?? []).filter(c => c.questionIds?.includes(id)).map(c => `concept:${c.id}`);
  const cluster = n10RemediationForQuestion(id)?.clusterId;
  if (cluster) values.push(`n10:${cluster}`);
  return new Set(values);
}
const sameWording = prompt => prompt.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Internal answer-key plan, with Question-shaped items and separate selection metadata. */
export function buildFollowup(summary, content, { quizSize = 15, exam } = {}) {
  if (!Number.isInteger(quizSize) || quizSize < 1 || quizSize > 100) throw new Error('options');
  const index = bankIndex(content);
  if (exam && !index.exams.has(exam)) throw new Error('options');
  const exams = [...new Set(summary.questions.map(q => q.examId).concat(exam ? [exam] : []))].filter(code => !exam || code === exam).sort(cmp);
  const plans = [], shortages = [];
  for (const code of exams) {
    const evidence = summary.questions.filter(q => q.examId === code), weak = evidence.filter(q => q.weaknessScore > 0), correct = evidence.filter(q => q.weaknessScore === 0 && q.correct > 0);
    const allowedIds = controlledQuestionIds([...index.bank.keys()].sort(cmp), [...index.bank.values()].map(e => e.question), content.topics, code);
    const pool = allowedIds.map(id => index.bank.get(id));
    const chosen = new Set(), wording = new Set(), selections = [];
    const evidenceById = new Map(evidence.map(q => [q.questionId, q]));
    const relation = (candidate, source) => {
      const q = candidate.question;
      if (q.id === source.questionId || sameWording(q.prompt) === sameWording(index.bank.get(source.questionId).question.prompt)) return 4;
      const concepts = conceptsFor(source.questionId, content);
      if ([...conceptsFor(q.id, content)].some(c => concepts.has(c))) return 0;
      if (source.objectiveId && candidate.objectives.get(code).includes(source.objectiveId)) return 1;
      if (q.topicId === source.topicId) return 2;
      return Infinity;
    };
    // Round robin by objective (topic if unmapped), not by the loudest individual miss.
    const grouped = new Map();
    for (const source of weak) {
      const id = source.objectiveId ? `objective:${source.objectiveId}` : `topic:${source.topicId}`;
      const list = grouped.get(id) ?? []; list.push(source); grouped.set(id, list);
    }
    const weakGroups = [...grouped.values()];
    const correctGroups = correct.sort((a, b) => cmp(a.lastAttemptedAt, b.lastAttemptedAt) || cmp(a.questionId, b.questionId)).map(q => [q]);
    const take = (groups, category, count) => {
      let added = 0;
      while (added < count && selections.length < quizSize) {
        let changed = false;
        for (const sources of groups) {
          if (added >= count || selections.length >= quizSize) break;
          const candidates = pool.filter(c => !chosen.has(c.question.id) && !wording.has(sameWording(c.question.prompt))
            && (category !== 'spaced-review' || (evidenceById.get(c.question.id)?.correct > 0
              && evidenceById.get(c.question.id)?.weaknessScore === 0)))
            .map(candidate => {
              const source = [...sources].sort((a, b) => relation(candidate, a) - relation(candidate, b) || sortScore(a, b))[0];
              return { candidate, source, distance: relation(candidate, source) };
            }).filter(c => Number.isFinite(c.distance));
          const distanceRank = d => category === 'related-concept-reinforcement' ? ({ 0: 1, 1: 0, 2: 2, 4: 4 })[d] : d;
          candidates.sort((a, b) => distanceRank(a.distance) - distanceRank(b.distance)
            || Number((evidenceById.get(a.candidate.question.id)?.correct ?? 0) > 0) - Number((evidenceById.get(b.candidate.question.id)?.correct ?? 0) > 0)
            || cmp(a.candidate.question.id, b.candidate.question.id));
          const best = candidates[0];
          if (!best) continue;
          const q = best.candidate.question;
          chosen.add(q.id); wording.add(sameWording(q.prompt));
          selections.push({ questionId: q.id, category, selectionPriority: selections.length + 1,
            reason: best.distance === 4 ? 'exact-repeat-after-alternative-exhaustion' : ['same-authored-concept', 'same-objective', 'same-topic'][best.distance],
            sourceQuestionIds: sources.map(s => s.questionId).sort(cmp),
            weakObjectiveIds: [...new Set(sources.filter(s => s.objectiveId).map(s => s.objectiveId))].sort(cmp) });
          added++; changed = true;
        }
        if (!changed) break;
      }
      return added;
    };
    const directTarget = Math.round(quizSize * 0.6), relatedTarget = Math.round(quizSize * 0.25), spacedTarget = quizSize - directTarget - relatedTarget;
    const targets = [
      [weakGroups, 'direct-remediation', directTarget], [weakGroups, 'related-concept-reinforcement', relatedTarget], [correctGroups, 'spaced-review', spacedTarget],
    ];
    for (const [groups, category, target] of targets) {
      const added = take(groups, category, target);
      if (added < target) shortages.push({ examId: code, category, requested: target, selectedAtTarget: added, reason: 'insufficient-relevant-bank-or-observed-evidence' });
    }
    // Redistribute only within evidenced concepts/objectives/topics, never unrelated filler.
    take(weakGroups, 'direct-remediation', quizSize - selections.length);
    take(correctGroups, 'spaced-review', quizSize - selections.length);
    for (const sources of weakGroups) {
      const scoped = pool.filter(candidate => sources[0].objectiveId ? candidate.objectives.get(code).includes(sources[0].objectiveId) : candidate.question.topicId === sources[0].topicId);
      const alternatives = new Set(scoped.filter(candidate => !sources.some(s => s.questionId === candidate.question.id)).map(c => sameWording(c.question.prompt)));
      if (alternatives.size < 3) shortages.push({ examId: code, objectiveId: sources[0].objectiveId, topicId: sources[0].topicId,
        availableQuestions: new Set(scoped.map(c => sameWording(c.question.prompt))).size,
        availableAlternatives: alternatives.size, desiredMinimum: 3, reason: 'limited-contrast-pool' });
    }
    if (selections.length < quizSize) shortages.push({ examId: code, requested: quizSize, selected: selections.length, reason: 'insufficient-relevant-unique-wording' });
    const questions = selections.map(s => {
      const q = index.bank.get(s.questionId).question;
      // Explicit Question allowlist: never spread arbitrary metadata or learner values.
      return { id: q.id, topicId: q.topicId, examCodes: [...index.bank.get(q.id).codes], prompt: q.prompt,
        choices: [...q.choices], answer: structuredClone(q.answer), explanation: q.explanation,
        ...(q.objectiveIds ? { objectiveIds: Object.fromEntries([...index.bank.get(q.id).objectives].filter(([id]) => Array.isArray(q.objectiveIds[id]))) } : {}) };
    });
    // Existing QuizRunner draws at most 15. Larger plans need separate controlled
    // pools rather than one link that would silently omit the remaining questions.
    const learnerQuizPaths = [];
    for (let i = 0; i < questions.length; i += 15) {
      learnerQuizPaths.push(`/quiz?exam=${encodeURIComponent(code)}&questions=${questions.slice(i, i + 15).map(q => encodeURIComponent(q.id)).join(',')}`);
    }
    plans.push({ examId: code, certification: index.exams.get(code).name, requestedSize: quizSize, questions, selections,
      learnerQuizPath: learnerQuizPaths.length === 1 ? learnerQuizPaths[0] : null, learnerQuizPaths, maxQuestionsPerExistingQuiz: 15 });
  }
  return { internalAnswerKey: true, bankPolicy: 'Authored bank with structural validation; not an independent exam-fact verification.',
    mixTargets: { directRemediation: 0.6, relatedReinforcement: 0.25, spacedReview: 0.15 }, rejectedBankQuestions: index.rejectedQuestions, plans, shortages };
}

export function summaryMarkdown(summary, quiz) {
  const top = summary.objectives.filter(o => o.weaknessScore > 0).slice(0, 8);
  const list = values => values.length ? values.map(v => `- ${v}`).join('\n') : '- None in retained evidence.';
  return `# Local learner remediation\n\nWindow: ${summary.window.start} — ${summary.window.end}\n\n`
    + `Retained evidence only; no readiness or global mastery claim. Answer keys stay in the private JSON plan.\n\n`
    + `## Top weak objectives\n\n${list(top.map(o => `${o.examId} / ${o.objectiveId}: score ${o.weaknessScore}; ${o.incorrect} incorrect / ${o.attempts} attempts`))}\n\n`
    + `## Repeated misses\n\n${list(summary.repeatedMisses.map(q => `${q.examId} / ${q.questionId}`))}\n\n`
    + `## Recently improved\n\n${list(summary.recentlyImproved.map(q => `${q.examId} / ${q.questionId}`))}\n\n`
    + `## Recently mastered candidates\n\nAt least three observed correct answers and no observed miss in this window; not proof of mastery.\n\n${list(summary.recentlyMasteredCandidates.map(q => `${q.examId} / ${q.questionId}`))}\n\n`
    + `## Content / evidence shortages\n\n${list(quiz.shortages.map(s => `${s.examId}${s.objectiveId ? ` / ${s.objectiveId}` : ''}: ${s.reason}; available ${s.availableAlternatives ?? s.selected ?? s.selectedAtTarget}, target ${s.desiredMinimum ?? s.requested}`))}\n\n`
    + `## Recommended next quiz focus\n\n${list(quiz.plans.map(p => `${p.examId}: ${p.questions.length}/${p.requestedSize} relevant questions. ${p.learnerQuizPaths.join(' ; ') || 'No relevant questions available.'}`))}\n\n`
    + `## Scoring\n\n${summary.formula}\n\nEvidence policy: ${summary.evidencePolicy}.\n`;
}
