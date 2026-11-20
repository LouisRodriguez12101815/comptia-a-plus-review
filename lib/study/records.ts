import pairsJson from "@/content/study-pairs.json";
import { flashcards, questions, topics } from "@/lib/content";
import { cardsForQuestion, cardsForTask } from "@/lib/study/memory";
import { drillDecks, type DrillItem } from "@/lib/practice/drills";
import { saaDomainFromTask, SAA_TASK_IDS, servicesInQuestion } from "@/lib/saa-tags";
import type { ExamCode, Flashcard } from "@/lib/types";

export type StudyKind = "card" | "pair" | "game-item";

export type StudyRecord = {
  id: string;
  kind: StudyKind;
  exam: ExamCode;
  taskId: string | null;
  services: string[];
  docsUrl: string | null;
  questionIds: string[];
};

export type ResolvedSide = {
  label: string;
  pickWhen: string;
  ref?: string;
};

type PairSideSource = {
  ref?: string;
  label?: string;
  pickWhen?: string;
};

export type PairSource = {
  id: string;
  exam: ExamCode;
  taskId: string;
  services: string[];
  docsUrl: string;
  questionIds: string[];
  difference?: string;
  sides: PairSideSource[];
};

const SAA_DECKS = new Set([
  "aws-saa-secure-cues",
  "aws-saa-resilient-cues",
  "aws-saa-performance-cues",
  "aws-saa-cost-cues",
  "aws-saa-service-compare",
]);

const pairSources = pairsJson as PairSource[];

function cardExamCodes(card: Flashcard): ExamCode[] {
  return card.examCodes ?? topics.find((topic) => topic.id === card.topicId)?.examCodes ?? [];
}

function drillRef(deckId: string, itemId: string): string {
  return `${deckId}/${itemId}`;
}

const drillIndex = new Map<string, { deckId: string; exam: string; item: DrillItem }>();
for (const deck of drillDecks) {
  if (!SAA_DECKS.has(deck.id)) continue;
  for (const item of deck.items) {
    drillIndex.set(drillRef(deck.id, item.id), { deckId: deck.id, exam: deck.exam, item });
  }
}

export function drillItem(ref: string): DrillItem | undefined {
  return drillIndex.get(ref)?.item;
}

export function resolveSide(side: PairSideSource, pairId: string): ResolvedSide {
  if (side.ref) {
    const item = drillItem(side.ref);
    const cue = item?.fields.cue ?? item?.fields.scenario;
    if (!item || !cue || !item.fields.answer) throw new Error(`${pairId}: missing drill item ${side.ref}`);
    return { label: item.fields.answer, pickWhen: cue, ref: side.ref };
  }
  if (!side.label || !side.pickWhen) throw new Error(`${pairId}: a side needs a drill ref or its own label and cue`);
  return { label: side.label, pickWhen: side.pickWhen };
}

export function pairSourcesFor(exam: ExamCode = "saa-c03"): PairSource[] {
  return pairSources.filter((pair) => pair.exam === exam);
}

export function resolvedPairs(exam: ExamCode = "saa-c03", taskId?: string | null) {
  return pairSourcesFor(exam)
    .filter((pair) => !taskId || pair.taskId === taskId)
    .map((pair) => ({
      ...pair,
      sides: pair.sides.map((side) => resolveSide(side, pair.id)),
    }));
}

function relatedQuestionIds(card: Flashcard): string[] {
  if (!card.taskId) return [];
  const services = new Set(card.services ?? []);
  const reviewId = `q-aws-review-saa-c03-${card.taskId}`;
  const ids: string[] = [];
  for (const question of questions) {
    if (question.objectiveIds?.["saa-c03"]?.[0] !== card.taskId) continue;
    const sharesService = (question.services ?? []).some((service) => services.has(service));
    if (question.id === reviewId || sharesService) ids.push(question.id);
  }
  ids.sort((a, b) => Number(b === reviewId) - Number(a === reviewId) || a.localeCompare(b));
  return ids.slice(0, 3);
}

function cardRecord(card: Flashcard): StudyRecord | undefined {
  const codes = cardExamCodes(card);
  const saa = codes.includes("saa-c03");
  const clf = codes.includes("clf-c02");
  if (!saa && !clf) return undefined;
  return {
    id: card.id,
    kind: "card",
    exam: saa ? "saa-c03" : "clf-c02",
    taskId: card.taskId ?? null,
    services: card.services ?? [],
    docsUrl: card.docsUrl ?? null,
    questionIds: relatedQuestionIds(card),
  };
}

function gameItemRecords(): StudyRecord[] {
  const records: StudyRecord[] = [];
  for (const [id, entry] of drillIndex) {
    const taskId = entry.item.objective && (SAA_TASK_IDS as readonly string[]).includes(entry.item.objective)
      ? entry.item.objective
      : null;
    const text = [entry.item.fields.cue, entry.item.fields.scenario, entry.item.fields.answer, entry.item.detail]
      .filter((part): part is string => Boolean(part))
      .join("\n");
    records.push({
      id,
      kind: "game-item",
      exam: "saa-c03",
      taskId,
      services: servicesInQuestion({ prompt: text, choices: [], explanation: "" }),
      docsUrl: null,
      questionIds: [],
    });
  }
  return records;
}

let cached: StudyRecord[] | undefined;

/** One catalog. Card and game-item text stays on the card or drill item; pairs point at those ids. */
export function studyRecords(): StudyRecord[] {
  if (cached) return cached;
  const cards = flashcards.flatMap((card) => {
    const record = cardRecord(card);
    return record ? [record] : [];
  });
  const pairs: StudyRecord[] = pairSources.map((pair) => ({
    id: pair.id,
    kind: "pair",
    exam: pair.exam,
    taskId: pair.taskId,
    services: pair.services,
    docsUrl: pair.docsUrl,
    questionIds: pair.questionIds,
  }));
  cached = [...cards, ...pairs, ...gameItemRecords()];
  return cached;
}

export function studyRecord(id: string): StudyRecord | undefined {
  return studyRecords().find((record) => record.id === id);
}

export { cardsForQuestion, cardsForTask };

export function cheatSheet(domain: "D1" | "D2" | "D3" | "D4") {
  const cards = flashcards.filter((card) => card.taskId && saaDomainFromTask(card.taskId) === domain);
  const pairs = resolvedPairs("saa-c03").filter((pair) => saaDomainFromTask(pair.taskId) === domain);
  return { cards, pairs };
}
