import { createEmptyProgress as createEmptyProgressValue, parseProgress as parseProgressValue } from "./progress-parser.mjs";
import type { StudyFocus } from "@/lib/types";
import { isKnownGrade, reviewCard, type ReviewGrade, type StoredSchedule } from "@/lib/study/schedule";

export type QuizAttempt = {
  topicId: string;
  correct: number;
  total: number;
  /** Question IDs shown in this quiz. Older saved attempts may not have this field. */
  questionIds?: string[];
  /** Authored choice index for missed single-answer questions. */
  wrongChoices?: Record<string, number>;
  /** Optional future-proof history; multi-select values are retained as complete sets. */
  selectedChoices?: Record<string, number | number[]>;
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
  /** The wrong choice picked (authored index) for each missed single-answer question. */
  wrongChoices?: Record<string, number>;
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

function createEmptyProgress(): Progress { return createEmptyProgressValue() as Progress; }

/** Why the saved progress could not be used as-is. Shown once on the dashboard. */
export type ProgressProblem = "storageUnavailable" | "unreadable" | "repaired";

const BACKUP_KEY = `${KEY}:unreadable-backup`;
const serverProgress = createEmptyProgress();
let cachedRaw: string | null | undefined;
let cachedProgress = createEmptyProgress();
let problems: ProgressProblem[] = [];

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

export function parseProgress(raw: string | null): { progress: Progress; problems: ProgressProblem[] } {
  return parseProgressValue(raw) as { progress: Progress; problems: ProgressProblem[] };
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
