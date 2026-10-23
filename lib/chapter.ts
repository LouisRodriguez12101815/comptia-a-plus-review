import core2LearningMap from "@/content/core2-learning-map.json";
import { getFlashcards, getQuestions, getTopic } from "@/lib/content";
import { visualChapters } from "@/lib/visuals";
import { getTrack } from "@/lib/tracks";
import type { TrackId } from "@/lib/tracks";
import type { StudyFocus, Topic } from "@/lib/types";

const trackByGroup: Partial<Record<Topic["group"], TrackId>> = {
  core1: "core1",
  core2: "core2",
  networking: "networking",
};

/** The exam focus a chapter should open under. */
export function focusForTopic(topic: Topic): StudyFocus {
  const trackId = trackByGroup[topic.group];
  const focus = trackId ? getTrack(trackId).focus : null;
  if (focus && focus !== "all" && topic.examCodes.includes(focus)) return focus;
  return topic.examCodes[0] ?? "all";
}

export type ChapterTool = {
  id: "notes" | "visuals" | "flashcards" | "quiz" | "practice";
  label: string;
  /** Number of items, or null for the notes page itself. */
  count: number | null;
  unit: string;
  href: string | null;
};

/** What a chapter offers across the four study tools, for the chapter header strip. */
export function chapterTools(topicId: string): ChapterTool[] {
  const topic = getTopic(topicId);
  if (!topic) return [];
  const focus = focusForTopic(topic);
  const trackId = trackByGroup[topic.group];
  const visuals =
    visualChapters(focus).find((chapter) => chapter.id === topicId)?.visuals ?? [];
  const cards = getFlashcards(topicId, focus).length;
  const quiz = getQuestions(topicId, focus).length;
  const study = core2LearningMap.topics.find(entry => entry.topicId === topicId);
  const first = visuals[0]?.file.replace(/\.html$/, "");
  return [
    { id: "notes", label: "Notes", count: null, unit: "", href: `/notes/${topicId}` },
    {
      id: "visuals",
      label: "Visuals",
      count: study?.visualFiles.length ?? visuals.length,
      unit: "visuals",
      href: trackId && first ? `${getTrack(trackId).href}/visuals#visual-${first}` : study ? `/core2/review-tools#topic-${topicId}` : null,
    },
    {
      id: "flashcards",
      label: "Flashcards",
      count: cards,
      unit: "cards",
      href: cards ? `/flashcards?topic=${topicId}` : null,
    },
    ...(study ? [{ id: "practice" as const, label: "Practice", count: study.drillIds.length, unit: "decks", href: `/core2/review-tools#topic-${topicId}` }] : []),
    {
      id: "quiz",
      label: "Quiz",
      count: quiz,
      unit: "questions",
      href: quiz ? `/quiz?topic=${topicId}` : null,
    },
  ];
}
