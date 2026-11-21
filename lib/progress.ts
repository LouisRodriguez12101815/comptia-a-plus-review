import { DEFAULT_STUDY_FOCUS, isStudyFocus } from "@/lib/exams";
import type { StudyFocus } from "@/lib/types";
import { rememberMatchMiss, type MemoryMiss } from "@/lib/study/memory-match";
import { isKnownGrade, reviewCard, type ReviewGrade, type StoredSchedule } from "@/lib/study/schedule";
import { requestLearnerFlush } from "@/lib/learner/flush";

export type QuizAttempt = {
  topicId: string;
  /** Exam provenance for newly recorded focused quizzes; absent on legacy records. */
  exam?: string;
  /** Content fingerprint for the exam bank used by this quiz. */
  bankVersion?: string;
  correct: number;
  total: number;
  /** Question IDs shown in this quiz. Older saved attempts may not have this field. */
  questionIds?: string[];
  /** Authored choice index for missed single-answer questions. */
  wrongChoices?: Record<string, number>;
  /** Optional future-proof history; multi-select values are retained as complete sets. */
  selectedChoices?: Record<string, number | number[]>;
  missedIds: string[];
  /** Correct answers marked Unsure or Guess. They still count in `correct`. */
  luckyIds?: string[];
  sureIds?: string[];
  unsureIds?: string[];
  guessedIds?: string[];
  confidenceByQuestion?: Record<string, "sure" | "unsure" | "guess">;
  /** Why a wrong answer was missed. Absent when the learner skipped the tap. */
  missReasons?: Record<string, string>;
  secondsByQuestion?: Record<string, number>;
  sittingId?: string;
  /** quiz, topic, or twin. Timed tests also write a mock row. */
  mode?: string;
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
  unsureIds?: string[];
  luckyIds?: string[];
  confidenceByQuestion?: Record<string, "sure" | "unsure" | "guess">;
  missReasons?: Record<string, string>;
  secondsByQuestion?: Record<string, number>;
  sittingId?: string;
  /** mock or mini. */
  mode?: string;
  /** The wrong choice picked (authored index) for each missed single-answer question. */
  wrongChoices?: Record<string, number>;
  missedIds: string[];
  at: number;
};

export type ClfAssessmentSnapshot = {
  id: string;
  kind: "baseline" | "retest";
  /** Retests must identify the immutable baseline they measure. */
  baselineId?: string;
  at: number;
  bankVersion: string;
  objectives: Record<string, {
    accuracy: number | null;
    distinctQuestions: number;
    evidence: "none" | "limited" | "provisional";
    state: "not-assessed" | "insufficient" | "weak" | "developing" | "strong";
    questionEvidence: { questionId: string; correct: boolean; at: number }[];
  }>;
};

