"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getFlashcards, getQuestions, getTopics } from "@/lib/content";
import {
  getProgressProblems,
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeProgress,
  type ProgressProblem,
} from "@/lib/progress";

const noProblems: ProgressProblem[] = [];
import { useStudyFocus } from "@/app/components/useStudyFocus";

export function ProgressDashboard() {
  const t = useTranslations("progressDashboard");
  const tExams = useTranslations("exams");
  const [focus] = useStudyFocus();
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const problems = useSyncExternalStore(subscribeProgress, getProgressProblems, () => noProblems);
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
    <>
    {problems.length > 0 && (
      <p role="status" className="mb-4 rounded-xl border border-amber-300/50 bg-amber-300/10 p-3 text-sm text-amber-100">
        {t(`problem.${problems[0]}`)}
      </p>
    )}
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat
        label={t("cardsKnown", { exam: tExams(`${focus}.shortLabel`) })}
        value={`${known} / ${cards.length}`}
      />
      <Stat label={t("practiceQuestions")} value={`${practiceQuestions.length}`} />
      <Stat
        label={t("latestQuiz")}
        value={
          last
            ? `${last.correct}/${last.total} (${Math.round((last.correct / last.total) * 100)}%)`
            : t("notTakenYet")
        }
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:col-span-3">
        <p className="text-sm text-slate-400">
          {t("chaptersNote", { count: focusedTopics.length })}
        </p>
      </div>
    </div>
    </>
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
