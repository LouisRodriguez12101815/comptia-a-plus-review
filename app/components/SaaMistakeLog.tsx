"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { questions } from "@/lib/content";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import {
  filterMistakeRows,
  mistakeCardHref,
  mistakeDrillLinks,
  mistakeRetestIds,
  mistakeSummary,
  saaMistakeLog,
  type MistakeFilter,
  type MistakeStatus,
} from "@/lib/saa-mistake-log";
import { MISS_REASONS, saaRotationHistory, type MissReason } from "@/lib/saa-test-skills";

const statuses: MistakeStatus[] = ["misconception", "active", "mastered"];

function optionList(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

export function SaaMistakeLog() {
  const t = useTranslations("saaMistakes");
  const skills = useTranslations("saaTestSkills");
  const decks = useTranslations("drillDecks") as unknown as (key: string) => string;
  const locale = useLocale();
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState<MistakeFilter>({ domain: "", task: "", status: "", reason: "" });
  const attempts = useMemo(
    () => [...progress.quizAttempts, ...progress.mockAttempts],
    [progress.quizAttempts, progress.mockAttempts],
  );
  const rows = useMemo(() => saaMistakeLog(attempts, questions), [attempts]);
  const summary = useMemo(() => mistakeSummary(rows, now), [rows, now]);
  const visible = useMemo(() => filterMistakeRows(rows, filter), [rows, filter]);
  const retestIds = useMemo(() => mistakeRetestIds(visible, saaRotationHistory(progress)), [visible, progress]);
  const tasks = useMemo(
    () => optionList(visible.filter((row) => row.status !== "mastered").map((row) => row.task)),
    [visible],
  );
  const drills = useMemo(() => mistakeDrillLinks(tasks), [tasks]);
  const when = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }), [locale]);

  function setField(key: keyof MistakeFilter, value: string) {
    setFilter((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="max-w-prose text-slate-300">{t("intro")}</p>
      </header>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby="mistake-summary">
        <h2 id="mistake-summary" className="text-lg font-semibold text-white">{t("summaryHeading")}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          <li className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-sm text-sky-100">{t("activeCount", { count: summary.active })}</li>
          <li className="rounded-full border border-rose-400/50 bg-rose-400/10 px-3 py-1 text-sm text-rose-100">{t("misconceptionCount", { count: summary.misconceptions })}</li>
          <li className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">{t("masteredWeek", { count: summary.masteredThisWeek })}</li>
        </ul>
        <p className="mt-3 text-sm text-slate-300">
          {summary.weakestTasks.length === 0
            ? t("weakestEmpty")
            : t("weakest", { tasks: summary.weakestTasks.map((item) => t("weakestTask", { task: item.task, count: item.count })).join(", ") })}
        </p>
      </section>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("filters")}>
        <label className="text-sm text-slate-300">
          {t("domain")}
          <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={filter.domain} onChange={(event) => setField("domain", event.target.value)}>
            <option value="">{t("all")}</option>
            {optionList(rows.map((row) => row.domain)).map((domain) => <option key={domain} value={domain}>{domain}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          {t("task")}
          <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={filter.task} onChange={(event) => setField("task", event.target.value)}>
            <option value="">{t("all")}</option>
            {optionList(rows.map((row) => row.task)).map((task) => <option key={task} value={task}>{task}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          {t("status")}
          <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={filter.status} onChange={(event) => setField("status", event.target.value as MistakeStatus | "")}>
            <option value="">{t("all")}</option>
            {statuses.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          {t("reason")}
          <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={filter.reason} onChange={(event) => setField("reason", event.target.value as MissReason | "")}>
            <option value="">{t("all")}</option>
            {MISS_REASONS.map((reason) => <option key={reason} value={reason}>{skills(`reasons.${reason}`)}</option>)}
          </select>
        </label>
      </form>

      <div className="flex flex-wrap gap-2">
        {retestIds.length > 0 ? (
          <Link href={`/quiz?exam=saa-c03&questions=${retestIds.join(",")}`} className="inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 text-sm font-medium text-slate-950">{t("retest", { count: retestIds.length })}</Link>
        ) : (
          <p className="inline-flex min-h-11 items-center text-sm text-slate-400">{t("retestEmpty")}</p>
        )}
        {tasks.length > 0 ? (
          <Link href={mistakeCardHref(tasks)} className="inline-flex min-h-11 items-center rounded-full border border-teal-300 px-5 text-sm text-teal-100">{t("reviewCards")}</Link>
        ) : null}
      </div>
      {tasks.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("reviewCards")}>
          {tasks.map((task) => (
            <li key={task}>
              <Link href={mistakeCardHref([task])} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4">{t("taskCards", { task })}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      {drills.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("drills")}>
          {drills.map((drill) => (
            <li key={drill.id}>
              <Link href={drill.href} className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-cyan-100">{decks(`${drill.id}.title`)}</Link>
            </li>
          ))}
        </ul>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400">{rows.length === 0 ? t("empty") : t("filterEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="px-3 py-3 font-medium">{t("prompt")}</th>
                <th className="px-3 py-3 font-medium">{t("task")}</th>
                <th className="px-3 py-3 font-medium">{t("domain")}</th>
                <th className="px-3 py-3 font-medium">{t("timesMissed")}</th>
                <th className="px-3 py-3 font-medium">{t("correctSince")}</th>
                <th className="px-3 py-3 font-medium">{t("lastResult")}</th>
                <th className="px-3 py-3 font-medium">{t("lastConfidence")}</th>
                <th className="px-3 py-3 font-medium">{t("reason")}</th>
                <th className="px-3 py-3 font-medium">{t("lastSeen")}</th>
                <th className="px-3 py-3 font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  <td className="max-w-xs px-3 py-3 text-white">{row.prompt}</td>
                  <td className="px-3 py-3 font-mono text-teal-200">{row.task || t("none")}</td>
                  <td className="px-3 py-3">{row.domain || t("none")}</td>
                  <td className="px-3 py-3">{row.timesMissed}</td>
                  <td className="px-3 py-3">{row.correctSinceLastMiss}</td>
                  <td className="px-3 py-3">{t(`results.${row.lastResult}`)}</td>
                  <td className="px-3 py-3">{row.lastConfidence ? skills(row.lastConfidence) : t("none")}</td>
                  <td className="px-3 py-3">{row.missReason ? skills(`reasons.${row.missReason}`) : t("none")}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{when.format(row.lastSeen)}</td>
                  <td className="px-3 py-3">{t(`statuses.${row.status}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
