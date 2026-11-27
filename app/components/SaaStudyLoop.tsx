"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions } from "@/lib/content";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import { saaContrastHistory, saaContrastHref } from "@/lib/saa-contrast";
import { nextSaaQuestionIds, saaDomainSummary, saaNextSession } from "@/lib/saa-study-loop";
import { mostCommonMissReason, reasonTools, SAA_CLUSTERS, saaReviewMisses } from "@/lib/saa-test-skills";

function PatternCard({ id, title, diagram, when, docs, questionIds }: { id?: string; title: string; diagram: string; when: string; docs: string; questionIds: string[] }) {
  const t = useTranslations("saaStudyLoop");
  return (
    <li id={id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h4 className="font-medium text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-300">{diagram}</p>
      <p className="mt-2 text-sm text-slate-300">{when}</p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <a href={docs} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{t("docsLink")}</a>
        <Link href={`/quiz?exam=saa-c03&questions=${questionIds.join(",")}`} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{t("patternQuiz")}</Link>
      </p>
    </li>
  );
}

const domains = objectives.exams.find((exam) => exam.code === "saa-c03")?.domains.map((domain) => ({
  id: domain.id,
  title: domain.title,
})) ?? [];

export function SaaStudyLoop() {
  const t = useTranslations("saaStudyLoop");
  const contrastT = useTranslations("saaContrast");
  const skills = useTranslations("saaTestSkills");
  const mistakes = useTranslations("saaMistakes");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const domainRows = useMemo(
    () => saaDomainSummary([...progress.quizAttempts, ...progress.mockAttempts], questions, domains),
    [progress],
  );
  const nextIds = useMemo(
    () => nextSaaQuestionIds([...progress.quizAttempts, ...progress.mockAttempts], questions, domains),
    [progress],
  );
  const reviewMisses = useMemo(
    () => saaReviewMisses([...progress.quizAttempts, ...progress.mockAttempts], questions),
    [progress],
  );
  const commonReason = useMemo(
    () => mostCommonMissReason([...progress.quizAttempts, ...progress.mockAttempts]),
    [progress],
  );
  const now = useNow({ updateInterval: 60_000 }).getTime();
  const contrast = useMemo(
    () => saaContrastHistory([...progress.quizAttempts, ...progress.mockAttempts], now, questions),
    [now, progress],
  );
  const nextSession = saaNextSession(domainRows);
  const tools = reasonTools();
  const byId = useMemo(() => new Map(questions.map((question) => [question.id, question])), []);

  return (
    <section id="study-loop" aria-labelledby="saa-study-loop-heading" className="scroll-mt-24 space-y-6">
      <div>
        <h2 id="saa-study-loop-heading" className="text-lg font-medium text-white">{t("heading")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("targetNote")}</p>
      </div>

      <section aria-labelledby="next-session-heading" className="rounded-2xl border border-teal-700/60 bg-slate-900/80 p-5">
        <h3 id="next-session-heading" className="text-lg font-medium text-white">{t("session.heading")}</h3>
        {nextSession.kind === "empty" ? (
          <p className="mt-2 text-sm text-slate-300">{t("session.empty")}</p>
        ) : (
          <>
            <p className="mt-2 font-medium text-teal-100">{nextSession.domain.id} · {nextSession.domain.title}</p>
            <p className="mt-1 text-sm text-slate-300">{t(`session.${nextSession.kind}`, { correct: nextSession.domain.correct, answered: nextSession.domain.answered })}</p>
            <Link href={`/quiz?exam=saa-c03&domain=${nextSession.domain.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{t("session.practiceLink")}</Link>
          </>
        )}
        <p className="mt-2 text-xs text-slate-400">{t("session.caveat")}</p>
        <Link href="/practice-games/drills/aws-saa-confusion-pairs" className="mt-2 inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{t("session.contrasts")}</Link>
      </section>

      {(contrast.due.length > 0 || Object.values(contrast.counts).some((row) => row.answered > 0)) && (
        <section aria-labelledby="contrast-review-heading" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 id="contrast-review-heading" className="font-medium text-white">{contrastT("reviewHeading")}</h3>
          <p className="mt-1 text-sm text-slate-300">{contrastT("reviewIntro")}</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {(["first", "contrast", "delayed"] as const).map((mode) => {
              const { correct, answered } = contrast.counts[mode];
              return <div key={mode}><dt className="text-sm text-slate-300">{contrastT(`modes.${mode}`)}</dt><dd className="text-white">{answered ? contrastT("record", { correct, answered }) : contrastT("noRecord")}</dd></div>;
            })}
          </dl>
          {contrast.due.length > 0 && (
            <ul className="mt-3">
              {contrast.due.map(({ group, id }) => <li key={group}><Link href={saaContrastHref(id, "delayed")} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{contrastT("dueLink", { topic: contrastT(`${group}.title`) })}</Link></li>)}
            </ul>
          )}
        </section>
      )}

      {domainRows.length === 0 ? (
        <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">{t("empty")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {domainRows.map((domain) => (
            <li key={domain.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="font-medium text-white"><span className="font-mono text-teal-300">{domain.id}</span> {domain.title}</p>
              <p className="mt-1 text-sm text-slate-300">{t("domainLine", { correct: domain.correct, answered: domain.answered, percent: domain.percent, sittings: domain.sittings })}</p>
              {domain.weak ? <p className="mt-2 text-sm text-amber-200">{t("weak")}</p> : null}
              <Link href={`/quiz?exam=saa-c03&domain=${domain.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{t("domainQuiz")}</Link>
            </li>
          ))}
        </ul>
      )}

      <div id="saa-next-10">
        <h3 className="font-medium text-white">{t("nextHeading")}</h3>
        {nextIds.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">{t("nextEmpty")}</p>
        ) : (
          <Link href={`/quiz?exam=saa-c03&questions=${nextIds.join(",")}`} className="mt-2 inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950">{t("nextLink", { count: nextIds.length })}</Link>
        )}
      </div>

      <div>
        <h3 className="font-medium text-white">{skills("practiceHeading")}</h3>
        <p className="mt-1 text-sm text-slate-400">{skills("practiceIntro")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/test?exam=saa-c03&length=mini" className="inline-flex min-h-11 items-center rounded-full bg-teal-500 px-4 text-sm font-medium text-slate-950">{skills("miniLink")}</Link>
          <Link href="/quiz?exam=saa-c03&mode=twin" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-teal-100">{skills("twinLink")}</Link>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SAA_CLUSTERS.map((cluster) => (
            <li key={cluster.id}>
              <Link href={`/quiz?exam=saa-c03&cluster=${cluster.id}`} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{skills("clusterLink", { id: cluster.id, title: cluster.title })}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium text-white">{skills("reasonHeading")}</h3>
        <p className="mt-1 text-sm text-slate-300">{commonReason ? skills("reasonCommon", { reason: skills(`reasons.${commonReason}`) }) : skills("reasonEmpty")}</p>
        <ul className="mt-3 space-y-2">
          {tools.map((tool) => (
            <li key={tool.reason}>
              <Link href={tool.href} className={`inline-flex min-h-11 items-center text-sm underline underline-offset-4 ${tool.reason === commonReason ? "text-amber-200" : "text-teal-200"}`}>{skills(`reasonLinks.${tool.reason}`)}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium text-white">{t("missHeading")}</h3>
        <Link href="/aws-saa/mistakes" className="mt-1 inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{mistakes("link")}</Link>
        {reviewMisses.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">{t("missEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reviewMisses.slice(0, 10).map((miss) => (
              <li key={`${miss.id}-${miss.lucky ? "lucky" : "miss"}`} className="text-sm text-slate-200">
                {byId.get(miss.id)?.prompt} <span className="text-slate-400">{miss.lucky ? skills("luckyBadge") : t("missCount", { count: miss.misses })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-medium text-white">{t("patternsHeading")}</h3>
        <ul className="mt-3 grid gap-3">
          <PatternCard id="saa-pattern-multiaz" title={t("patterns.multiAz.title")} diagram={t("patterns.multiAz.diagram")} when={t("patterns.multiAz.when")} docs={t("patterns.multiAz.docs")} questionIds={["q-aws-found-02", "q-aws-found-06"]} />
          <PatternCard title={t("patterns.decouple.title")} diagram={t("patterns.decouple.diagram")} when={t("patterns.decouple.when")} docs={t("patterns.decouple.docs")} questionIds={["q-saa-practice-18", "q-saa-core-35"]} />
          <PatternCard title={t("patterns.cache.title")} diagram={t("patterns.cache.diagram")} when={t("patterns.cache.when")} docs={t("patterns.cache.docs")} questionIds={["q-saa-core-27", "q-saa-practice-52"]} />
          <PatternCard title={t("patterns.storage.title")} diagram={t("patterns.storage.diagram")} when={t("patterns.storage.when")} docs={t("patterns.storage.docs")} questionIds={["q-saa-costbatch-001", "q-aws-found-14"]} />
          <PatternCard title={t("patterns.cost.title")} diagram={t("patterns.cost.diagram")} when={t("patterns.cost.when")} docs={t("patterns.cost.docs")} questionIds={["q-saa-arch-32", "q-saa-arch-31"]} />
        </ul>
      </div>
    </section>
  );
}
