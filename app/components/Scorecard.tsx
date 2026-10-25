"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions, topics } from "@/lib/content";
import { buildExamPool } from "@/lib/exam-test.mjs";
import type { CoverageMatrix } from "@/lib/objective-coverage.mjs";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import { confusionPairs, drillQuestionIds } from "@/lib/confusions";
import { LookAlike } from "@/app/components/LookAlike";
import { confidenceByObjective, dueReviews, objectiveStats, weakestObjectives, type ObjectiveStat } from "@/lib/weakness";

const statusStyle: Record<ObjectiveStat["status"], string> = {
  weak: "border-amber-400/50 bg-amber-400/10 text-amber-200",
  ok: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  strong: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
  few: "border-slate-600 bg-slate-800/60 text-slate-300",
  untested: "border-slate-700 bg-transparent text-slate-400",
};

const barStyle: Record<ObjectiveStat["status"], string> = {
  weak: "bg-amber-400",
  ok: "bg-sky-400",
  strong: "bg-emerald-400",
  few: "bg-slate-500",
  untested: "bg-slate-700",
};

/**
 * Per-objective results from every saved timed test for one exam, with a link
 * that starts a test on any objective. Colour always comes with a text label.
 */
export function Scorecard({ exam }: { exam: string }) {
  const t = useTranslations("scorecard");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const pool = useMemo(() => buildExamPool({ objectives: objectives as CoverageMatrix, questions, topics, examCode: exam }), [exam]);
  const stats = useMemo(() => objectiveStats(pool, progress.mockAttempts, exam), [pool, progress.mockAttempts, exam]);
  const weakest = weakestObjectives(stats);
  const counts = stats.reduce<Record<ObjectiveStat["status"], number>>((acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }), { weak: 0, ok: 0, strong: 0, few: 0, untested: 0 });
  const sittings = progress.mockAttempts.filter((attempt) => attempt.exam === exam).length;
  const confidence = useMemo(() => confidenceByObjective(pool, progress.mockAttempts, exam), [pool, progress.mockAttempts, exam]);
  const [now] = useState(() => Date.now());
  const due = useMemo(() => dueReviews(progress.mockAttempts, exam, now).length, [progress.mockAttempts, exam, now]);
  const pairs = useMemo(() => {
    const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
    const inPool = new Set(pool.domains.flatMap((d) => d.objectives.flatMap((o) => o.questionIds)));
    const bank = questions.filter((q) => inPool.has(q.id));
    return confusionPairs(progress.mockAttempts, exam, byId).slice(0, 8).map((pair) => ({ ...pair, drill: drillQuestionIds(pair, bank) }));
  }, [pool, progress.mockAttempts, exam]);
  const totals = [...confidence.values()].reduce((acc, c) => ({ sureWrong: acc.sureWrong + c.sureWrong, guessRight: acc.guessRight + c.guessRight }), { sureWrong: 0, guessRight: 0 });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby="scorecard-summary">
        <h2 id="scorecard-summary" className="text-lg font-semibold text-white">{t("summaryHeading")}</h2>
        <p className="mt-1 text-sm text-slate-300">{t("summaryLine", { sittings })}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(["weak", "ok", "strong", "few", "untested"] as const).map((status) => (
            <li key={status} className={`rounded-full border px-3 py-1 text-sm ${statusStyle[status]}`}>{t(`status.${status}`)} · {counts[status]}</li>
          ))}
        </ul>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={t("confidenceSummary")}>
          <li className="rounded-full border border-rose-400/50 bg-rose-400/10 px-3 py-1 text-sm text-rose-100">{t("sureWrongChip", { count: totals.sureWrong })}</li>
          <li className="rounded-full border border-violet-400/50 bg-violet-400/10 px-3 py-1 text-sm text-violet-100">{t("guessRightChip", { count: totals.guessRight })}</li>
          <li className="rounded-full border border-slate-600 bg-slate-800/60 px-3 py-1 text-sm text-slate-200">{t("dueChip", { count: due })}</li>
        </ul>
        {weakest.length > 0 ? (
          <Link href={`/test?exam=${exam}&focus=${weakest.map((s) => s.id).join(",")}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400">
            {t("practiceWeakest", { count: weakest.length })}
          </Link>
        ) : (
          <p className="mt-4 text-sm text-slate-400">{t("noWeakYet")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby="lookalike-heading">
        <h2 id="lookalike-heading" className="text-lg font-semibold text-white">{t("lookAlikeHeading")}</h2>
        {pairs.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">{t("lookAlikeNone")}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-300">{t("lookAlikeIntro")}</p>
            <ol className="mt-3 space-y-4">
              {pairs.map((pair) => (
                <li key={pair.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-100">
                    <span className="font-medium text-white">{pair.group.title}</span> · {t("lookAlikeCount", { count: pair.count, picked: pair.picked.label, answer: pair.answer.label })}
                  </p>
                  <LookAlike answer={pair.answer} picked={pair.picked} answerLabel={t("lookAlikeAnswer")} pickedLabel={t("lookAlikePicked")} />
                  <Link href={`/test?exam=${exam}&drill=${pair.drill.join(",")}&pair=${encodeURIComponent(pair.key)}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">
                    {t("lookAlikeDrill", { count: pair.drill.length })}<span className="sr-only"> {pair.answer.label} / {pair.picked.label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      {pool.domains.map((domain) => (
        <section key={domain.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby={`domain-${domain.id}`}>
          <h2 id={`domain-${domain.id}`} className="text-lg font-semibold text-white">
            <span className="font-mono text-teal-300">{domain.id}</span> {domain.title} <span className="text-sm font-normal text-slate-400">· {t("weight", { weight: domain.weight })}</span>
          </h2>
          <ul className="mt-3 divide-y divide-slate-800">
            {stats.filter((s) => s.domainId === domain.id).map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-100"><span className="font-mono text-teal-300">{s.id}</span> {s.title}</p>
                  <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full ${barStyle[s.status]}`} style={{ width: `${s.recent ?? 0}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {s.answered === 0 ? t("noAnswers") : t("answeredLine", { correct: s.correct, answered: s.answered, recent: s.recent ?? 0 })}
                    {s.trend ? ` · ${t(`trend.${s.trend}`)}` : ""}
                  </p>
                  {(confidence.get(s.id)?.sureWrong || confidence.get(s.id)?.guessRight) ? (
                    <p className="mt-1 text-xs">
                      {confidence.get(s.id)!.sureWrong > 0 && <span className="text-rose-200">{t("sureWrongLine", { count: confidence.get(s.id)!.sureWrong })}</span>}
                      {confidence.get(s.id)!.sureWrong > 0 && confidence.get(s.id)!.guessRight > 0 && <span className="text-slate-500"> · </span>}
                      {confidence.get(s.id)!.guessRight > 0 && <span className="text-violet-200">{t("guessRightLine", { count: confidence.get(s.id)!.guessRight })}</span>}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyle[s.status]}`}>{t(`status.${s.status}`)}</span>
                  <Link href={`/test?exam=${exam}&focus=${s.id}`} className="inline-flex min-h-11 items-center text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">
                    {t("practice")}<span className="sr-only"> {s.id}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
