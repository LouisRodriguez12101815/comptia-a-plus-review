"use client";

import { useSyncExternalStore } from "react";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  setStudyFocus,
  subscribeProgress,
} from "@/lib/progress";
import type { StudyFocus } from "@/lib/types";

export function useStudyFocus(): [StudyFocus, (focus: StudyFocus) => void] {
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  return [progress.studyFocus, setStudyFocus];
}
