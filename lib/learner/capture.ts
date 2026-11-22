import type { Progress } from "@/lib/progress";

export type CaptureRow = {
  kind: "quiz" | "mock";
  startedAt: number | null;
  finishedAt: number;
  syncedAt: string | null;
  delayMs: number | null;
};

type SyncItem = { key: string; dateUpdated?: string | null };

function iso(value: string | null | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

/** dateUpdated on the Sync item that holds the progress snapshot. Twilio sets this; we do not. */
export function progressSyncedAt(items: SyncItem[]): string | null {
  const head = items.find((item) => item.key === "progress-head");
  if (head) return iso(head.dateUpdated);
  const legacy = items.find((item) => item.key === "progress");
  if (legacy) return iso(legacy.dateUpdated);
  const chunks = items.filter((item) => /^progress-\d+$/.test(item.key));
  const newest = chunks
    .map((item) => iso(item.dateUpdated))
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);
  return newest ?? null;
}

function inWindow(at: number, window: { start: string; end: string }): boolean {
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  return Number.isFinite(at) && at >= start && at <= end;
}

function row(kind: CaptureRow["kind"], startedAt: number | null, finishedAt: number, syncedAt: string | null): CaptureRow {
  const syncedMs = syncedAt ? Date.parse(syncedAt) : NaN;
  return {
    kind,
    startedAt,
    finishedAt,
    syncedAt,
    delayMs: Number.isFinite(syncedMs) ? syncedMs - finishedAt : null,
  };
}

/** Quizzes and mocks stored in the synced snapshot. A missing Sync date means the row is not yet proven. */
export function attemptCaptures(
  progress: { quizAttempts?: Progress["quizAttempts"]; mockAttempts?: Progress["mockAttempts"] },
  exam: string,
  window: { start: string; end: string },
  syncedAt: string | null,
): CaptureRow[] {
  const rows: CaptureRow[] = [];
  for (const attempt of progress.quizAttempts ?? []) {
    if (attempt.exam !== exam || !inWindow(attempt.at, window)) continue;
    rows.push(row("quiz", attempt.startedAt ?? null, attempt.at, syncedAt));
  }
  for (const attempt of progress.mockAttempts ?? []) {
    if (attempt.exam !== exam || !inWindow(attempt.at, window)) continue;
    rows.push(row("mock", attempt.startedAt ?? null, attempt.at, syncedAt));
  }
  return rows.sort((a, b) => b.finishedAt - a.finishedAt || (a.kind < b.kind ? -1 : 1));
}

/** Finished local tests that are not in the synced list. */
export function unsyncedCaptures(
  progress: Progress,
  synced: CaptureRow[],
  exam: string,
  window: { start: string; end: string },
): CaptureRow[] {
  const seen = new Map<string, number>();
  for (const row of synced) seen.set(`${row.kind}:${row.finishedAt}`, (seen.get(`${row.kind}:${row.finishedAt}`) ?? 0) + 1);
  const extra: CaptureRow[] = [];
  const take = (kind: CaptureRow["kind"], startedAt: number | undefined, finishedAt: number) => {
    const key = `${kind}:${finishedAt}`;
    const left = seen.get(key) ?? 0;
    if (left > 0) {
      seen.set(key, left - 1);
      return;
    }
    extra.push(row(kind, startedAt ?? null, finishedAt, null));
  };
  for (const attempt of progress.quizAttempts) {
    if (attempt.exam !== exam || !inWindow(attempt.at, window)) continue;
    take("quiz", attempt.startedAt, attempt.at);
  }
  for (const attempt of progress.mockAttempts) {
    if (attempt.exam !== exam || !inWindow(attempt.at, window)) continue;
    take("mock", attempt.startedAt, attempt.at);
  }
  return extra.sort((a, b) => b.finishedAt - a.finishedAt);
}

export function captureLine(row: CaptureRow): string {
  const started = row.startedAt === null ? "start not recorded" : new Date(row.startedAt).toISOString();
  const synced = row.syncedAt === null ? "not synced yet" : row.syncedAt;
  const delay = row.delayMs === null ? "" : ` delay ${Math.round(row.delayMs / 1000)}s`;
  return `${row.kind} started ${started} finished ${new Date(row.finishedAt).toISOString()} synced ${synced}${delay}`;
}
