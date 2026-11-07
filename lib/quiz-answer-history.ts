import type { Question } from "@/lib/types";

/** Converts the displayed choice back to its authored index for single-answer quizzes. */
export function wrongChoiceForAttempt(
  question: Question,
  displayedToAuthored: number[] | undefined,
  selected: number | number[] | undefined,
): number | undefined {
  if (Array.isArray(question.answer) || typeof selected !== "number") return undefined;
  const authored = displayedToAuthored?.[selected];
  return typeof authored === "number" && Number.isInteger(authored) && authored >= 0 && authored < question.choices.length ? authored : undefined;
}

export function wrongChoicesForQuiz(
  questions: Question[],
  answers: Record<string, number | number[]>,
  displayedOrders: Record<string, number[]>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const question of questions) {
    const selected = answers[question.id];
    const wrong = wrongChoiceForAttempt(question, displayedOrders[question.id], selected);
    if (wrong !== undefined && typeof question.answer === "number" && wrong !== question.answer) result[question.id] = wrong;
  }
  return result;
}
