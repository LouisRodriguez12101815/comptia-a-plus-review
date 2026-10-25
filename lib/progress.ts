import { DEFAULT_STUDY_FOCUS, isStudyFocus } from "@/lib/exams";
import type { StudyFocus } from "@/lib/types";
import { isKnownGrade, reviewCard, type ReviewGrade, type StoredSchedule } from "@/lib/study/schedule";

export type QuizAttempt = {
  topicId: string;
  correct: number;
  total: number;
  /** Question IDs shown in this quiz. Older saved attempts may not have this field. */
  questionIds?: string[];
  missedIds: string[];
  at: number;
};

export type MockDomainResult = {
  id: string;
  title: string;
  correct: number;
  total: number;
};

export type MockAttempt = {
  bankVersion?: string;
  correctIds?: string[];
  multiQuestionIds?: string[];
  exam: string;
  full: boolean;
  correct: number;
  total: number;
  percent: number;
  domains: MockDomainResult[];
  multiCorrect: number;
  multiTotal: number;
  /** Question IDs shown in this sitting. Older saved attempts may not have this field. */
  questionIds?: string[];
  /** The objective each question was drawn for. Older saved attempts may not have this field. */
  objectiveByQuestion?: Record<string, string>;
  /** Questions the learner marked as sure or as a guess before answering. */
  sureIds?: string[];
  guessedIds?: string[];
  missedIds: string[];
  at: number;
};

export type Progress = {
  studyFocus: StudyFocus;
  knownCards: Record<string, boolean>;
  unknownCards: Record<string, boolean>;
  quizAttempts: QuizAttempt[];
  mockAttempts: MockAttempt[];
  /** FSRS schedule per flashcard id (see lib/study/schedule.ts). */
  schedules: Record<string, StoredSchedule>;
};

const KEY = "comptia-a-plus-review-progress-v1";
const listeners = new Set<() => void>();

function createEmptyProgress(): Progress {
  return {
    studyFocus: DEFAULT_STUDY_FOCUS,
    knownCards: {},
    unknownCards: {},
    quizAttempts: [],
    mockAttempts: [],
    schedules: {},
  };
}

/** Why the saved progress could not be used as-is. Shown once on the dashboard. */
export type ProgressProblem = "storageUnavailable" | "unreadable" | "repaired";

const BACKUP_KEY = `${KEY}:unreadable-backup`;
const serverProgress = createEmptyProgress();
let cachedRaw: string | null | undefined;
let cachedProgress = createEmptyProgress();
let problems: ProgressProblem[] = [];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function flags(value: unknown): { value: Record<string, boolean>; repaired: boolean } {
  if (value === undefined) return { value: {}, repaired: false };
  if (!isRecord(value)) return { value: {}, repaired: true };
  const entries = Object.entries(value).filter((entry): entry is [string, true] => entry[1] === true);
  return { value: Object.fromEntries(entries), repaired: entries.length !== Object.keys(value).length };
}

function isAttempt(value: unknown): value is QuizAttempt {
  return isRecord(value) && typeof value.topicId === "string" && Number.isFinite(value.correct) && Number.isFinite(value.total)
    && (value.total as number) > 0 && Array.isArray(value.missedIds) && Number.isFinite(value.at)
    && (value.questionIds === undefined || (Array.isArray(value.questionIds) && value.questionIds.every((id) => typeof id === "string")));
}

/**
 * Question IDs from saved quizzes and timed tests, oldest sitting first, so a new
 * quiz can show questions that have not been seen yet.
 */
export function questionHistory(progress: Progress): string[] {
  return [
    ...progress.quizAttempts.map((attempt) => ({ at: attempt.at, ids: attempt.questionIds ?? [] })),
    ...progress.mockAttempts.map((attempt) => ({ at: attempt.at, ids: attempt.questionIds ?? [] })),
  ]
    .sort((a, b) => a.at - b.at)
    .flatMap((entry) => entry.ids);
}

function isMockDomain(value: unknown): value is MockDomainResult {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string"
    && Number.isFinite(value.correct) && Number.isFinite(value.total) && (value.total as number) > 0;
}

function isMockAttempt(value: unknown): value is MockAttempt {
  return isRecord(value) && typeof value.exam === "string" && typeof value.full === "boolean"
    && Number.isFinite(value.correct) && Number.isFinite(value.total) && Number.isFinite(value.percent)
    && Array.isArray(value.domains) && value.domains.every(isMockDomain)
    && Number.isFinite(value.multiCorrect) && Number.isFinite(value.multiTotal)
    && (value.bankVersion === undefined || typeof value.bankVersion === "string")
    && [value.correctIds, value.multiQuestionIds].every(ids => ids === undefined || (Array.isArray(ids) && ids.every(id => typeof id === "string")))
    && (value.questionIds === undefined || (Array.isArray(value.questionIds) && value.questionIds.every((id) => typeof id === "string")))
    && (value.objectiveByQuestion === undefined || (isRecord(value.objectiveByQuestion) && Object.values(value.objectiveByQuestion).every((id) => typeof id === "string")))
    && [value.sureIds, value.guessedIds].every((ids) => ids === undefined || (Array.isArray(ids) && ids.every((id) => typeof id === "string")))
    && Array.isArray(value.missedIds) && Number.isFinite(value.at);
}

/**
 * Python Class 10 pattern: try the conversion, catch the specific failure, keep what is valid,
 * and report what happened instead of failing silently. Exported for tests.
 */