export type Progress = {
  studyFocus: StudyFocus;
  knownCards: Record<string, boolean>;
  unknownCards: Record<string, boolean>;
  quizAttempts: QuizAttempt[];
  mockAttempts: MockAttempt[];
  /** Bounded CLF baseline/retest snapshots; optional for backward compatibility. */
  clfAssessmentSnapshots?: ClfAssessmentSnapshot[];
  /** FSRS schedule per flashcard id (see lib/study/schedule.ts). */
  schedules: Record<string, StoredSchedule>;
  /** SAA game streak, best times, and memory-match misses. Optional so older saves still load. */
  memoryGames?: { lastMixDay?: string; streak: number; bestMs: Record<string, number>; misses?: MemoryMiss[] };
  /** Missed drill cues and the best survival or speed streak. Optional so older saves still load. */
  drillPractice?: {
    missedIds: string[];
    bestStreak: number;
    decks?: Record<string, { bestScore: number; bestStreak: number }>;
  };
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

function isAttemptBase(value: unknown): value is QuizAttempt {
  return isRecord(value) && typeof value.topicId === "string" && Number.isFinite(value.correct) && Number.isFinite(value.total)
    && (value.total as number) > 0 && Array.isArray(value.missedIds) && Number.isFinite(value.at)
    && (value.exam === undefined || typeof value.exam === "string")
    && (value.bankVersion === undefined || typeof value.bankVersion === "string")
    && (value.questionIds === undefined || (Array.isArray(value.questionIds) && value.questionIds.every((id) => typeof id === "string")));
}

function validChoiceIndex(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function repairedChoiceMap(value: unknown, allowSets: boolean): { value?: Record<string, number | number[]>; repaired: boolean } {
  if (value === undefined) return { repaired: false };
  if (!isRecord(value)) return { repaired: true };
  const kept: Record<string, number | number[]> = {};
  let repaired = false;
  for (const [id, choice] of Object.entries(value)) {
    if (validChoiceIndex(choice)) kept[id] = choice;
    else if (allowSets && Array.isArray(choice) && choice.length > 0 && choice.every(validChoiceIndex)) kept[id] = [...choice];
    else repaired = true;
  }
  return { value: Object.keys(kept).length ? kept : undefined, repaired };
}

const CONFIDENCE_LEVELS = new Set(["sure", "unsure", "guess"]);
const MISS_REASONS = new Set(["qualifier", "confused", "unknown", "time"]);
const ATTEMPT_MODES = new Set(["quiz", "mock", "mini", "topic", "twin"]);

function optionalStringList(value: unknown): { value?: string[]; bad: boolean } {
  if (value === undefined) return { bad: false };
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) return { bad: true };
  return { value: value as string[], bad: false };
}

function optionalConfidence(value: unknown): { value?: Record<string, "sure" | "unsure" | "guess">; bad: boolean } {
  if (value === undefined) return { bad: false };
  if (!isRecord(value)) return { bad: true };
  const kept: Record<string, "sure" | "unsure" | "guess"> = {};
  let bad = false;
  for (const [id, level] of Object.entries(value)) {
    if (CONFIDENCE_LEVELS.has(level as string)) kept[id] = level as "sure" | "unsure" | "guess";
    else bad = true;
  }
  return { value: Object.keys(kept).length ? kept : undefined, bad };
}

function optionalReasons(value: unknown): { value?: Record<string, string>; bad: boolean } {
  if (value === undefined) return { bad: false };
  if (!isRecord(value)) return { bad: true };
  const kept: Record<string, string> = {};
  let bad = false;
  for (const [id, reason] of Object.entries(value)) {
    if (typeof reason === "string" && MISS_REASONS.has(reason)) kept[id] = reason;
    else bad = true;
  }
  return { value: Object.keys(kept).length ? kept : undefined, bad };
}

function optionalSeconds(value: unknown): { value?: Record<string, number>; bad: boolean } {
  if (value === undefined) return { bad: false };
  if (!isRecord(value)) return { bad: true };
  const kept: Record<string, number> = {};
  let bad = false;
  for (const [id, seconds] of Object.entries(value)) {
    if (typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0) kept[id] = seconds;
    else bad = true;
  }
  return { value: Object.keys(kept).length ? kept : undefined, bad };
}

function applyAttemptExtras<T extends QuizAttempt | MockAttempt>(attempt: T): { attempt: T; repaired: boolean } {
  const input = attempt as T & Record<string, unknown>;
  let repaired = false;
  const lucky = optionalStringList(input.luckyIds);
  const sure = optionalStringList(input.sureIds);
  const unsure = optionalStringList(input.unsureIds);
  const guessed = optionalStringList(input.guessedIds);
  const confidence = optionalConfidence(input.confidenceByQuestion);
  const reasons = optionalReasons(input.missReasons);
  const seconds = optionalSeconds(input.secondsByQuestion);
  repaired = lucky.bad || sure.bad || unsure.bad || guessed.bad || confidence.bad || reasons.bad || seconds.bad;
  if (input.sittingId !== undefined && typeof input.sittingId !== "string") repaired = true;
  if (input.mode !== undefined && (typeof input.mode !== "string" || !ATTEMPT_MODES.has(input.mode))) repaired = true;
  const next = { ...attempt };
  const write = (key: "luckyIds" | "sureIds" | "unsureIds" | "guessedIds", value?: string[]) => {
    if (value) next[key] = value;
    else delete next[key];
  };
  write("luckyIds", lucky.value);
  write("sureIds", sure.value);
  write("unsureIds", unsure.value);
  write("guessedIds", guessed.value);
  if (confidence.value) next.confidenceByQuestion = confidence.value;
  else delete next.confidenceByQuestion;
  if (reasons.value) next.missReasons = reasons.value;
  else delete next.missReasons;
  if (seconds.value) next.secondsByQuestion = seconds.value;
  else delete next.secondsByQuestion;
  if (typeof input.sittingId === "string") next.sittingId = input.sittingId;
  else delete next.sittingId;
  if (typeof input.mode === "string" && ATTEMPT_MODES.has(input.mode)) next.mode = input.mode;
  else delete next.mode;
  return { attempt: next, repaired };
}

function parseQuizAttempt(value: unknown): { attempt: QuizAttempt | null; repaired: boolean } {
  if (!isAttemptBase(value)) return { attempt: null, repaired: false };
  const input = value as QuizAttempt;
  const wrong = repairedChoiceMap(input.wrongChoices, false);
  const selected = repairedChoiceMap(input.selectedChoices, true);
  const attempt: QuizAttempt = { ...input };
  if (wrong.value) attempt.wrongChoices = wrong.value as Record<string, number>;
  else delete attempt.wrongChoices;
  if (selected.value) attempt.selectedChoices = selected.value;
  else delete attempt.selectedChoices;
  const extras = applyAttemptExtras(attempt);
  return { attempt: extras.attempt, repaired: wrong.repaired || selected.repaired || extras.repaired };
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
    && (value.wrongChoices === undefined || (isRecord(value.wrongChoices) && Object.values(value.wrongChoices).every((n) => Number.isInteger(n) && (n as number) >= 0)))
    && Array.isArray(value.missedIds) && Number.isFinite(value.at);
}

function parseDrillPractice(value: unknown): { value?: Progress["drillPractice"]; repaired: boolean } {
  if (value === undefined) return { repaired: false };
  if (!isRecord(value)) return { repaired: true };
  const rawIds = Array.isArray(value.missedIds) ? value.missedIds : [];
  const missedIds = [...new Set(rawIds.filter((id): id is string => typeof id === "string" && id.includes("/")))];
  const bestStreak = Number.isInteger(value.bestStreak) && (value.bestStreak as number) >= 0 ? value.bestStreak as number : 0;
  let decks: Record<string, { bestScore: number; bestStreak: number }> | undefined;
  let decksRepaired = false;
  if (value.decks !== undefined) {
    if (!isRecord(value.decks)) decksRepaired = true;
    else {
      const kept: Record<string, { bestScore: number; bestStreak: number }> = {};
      for (const [id, row] of Object.entries(value.decks)) {
        if (!isRecord(row) || !Number.isInteger(row.bestScore) || (row.bestScore as number) < 0 || !Number.isInteger(row.bestStreak) || (row.bestStreak as number) < 0) {
          decksRepaired = true;
          continue;
        }
        kept[id] = { bestScore: row.bestScore as number, bestStreak: row.bestStreak as number };
      }
      decks = kept;
    }
  }
  return {
    value: { missedIds, bestStreak, ...(decks ? { decks } : {}) },
    repaired: !Array.isArray(value.missedIds) || missedIds.length !== rawIds.length || !Number.isInteger(value.bestStreak) || (value.bestStreak as number) < 0 || decksRepaired,
  };
}

function parseMatchMiss(entry: unknown): MemoryMiss | undefined {
  if (!isRecord(entry) || typeof entry.id !== "string" || entry.id.length === 0) return undefined;
  if (typeof entry.task !== "string" || !/^\d\.\d$/.test(entry.task)) return undefined;
  if (typeof entry.prompt !== "string" || entry.prompt.length === 0) return undefined;
  if (!Number.isFinite(entry.at) || !Number.isInteger(entry.times) || (entry.times as number) < 1) return undefined;
  return { id: entry.id, task: entry.task, prompt: entry.prompt, at: entry.at as number, times: entry.times as number };
}

function parseMemoryGames(value: unknown): { value?: Progress["memoryGames"]; repaired: boolean } {
  if (value === undefined) return { repaired: false };
  if (!isRecord(value)) return { repaired: true };
  const streak = Number.isInteger(value.streak) && (value.streak as number) >= 0 ? value.streak as number : 0;
  const lastMixDay = typeof value.lastMixDay === "string" ? value.lastMixDay : undefined;
  const bestMs: Record<string, number> = {};
  if (isRecord(value.bestMs)) {
    for (const [key, ms] of Object.entries(value.bestMs)) {
      if (typeof ms === "number" && Number.isFinite(ms) && ms >= 0) bestMs[key] = ms;
    }
  }
  let misses: MemoryMiss[] | undefined;
  let missesRepaired = false;
  if (value.misses !== undefined) {
    if (!Array.isArray(value.misses)) missesRepaired = true;
    else {
      const parsed = value.misses.flatMap((entry) => {
        const miss = parseMatchMiss(entry);
        if (!miss) missesRepaired = true;
        return miss ? [miss] : [];
      }).slice(0, 200);
      if (parsed.length !== value.misses.length) missesRepaired = true;
      if (parsed.length > 0) misses = parsed;
    }
  }
  return {
    value: { streak, bestMs, ...(lastMixDay ? { lastMixDay } : {}), ...(misses ? { misses } : {}) },
    repaired: missesRepaired || !Number.isInteger(value.streak) || (value.streak as number) < 0 || (value.bestMs !== undefined && !isRecord(value.bestMs)) || (value.lastMixDay !== undefined && typeof value.lastMixDay !== "string"),
  };
}

function isClfSnapshot(value: unknown): value is ClfAssessmentSnapshot {
  if (!isRecord(value) || typeof value.id !== "string" || (value.kind !== "baseline" && value.kind !== "retest") || (value.baselineId !== undefined && typeof value.baselineId !== "string") || (value.kind === "baseline" && value.baselineId !== undefined) || !Number.isFinite(value.at) || typeof value.bankVersion !== "string" || !isRecord(value.objectives)) return false;
  return Object.values(value.objectives).every((objective) => isRecord(objective) && (objective.accuracy === null || Number.isFinite(objective.accuracy)) && Number.isInteger(objective.distinctQuestions) && typeof objective.evidence === "string" && typeof objective.state === "string" && Array.isArray(objective.questionEvidence) && objective.questionEvidence.every((item) => isRecord(item) && typeof item.questionId === "string" && typeof item.correct === "boolean" && Number.isFinite(item.at)));
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
  const parsedQuizAttempts = attempts.map(parseQuizAttempt);
  const quizAttempts = parsedQuizAttempts.flatMap(({ attempt }) => attempt ? [attempt] : []);
  const rawMockAttempts = Array.isArray(parsed.mockAttempts) ? parsed.mockAttempts : [];
  const parsedMockAttempts = rawMockAttempts.filter(isMockAttempt).map((attempt) => applyAttemptExtras(attempt));
  const mockAttempts = parsedMockAttempts.map(({ attempt }) => attempt);
  const rawSnapshots = Array.isArray(parsed.clfAssessmentSnapshots) ? parsed.clfAssessmentSnapshots : [];
  const clfAssessmentSnapshots = rawSnapshots.filter(isClfSnapshot).slice(0, 20);
  const schedules = isRecord(parsed.schedules) ? (parsed.schedules as Record<string, StoredSchedule>) : {};
  const memoryGames = parseMemoryGames(parsed.memoryGames);
  const drillPractice = parseDrillPractice(parsed.drillPractice);
  const repaired = known.repaired || unknown.repaired || memoryGames.repaired || drillPractice.repaired
    || (parsed.quizAttempts !== undefined && !Array.isArray(parsed.quizAttempts))
    || quizAttempts.length !== attempts.length
    || parsedQuizAttempts.some(({ repaired: optionalRepaired }) => optionalRepaired)
    || (parsed.mockAttempts !== undefined && !Array.isArray(parsed.mockAttempts))
    || mockAttempts.length !== rawMockAttempts.length
    || parsedMockAttempts.some(({ repaired: mockRepaired }) => mockRepaired)
    || (parsed.clfAssessmentSnapshots !== undefined && (!Array.isArray(parsed.clfAssessmentSnapshots) || clfAssessmentSnapshots.length !== rawSnapshots.length))
    || (parsed.schedules !== undefined && !isRecord(parsed.schedules));
  const progress: Progress = {
      studyFocus: isStudyFocus(parsed.studyFocus) ? parsed.studyFocus : DEFAULT_STUDY_FOCUS,
      knownCards: known.value,
      unknownCards: unknown.value,
      quizAttempts,
      mockAttempts,
      schedules,
    };
  if (clfAssessmentSnapshots.length > 0) progress.clfAssessmentSnapshots = clfAssessmentSnapshots;
  if (memoryGames.value) progress.memoryGames = memoryGames.value;
  if (drillPractice.value) progress.drillPractice = drillPractice.value;
  return {
    progress,
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
  requestLearnerFlush();
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
  requestLearnerFlush();
  return next;
}

export function recordClfAssessmentSnapshot(snapshot: ClfAssessmentSnapshot) {
  const current = loadProgress();
  const snapshots = [snapshot, ...(current.clfAssessmentSnapshots ?? []).filter((item) => item.id !== snapshot.id)].slice(0, 20);
  const next = { ...current, clfAssessmentSnapshots: snapshots };
  saveProgress(next);
  return next;
}

export function recordMemoryBest(boardId: string, ms: number) {
  const current = loadProgress();
  const games = current.memoryGames ?? { streak: 0, bestMs: {} };
  const previous = games.bestMs[boardId];
  if (previous !== undefined && previous <= ms) return current;
  const next = { ...current, memoryGames: { ...games, bestMs: { ...games.bestMs, [boardId]: ms } } };
  saveProgress(next);
  return next;
}

function withDeckBest(
  practice: NonNullable<Progress["drillPractice"]>,
  deckId: string,
  patch: { bestScore?: number; bestStreak?: number },
) {
  const previous = practice.decks?.[deckId] ?? { bestScore: 0, bestStreak: 0 };
  return {
    ...practice.decks,
    [deckId]: {
      bestScore: Math.max(previous.bestScore, patch.bestScore ?? previous.bestScore),
      bestStreak: Math.max(previous.bestStreak, patch.bestStreak ?? previous.bestStreak),
    },
  };
}

/** Remember a miss, clear it after a later correct answer, and keep a higher streak. */
export function recordDrillOutcome(deckId: string, itemId: string, correct: boolean, streak: number) {
  const current = loadProgress();
  const practice = current.drillPractice ?? { missedIds: [], bestStreak: 0 };
  const key = `${deckId}/${itemId}`;
  const missedIds = correct
    ? practice.missedIds.filter((id) => id !== key)
    : practice.missedIds.includes(key) ? practice.missedIds : [...practice.missedIds, key];
  const next = {
    ...current,
    drillPractice: {
      missedIds,
      bestStreak: Math.max(practice.bestStreak, streak),
      decks: withDeckBest(practice, deckId, { bestStreak: streak }),
    },
  };
  saveProgress(next);
  return next;
}

/** Keep the higher speed-run score for one deck. */
export function recordDrillScore(deckId: string, score: number) {
  const current = loadProgress();
  const practice = current.drillPractice ?? { missedIds: [], bestStreak: 0 };
  const next = { ...current, drillPractice: { ...practice, decks: withDeckBest(practice, deckId, { bestScore: score }) } };
  saveProgress(next);
  return next;
}

/** One tap after a wrong answer. Null clears a reason the learner skipped or undid. */
export function setMissReason(sittingId: string, questionId: string, reason: string | null) {
  const current = loadProgress();
  const apply = <T extends { sittingId?: string; missReasons?: Record<string, string> }>(attempt: T): T => {
    if (attempt.sittingId !== sittingId) return attempt;
    const missReasons = { ...attempt.missReasons };
    if (reason && MISS_REASONS.has(reason)) missReasons[questionId] = reason;
    else delete missReasons[questionId];
    return { ...attempt, missReasons };
  };
  const next = {
    ...current,
    quizAttempts: current.quizAttempts.map(apply),
    mockAttempts: current.mockAttempts.map(apply),
  };
  saveProgress(next);
  return next;
}

/** A wrong memory-match pair: keep it on the synced game record and schedule it again in FSRS. */
export function progressAfterMatchMiss(current: Progress, miss: { id: string; task: string; prompt: string }, now: Date = new Date()): Progress {
  const games = current.memoryGames ?? { streak: 0, bestMs: {} };
  const misses = rememberMatchMiss(games.misses, miss, now.getTime());
  const schedules = {
    ...current.schedules,
    [miss.id]: reviewCard(current.schedules[miss.id], "again", now),
  };
  return {
    ...current,
    schedules,
    ...markedCounts(current, miss.id, false),
    memoryGames: { ...games, misses },
  };
}

export function recordMatchMiss(miss: { id: string; task: string; prompt: string }, now: Date = new Date()) {
  const next = progressAfterMatchMiss(loadProgress(), miss, now);
  saveProgress(next);
  requestLearnerFlush();
  return next;
}

export function recordMemoryStreak(lastMixDay: string, streak: number) {
  const current = loadProgress();
  const games = current.memoryGames ?? { streak: 0, bestMs: {} };
  const next = { ...current, memoryGames: { ...games, lastMixDay, streak } };
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
