"use client";

import { useEffect } from "react";
import { loadProgress, setStudyFocus } from "@/lib/progress";
import type { StudyFocus } from "@/lib/types";

/** Opening a track page, even from a shared link, selects that track's exam focus. */
export function SetTrackFocus({ focus }: { focus: StudyFocus | null }) {
  useEffect(() => {
    if (focus && loadProgress().studyFocus !== focus) setStudyFocus(focus);
  }, [focus]);
  return null;
}
