import { flashcards, getTopics, questions } from "@/lib/content";
import { glossaryEntries, type GlossaryEntry } from "@/lib/glossary";
import type { ExamCode, Topic } from "@/lib/types";

export type SearchHit = {
  kind: "topic" | "flashcard" | "question" | "term";
  title: string;
  text: string;
  href: string;
  exam: string;
};

export const MAX_PER_KIND = 25;

function matchesAll(haystack: string, tokens: string[]) {
  return tokens.every((token) => haystack.includes(token));
}

function examOfTopic(topic: Topic | undefined): string {
  return topic?.examCodes[0] ?? "all";
}

/** Search every topic, flashcard, question and glossary term. Every word in the query must match. */
export function searchSite(query: string, exam: string = "all") {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const empty = { topics: [] as SearchHit[], flashcards: [] as SearchHit[], questions: [] as SearchHit[], terms: [] as SearchHit[], total: 0 };
  if (tokens.length === 0) return empty;

  const topics = getTopics("all");
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const inExam = (codes: ExamCode[] | undefined, fallback: string) =>
    exam === "all" || (codes ? codes.includes(exam as ExamCode) : fallback === exam);

  const topicHits: SearchHit[] = [];
  for (const topic of topics) {
    if (!inExam(topic.examCodes, "")) continue;
    const sectionText = topic.sections
      .map((section) => `${section.title} ${JSON.stringify(section.blocks ?? "")}`)
      .join(" ");
    const haystack = `${topic.title} ${topic.summary} ${sectionText}`.toLowerCase();
    if (matchesAll(haystack, tokens)) {
      topicHits.push({ kind: "topic", title: topic.title, text: topic.summary, href: `/notes/${topic.id}`, exam: examOfTopic(topic) });
    }
  }

  const cardHits: SearchHit[] = [];
  for (const card of flashcards) {
    const topic = topicById.get(card.topicId);
    const codes = card.examCodes ?? topic?.examCodes;
    if (!inExam(codes, "")) continue;
    if (matchesAll(`${card.front} ${card.back}`.toLowerCase(), tokens)) {
      cardHits.push({ kind: "flashcard", title: card.front, text: card.back, href: `/notes/${card.topicId}`, exam: examOfTopic(topic) });
    }
  }

  const questionHits: SearchHit[] = [];
  for (const question of questions) {
    const topic = topicById.get(question.topicId);
    const codes = question.examCodes ?? topic?.examCodes;
    if (!inExam(codes, "")) continue;
    if (matchesAll(`${question.prompt} ${question.explanation}`.toLowerCase(), tokens)) {
      questionHits.push({ kind: "question", title: question.prompt, text: question.explanation, href: `/notes/${question.topicId}`, exam: examOfTopic(topic) });
    }
  }

  const termHits: SearchHit[] = glossaryEntries
    .filter((entry: GlossaryEntry) => (exam === "all" || entry.exam === exam) && matchesAll(`${entry.term} ${entry.meaning}`.toLowerCase(), tokens))
    .map((entry) => ({ kind: "term" as const, title: entry.term, text: entry.meaning, href: `/glossary#${entry.id}`, exam: entry.exam }));

  return {
    topics: topicHits.slice(0, MAX_PER_KIND),
    flashcards: cardHits.slice(0, MAX_PER_KIND),
    questions: questionHits.slice(0, MAX_PER_KIND),
    terms: termHits.slice(0, MAX_PER_KIND),
    total: topicHits.length + cardHits.length + questionHits.length + termHits.length,
  };
}
