import type { Question } from "@/lib/types";

/** This site's practice target. It is not an AWS passing score. */
export const SAA_PRACTICE_TARGET = 80;

export type AnsweredAttempt = {
  exam?: string;
  at?: number;
  questionIds?: string[];
  missedIds?: string[];
  wrongChoices?: Record<string, number>;
  selectedChoices?: Record<string, number | number[]>;
  answeredIds?: string[];
  correctIds?: string[];
};

export type AnsweredOutcome = { id: string; correct: boolean };

export type DomainSummary = {
  id: string;
  title: string;
  correct: number;
  answered: number;
  percent: number;
  sittings: number;
  weak: boolean;
};

/**
 * Questions with a recorded answer. Unshown ids and misses with no recorded choice
 * are left out, so an abandoned sitting cannot be scored as correct.
 */
export function answeredOutcomes(attempt: AnsweredAttempt): AnsweredOutcome[] {
  const shown = attempt.questionIds ?? [];
  const shownSet = new Set(shown);
  const missed = new Set(attempt.missedIds ?? []);
  const inScope = (id: string) => shownSet.size === 0 || shownSet.has(id);

  if (Array.isArray(attempt.answeredIds)) {
    return attempt.answeredIds.filter(inScope).map((id) => ({ id, correct: !missed.has(id) }));
  }
  if (attempt.selectedChoices) {
    return Object.keys(attempt.selectedChoices).filter(inScope).map((id) => ({ id, correct: !missed.has(id) }));
  }
  if (Array.isArray(attempt.correctIds)) {
    const wrong = new Set(Object.keys(attempt.wrongChoices ?? {}));
    const outcomes: AnsweredOutcome[] = [];
    for (const id of attempt.correctIds) {
      if (!inScope(id) || missed.has(id) || wrong.has(id)) continue;
      outcomes.push({ id, correct: true });
    }
    for (const id of wrong) {
      if (inScope(id)) outcomes.push({ id, correct: false });
    }
    return outcomes;
  }
  if (attempt.wrongChoices) {
    const outcomes: AnsweredOutcome[] = [];
    for (const id of shown) {
      if (attempt.wrongChoices[id] !== undefined) outcomes.push({ id, correct: false });
      else if (!missed.has(id)) outcomes.push({ id, correct: true });
    }
    return outcomes;
  }
  return [];
}

function saaTask(question: Question | undefined): string | undefined {
  const task = question?.objectiveIds?.["saa-c03"]?.[0];
  return typeof task === "string" ? task : undefined;
}

function domainIdForTask(task: string): string {
  return `${task[0]}.0`;
}

export function saaDomainSummary(
  attempts: AnsweredAttempt[],
  questions: Question[],
  domains: { id: string; title: string }[],
): DomainSummary[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const titles = new Map(domains.map((domain) => [domain.id, domain.title]));
  const totals = new Map<string, { correct: number; answered: number; sittings: number }>();

  for (const attempt of attempts) {
    if (attempt.exam !== "saa-c03") continue;
    const seenDomains = new Set<string>();
    for (const outcome of answeredOutcomes(attempt)) {
      const task = saaTask(byId.get(outcome.id));
      if (!task) continue;
      const domainId = domainIdForTask(task);
      const current = totals.get(domainId) ?? { correct: 0, answered: 0, sittings: 0 };
      current.answered += 1;
      if (outcome.correct) current.correct += 1;
      seenDomains.add(domainId);
      totals.set(domainId, current);
    }
    for (const domainId of seenDomains) {
      const current = totals.get(domainId);
      if (current) current.sittings += 1;
    }
  }

  return [...totals.entries()]
    .map(([id, value]) => ({
      id,
      title: titles.get(id) ?? id,
      correct: value.correct,
      answered: value.answered,
      percent: Math.round((100 * value.correct) / value.answered),
      sittings: value.sittings,
      weak: Math.round((100 * value.correct) / value.answered) < SAA_PRACTICE_TARGET,
    }))
    .sort((a, b) => a.percent - b.percent || a.id.localeCompare(b.id));
}