export function parseProgress(raw: string | null): { progress: Progress; problems: ProgressProblem[] } {
  if (!raw) return { progress: createEmptyProgress(), problems: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { progress: createEmptyProgress(), problems: ["unreadable"] };
  }
  if (!isRecord(parsed)) return { progress: createEmptyProgress(), problems: ["unreadable"] };
  const known = flags(parsed.knownCards), unknown = flags(parsed.unknownCards);
  const attempts = Array.isArray(parsed.quizAttempts) ? parsed.quizAttempts : [];
  const quizAttempts = attempts.filter(isAttempt);
  const rawMockAttempts = Array.isArray(parsed.mockAttempts) ? parsed.mockAttempts : [];
  const mockAttempts = rawMockAttempts.filter(isMockAttempt);
  const schedules = isRecord(parsed.schedules) ? (parsed.schedules as Record<string, StoredSchedule>) : {};
  const repaired = known.repaired || unknown.repaired
    || (parsed.quizAttempts !== undefined && !Array.isArray(parsed.quizAttempts))
    || quizAttempts.length !== attempts.length
    || (parsed.mockAttempts !== undefined && !Array.isArray(parsed.mockAttempts))
    || mockAttempts.length !== rawMockAttempts.length
    || (parsed.schedules !== undefined && !isRecord(parsed.schedules));
  return {
    progress: {
      studyFocus: isStudyFocus(parsed.studyFocus) ? parsed.studyFocus : DEFAULT_STUDY_FOCUS,
      knownCards: known.value,
      unknownCards: unknown.value,
      quizAttempts,
      mockAttempts,
      schedules,
    },
    problems: repaired ? ["repaired"] : [],
  };
}

function readStored(): { raw: string | null; unavailable: boolean } {
  try {
    return { raw: window.localStorage.getItem(KEY), unavailable: false };
  } catch {
    return { raw: null, unavailable: true };
  }
}

export function getProgressSnapshot(): Progress {
  if (typeof window === "undefined") return serverProgress;
  const { raw, unavailable } = readStored();
  if (unavailable) {
    if (!problems.includes("storageUnavailable")) problems = ["storageUnavailable"];
    return cachedProgress;
  }
  if (raw === cachedRaw) return cachedProgress;
  cachedRaw = raw;
  const result = parseProgress(raw);
  if (result.problems.includes("unreadable") && raw) {
    // Keep the bad text so nothing is lost when the next save overwrites the main key.
    try { window.localStorage.setItem(BACKUP_KEY, raw); } catch { /* storage full or blocked: nothing more to do */ }
  }
  problems = result.problems;
  cachedProgress = result.progress;
  return cachedProgress;
}

/** Problems found the last time progress was read or saved. Empty when everything loaded cleanly. */
export function getProgressProblems(): ProgressProblem[] {
  return problems;
}

export function getServerProgressSnapshot(): Progress {
  return serverProgress;
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cachedRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function loadProgress(): Progress {
  return getProgressSnapshot();
}

export function saveProgress(progress: Progress) {
  const raw = JSON.stringify(progress);
  try {
    window.localStorage.setItem(KEY, raw);
    cachedRaw = raw;
  } catch {
    // Private window, blocked or full storage: keep studying in memory and say so.
    problems = ["storageUnavailable"];
  } finally {
    cachedProgress = progress;
    listeners.forEach((listener) => listener());
  }
}

export function setStudyFocus(studyFocus: StudyFocus) {
  const current = loadProgress();
  saveProgress({ ...current, studyFocus });
}

export function markCard(cardId: string, known: boolean) {
  const current = loadProgress();
  const knownCards = { ...current.knownCards };
  const unknownCards = { ...current.unknownCards };
  if (known) {
    knownCards[cardId] = true;
    delete unknownCards[cardId];
  } else {
    unknownCards[cardId] = true;
    delete knownCards[cardId];
  }
  const next = { ...current, knownCards, unknownCards };
  saveProgress(next);
  return next;
}

export function recordQuiz(attempt: Omit<QuizAttempt, "at">) {
  const current = loadProgress();
  const next = {
    ...current,
    quizAttempts: [
      { ...attempt, at: Date.now() },
      ...current.quizAttempts,
    ].slice(0, 40),
  };
  saveProgress(next);
  return next;
}

export function recordMock(attempt: Omit<MockAttempt, "at">) {
  const current = loadProgress();
  const next = {
    ...current,
    mockAttempts: [
      { ...attempt, at: Date.now() },
      ...current.mockAttempts,
    ].slice(0, 30),
  };
  saveProgress(next);
  return next;
}

/** Record a review grade: updates the FSRS schedule and the known/unknown counts. */
export function rateCard(cardId: string, grade: ReviewGrade, now: Date = new Date()) {
  const current = loadProgress();
  const schedules = {
    ...current.schedules,
    [cardId]: reviewCard(current.schedules[cardId], grade, now),
  };
  const next = { ...current, schedules, ...markedCounts(current, cardId, isKnownGrade(grade)) };
  saveProgress(next);
  return next;
}

function markedCounts(current: Progress, cardId: string, known: boolean) {
  const knownCards = { ...current.knownCards };
  const unknownCards = { ...current.unknownCards };
  if (known) {
    knownCards[cardId] = true;
    delete unknownCards[cardId];
  } else {
    unknownCards[cardId] = true;
    delete knownCards[cardId];
  }
  return { knownCards, unknownCards };
}
