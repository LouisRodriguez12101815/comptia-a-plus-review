export type QuizAttempt = {
  topicId: string;
  correct: number;
  total: number;
  missedIds: string[];
  at: number;
};

export type Progress = {
  knownCards: Record<string, boolean>;
  unknownCards: Record<string, boolean>;
  quizAttempts: QuizAttempt[];
};

const KEY = "comptia-a-plus-review-progress-v1";

const empty: Progress = {
  knownCards: {},
  unknownCards: {},
  quizAttempts: [],
};

export function loadProgress(): Progress {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Progress;
    return {
      knownCards: parsed.knownCards ?? {},
      unknownCards: parsed.unknownCards ?? {},
      quizAttempts: parsed.quizAttempts ?? [],
    };
  } catch {
    return empty;
  }
}

export function saveProgress(progress: Progress) {
  window.localStorage.setItem(KEY, JSON.stringify(progress));
}

export function markCard(cardId: string, known: boolean) {
  const progress = loadProgress();
  if (known) {
    progress.knownCards[cardId] = true;
    delete progress.unknownCards[cardId];
  } else {
    progress.unknownCards[cardId] = true;
    delete progress.knownCards[cardId];
  }
  saveProgress(progress);
  return progress;
}

export function recordQuiz(attempt: Omit<QuizAttempt, "at">) {
  const progress = loadProgress();
  progress.quizAttempts = [
    { ...attempt, at: Date.now() },
    ...progress.quizAttempts,
  ].slice(0, 40);
  saveProgress(progress);
  return progress;
}
