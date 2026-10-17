/**
 * Spaced repetition for flashcards, using the open-source FSRS algorithm (ts-fsrs, MIT).
 * Pure functions only: no storage, no React. Schedules are stored as plain JSON
 * (ISO dates), and revived into ts-fsrs cards when they are reviewed.
 */
import { Rating, createEmptyCard, fsrs, generatorParameters, type Card, type Grade } from "ts-fsrs";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

/** JSON-safe form of an FSRS card: dates as ISO strings. */
export type StoredSchedule = Omit<Card, "due" | "last_review"> & {
  due: string;
  last_review?: string;
};

const scheduler = fsrs(generatorParameters({ enable_fuzz: false }));

const gradeValue: Record<ReviewGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export const gradeLabels: Record<ReviewGrade, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

function toCard(stored: StoredSchedule): Card {
  return {
    ...stored,
    due: new Date(stored.due),
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  } as Card;
}

function toStored(card: Card): StoredSchedule {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  } as StoredSchedule;
}

/** Cards with no schedule are new and due now. */
export function isDue(stored: StoredSchedule | undefined, now: Date = new Date()): boolean {
  if (!stored) return true;
  const due = new Date(stored.due);
  return Number.isNaN(due.getTime()) || due.getTime() <= now.getTime();
}

/** Apply one review and return the next schedule. */
export function reviewCard(
  stored: StoredSchedule | undefined,
  grade: ReviewGrade,
  now: Date = new Date(),
): StoredSchedule {
  const card = stored ? toCard(stored) : createEmptyCard(now);
  const next = scheduler.next(card, now, gradeValue[grade]);
  return toStored(next.card);
}

/** Whole days until a stored card is due again (0 when due now). */
export function daysUntilDue(stored: StoredSchedule | undefined, now: Date = new Date()): number {
  if (!stored) return 0;
  const ms = new Date(stored.due).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Whether a grade counts as knowing the card, for the existing "known" counts. */
export function isKnownGrade(grade: ReviewGrade): boolean {
  return grade === "good" || grade === "easy";
}
