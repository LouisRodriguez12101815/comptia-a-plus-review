import type { Question } from "@/lib/types";

export function correctIndices(question: Question): number[] {
  return Array.isArray(question.answer) ? question.answer : [question.answer];
}

export function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function isCorrectPick(
  question: Question,
  pick: number | number[] | undefined,
): boolean {
  if (pick === undefined || pick === null) return false;

  if (Array.isArray(question.answer)) {
    return Array.isArray(pick) && sameSet(pick, question.answer);
  }

  return pick === question.answer;
}

export function answerLabel(
  question: Question,
  pick: number | number[] | undefined,
): string {
  if (pick === undefined || pick === null) return "—";
  const indices = Array.isArray(pick) ? pick : [pick];
  return indices.map((index) => question.choices[index]).join(" · ");
}
