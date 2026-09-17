import flashcardsJson from "@/content/flashcards.json";
import questionsJson from "@/content/questions.json";
import topicsJson from "@/content/topics.json";
import type { Flashcard, Question, Topic, TopicGroup } from "@/lib/types";

export const topics = topicsJson as Topic[];
export const flashcards = flashcardsJson as Flashcard[];
export const questions = questionsJson as Question[];

export const groupLabels: Record<TopicGroup, string> = {
  core1: "Core 1",
  core2: "Core 2",
  networking: "Networking",
  weak: "Weak areas",
  reference: "Quick reference",
};

export function getTopic(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}

export function getFlashcards(topicId?: string): Flashcard[] {
  if (!topicId || topicId === "all") return flashcards;
  if (topicId === "weak") return flashcards.filter((card) => card.weak);
  return flashcards.filter((card) => card.topicId === topicId);
}

export function getQuestions(topicId?: string): Question[] {
  if (!topicId || topicId === "all") return questions;
  if (topicId === "weak") return questions.filter((question) => question.weak);
  return questions.filter((question) => question.topicId === topicId);
}

export function searchNotes(query: string): {
  topic: Topic;
  section: Topic["sections"][number];
  snippet: string;
}[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: { topic: Topic; section: Topic["sections"][number]; snippet: string }[] =
    [];

  for (const topic of topics) {
    for (const section of topic.sections) {
      const haystack = [
        topic.title,
        section.title,
        ...section.blocks.flatMap((block) => {
          if (block.type === "paragraph" || block.type === "callout") return [block.text];
          if (block.type === "bullets") return block.items;
          if (block.type === "code") return [block.text];
          if (block.type === "table") {
            return [block.headers.join(" "), ...block.rows.map((row) => row.join(" "))];
          }
          return [];
        }),
      ]
        .join("\n")
        .toLowerCase();

      if (!haystack.includes(q)) continue;

      const snippetSource = section.blocks
        .flatMap((block) => {
          if (block.type === "paragraph" || block.type === "callout") return [block.text];
          if (block.type === "bullets") return block.items;
          return [];
        })
        .find((text) => text.toLowerCase().includes(q));

      hits.push({
        topic,
        section,
        snippet: snippetSource ?? section.title,
      });
    }
  }

  return hits;
}
