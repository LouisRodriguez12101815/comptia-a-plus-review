import type { ClfAssessmentSnapshot, MockAttempt, Progress, QuizAttempt } from "@/lib/progress";
import type { StoredSchedule } from "@/lib/study/schedule";

const reviewedAt = (s: StoredSchedule | undefined) => {
  const t = s?.last_review ? Date.parse(s.last_review) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

function unionAttempts<T extends { at: number }>(a: T[], b: T[], key: (x: T) => string, max: number, keep?: (primary: T, secondary: T) => T): T[] {
  const seen = new Map<string, T>();
  for (const item of [...a, ...b]) {
    const id = key(item);
    const previous = seen.get(id);
    if (!previous) seen.set(id, item);
    else if (keep) seen.set(id, keep(previous, item));
  }
  return [...seen.values()].sort((x, y) => y.at - x.at).slice(0, max);
}

/** Local seconds win for a question. Seconds that exist only on the other copy are kept. */
function keepSeconds<T extends { secondsByQuestion?: Record<string, number> }>(primary: T, secondary: T): T {
  const seconds: Record<string, number> = {};
  for (const source of [secondary.secondsByQuestion, primary.secondsByQuestion]) {
    if (!source) continue;
    for (const [id, value] of Object.entries(source)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) seconds[id] = value;
    }
  }
  if (!Object.keys(seconds).length) return primary;
  return { ...primary, secondsByQuestion: seconds };
}

/** Missed drill cues kept from a sync. Local ids are kept first, then remote ids, until this cap. */
export const DRILL_MISSED_CAP = 200;

function mergeMemoryGames(local: Progress["memoryGames"], remote: Progress["memoryGames"]) {
  if (!local && !remote) return undefined;
  const left = local ?? { streak: 0, bestMs: {} };
  const right = remote ?? { streak: 0, bestMs: {} };
  const bestMs: Record<string, number> = {};
  for (const [id, ms] of Object.entries({ ...right.bestMs, ...left.bestMs })) {
    const other = id in left.bestMs && id in right.bestMs ? Math.min(left.bestMs[id], right.bestMs[id]) : ms;
    if (Number.isFinite(other) && other >= 0) bestMs[id] = other;
  }
  const lastMixDay = [left.lastMixDay, right.lastMixDay].filter((day): day is string => typeof day === "string" && day.length > 0).sort().at(-1);
  return { streak: Math.max(left.streak, right.streak), bestMs, ...(lastMixDay ? { lastMixDay } : {}) };
}

function mergeDrillPractice(local: Progress["drillPractice"], remote: Progress["drillPractice"]) {
  if (!local && !remote) return undefined;
  const left = local ?? { missedIds: [], bestStreak: 0 };
  const right = remote ?? { missedIds: [], bestStreak: 0 };
  const missedIds: string[] = [];
  const seen = new Set<string>();
  for (const id of [...left.missedIds, ...right.missedIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    missedIds.push(id);
    if (missedIds.length === DRILL_MISSED_CAP) break;
  }
  const decks: NonNullable<NonNullable<Progress["drillPractice"]>["decks"]> = {};
  for (const [id, row] of [...Object.entries(right.decks ?? {}), ...Object.entries(left.decks ?? {})]) {
    const previous = decks[id] ?? { bestScore: 0, bestStreak: 0 };
    decks[id] = {
      bestScore: Math.max(previous.bestScore, row.bestScore),
      bestStreak: Math.max(previous.bestStreak, row.bestStreak),
    };
  }
  return {
    missedIds,
    bestStreak: Math.max(left.bestStreak, right.bestStreak),
    ...(Object.keys(decks).length ? { decks } : {}),
  };
}

/**
 * Combine two copies of one learner's progress. The newest review of each card wins,
 * attempts are combined without duplicates, and nothing is ever dropped silently
 * except by the existing caps (40 quizzes, 30 mock exams, 200 missed drill cues).
 * Best scores and streaks take the max. A best time is the lower millisecond count.
 * `lastMixDay` takes the later date. `local` wins schedule ties.
 * A shared sitting keeps per-question seconds from either copy; local seconds win when both recorded one.
 */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const schedules: Record<string, StoredSchedule> = { ...remote.schedules };
  for (const [id, s] of Object.entries(local.schedules)) {
    if (!schedules[id] || reviewedAt(s) >= reviewedAt(schedules[id])) schedules[id] = s;
  }
  const knownCards: Record<string, boolean> = {};
  const unknownCards: Record<string, boolean> = {};
  const ids = new Set([...Object.keys(local.knownCards), ...Object.keys(local.unknownCards), ...Object.keys(remote.knownCards), ...Object.keys(remote.unknownCards)]);
  for (const id of ids) {
    const localHas = id in local.knownCards || id in local.unknownCards;
    const remoteHas = id in remote.knownCards || id in remote.unknownCards;
    let side = local;
    if (!localHas && remoteHas) side = remote;
    else if (localHas && remoteHas && reviewedAt(remote.schedules[id]) > reviewedAt(local.schedules[id])) side = remote;
    if (id in side.knownCards) knownCards[id] = true;
    else if (id in side.unknownCards) unknownCards[id] = true;
  }
  const memoryGames = mergeMemoryGames(local.memoryGames, remote.memoryGames);
  const drillPractice = mergeDrillPractice(local.drillPractice, remote.drillPractice);
  return {
    studyFocus: local.studyFocus,
    knownCards,
    unknownCards,
    schedules,
    quizAttempts: unionAttempts<QuizAttempt>(local.quizAttempts, remote.quizAttempts, (q) => `${q.at}:${q.topicId}`, 40, keepSeconds),
    mockAttempts: unionAttempts<MockAttempt>(local.mockAttempts, remote.mockAttempts, (m) => `${m.at}:${m.exam}`, 30, keepSeconds),
    ...((local.clfAssessmentSnapshots?.length || remote.clfAssessmentSnapshots?.length) ? { clfAssessmentSnapshots: unionAttempts<ClfAssessmentSnapshot>(local.clfAssessmentSnapshots ?? [], remote.clfAssessmentSnapshots ?? [], (snapshot) => snapshot.id, 20) } : {}),
    ...(memoryGames ? { memoryGames } : {}),
    ...(drillPractice ? { drillPractice } : {}),
  };
}
