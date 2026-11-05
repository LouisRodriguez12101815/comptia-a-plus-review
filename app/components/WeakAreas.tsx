"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ExplanationText } from "@/app/components/ExplanationText";
import { QuizRunner } from "@/app/components/QuizRunner";
import { getTopic, questions } from "@/lib/content";
import { conceptVideos } from "@/lib/concept-videos";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import { visualItemsForTopic } from "@/lib/visuals";
import { remediationForQuestion, rankMissedClusters, rankMissedQuestions } from "@/lib/weak-areas";

export function WeakAreas() {
  const t = useTranslations("weakAreas");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);

  const remediation = useMemo(
    () => rankMissedQuestions(progress, questions).map((missed) => remediationForQuestion(missed, {
      videos: conceptVideos,
      visualsForTopic: visualItemsForTopic,
      topicTitleFor: (topicId) => getTopic(topicId)?.title,
      questions,
    })),
    [progress],
  );
  const clusters = rankMissedClusters(remediation);
  const missedIds = remediation.map(({ question }) => question.id);

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
    <section data-cluster-summary aria-labelledby="weak-clusters-heading" className="space-y-3">
      <h2 id="weak-clusters-heading" className="text-xl font-semibold text-white">{t("clusterHeading")}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {clusters.map((cluster, index) => <li key={cluster.clusterId} data-cluster-id={cluster.clusterId} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-300">{index === 0 ? t("primaryWeakness") : index === 1 ? t("secondaryWeakness") : t("otherWeakness")}</p>
          <p className="mt-1 font-semibold text-white">{cluster.clusterLabel}</p>
          <p className="mt-1 text-sm text-slate-300">{t("clusterMisses", { count: cluster.misses })}</p>
        </li>)}
      </ul>
    </section>
    <section className="space-y-3" aria-labelledby="weak-remediation-heading">
      <h2 id="weak-remediation-heading" className="text-xl font-semibold text-white">{t("remediationHeading")}</h2>
      {remediation.map((item) => {
        const answer = Array.isArray(item.question.answer)
          ? item.question.answer.map((index) => item.question.choices[index]).join(" · ")
          : item.question.choices[item.question.answer];
        return <article key={item.question.id} data-remediation-card={item.question.id} className="space-y-4 rounded-2xl border border-amber-900/70 bg-slate-900 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">{t("missedStatus", { count: item.misses })}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{item.question.prompt}</h3>
            <p className="mt-2 text-sm text-slate-400">{t("topicContext", { topic: item.topicTitle })}</p>
          </div>
          <div className="space-y-2 text-sm">
            {item.selectedAnswer && <p className="text-slate-300"><strong>{t("yourAnswer")}</strong> {item.selectedAnswer}</p>}
            <p className="text-teal-100"><strong>{t("correctAnswer")}</strong> {answer}</p>
            {item.whyWrong && <p data-remediation-why-wrong className="text-slate-300"><strong>{t("whyWrong")}</strong> {item.whyWrong}</p>}
            <p className="text-slate-300"><strong>{t("why")}</strong> <ExplanationText text={item.question.explanation} /></p>
            {item.examClue && <p data-remediation-clue className="text-slate-300"><strong>{t("examClue")}</strong> {item.examClue}</p>}
            {item.memoryRule && <p data-remediation-rule className="text-amber-200"><strong>{t("memoryRule")}</strong> {item.memoryRule}</p>}
            <p data-remediation-cluster className="text-slate-400"><strong>{t("conceptCluster")}</strong> {item.clusterLabel}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {item.video && <Link data-remediation-video href={`/networking/videos/${item.video.slug}`} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("watchVideo", { title: item.video.title })}</Link>}
            {item.visual && <Link data-remediation-visual href={`/visuals/${item.visual.file}`} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("exploreVisual", { title: item.visual.title })}</Link>}
            <Link data-remediation-notes href={item.notesHref} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("reviewNotes")}</Link>
            <Link data-remediation-retry href={item.retryQuestionIds.length > 0
              ? `/quiz?questions=${encodeURIComponent(item.retryQuestionIds.join(","))}`
              : `/quiz?topic=${encodeURIComponent(item.question.topicId)}`} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{item.retryQuestionIds.length > 0 ? t("retryConcept") : t("retryQuestion")}</Link>
          </div>
        </article>;
      })}
    </section>
    <section className="space-y-3" aria-labelledby="missed-drill-heading">
      <h2 id="missed-drill-heading" className="text-xl font-semibold text-white">{t("drillHeading")}</h2>
      <p className="text-sm text-slate-300">{t("drillIntro", { count: missedIds.length })}</p>
      <QuizRunner initialTopic="all" questionIds={missedIds} />
    </section>
  </div>;
}
