import { isStudyFocus } from "@/lib/exams";
import type { StudyFocus } from "@/lib/types";

const timedExams = new Set(["220-1201", "220-1202", "n10-009", "clf-c02", "saa-c03"]);

/** An explicit invalid or repeated exam must never silently select another exam. */
export function resolveExamParam(value: unknown, timed = false): { kind: "absent" } | { kind: "invalid" } | { kind: "valid"; focus: StudyFocus } {
  if (value === undefined) return { kind: "absent" };
  if (typeof value !== "string" || !isStudyFocus(value) || (timed && !timedExams.has(value))) return { kind: "invalid" };
  return { kind: "valid", focus: value };
}
