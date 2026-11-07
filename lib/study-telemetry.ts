import topics from "../content/topics.json" with { type: "json" };
import networkPlusTopics from "../content/topics-network-plus.json" with { type: "json" };
import { isExamCode } from "@/lib/exams";
import type { Question } from "@/lib/types";
import type { ExamCode } from "@/lib/types";
import type { StudyEventType, StudyResourceType } from "@/lib/learner/telemetry";

export type StudyEventInput = {
  type: StudyEventType;
  exam?: ExamCode;
  question?: Question;
  topicId?: string;
  objectiveId?: string;
  correct?: boolean;
  missCount?: number;
  resourceType?: StudyResourceType;
  questionCount?: number;
  correctCount?: number;
  missedCount?: number;
};

const SESSION_KEY = "comptia-a-plus-study-session-v1";
const topicExamCodes = new Map(
  [...topics, ...networkPlusTopics].map((topic) => [topic.id, topic.examCodes]),
);
let submissionQueue = Promise.resolve();

export function examForStudyQuestion(question: Question, preferred?: ExamCode): ExamCode | undefined {
  if (preferred && (question.examCodes?.includes(preferred) || topicExamCodes.get(question.topicId)?.includes(preferred))) return preferred;
  const codes = question.examCodes?.filter(isExamCode) ?? topicExamCodes.get(question.topicId)?.filter(isExamCode) ?? [];
  return codes.length === 1 ? codes[0] : undefined;
}

export function examForStudyQuestions(questions: Question[], preferred?: ExamCode): ExamCode | undefined {
  if (!questions.length) return undefined;
  const candidates = preferred ? [preferred] : ["220-1201", "220-1202", "n10-009", "clf-c02", "saa-c03", "sy0-701", "az-900", "az-104"] as ExamCode[];
  const valid = candidates.filter((exam) => questions.every((question) => examForStudyQuestion(question, exam) === exam));
  return valid.length === 1 ? valid[0] : undefined;
}

export function isQuestionForExam(question: Question, exam: ExamCode): boolean {
  return examForStudyQuestion(question, exam) === exam;
}

export function isN10Question(question: Question): boolean {
  return isQuestionForExam(question, "n10-009");
}

export function objectiveForStudyQuestion(question: Question, exam = examForStudyQuestion(question)): string | undefined {
  return exam ? question.objectiveIds?.[exam]?.[0] : undefined;
}

export function buildStudyEvent(input: StudyEventInput, sessionIdValue: string, at = Date.now()) {
  const question = input.question;
  const exam = input.exam ?? (question ? examForStudyQuestion(question) : input.topicId ? topicExamCodes.get(input.topicId)?.filter(isExamCode).length === 1 ? topicExamCodes.get(input.topicId)?.find(isExamCode) : undefined : undefined);
  if (!exam) throw new Error("ambiguous_exam");
  if (question && !isQuestionForExam(question, exam)) throw new Error("question_exam_mismatch");
  return {
    v: 1,
    type: input.type,
    at,
    exam,
    sessionId: sessionIdValue,
    ...(question ? {
      questionId: question.id,
      topicId: question.topicId,
      objectiveId: objectiveForStudyQuestion(question, exam),
    } : input.topicId ? { topicId: input.topicId } : {}),
    ...(input.objectiveId ? { objectiveId: input.objectiveId } : {}),
    ...(input.correct === undefined ? {} : { correct: input.correct }),
    ...(input.missCount === undefined ? {} : { missCount: input.missCount }),
    ...(input.resourceType ? { resourceType: input.resourceType } : {}),
    ...(input.questionCount === undefined ? {} : { questionCount: input.questionCount }),
    ...(input.correctCount === undefined ? {} : { correctCount: input.correctCount }),
    ...(input.missedCount === undefined ? {} : { missedCount: input.missedCount }),
  };
}

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const value = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, value);
    return value;
  } catch {
    return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/** Best effort only: telemetry failures are deliberately invisible to quiz interactions. */
function eventBody(input: StudyEventInput): string | null {
  if (typeof window === "undefined") return null;
  try { return JSON.stringify(buildStudyEvent(input, sessionId())); } catch { return null; }
}

function sendImmediately(body: string): void {
  try {
    const payload = new Blob([body], { type: "application/json" });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function"
      && navigator.sendBeacon("/api/learner/telemetry", payload)) return;
  } catch {
    // Fall through to fetch when Beacon is unavailable or rejects the payload.
  }
  void fetch("/api/learner/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {
    // Telemetry is observational and must never block studying.
  });
}

export function sendStudyEvent(input: StudyEventInput): void {
  const body = eventBody(input);
  if (!body) return;
  submissionQueue = submissionQueue.then(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      await fetch("/api/learner/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "same-origin",
        keepalive: true,
        signal: controller.signal,
      });
    } catch {
      // Telemetry is observational and must never block studying.
    } finally {
      clearTimeout(timeout);
    }
  });
}

/** Sends navigation-triggering telemetry outside the ordinary queue. Best effort only. */
export function sendStudyEventOnNavigation(input: StudyEventInput): void {
  const body = eventBody(input);
  if (body) sendImmediately(body);
}
