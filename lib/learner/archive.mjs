import { CHUNK } from "./progress-snapshot.mjs";

/** Recent window kept on the main snapshot. Older attempts move to archive items. */
export const QUIZ_CAP = 40;
export const MOCK_CAP = 30;

/**
 * One Sync map item must stay under 16 KiB. Archive documents use the same
 * 12,000-byte budget as a progress chunk so a month can be split without
 * approaching that provider limit.
 */
export const ARCHIVE_BYTES = CHUNK;

const KEY = /^archive-(\d{4}-\d{2})(?:-(\d+))?$/;

export function isArchiveKey(key) {
  return parseArchiveKey(key) !== null;
}

function parseArchiveKey(key) {
  const match = KEY.exec(key);
  if (!match) return null;
  const index = match[2] === undefined ? 1 : Number(match[2]);
  if (!Number.isInteger(index) || index < 1 || (match[2] !== undefined && index < 2)) return null;
  return { month: match[1], index };
}

function keyFor(month, index) {
  return index === 1 ? `archive-${month}` : `archive-${month}-${index}`;
}

export function monthOf(at) {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function archiveDoc(data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || data.v !== 1) throw new Error("invalid_progress_archive");
  if (data.quizzes !== undefined && !Array.isArray(data.quizzes)) throw new Error("invalid_progress_archive");
  if (data.mocks !== undefined && !Array.isArray(data.mocks)) throw new Error("invalid_progress_archive");
  return { v: 1, quizzes: data.quizzes ?? [], mocks: data.mocks ?? [] };
}

function byteSize(doc) {
  return Buffer.byteLength(JSON.stringify(doc), "utf8");
}

export function readArchiveItems(items) {
  if (!Array.isArray(items)) throw new Error("invalid_progress_archive");
  const chunks = [];
  for (const item of items) {
    if (!item || typeof item.key !== "string" || !isArchiveKey(item.key)) continue;
    const parsed = parseArchiveKey(item.key);
    const body = archiveDoc(item.data);
    chunks.push({ key: item.key, month: parsed.month, index: parsed.index, quizzes: body.quizzes, mocks: body.mocks });
  }
  return chunks;
}

export function readArchives(items) {
  const chunks = readArchiveItems(items);
  return {
    quizzes: chunks.flatMap((chunk) => chunk.quizzes),
    mocks: chunks.flatMap((chunk) => chunk.mocks),
  };
}

function earlierStamp(left, right) {
  const valid = (value) => (typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value ? value : undefined);
  const a = valid(left);
  const b = valid(right);
  if (a && b) return a <= b ? a : b;
  return a ?? b;
}

function withEarlierStamp(next, previous) {
  const stamp = earlierStamp(next?.serverSeenAt, previous?.serverSeenAt);
  if (!stamp || next?.serverSeenAt === stamp) return next;
  return { ...next, serverSeenAt: stamp };
}

function unionAttempts(primary, extra, keyFn) {
  const seen = new Map();
  for (const item of [...(extra ?? []), ...(primary ?? [])]) {
    if (!item || typeof item !== "object") continue;
    const id = keyFn(item);
    const previous = seen.get(id);
    seen.set(id, previous ? withEarlierStamp(item, previous) : item);
  }
  return [...seen.values()];
}

/** Snapshot attempts plus archive attempts. An attempt stored in both places is kept once. */
export function attachArchives(progress, items) {
  const extra = readArchives(items);
  if (!extra.quizzes.length && !extra.mocks.length) return progress;
  return {
    ...progress,
    quizAttempts: unionAttempts(progress.quizAttempts, extra.quizzes, (attempt) => `${attempt.at}:${attempt.topicId}`),
    mockAttempts: unionAttempts(progress.mockAttempts, extra.mocks, (attempt) => `${attempt.at}:${attempt.exam}`),
  };
}

export function splitRecent(progress) {
  const quizzes = [...(progress.quizAttempts ?? [])].sort((a, b) => b.at - a.at);
  const mocks = [...(progress.mockAttempts ?? [])].sort((a, b) => b.at - a.at);
  return {
    recent: { ...progress, quizAttempts: quizzes.slice(0, QUIZ_CAP), mockAttempts: mocks.slice(0, MOCK_CAP) },
    older: { quizzes: quizzes.slice(QUIZ_CAP), mocks: mocks.slice(MOCK_CAP) },
  };
}