/** Lowest domain percent. With no scored answers, Domain 1. */
export function weakestSaaDomain(
  attempts: AnsweredAttempt[],
  questions: Question[],
  domains: { id: string; title: string }[],
): "D1" | "D2" | "D3" | "D4" {
  const row = saaDomainSummary(attempts, questions, domains)[0];
  const domain = row ? `D${row.id[0]}` : "D1";
  return domain === "D2" || domain === "D3" || domain === "D4" ? domain : "D1";
}

export function nextSaaQuestionIds(
  attempts: AnsweredAttempt[],
  questions: Question[],
  domains: { id: string; title: string }[],
  limit = 10,
): string[] {
  const summary = saaDomainSummary(attempts, questions, domains);
  const weakDomains = new Set(summary.filter((domain) => domain.weak).map((domain) => domain.id));
  if (weakDomains.size === 0) return [];

  const byId = new Map(questions.map((question) => [question.id, question]));
  const saa = questions.filter((question) => question.examCodes?.includes("saa-c03") && saaTask(question));
  const latest = new Map<string, boolean>();
  const taskStats = new Map<string, { correct: number; answered: number }>();

  for (const attempt of [...attempts].sort((a, b) => (a.at ?? 0) - (b.at ?? 0))) {
    if (attempt.exam !== "saa-c03") continue;
    for (const outcome of answeredOutcomes(attempt)) {
      const task = saaTask(byId.get(outcome.id));
      if (!task || !weakDomains.has(domainIdForTask(task))) continue;
      latest.set(outcome.id, outcome.correct);
      const stats = taskStats.get(task) ?? { correct: 0, answered: 0 };
      stats.answered += 1;
      if (outcome.correct) stats.correct += 1;
      taskStats.set(task, stats);
    }
  }

  const tasks = [...taskStats.entries()].sort((a, b) => {
    const aPercent = a[1].answered ? a[1].correct / a[1].answered : 1;
    const bPercent = b[1].answered ? b[1].correct / b[1].answered : 1;
    const aMisses = a[1].answered - a[1].correct;
    const bMisses = b[1].answered - b[1].correct;
    return aPercent - bPercent || bMisses - aMisses || a[0].localeCompare(b[0]);
  }).map(([task]) => task);

  const missed: string[] = [];
  const unseen: string[] = [];
  for (const task of tasks) {
    const inTask = saa.filter((question) => saaTask(question) === task).sort((a, b) => a.id.localeCompare(b.id));
    for (const question of inTask) {
      if (latest.get(question.id) === false) missed.push(question.id);
      else if (!latest.has(question.id)) unseen.push(question.id);
    }
  }
  return [...missed, ...unseen].slice(0, limit);
}

export type UntimedMiss = { id: string; misses: number; latestAt: number };

/** Misses recorded on untimed SAA quizzes. Timed mocks are a separate review. */
export function saaUntimedMisses(attempts: AnsweredAttempt[], questions: Question[]): UntimedMiss[] {
  const saa = new Set(questions.filter((question) => question.examCodes?.includes("saa-c03")).map((question) => question.id));
  const counts = new Map<string, UntimedMiss>();
  for (const attempt of attempts) {
    if (attempt.exam !== "saa-c03") continue;
    const outcomes = new Map(answeredOutcomes(attempt).map((outcome) => [outcome.id, outcome.correct]));
    for (const id of attempt.missedIds ?? []) {
      if (!saa.has(id) || outcomes.get(id) !== false) continue;
      const current = counts.get(id) ?? { id, misses: 0, latestAt: 0 };
      current.misses += 1;
      current.latestAt = Math.max(current.latestAt, attempt.at ?? 0);
      counts.set(id, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.misses - a.misses || b.latestAt - a.latestAt || a.id.localeCompare(b.id));
}
