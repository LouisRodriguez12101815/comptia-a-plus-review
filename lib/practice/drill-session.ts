/** Timed and lives rules for a drill round. The cue text stays in the deck. */

export const SPEED_MS = 60_000;
export const SURVIVAL_LIVES = 3;

export type SessionKind = "practice" | "speed" | "survival" | "missed";

const SESSION_KINDS: SessionKind[] = ["practice", "speed", "survival", "missed"];

export function sessionKind(value: string | undefined): SessionKind {
  return SESSION_KINDS.includes(value as SessionKind) ? value as SessionKind : "practice";
}

export type DrillSession = {
  kind: SessionKind;
  lives: number;
  combo: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  attempts: number;
  finished: boolean;
  startedAt: number;
};

export function startSession(kind: SessionKind, now: number): DrillSession {
  return {
    kind,
    lives: SURVIVAL_LIVES,
    combo: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    attempts: 0,
    finished: false,
    startedAt: now,
  };
}

export function speedRemaining(session: DrillSession, now: number): number {
  if (session.kind !== "speed") return SPEED_MS;
  return Math.max(0, SPEED_MS - (now - session.startedAt));
}

/** A correct answer raises the combo and adds that many points. A miss resets the combo. Survival loses a life on a miss and ends at 0. */
export function applyResult(session: DrillSession, correct: boolean, now: number): DrillSession {
  if (session.finished) return session;
  if (session.kind === "speed" && speedRemaining(session, now) === 0) {
    return { ...session, finished: true };
  }
  const attempts = session.attempts + 1;
  if (correct) {
    const combo = session.combo + 1;
    const streak = session.streak + 1;
    return {
      ...session,
      attempts,
      correct: session.correct + 1,
      combo,
      streak,
      bestStreak: Math.max(session.bestStreak, streak),
      score: session.score + combo,
    };
  }
  const lives = session.kind === "survival" ? session.lives - 1 : session.lives;
  return {
    ...session,
    attempts,
    combo: 0,
    streak: 0,
    lives,
    finished: session.kind === "survival" && lives <= 0,
  };
}

export function finishForTime(session: DrillSession, now: number): DrillSession {
  if (session.kind === "speed" && speedRemaining(session, now) === 0) return { ...session, finished: true };
  return session;
}
