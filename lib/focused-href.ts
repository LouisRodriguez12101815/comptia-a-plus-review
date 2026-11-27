import type { StudyFocus } from "@/lib/types";

export function focusedHref(href: string, focus: StudyFocus | null): string {
  if (!focus) return href;
  const match = href.match(/^\/(notes|quiz|flashcards)(\?[^#]*)?(#.*)?$/);
  if (!match) return href;
  const params = new URLSearchParams(match[2] ?? "");
  if (!params.has("exam")) params.set("exam", focus);
  return `/${match[1]}?${params.toString()}${match[3] ?? ""}`;
}
