"use client";

import { useEffect } from "react";
import { loadProgress, setStudyFocus } from "@/lib/progress";
import type { ExamCode, StudyFocus } from "@/lib/types";

/**
 * Opening a chapter from a shared link or another track must not leave the saved
 * exam focus on a track the chapter does not belong to. That would show the wrong
 * track in the header and make the chapter's quiz and flashcards look empty.
 * A focus the chapter already belongs to (or "all") is left alone.
 */
export function EnsureTopicFocus({
  codes,
  preferred,
}: {
  codes: ExamCode[];
  preferred: StudyFocus;
}) {
  useEffect(() => {
    const current = loadProgress().studyFocus;
    if (current !== "all" && !codes.includes(current)) setStudyFocus(preferred);
  }, [codes, preferred]);
  return null;
}
