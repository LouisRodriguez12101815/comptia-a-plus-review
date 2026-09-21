import flashcardsJson from "@/content/flashcards.json";
import questionsJson from "@/content/questions.json";
import topicsJson from "@/content/topics.json";
import { examMatches } from "@/lib/exams";
import type {
  ExamCode,
  Flashcard,
  Question,
  StudyFocus,
  Topic,
  TopicGroup,
} from "@/lib/types";

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

export function getTopics(focus: StudyFocus = "all"): Topic[] {
  return topics.filter((topic) => examMatches(topic.examCodes, focus));
}

function itemExamCodes(item: Flashcard | Question): ExamCode[] {
  return item.examCodes ?? getTopic(item.topicId)?.examCodes ?? [];
}

function cardMatchesFocus(card: Flashcard, focus: StudyFocus): boolean {
  return examMatches(itemExamCodes(card), focus);
}

function questionMatchesFocus(question: Question, focus: StudyFocus): boolean {
  return examMatches(itemExamCodes(question), focus);
}

export function getFlashcards(
  topicId: string = "all",
  focus: StudyFocus = "all",
): Flashcard[] {
  const focused = flashcards.filter((card) => cardMatchesFocus(card, focus));
  if (topicId === "all") return focused;
  if (topicId === "weak") return focused.filter((card) => card.weak);
  return focused.filter((card) => card.topicId === topicId);
}

export function getQuestions(
  topicId: string = "all",
  focus: StudyFocus = "all",
): Question[] {
  const focused = questions.filter((question) => questionMatchesFocus(question, focus));
  if (topicId === "all") return focused;
  if (topicId === "weak") return focused.filter((question) => question.weak);
  return focused.filter((question) => question.topicId === topicId);
}

export function searchNotes(
  query: string,
  focus: StudyFocus = "all",
): {
  topic: Topic;
  section: Topic["sections"][number];
  snippet: string;
}[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: { topic: Topic; section: Topic["sections"][number]; snippet: string }[] =
    [];

  for (const topic of getTopics(focus)) {
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
