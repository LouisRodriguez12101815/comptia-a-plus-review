import type { StudyFocus } from "@/lib/types";

/** Legacy topic attribution is safe only when the topic belongs to one exam. */
export function attemptMatchesFocus(attempt: { exam?: string; topicId: string }, focus: StudyFocus, topicExams?: readonly string[]): boolean {
  if (focus === "all") return true;
  if (attempt.exam) return attempt.exam === focus;
  if (attempt.topicId === "all" || attempt.topicId === "weak") return false;
  return topicExams?.length === 1 && topicExams[0] === focus;
}
