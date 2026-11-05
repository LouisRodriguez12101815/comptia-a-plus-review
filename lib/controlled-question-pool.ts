import { examMatches } from "@/lib/exams";
import type { Question, StudyFocus, Topic } from "@/lib/types";

/** Resolve a controlled quiz pool while preserving the caller's question order. */
export function controlledQuestionIds(
  rawIds: readonly string[],
  questions: Question[],
  topics: Topic[],
  focus: StudyFocus = "all",
): string[] {
  const wanted = new Set(rawIds);
  const topicCodes = new Map(topics.map((topic) => [topic.id, topic.examCodes]));
  const byId = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set<string>();

  return rawIds.filter((id) => {
    if (!wanted.has(id) || seen.has(id)) return false;
    const question = byId.get(id);
    if (!question) return false;
    const codes = question.examCodes ?? topicCodes.get(question.topicId) ?? [];
    if (!examMatches(codes, focus)) return false;
    seen.add(id);
    return true;
  });
}
