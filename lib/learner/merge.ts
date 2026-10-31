import type { MockAttempt, Progress, QuizAttempt } from "@/lib/progress";
import type { StoredSchedule } from "@/lib/study/schedule";

const reviewedAt = (s: StoredSchedule | undefined) => {
  const t = s?.last_review ? Date.parse(s.last_review) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

function unionAttempts<T extends { at: number }>(a: T[], b: T[], key: (x: T) => string, max: number): T[] {
  const seen = new Map<string, T>();
  for (const item of [...a, ...b]) if (!seen.has(key(item))) seen.set(key(item), item);
  return [...seen.values()].sort((x, y) => y.at - x.at).slice(0, max);
}

/**
 * Combine two copies of one learner's progress. The newest review of each card wins,
 * attempts are combined without duplicates, and nothing is ever dropped silently
 * except by the existing caps (40 quizzes, 30 mock exams). `local` wins ties.
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
  return {
    studyFocus: local.studyFocus,
    knownCards,
    unknownCards,
    schedules,
    quizAttempts: unionAttempts<QuizAttempt>(local.quizAttempts, remote.quizAttempts, (q) => `${q.at}:${q.topicId}`, 40),
    mockAttempts: unionAttempts<MockAttempt>(local.mockAttempts, remote.mockAttempts, (m) => `${m.at}:${m.exam}`, 30),
  };
}
