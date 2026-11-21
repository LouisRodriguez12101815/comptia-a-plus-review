import { flashcards, questions } from "@/lib/content";
import type { Flashcard } from "@/lib/types";

export function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** The front always counts. Aliases are extra accepted answers, not a second card. */
export function acceptedTerms(card: Pick<Flashcard, "front" | "aliases">): string[] {
  return [card.front, ...(card.aliases ?? [])];
}

export function termMatches(input: string, card: Pick<Flashcard, "front" | "aliases">): boolean {
  const typed = normalizeTerm(input);
  if (!typed) return false;
  return acceptedTerms(card).some((term) => normalizeTerm(term) === typed);
}

function blankIn(text: string, needle: string): { prompt: string; answer: string } | undefined {
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return undefined;
  const before = index > 0 && /[a-z0-9]/i.test(text[index - 1]);
  const after = index + needle.length < text.length && /[a-z0-9]/i.test(text[index + needle.length]);
  if (before || after) return undefined;
  const answer = text.slice(index, index + needle.length);
  return { prompt: `${text.slice(0, index)}_____${text.slice(index + needle.length)}`, answer };
}

/** Hide one term from the card. The answer is that term, or the front when the back has no clean blank. */
export function clozeForCard(card: Pick<Flashcard, "front" | "back" | "services">): { prompt: string; answer: string } {
  const candidates: string[] = [];
  if (card.front.length <= 48) candidates.push(card.front);
  for (const part of card.front.split(/\s+vs\s+|\s+\/\s+|\s+[—–-]\s+/i)) {
    const trimmed = part.trim();
    if (trimmed.length >= 3 && trimmed !== card.front) candidates.push(trimmed);
  }
  for (const service of card.services ?? []) {
    candidates.push(service);
    for (const part of service.split(/\s+/)) {
      if (part.length >= 3 && part !== "AWS" && part !== "Amazon") candidates.push(part);
    }
  }
  for (const candidate of candidates) {
    const blank = blankIn(card.back, candidate);
    if (blank) return blank;
  }
  return { prompt: `${card.back}\n\n_____`, answer: card.front };
}

export function cardsForTask(taskId: string): Flashcard[] {
  return flashcards.filter((card) => !card.retired && card.taskId === taskId);
}

/** Cards that share the question's SAA task. This does not schedule the question. */
export function cardsForQuestion(questionId: string): Flashcard[] {
  const question = questions.find((item) => item.id === questionId);
  const taskId = question?.objectiveIds?.["saa-c03"]?.[0];
  if (!taskId) return [];
  return cardsForTask(taskId);
}
