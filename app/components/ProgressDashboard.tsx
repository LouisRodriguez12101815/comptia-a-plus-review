"use client";

import { useSyncExternalStore } from "react";
import { getFlashcards, getQuestions, getTopics } from "@/lib/content";
import { examShortLabel } from "@/lib/exams";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeProgress,
} from "@/lib/progress";
import { useStudyFocus } from "@/app/components/useStudyFocus";

export function ProgressDashboard() {
  const [focus] = useStudyFocus();
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const cards = getFlashcards("all", focus);
  const practiceQuestions = getQuestions("all", focus);
  const focusedTopics = getTopics(focus);
  const cardIds = new Set(cards.map((card) => card.id));
  const known = Object.keys(progress.knownCards).filter((id) => cardIds.has(id)).length;
  const last = progress.quizAttempts.find((attempt) => {
    if (focus === "all") return true;
    return getQuestions(attempt.topicId, focus).length > 0;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label={`${examShortLabel(focus)} cards known`} value={`${known} / ${cards.length}`} />
      <Stat label="Practice questions" value={`${practiceQuestions.length}`} />
      <Stat
        label="Latest matching quiz"
        value={
          last
            ? `${last.correct}/${last.total} (${Math.round((last.correct / last.total) * 100)}%)`
            : "Not taken yet"
        }
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:col-span-3">
        <p className="text-sm text-slate-400">
          {focusedTopics.length} relevant note chapters · Progress and exam priority stay in this browser only.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
