import type { MockAttempt, Progress, QuizAttempt } from "@/lib/progress";
import type { ExamCode, Question, Topic } from "@/lib/types";

export type PerformanceWindow = "24h" | "7d" | "30d" | "history";
export type AttemptKind = "quiz" | "mock";

export type PerformanceAttempt = {
  kind: AttemptKind;
  at: number;
  correct: number;
  total: number;
  percent: number;
  questionIds?: string[];
  missedIds: string[];
  topicId?: string;
  exam?: string;
  full?: boolean;
  domains?: MockAttempt["domains"];
  objectiveByQuestion?: Record<string, string>;
  wrongChoices?: Record<string, number>;
};

export type PerformanceSummary = {
  quizzes: number;
  mocks: number;
  questions: number;
  correct: number;
  incorrect: number;
  accuracy: number;
};

export type QuestionPerformance = {
  questionId: string;
  question: Question;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  firstSeenAt: number;
  lastSeenAt: number;
  lastMissAt?: number;
  selectedWrongAnswer?: string;
  exam?: ExamCode;
  objectiveId?: string;
  topic?: Topic;
  recovered: boolean;
};

export type TopicPerformance = {
  topicId: string;
  title: string;
  questions: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  repeatedMisses: number;
};

export type ObjectivePerformance = {
  key: string;
  exam: ExamCode;
  objectiveId: string;
  title: string;
  questions: number;
  correct: number;
  incorrect: number;
  accuracy: number;
};

export type ScoreTrendPoint = {
  at: number;
  percent: number;
  kind: AttemptKind;
  label: string;
};

const duration: Record<Exclude<PerformanceWindow, "history">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const validAt = (at: number) => Number.isFinite(at) && at >= 0;
const percent = (correct: number, total: number) => total > 0 ? Math.round((correct / total) * 100) : 0;

export function windowStart(window: PerformanceWindow, now: number): number {
  return window === "history" ? 0 : now - duration[window];
}

export function progressAttempts(progress: Progress): PerformanceAttempt[] {
  const quizzes: PerformanceAttempt[] = (progress.quizAttempts ?? []).map((attempt: QuizAttempt) => ({
    kind: "quiz",
    at: attempt.at,
    correct: attempt.correct,
    total: attempt.total,
    percent: percent(attempt.correct, attempt.total),
    questionIds: attempt.questionIds,
    missedIds: attempt.missedIds ?? [],
    topicId: attempt.topicId,
  }));
  const mocks: PerformanceAttempt[] = (progress.mockAttempts ?? []).map((attempt: MockAttempt) => ({
    kind: "mock",
    at: attempt.at,
    correct: attempt.correct,
    total: attempt.total,
    percent: Number.isFinite(attempt.percent) ? Math.round(attempt.percent) : percent(attempt.correct, attempt.total),
    questionIds: attempt.questionIds,
    missedIds: attempt.missedIds ?? [],
    exam: attempt.exam,
    full: attempt.full,
    domains: attempt.domains,
    objectiveByQuestion: attempt.objectiveByQuestion,
    wrongChoices: attempt.wrongChoices,
  }));
  return [...quizzes, ...mocks].filter((attempt) => validAt(attempt.at) && attempt.total > 0);
}

export function attemptsForWindow(progress: Progress, window: PerformanceWindow, now = Date.now()): PerformanceAttempt[] {
  const start = windowStart(window, now);
  return progressAttempts(progress)
    .filter((attempt) => attempt.at >= start && attempt.at <= now)
    .sort((a, b) => a.at - b.at);
}

export function performanceSummary(progress: Progress, window: PerformanceWindow, now = Date.now()): PerformanceSummary {
  const attempts = attemptsForWindow(progress, window, now);
  const quizzes = attempts.filter((attempt) => attempt.kind === "quiz").length;
  const mocks = attempts.filter((attempt) => attempt.kind === "mock").length;
  const questions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const correct = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  return { quizzes, mocks, questions, correct, incorrect: Math.max(0, questions - correct), accuracy: percent(correct, questions) };
}

function questionResults(attempt: PerformanceAttempt): { id: string; correct: boolean }[] {
  if (!attempt.questionIds?.length) return [];
  const missed = new Set(attempt.missedIds);
  return [...new Set(attempt.questionIds)].map((id) => ({ id, correct: !missed.has(id) }));
}

function questionExam(question: Question, attempt: PerformanceAttempt): ExamCode | undefined {
  if (attempt.exam && question.examCodes?.includes(attempt.exam as ExamCode)) return attempt.exam as ExamCode;
  return question.examCodes?.length === 1 ? question.examCodes[0] : undefined;
}