function packAttempts(quizzes, mocks) {
  const chunks = [];
  let keptQuizzes = [];
  let keptMocks = [];
  const flush = () => {
    if (!keptQuizzes.length && !keptMocks.length) return;
    chunks.push({ v: 1, quizzes: keptQuizzes, mocks: keptMocks });
    keptQuizzes = [];
    keptMocks = [];
  };
  const push = (kind, attempt) => {
    const nextQuizzes = kind === "quiz" ? [...keptQuizzes, attempt] : keptQuizzes;
    const nextMocks = kind === "mock" ? [...keptMocks, attempt] : keptMocks;
    if ((keptQuizzes.length || keptMocks.length) && byteSize({ v: 1, quizzes: nextQuizzes, mocks: nextMocks }) > ARCHIVE_BYTES) flush();
    if (kind === "quiz") keptQuizzes = [...keptQuizzes, attempt];
    else keptMocks = [...keptMocks, attempt];
    if (byteSize({ v: 1, quizzes: keptQuizzes, mocks: keptMocks }) > ARCHIVE_BYTES) throw new Error("too_large");
  };
  for (const attempt of quizzes) push("quiz", attempt);
  for (const attempt of mocks) push("mock", attempt);
  flush();
  return chunks;
}

function fillTail(tail, quizzes, mocks) {
  const keptQuizzes = [...tail.quizzes];
  const keptMocks = [...tail.mocks];
  const restQuizzes = [];
  const restMocks = [];
  for (const attempt of quizzes) {
    const trial = { v: 1, quizzes: [...keptQuizzes, attempt], mocks: keptMocks };
    if (byteSize(trial) <= ARCHIVE_BYTES) keptQuizzes.push(attempt);
    else restQuizzes.push(attempt);
  }
  for (const attempt of mocks) {
    const trial = { v: 1, quizzes: keptQuizzes, mocks: [...keptMocks, attempt] };
    if (byteSize(trial) <= ARCHIVE_BYTES) keptMocks.push(attempt);
    else restMocks.push(attempt);
  }
  return {
    tail: { v: 1, quizzes: keptQuizzes, mocks: keptMocks },
    restQuizzes,
    restMocks,
    grew: keptQuizzes.length !== tail.quizzes.length || keptMocks.length !== tail.mocks.length,
  };
}

function attemptKey(kind, attempt) {
  return kind === "quiz" ? `quiz:${attempt.at}:${attempt.topicId}` : `mock:${attempt.at}:${attempt.exam}`;
}

/**
 * Append-only archive writes. Closed chunks are never rewritten. The open
 * tail may gain attempts. An attempt already stored is left where it is.
 */
export function archivePlans(items, older) {
  const chunks = readArchiveItems(items);
  const byMonth = new Map();
  for (const chunk of chunks) {
    const list = byMonth.get(chunk.month) ?? [];
    list.push(chunk);
    byMonth.set(chunk.month, list);
  }
  const freshByMonth = new Map();
  const take = (kind, attempt) => {
    const month = monthOf(attempt.at);
    if (!month) throw new Error("invalid_progress_archive");
    const row = freshByMonth.get(month) ?? { quizzes: [], mocks: [] };
    row[kind].push(attempt);
    freshByMonth.set(month, row);
  };
  for (const attempt of older.quizzes ?? []) take("quizzes", attempt);
  for (const attempt of older.mocks ?? []) take("mocks", attempt);
  const plans = [];
  for (const [month, fresh] of freshByMonth) {
    const existing = (byMonth.get(month) ?? []).slice().sort((a, b) => a.index - b.index);
    const known = new Set();
    for (const chunk of existing) {
      for (const attempt of chunk.quizzes) known.add(attemptKey("quiz", attempt));
      for (const attempt of chunk.mocks) known.add(attemptKey("mock", attempt));
    }
    let quizzes = fresh.quizzes.filter((attempt) => !known.has(attemptKey("quiz", attempt)));
    let mocks = fresh.mocks.filter((attempt) => !known.has(attemptKey("mock", attempt)));
    if (!quizzes.length && !mocks.length) continue;
    let nextIndex = existing.reduce((max, chunk) => Math.max(max, chunk.index), 0) + 1;
    if (existing.length) {
      const tail = existing[existing.length - 1];
      const filled = fillTail(tail, quizzes, mocks);
      if (filled.tail.quizzes.length < tail.quizzes.length || filled.tail.mocks.length < tail.mocks.length) throw new Error("invalid_progress_archive");
      if (filled.grew) plans.push({ key: tail.key, data: filled.tail, replace: true });
      quizzes = filled.restQuizzes;
      mocks = filled.restMocks;
    }
    for (const data of packAttempts(quizzes, mocks)) {
      plans.push({ key: keyFor(month, nextIndex), data, replace: false });
      nextIndex += 1;
    }
  }
  return plans;
}
