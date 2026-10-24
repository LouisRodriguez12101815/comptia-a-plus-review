"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { QuizRunner } from "@/app/components/QuizRunner";
import { getTopic, questions } from "@/lib/content";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";

const questionById = new Map(questions.map((q) => [q.id, q]));

function primaryTopic(topicId: string | string[]): string {
  return Array.isArray(topicId) ? topicId[0] : topicId;
}

export function WeakAreas() {
  const t = useTranslations("weakAreas");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);

  // Count how many recorded sittings missed each question, from quizzes and mock exams.
  const { missCounts, topicCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const attempt of progress.quizAttempts) {
      for (const id of new Set(attempt.missedIds)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const attempt of progress.mockAttempts) {
      for (const id of new Set(attempt.missedIds)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const byTopic = new Map<string, number>();
    for (const [id, n] of counts) {
      const q = questionById.get(id);
      if (!q) continue;
      const topic = primaryTopic(q.topicId as string | string[]);
      byTopic.set(topic, (byTopic.get(topic) ?? 0) + n);
    }
    return { missCounts: counts, topicCounts: [...byTopic.entries()].sort((a, b) => b[1] - a[1]) };
  }, [progress]);

  const missedIds = [...missCounts.keys()].filter((id) => questionById.has(id));

  if (missedIds.length === 0) {
    return <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
      <p className="text-slate-300">{t("empty")}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href="/test" className="inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950">{t("takeTest")}</Link>
        <Link href="/quiz" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-100">{t("openQuiz")}</Link>
      </div>
    </section>;
  }

  return <div className="space-y-6">
    <section className="space-y-3" aria-labelledby="weak-topics-heading">
      <h2 id="weak-topics-heading" className="text-xl font-semibold text-white">{t("topicsHeading")}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">{topicCounts.map(([topicId, misses]) => {
        const topic = getTopic(topicId);
        return <li key={topicId} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="font-semibold text-white">{topic?.title ?? topicId}</p>
          <p className="text-sm text-slate-300">{t("missCount", { count: misses })}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/notes/${topicId}`} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("reviewNotes")}</Link>
            <Link href={`/quiz?topic=${topicId}`} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("drillTopic")}</Link>
          </div>
        </li>;
      })}</ul>
    </section>
    <section className="space-y-3" aria-labelledby="missed-drill-heading">
      <h2 id="missed-drill-heading" className="text-xl font-semibold text-white">{t("drillHeading")}</h2>
      <p className="text-sm text-slate-300">{t("drillIntro", { count: missedIds.length })}</p>
      <QuizRunner initialTopic="all" questionIds={missedIds} />
    </section>
  </div>;
}