export function questionPerformance(
  progress: Progress,
  questions: Question[],
  options: { window?: PerformanceWindow; now?: number; topics?: Topic[] } = {},
): QuestionPerformance[] {
  const attempts = attemptsForWindow(progress, options.window ?? "history", options.now ?? Date.now());
  const byId = new Map(questions.map((question) => [question.id, question]));
  const topicById = new Map((options.topics ?? []).map((topic) => [topic.id, topic]));
  const rows = new Map<string, QuestionPerformance>();
  const ordered = [...attempts].sort((a, b) => a.at - b.at);
  const priorMiss = new Set<string>();

  for (const attempt of ordered) {
    for (const result of questionResults(attempt)) {
      const question = byId.get(result.id);
      if (!question) continue;
      const existing = rows.get(result.id);
      const exam = questionExam(question, attempt);
      const objectiveId = (exam && attempt.objectiveByQuestion?.[result.id]) ?? (exam && question.objectiveIds?.[exam]?.[0]);
      const selectedIndex = attempt.wrongChoices?.[result.id];
      const next: QuestionPerformance = existing ?? {
        questionId: result.id,
        question,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
        firstSeenAt: attempt.at,
        lastSeenAt: attempt.at,
        exam,
        objectiveId,
        topic: topicById.get(question.topicId),
        recovered: false,
      };
      next.attempts += 1;
      next.correct += Number(result.correct);
      next.incorrect += Number(!result.correct);
      next.accuracy = percent(next.correct, next.attempts);
      next.lastSeenAt = Math.max(next.lastSeenAt, attempt.at);
      if (exam && !next.exam) next.exam = exam;
      if (objectiveId && !next.objectiveId) next.objectiveId = objectiveId;
      if (!result.correct) {
        next.lastMissAt = Math.max(next.lastMissAt ?? 0, attempt.at);
        if (selectedIndex !== undefined && Number.isInteger(selectedIndex) && selectedIndex >= 0) {
          next.selectedWrongAnswer = question.choices[selectedIndex] ?? next.selectedWrongAnswer;
        }
        priorMiss.add(result.id);
      } else if (priorMiss.has(result.id)) {
        next.recovered = true;
      }
      rows.set(result.id, next);
    }
  }
  return [...rows.values()];
}

export function rankQuestionPerformance(rows: QuestionPerformance[]): QuestionPerformance[] {
  return [...rows].sort((a, b) => b.incorrect - a.incorrect || (b.lastMissAt ?? 0) - (a.lastMissAt ?? 0) || a.questionId.localeCompare(b.questionId));
}

export function topicPerformance(rows: QuestionPerformance[]): TopicPerformance[] {
  const grouped = new Map<string, TopicPerformance>();
  for (const row of rows) {
    const current = grouped.get(row.question.topicId) ?? { topicId: row.question.topicId, title: row.topic?.title ?? row.question.topicId, questions: 0, correct: 0, incorrect: 0, accuracy: 0, repeatedMisses: 0 };
    current.questions += row.attempts;
    current.correct += row.correct;
    current.incorrect += row.incorrect;
    current.repeatedMisses += Math.max(0, row.incorrect - 1);
    current.accuracy = percent(current.correct, current.questions);
    grouped.set(row.question.topicId, current);
  }
  return [...grouped.values()].sort((a, b) => b.repeatedMisses - a.repeatedMisses || b.incorrect - a.incorrect || a.accuracy - b.accuracy || a.topicId.localeCompare(b.topicId));
}

export function objectivePerformance(rows: QuestionPerformance[], objectiveTitles: Record<string, string> = {}): ObjectivePerformance[] {
  const grouped = new Map<string, ObjectivePerformance>();
  for (const row of rows) {
    if (!row.exam || !row.objectiveId) continue;
    const key = `${row.exam}:${row.objectiveId}`;
    const current = grouped.get(key) ?? { key, exam: row.exam, objectiveId: row.objectiveId, title: objectiveTitles[key] ?? row.objectiveId, questions: 0, correct: 0, incorrect: 0, accuracy: 0 };
    current.questions += row.attempts;
    current.correct += row.correct;
    current.incorrect += row.incorrect;
    current.accuracy = percent(current.correct, current.questions);
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions || a.key.localeCompare(b.key));
}

export function recoveredQuestions(rows: QuestionPerformance[]): QuestionPerformance[] {
  return rankQuestionPerformance(rows.filter((row) => row.recovered));
}

export function repeatedMisses(rows: QuestionPerformance[]): QuestionPerformance[] {
  return rankQuestionPerformance(rows.filter((row) => row.incorrect >= 2));
}

export function scoreTrend(progress: Progress, window: PerformanceWindow, now = Date.now()): ScoreTrendPoint[] {
  return attemptsForWindow(progress, window, now).map((attempt) => ({
    at: attempt.at,
    percent: attempt.percent,
    kind: attempt.kind,
    label: attempt.kind === "quiz" ? attempt.topicId ?? "quiz" : attempt.exam ?? "mock",
  }));
}

export function recentActivity(progress: Progress, window: PerformanceWindow, now = Date.now()): PerformanceAttempt[] {
  return attemptsForWindow(progress, window, now).reverse();
}

export function recommendedQuestions(rows: QuestionPerformance[]): QuestionPerformance[] {
  return [...repeatedMisses(rows), ...rankQuestionPerformance(rows.filter((row) => row.incorrect === 1 && !row.recovered))]
    .filter((row, index, all) => all.findIndex((candidate) => candidate.questionId === row.questionId) === index)
    .slice(0, 5);
}
