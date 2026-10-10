import type { IncidentChoice } from "@/lib/game/types";

// Shuffle a copy so answer IDs and the incident's correctAnswerId never change.
export function shuffleAnswers(
  answers: readonly IncidentChoice[],
  random: () => number = Math.random,
): IncidentChoice[] {
  const shuffled = [...answers];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
