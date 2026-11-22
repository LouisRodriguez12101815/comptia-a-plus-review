import type { Progress } from "@/lib/progress";

export type CaptureRow = {
  kind: "quiz" | "mock" | "sitting";
  sittingId?: string;
  startedAt: number | null;
  finishedAt: number;
  syncedAt: string | null;
  delayMs: number | null;
  /** stamped: serverSeenAt. before: stored before per-test tracking. pending: still only on this device. */
  sync: "stamped" | "before" | "pending";
};

type StoredAttempt = {
  exam?: string;
  at: number;
  startedAt?: number;
  sittingId?: string;
  serverSeenAt?: string;
};

function inWindow(at: number, window: { start: string; end: string }): boolean {
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  return Number.isFinite(at) && at >= start && at <= end;
}

function serverSeen(value: string | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value ? value : null;
}

function row(kind: CaptureRow["kind"], attempt: StoredAttempt, pending: boolean, sittingId?: string): CaptureRow {
  const stamped = serverSeen(attempt.serverSeenAt);
  const syncedAt = pending || !stamped ? null : stamped;
  const syncedMs = syncedAt ? Date.parse(syncedAt) : NaN;
  return {
    kind,
    ...(sittingId ? { sittingId } : {}),
    startedAt: attempt.startedAt ?? null,
    finishedAt: attempt.at,
    syncedAt,
    delayMs: Number.isFinite(syncedMs) ? syncedMs - attempt.at : null,
    sync: pending ? "pending" : stamped ? "stamped" : "before",
  };
}

function sittingRow(mock: StoredAttempt, quiz: StoredAttempt, pending: boolean): CaptureRow {
  const stamps = [serverSeen(mock.serverSeenAt), serverSeen(quiz.serverSeenAt)].filter((value): value is string => value !== null).sort();
  const syncedAt = pending || stamps.length === 0 ? null : stamps[0];
  const syncedMs = syncedAt ? Date.parse(syncedAt) : NaN;
  const started = [mock.startedAt, quiz.startedAt].filter((value): value is number => typeof value === "number");
  return {
    kind: "sitting",
    sittingId: mock.sittingId,
    startedAt: started.length ? Math.min(...started) : null,
    finishedAt: Math.max(mock.at, quiz.at),
    syncedAt,
    delayMs: Number.isFinite(syncedMs) ? syncedMs - Math.max(mock.at, quiz.at) : null,
    sync: pending ? "pending" : stamps.length ? "stamped" : "before",
  };
}

function collapse(
  progress: { quizAttempts?: StoredAttempt[]; mockAttempts?: StoredAttempt[] },
  exam: string,
  window: { start: string; end: string },
  pending: boolean,
): CaptureRow[] {
  const quizzes = (progress.quizAttempts ?? []).filter((attempt) => attempt.exam === exam && inWindow(attempt.at, window));
  const mocks = (progress.mockAttempts ?? []).filter((attempt) => attempt.exam === exam && inWindow(attempt.at, window));
  const paired = new Set<StoredAttempt>();
  const rows: CaptureRow[] = [];
  for (const mock of mocks) {
    const matches = mock.sittingId ? quizzes.filter((quiz) => quiz.sittingId === mock.sittingId) : [];
    if (mock.sittingId && matches.length) {
      for (const quiz of matches) paired.add(quiz);
      rows.push(sittingRow(mock, matches[0], pending));
      continue;
    }
    rows.push(row("mock", mock, pending, mock.sittingId));
  }
  for (const quiz of quizzes) {
    if (paired.has(quiz)) continue;
    rows.push(row("quiz", quiz, pending, quiz.sittingId));
  }
  return rows.sort((a, b) => b.finishedAt - a.finishedAt || (a.kind < b.kind ? -1 : 1));
}

/** Quizzes, mocks, and timed sittings. Synced at is the attempt's serverSeenAt. */
export function attemptCaptures(
  progress: { quizAttempts?: Progress["quizAttempts"]; mockAttempts?: Progress["mockAttempts"] },
  exam: string,
  window: { start: string; end: string },
): CaptureRow[] {
  return collapse(progress, exam, window, false);
}

/** Finished local tests that are not in the synced list. */
export function unsyncedCaptures(
  progress: Progress,
  synced: CaptureRow[],
  exam: string,
  window: { start: string; end: string },
): CaptureRow[] {
  const seen = new Map<string, number>();
  for (const item of synced) {
    const key = item.sittingId ? `sitting:${item.sittingId}` : `${item.kind}:${item.finishedAt}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const extra: CaptureRow[] = [];
  for (const item of collapse(progress, exam, window, true)) {
    const key = item.sittingId ? `sitting:${item.sittingId}` : `${item.kind}:${item.finishedAt}`;
    const left = seen.get(key) ?? 0;
    if (left > 0) {
      seen.set(key, left - 1);
      continue;
    }
    extra.push(item);
  }
  return extra.sort((a, b) => b.finishedAt - a.finishedAt);
}

export function captureLine(row: CaptureRow): string {
  const started = row.startedAt === null ? "start not recorded" : new Date(row.startedAt).toISOString();
  const synced = row.sync === "before" ? "before tracking" : row.syncedAt === null ? "not synced yet" : row.syncedAt;
  const delay = row.delayMs === null ? "" : ` delay ${Math.round(row.delayMs / 1000)}s`;
  return `${row.kind} started ${started} finished ${new Date(row.finishedAt).toISOString()} synced ${synced}${delay}`;
}
