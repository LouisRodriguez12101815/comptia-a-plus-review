/** First-attempt outcomes and mock seen-shares derived from synced sittings. */

export const FIRST_SEEN_CAP = 4000;

export type FirstExposure = { exam: string; correct: boolean; at: number };

export type ExposureAttempt = {
  exam?: string;
  at: number;
  questionIds?: string[];
  missedIds?: string[];
  seenShare?: number;
};

export type ExposureProgress = {
  firstSeen?: Record<string, FirstExposure>;
  quizAttempts?: ExposureAttempt[];
  mockAttempts?: ExposureAttempt[];
};

export function validSeenShare(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

export function trimFirstSeen(ledger: Record<string, FirstExposure>): Record<string, FirstExposure> {
  const entries = Object.entries(ledger);
  if (entries.length <= FIRST_SEEN_CAP) return ledger;
  entries.sort((a, b) => a[1].at - b[1].at || a[0].localeCompare(b[0]));
  return Object.fromEntries(entries.slice(0, FIRST_SEEN_CAP));
}

/** Question ids already shown for this exam. SAA includes quizzes. An `at` keeps only earlier sittings. */
export function seenQuestionIds(progress: ExposureProgress, exam: string, beforeAt?: number): Set<string> {
  const ids = new Set<string>();
  const take = (attempt: ExposureAttempt) => {
    if (attempt.exam !== exam) return;
    if (beforeAt !== undefined && !(attempt.at < beforeAt)) return;
    for (const id of attempt.questionIds ?? []) ids.add(id);
  };
  if (exam === "saa-c03") for (const attempt of progress.quizAttempts ?? []) take(attempt);
  for (const attempt of progress.mockAttempts ?? []) take(attempt);
  return ids;
}

/** Share of this mock's questions that were already seen, as an integer percent. */
export function shareForMock(progress: ExposureProgress, exam: string, questionIds: string[], beforeAt?: number): number | null {
  if (!questionIds.length) return null;
  const seen = seenQuestionIds(progress, exam, beforeAt);
  const already = questionIds.filter((id) => seen.has(id)).length;
  return Math.round((100 * already) / questionIds.length);
}

function seedFirstSeen(progress: ExposureProgress): Record<string, FirstExposure> {
  const attempts = [...(progress.quizAttempts ?? []), ...(progress.mockAttempts ?? [])]
    .filter((attempt) => attempt.exam && attempt.questionIds?.length)
    .sort((a, b) => a.at - b.at);
  const ledger: Record<string, FirstExposure> = {};
  for (const attempt of attempts) {
    const missed = new Set(attempt.missedIds ?? []);
    for (const id of attempt.questionIds ?? []) {
      const key = `${attempt.exam}:${id}`;
      if (ledger[key]) continue;
      ledger[key] = { exam: attempt.exam as string, correct: !missed.has(id), at: attempt.at };
    }
  }
  return trimFirstSeen(ledger);
}

/** Add this sitting's first exposures. An existing earlier outcome stays. */
export function extendFirstSeen(progress: ExposureProgress, attempt: ExposureAttempt): Record<string, FirstExposure> | undefined {
  const base = progress.firstSeen ?? seedFirstSeen(progress);
  if (!attempt.exam || !attempt.questionIds?.length) return Object.keys(base).length ? base : progress.firstSeen;
  const missed = new Set(attempt.missedIds ?? []);
  const next = { ...base };
  for (const id of attempt.questionIds) {
    const key = `${attempt.exam}:${id}`;
    const previous = next[key];
    if (previous && previous.at <= attempt.at) continue;
    next[key] = { exam: attempt.exam, correct: !missed.has(id), at: attempt.at };
  }
  return trimFirstSeen(next);
}

export function firstAttemptSummary(progress: ExposureProgress, exam: string, start: number, end: number) {
  const ledger = mergeFirstSeen(seedFirstSeen(progress), progress.firstSeen) ?? {};
  const rows = Object.values(ledger).filter((row) => row.exam === exam && row.at >= start && row.at <= end);
  const correct = rows.filter((row) => row.correct).length;
  const total = rows.length;
  return { correct, total, accuracy: total ? Math.round((correct / total) * 1000) / 1000 : null };
}

/** Stored seen-share wins. Older mocks without one are computed from the sittings still in the payload. */
export function mockSeenByTimestamp(progress: ExposureProgress, exam: string, start: number, end: number): Map<string, number> {
  const shares = new Map<string, number>();
  for (const mock of progress.mockAttempts ?? []) {
    if (mock.exam !== exam || mock.at < start || mock.at > end) continue;
    const share = validSeenShare(mock.seenShare)
      ? mock.seenShare
      : shareForMock(progress, exam, mock.questionIds ?? [], mock.at);
    if (share === null) continue;
    shares.set(new Date(mock.at).toISOString(), share);
  }
  return shares;
}

export function mergeFirstSeen(
  local: Record<string, FirstExposure> | undefined,
  remote: Record<string, FirstExposure> | undefined,
): Record<string, FirstExposure> | undefined {
  if (!local && !remote) return undefined;
  const merged: Record<string, FirstExposure> = { ...(remote ?? {}) };
  for (const [key, row] of Object.entries(local ?? {})) {
    const other = merged[key];
    if (!other || row.at <= other.at) merged[key] = row;
  }
  const trimmed = trimFirstSeen(merged);
  return Object.keys(trimmed).length ? trimmed : undefined;
}
