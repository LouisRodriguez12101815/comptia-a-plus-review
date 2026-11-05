import type { LearnerMap } from "@/lib/learner/store";

export const STUDY_EVENT_VERSION = 1 as const;
export const TELEMETRY_MAX_EVENTS = 200;
export const TELEMETRY_MAX_CHUNKS = 8;

export const studyEventTypes = [
  "quiz_started",
  "question_answered",
  "remediation_opened",
  "remediation_resource_opened",
  "similar_question_started",
  "quiz_completed",
] as const;

export type StudyEventType = (typeof studyEventTypes)[number];
export type StudyResourceType = "flashcard" | "visual" | "video" | "notes" | "retry";

export type StudyEvent = {
  v: typeof STUDY_EVENT_VERSION;
  type: StudyEventType;
  at: number;
  exam: "n10-009";
  sessionId: string;
  questionId?: string;
  topicId?: string;
  objectiveId?: string;
  correct?: boolean;
  missCount?: number;
  resourceType?: StudyResourceType;
  questionCount?: number;
  correctCount?: number;
  missedCount?: number;
};

const keys = new Set([
  "v", "type", "at", "exam", "sessionId", "questionId", "topicId", "objectiveId",
  "correct", "missCount", "resourceType", "questionCount", "correctCount", "missedCount",
]);
const idPattern = /^[A-Za-z0-9._:-]{1,128}$/;
const sessionPattern = /^[A-Za-z0-9_-]{16,80}$/;
const resources = new Set<StudyResourceType>(["flashcard", "visual", "video", "notes", "retry"]);

const optionalId = (value: unknown, name: string): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !idPattern.test(value)) throw new Error(`invalid_${name}`);
  return value;
};

const optionalCount = (value: unknown, name: string): number | undefined => {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 10000) throw new Error(`invalid_${name}`);
  return value as number;
};

/** Strictly validates the small public telemetry schema; unknown client fields are rejected. */
export function parseStudyEvent(value: unknown): StudyEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_event");
  const input = value as Record<string, unknown>;
  if ([...Object.keys(input)].some((key) => !keys.has(key))) throw new Error("unknown_event_field");
  if (input.v !== STUDY_EVENT_VERSION || !studyEventTypes.includes(input.type as StudyEventType)) throw new Error("invalid_event_type");
  if (!Number.isInteger(input.at) || Math.abs(Date.now() - (input.at as number)) > 7 * 86400_000) throw new Error("invalid_event_time");
  if (input.exam !== "n10-009") throw new Error("invalid_exam");
  if (typeof input.sessionId !== "string" || !sessionPattern.test(input.sessionId)) throw new Error("invalid_session");

  const event: StudyEvent = {
    v: STUDY_EVENT_VERSION,
    type: input.type as StudyEventType,
    at: input.at as number,
    exam: "n10-009",
    sessionId: input.sessionId,
  };
  const questionId = optionalId(input.questionId, "question");
  const topicId = optionalId(input.topicId, "topic");
  const objectiveId = optionalId(input.objectiveId, "objective");
  if (questionId) event.questionId = questionId;
  if (topicId) event.topicId = topicId;
  if (objectiveId) event.objectiveId = objectiveId;
  if (input.correct !== undefined) {
    if (typeof input.correct !== "boolean") throw new Error("invalid_correct");
    event.correct = input.correct;
  }
  const missCount = optionalCount(input.missCount, "miss_count");
  if (missCount !== undefined) event.missCount = missCount;
  if (input.resourceType !== undefined) {
    if (typeof input.resourceType !== "string" || !resources.has(input.resourceType as StudyResourceType)) throw new Error("invalid_resource");
    event.resourceType = input.resourceType as StudyResourceType;
  }
  const questionCount = optionalCount(input.questionCount, "question_count");
  const correctCount = optionalCount(input.correctCount, "correct_count");
  const missedCount = optionalCount(input.missedCount, "missed_count");
  if (questionCount !== undefined) event.questionCount = questionCount;
  if (correctCount !== undefined) event.correctCount = correctCount;
  if (missedCount !== undefined) event.missedCount = missedCount;
  return event;
}

const telemetryKeys = (items: { key: string }[]) =>
  items.filter((item) => /^telemetry-\d+$/.test(item.key));

export async function loadTelemetry(map: LearnerMap): Promise<StudyEvent[]> {
  const items = telemetryKeys(await map.list())
    .sort((a, b) => Number(a.key.slice(10)) - Number(b.key.slice(10)));
  if (!items.length) return [];
  const raw = items.map((item) => String(((item as unknown as { data?: { s?: string } }).data?.s) ?? "")).join("");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("invalid_telemetry_store");
  return parsed.map(parseStudyEvent).slice(-TELEMETRY_MAX_EVENTS);
}

export async function appendTelemetry(map: LearnerMap, event: StudyEvent): Promise<void> {
  const events = [...(await loadTelemetry(map)), event].slice(-TELEMETRY_MAX_EVENTS);
  const raw = JSON.stringify(events);
  const chunks: string[] = [];
  for (let i = 0; i < raw.length; i += 12000) chunks.push(raw.slice(i, i + 12000));
  if (chunks.length > TELEMETRY_MAX_CHUNKS) throw new Error("too_large");
  const existing = telemetryKeys(await map.list()).map((item) => item.key);
  for (let i = 0; i < chunks.length; i += 1) await map.set(`telemetry-${i}`, { s: chunks[i] });
  for (const key of existing) if (Number(key.slice(10)) >= chunks.length) await map.remove(key);
}
