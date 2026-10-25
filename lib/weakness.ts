/*
 * Per-objective results from saved timed tests. Everything is derived from the
 * question IDs each sitting showed and the ones it missed, so no extra state is
 * stored. Only questions the learner reached count; unreached timed-out
 * questions are left out.
 */
import type { ExamPool } from "@/lib/exam-test.mjs";
import type { MockAttempt } from "@/lib/progress";

export type ObjectiveStatus = "untested" | "few" | "weak" | "ok" | "strong";

export type ObjectiveStat = {
  id: string;
  title: string;
  domainId: string;
  domainTitle: string;
  /** Questions answered for this objective across all sittings. */
  answered: number;
  correct: number;
  /** Accuracy over the last RECENT answers, 0 to 100, or null when none. */
  recent: number | null;
  /** Last 5 answers compared with the 5 before them. */
  trend: "up" | "down" | "flat" | null;
  status: ObjectiveStatus;
};

const RECENT = 10;
const MIN_ANSWERS = 3;
export const WEAK_BELOW = 70;
export const STRONG_FROM = 85;

function percent(outcomes: boolean[]): number | null {
  return outcomes.length ? Math.round((100 * outcomes.filter(Boolean).length) / outcomes.length) : null;
}

export function objectiveStats(pool: ExamPool, attempts: MockAttempt[], exam: string): ObjectiveStat[] {
  const oldestFirst = attempts.filter((attempt) => attempt.exam === exam).slice().sort((a, b) => a.at - b.at);
  const stats: ObjectiveStat[] = [];
  for (const domain of pool.domains) {
    for (const objective of domain.objectives) {
      const ids = new Set(objective.questionIds);
      // Keep the order answers were given across sittings, not per question.
      const outcomes: boolean[] = [];
      for (const attempt of oldestFirst) {
        const missed = new Set(attempt.missedIds);
        for (const id of attempt.questionIds ?? []) {
          // Newer sittings record the objective each question was drawn for; older ones
          // fall back to every objective whose topics include the question.
          const drawnFor = attempt.objectiveByQuestion?.[id];
          if (drawnFor ? drawnFor === objective.id : ids.has(id)) outcomes.push(!missed.has(id));
        }
      }
      const answered = outcomes.length;
      const correct = outcomes.filter(Boolean).length;
      const recent = percent(outcomes.slice(-RECENT));
      const last5 = percent(outcomes.slice(-5));
      const before5 = percent(outcomes.slice(-10, -5));
      const trend = last5 === null || before5 === null || outcomes.length < 8 ? null
        : last5 - before5 >= 15 ? "up" : before5 - last5 >= 15 ? "down" : "flat";
      const status: ObjectiveStatus = answered === 0 ? "untested"
        : answered < MIN_ANSWERS ? "few"
        : (recent ?? 0) < WEAK_BELOW ? "weak"
        : (recent ?? 0) < STRONG_FROM ? "ok" : "strong";
      stats.push({ id: objective.id, title: objective.title, domainId: domain.id, domainTitle: domain.title, answered, correct, recent, trend, status });
    }
  }
  return stats;
}

/** The objectives to practise next: weak ones first (lowest accuracy), then middling ones. */
export function weakestObjectives(stats: ObjectiveStat[], limit = 5): ObjectiveStat[] {
  const rank = (s: ObjectiveStat) => (s.status === "weak" ? 0 : s.status === "ok" ? 1 : 2);
  return stats
    .filter((s) => s.status === "weak" || s.status === "ok")
    .sort((a, b) => rank(a) - rank(b) || (a.recent ?? 0) - (b.recent ?? 0) || b.answered - a.answered)
    .slice(0, limit);
}

const DAY = 86_400_000;

export type DueReview = { questionId: string; objectiveId?: string; dueAt: number };

/**
 * Missed questions that are due to come back. A miss schedules the question for
 * 1 day later. Answering it correctly then schedules one more look 3 days later,
 * and a second correct answer ends the schedule. Any miss starts it again.
 * Returns the due ones, most overdue first.
 */
export function dueReviews(attempts: MockAttempt[], exam: string, now: number): DueReview[] {
  const state = new Map<string, { step: 0 | 1 | 2; dueAt: number; objectiveId?: string }>();
  const oldestFirst = attempts.filter((attempt) => attempt.exam === exam).slice().sort((a, b) => a.at - b.at);
  for (const attempt of oldestFirst) {
    const missed = new Set(attempt.missedIds);
    for (const id of attempt.questionIds ?? []) {
      const objectiveId = attempt.objectiveByQuestion?.[id];
      const current = state.get(id) ?? { step: 0, dueAt: 0 };
      if (missed.has(id)) state.set(id, { step: 1, dueAt: attempt.at + DAY, objectiveId });
      else if (current.step === 1) state.set(id, { step: 2, dueAt: attempt.at + 3 * DAY, objectiveId });
      else if (current.step === 2) state.set(id, { step: 0, dueAt: 0, objectiveId });
    }
  }
  return [...state.entries()]
    .filter(([, s]) => s.step > 0 && s.dueAt <= now)
    .map(([questionId, s]) => ({ questionId, objectiveId: s.objectiveId, dueAt: s.dueAt }))
    .sort((a, b) => a.dueAt - b.dueAt);
}

export type ConfidenceCounts = { sureWrong: number; guessRight: number };

/**
 * Per objective, how often an answer marked "sure" was wrong (a likely
 * misconception) and how often one marked "guessing" was right (luck to review).
 */
export function confidenceByObjective(pool: ExamPool, attempts: MockAttempt[], exam: string): Map<string, ConfidenceCounts> {
  const counts = new Map<string, ConfidenceCounts>();
  const objectivesFor = new Map<string, string[]>();
  for (const domain of pool.domains) {
    for (const objective of domain.objectives) {
      for (const id of objective.questionIds) objectivesFor.set(id, [...(objectivesFor.get(id) ?? []), objective.id]);
    }
  }
  for (const attempt of attempts.filter((a) => a.exam === exam)) {
    const missed = new Set(attempt.missedIds);
    const sure = new Set(attempt.sureIds ?? []);
    const guessed = new Set(attempt.guessedIds ?? []);
    for (const id of attempt.questionIds ?? []) {
      const sureWrong = sure.has(id) && missed.has(id);
      const guessRight = guessed.has(id) && !missed.has(id);
      if (!sureWrong && !guessRight) continue;
      const drawnFor = attempt.objectiveByQuestion?.[id];
      for (const objectiveId of drawnFor ? [drawnFor] : objectivesFor.get(id) ?? []) {
        const c = counts.get(objectiveId) ?? { sureWrong: 0, guessRight: 0 };
        if (sureWrong) c.sureWrong += 1;
        if (guessRight) c.guessRight += 1;
        counts.set(objectiveId, c);
      }
    }
  }
  return counts;
}
