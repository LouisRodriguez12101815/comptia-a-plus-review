"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions, topics } from "@/lib/content";
import { buildExamPool } from "@/lib/exam-test.mjs";
import type { CoverageMatrix } from "@/lib/objective-coverage.mjs";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import { objectiveStats, weakestObjectives, type ObjectiveStat } from "@/lib/weakness";

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
        {weakest.length > 0 ? (
          <Link href={`/test?exam=${exam}&focus=${weakest.map((s) => s.id).join(",")}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400">
            {t("practiceWeakest", { count: weakest.length })}
          </Link>
        ) : (
          <p className="mt-4 text-sm text-slate-400">{t("noWeakYet")}</p>
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
