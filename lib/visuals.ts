import ch10 from "@/content/network-plus/ch10.json";
import ch11 from "@/content/network-plus/ch11.json";
import ch9 from "@/content/network-plus/ch9.json";
import trackVisuals from "@/content/track-visuals.json";
import { getTopics } from "@/lib/content";
import type { StudyFocus } from "@/lib/types";

export type VisualItem = {
  file: string;
  title: string;
  description: string;
  group: string;
};

export type VisualChapter = {
  id: string;
  /** Short label, for example "Network+ · Chapter 9". */
  label: string;
  title: string;
  notesHref: string;
  visuals: VisualItem[];
};

/**
 * Visuals by topic id. Network+ chapters 9 to 11 keep their lists in their own
 * files. Every other chapter is added in content/track-visuals.json (see
 * docs/adding-visuals.md).
 */
const visualsByTopic: Record<string, VisualItem[]> = {
  "n10-ch9": ch9.visuals,
  "n10-ch10": ch10.visuals,
  "n10-ch11": ch11.visuals,
  ...(trackVisuals as Record<string, VisualItem[]>),
};

function chapterNumber(label: string): number {
  const match = /(\d+)\s*$/.exec(label);
  return match ? Number(match[1]) : 0;
}

/**
 * Every chapter of a track, with the chapters that have visuals first (in
 * chapter order) and the rest after them as "coming soon".
 */
export function visualChapters(focus: StudyFocus | null): VisualChapter[] {
  if (!focus) return [];
  const all = getTopics(focus)
    .filter((topic) => topic.group !== "weak" && topic.group !== "reference")
    .map(
      (topic): VisualChapter => ({
        id: topic.id,
        label: topic.chapter,
        title: topic.title,
        notesHref: `/notes/${topic.id}`,
        visuals: visualsByTopic[topic.id] ?? [],
      }),
    );
  const ready = all
    .filter((chapter) => chapter.visuals.length > 0)
    .sort(
      (a, b) =>
        (chapterNumber(a.label) || Number.MAX_SAFE_INTEGER) -
        (chapterNumber(b.label) || Number.MAX_SAFE_INTEGER),
    );
  const soon = all.filter((chapter) => chapter.visuals.length === 0);
  return [...ready, ...soon];
}

export function visualCounts(focus: StudyFocus | null) {
  const chapters = visualChapters(focus);
  const ready = chapters.filter((chapter) => chapter.visuals.length > 0);
  return {
    visuals: ready.reduce((sum, chapter) => sum + chapter.visuals.length, 0),
    chapters: ready.length,
    soon: chapters.length - ready.length,
  };
}
