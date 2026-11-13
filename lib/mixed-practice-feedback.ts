import type { Question } from "./types";
import { isCorrect } from "./exam-test.mjs";

export type MixedPracticeFeedback = {
  correct: boolean;
  selectedIndices: number[];
  correctIndices: number[];
  missingIndices: number[];
  incorrectIndices: number[];
};

/** Derives post-submission feedback without changing authored answer semantics. */
export function mixedPracticeFeedback(question: Question, answer: number | number[] | undefined): MixedPracticeFeedback {
  const selectedIndices = answer === undefined ? [] : Array.isArray(answer) ? [...answer].sort((a, b) => a - b) : [answer];
  const correctIndices = Array.isArray(question.answer) ? [...question.answer].sort((a, b) => a - b) : [question.answer];
  const selected = new Set(selectedIndices);
  const authored = new Set(correctIndices);
  return {
    correct: isCorrect(question, answer),
    selectedIndices,
    correctIndices,
    missingIndices: correctIndices.filter((index) => !selected.has(index)),
    incorrectIndices: selectedIndices.filter((index) => !authored.has(index)),
  };
}
