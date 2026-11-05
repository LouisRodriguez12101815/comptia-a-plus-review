/*
 * How well a learner knows one concept, read from their saved quiz and mock attempts.
 * Pure and dependency-free so it can be tested without a browser.
 */
export type ConceptStatus = "untested" | "weak" | "improving" | "solid";

type Attempt = { at: number; questionIds?: string[]; missedIds: string[] };
type Saved = { quizAttempts: Attempt[]; mockAttempts: Attempt[] };

export type ConceptProgress = { status: ConceptStatus; answered: number; correct: number; correctDays: number };

const WEAK_BELOW = 0.7;
const SOLID_FROM = 0.85;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A question counts by its latest answer. A concept is solid only when at least 85% of its answered
 * questions are right now, at least three (or all, for a small concept) have been answered, and correct
 * answers were given on two different days. It is weak below 70%, and improving in between.
 */
export function conceptProgress(questionIds: string[], saved: Saved): ConceptProgress {
  const wanted = new Set(questionIds);
  const latest = new Map<string, { at: number; right: boolean }>();
  const rightDays = new Set<number>();
  const attempts = [...saved.quizAttempts, ...saved.mockAttempts].sort((a, b) => a.at - b.at);
  for (const attempt of attempts) {
    const missed = new Set(attempt.missedIds);
    for (const id of attempt.questionIds ?? []) {
      if (!wanted.has(id)) continue;
      const right = !missed.has(id);
      latest.set(id, { at: attempt.at, right });
      if (right) rightDays.add(Math.floor(attempt.at / DAY_MS));
    }
  }
  const answered = latest.size;
  if (answered === 0) return { status: "untested", answered: 0, correct: 0, correctDays: 0 };
  const correct = [...latest.values()].filter((entry) => entry.right).length;
  const share = correct / answered;
  const enough = answered >= Math.min(3, questionIds.length);
  const status: ConceptStatus = share < WEAK_BELOW ? "weak" : share >= SOLID_FROM && enough && rightDays.size >= 2 ? "solid" : "improving";
  return { status, answered, correct, correctDays: rightDays.size };
}
