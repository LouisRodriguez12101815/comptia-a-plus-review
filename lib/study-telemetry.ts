import topics from "../content/topics.json" with { type: "json" };
import networkPlusTopics from "../content/topics-network-plus.json" with { type: "json" };
import type { Question } from "@/lib/types";
import type { StudyEventType, StudyResourceType } from "@/lib/learner/telemetry";

export type StudyEventInput = {
  type: StudyEventType;
  exam?: "n10-009";
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

export function isN10Question(question: Question): boolean {
  return question.examCodes?.includes("n10-009") ?? topicExamCodes.get(question.topicId)?.includes("n10-009") ?? false;
}

export function objectiveForStudyQuestion(question: Question): string | undefined {
  return question.objectiveIds?.["n10-009"]?.[0];
}

export function buildStudyEvent(input: StudyEventInput, sessionIdValue: string, at = Date.now()) {
  const question = input.question;
  return {
    v: 1,
    type: input.type,
    at,
    exam: "n10-009" as const,
    sessionId: sessionIdValue,
    ...(question ? {
      questionId: question.id,
      topicId: question.topicId,
      objectiveId: objectiveForStudyQuestion(question),
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
export function sendStudyEvent(input: StudyEventInput): void {
  if (typeof window === "undefined") return;
  const question = input.question;
  if (question && !isN10Question(question)) return;
  if (!question && input.topicId && !topicExamCodes.get(input.topicId)?.includes("n10-009")) return;
  if (!question && !input.topicId && input.exam !== "n10-009") return;
  const body = buildStudyEvent(input, sessionId());
  submissionQueue = submissionQueue.then(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      await fetch("/api/learner/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
