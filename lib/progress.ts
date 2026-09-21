import { DEFAULT_STUDY_FOCUS, isStudyFocus } from "@/lib/exams";
import type { StudyFocus } from "@/lib/types";

export type QuizAttempt = {
  topicId: string;
  correct: number;
  total: number;
  missedIds: string[];
  at: number;
};

export type Progress = {
  studyFocus: StudyFocus;
  knownCards: Record<string, boolean>;
  unknownCards: Record<string, boolean>;
  quizAttempts: QuizAttempt[];
};

const KEY = "comptia-a-plus-review-progress-v1";
const listeners = new Set<() => void>();

function createEmptyProgress(): Progress {
  return {
    studyFocus: DEFAULT_STUDY_FOCUS,
    knownCards: {},
    unknownCards: {},
    quizAttempts: [],
  };
}

const serverProgress = createEmptyProgress();
let cachedRaw: string | null | undefined;
let cachedProgress = createEmptyProgress();

function parseProgress(raw: string | null): Progress {
  if (!raw) return createEmptyProgress();
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      studyFocus: isStudyFocus(parsed.studyFocus)
        ? parsed.studyFocus
        : DEFAULT_STUDY_FOCUS,
      knownCards: parsed.knownCards ?? {},
      unknownCards: parsed.unknownCards ?? {},
      quizAttempts: parsed.quizAttempts ?? [],
    };
  } catch {
    return createEmptyProgress();
  }
}

export function getProgressSnapshot(): Progress {
  if (typeof window === "undefined") return serverProgress;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedProgress;
  cachedRaw = raw;
  cachedProgress = parseProgress(raw);
  return cachedProgress;
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
  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedProgress = progress;
  listeners.forEach((listener) => listener());
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
