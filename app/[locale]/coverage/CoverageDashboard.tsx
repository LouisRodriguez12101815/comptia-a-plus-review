"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  examCoverage, filterCoverage, rankGaps, summarizeCoverage,
  type CoverageMatrix, type CoverageRow,
} from "@/lib/objective-coverage.mjs";

import { DomainOverview } from "./DomainOverview";

const statusStyles: Record<string, string> = {
  covered: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  partial: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  missing: "border-slate-600 bg-slate-800 text-slate-200",
};
const control = "mt-2 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";

export function CoverageDashboard({ objectives, rows, topicTitles }: {
  objectives: CoverageMatrix; rows: CoverageRow[]; topicTitles: Record<string, string>;
}) {
  const t = useTranslations("coverageDashboard");
  const statusLabels: Record<string, string> = {
    covered: t("statusCovered"),
    partial: t("statusPartial"),
    missing: t("statusMissing"),
  };
  const [exam, setExam] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const visible = filterCoverage(rows, { exam, status, search });
  const summary = summarizeCoverage(visible);
  // Deliberately independent of the filters below: this is CLI gap 1.
  const next = rankGaps(rows)[0];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("heading")}</h1>
        <p className="max-w-3xl text-slate-300">{t("intro")}</p>
        <Link href="/assessment-workflow" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-teal-300 underline underline-offset-4 hover:text-teal-200">
          {t("assessmentWorkflow")}<span aria-hidden="true"> →</span>
        </Link>
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-slate-300">
          <p className="font-medium text-amber-200">{objectives.reviewed ? t("reviewed") : t("preliminary")}</p>
          <p className="mt-2">{t("statusExplainer")}</p>
          <p className="mt-2">{t("weightsExplainer")}</p>
        </div>
      </header>

      <section aria-labelledby="next-heading" className="rounded-2xl border border-teal-400/40 bg-teal-400/5 p-5" data-testid="global-next">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-300">{t("globalRecommendation")}</p>
        <h2 id="next-heading" className="mt-2 text-xl font-semibold text-white">{t("nextHeading")}</h2>
        {next ? <>
          <p className="mt-3 font-medium text-teal-200">{next.exam} / {next.id} · {next.title}</p>
          <p className="mt-2 text-sm text-slate-300">{t("nextMeta", {
            status: statusLabels[next.status] ?? next.status,
            domainTitle: next.domainTitle,
            weight: next.weight,
          })}</p>
          {next.note && <p className="mt-2 text-sm text-slate-300">{next.note}</p>}
          <p className="mt-2 text-sm text-slate-400">{t("nextVerify")}</p>
        </> : <p className="mt-3 text-slate-300">{t("noGaps")}</p>}
      </section>

      <section aria-labelledby="exam-summary-heading" className="space-y-3">
        <h2 id="exam-summary-heading" className="text-xl font-semibold">{t("summariesHeading")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {objectives.exams.map((item) => {
            const stats = examCoverage(item, rows);
            return <article key={item.code} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4" data-testid={`summary-${item.code}`}>
              <h3 className="font-medium text-white">{item.name}</h3>
              <p className="mt-1 font-mono text-sm text-teal-300">{item.code}</p>
              <p className="mt-3 text-2xl font-semibold">{t.rich("weightedCoverage", {
                percent: stats.weighted,
                muted: (chunks) => <span className="text-sm font-normal text-slate-300">{chunks}</span>,
              })}</p>
              <p className="mt-2 text-sm text-slate-300">{t("summaryCounts", { covered: stats.covered, partial: stats.partial, missing: stats.missing })}</p>
              <p className="mt-1 text-xs text-slate-400">{t("summaryTotal", { total: stats.total })}</p>
              <Link href={`/test?exam=${item.code}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-teal-300 underline underline-offset-4 hover:text-teal-200">{t("takeTest")}</Link>
            </article>;
          })}
        </div>
      </section>

      <DomainOverview objectives={objectives} rows={rows} />

      <section aria-labelledby="browse-heading" className="space-y-4">
        <h2 id="browse-heading" className="text-xl font-semibold">{t("browseHeading")}</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-sm font-medium text-slate-200">
              <label htmlFor="coverage-exam">{t("examLabel")}</label>
              <select id="coverage-exam" className={control} value={exam} onChange={(event) => setExam(event.target.value)}>
                <option value="all">{t("allExams")}</option>
                {objectives.exams.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
              </select>
            </div>
            <div className="text-sm font-medium text-slate-200">
              <label htmlFor="coverage-status">{t("statusLabel")}</label>
              <select id="coverage-status" className={control} value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">{t("allStatuses")}</option>
                <option value="covered">{t("statusCovered")}</option><option value="partial">{t("statusPartial")}</option><option value="missing">{t("statusMissing")}</option>
              </select>
            </div>
            <label className="text-sm font-medium text-slate-200 sm:col-span-2">{t("searchLabel")}
              <input type="search" className={control} placeholder={t("searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
          <button type="button" onClick={() => { setExam("all"); setStatus("all"); setSearch(""); }} className="mt-3 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-teal-300 underline underline-offset-4 hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-teal-300">{t("resetFilters")}</button>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-300" data-testid="result-count">{t("resultCount", {
          shown: summary.total,
          total: rows.length,
          covered: summary.covered,
          partial: summary.partial,
          missing: summary.missing,
        })}</p>
        <p className="text-sm text-slate-400">{t("countsNote")}</p>
        {visible.length === 0 ? <div className="rounded-xl border border-dashed border-slate-600 p-6 text-slate-300"><h3 className="font-medium text-white">{t("noMatchTitle")}</h3><p className="mt-2">{t("noMatchBody")}</p></div> :
          <ul className="space-y-4" aria-label={t("matchingList")}>
            {visible.map((row) => <li key={row.key} data-testid={`objective-${row.key}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 basis-64 font-semibold text-white"><span className="mb-1 block font-mono text-sm text-teal-300">{row.exam} / {row.id}</span>{row.title}</h3>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyles[row.status]}`}>{statusLabels[row.status] ?? row.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{t("rowDomain", { domain: row.domain, title: row.domainTitle, weight: row.weight })}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm sm:grid-cols-5">
                {([[t("statNotes"), row.notes], [t("statFlashcards"), row.cards], [t("statQuiz"), row.quiz], [t("statLabs"), row.labs], [t("statVisuals"), row.visuals]] as const).map(([label, value]) => <div key={label}><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 font-mono text-lg text-slate-100">{value}</dd></div>)}
              </dl>
              {row.topics.length ? <div className="mt-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("mappedNotes")}</p><ul className="mt-1 space-y-1">{row.topics.map((id) => <li key={id}><Link href={`/notes/${encodeURIComponent(id)}`} className="inline-flex min-h-11 items-center break-words text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">{topicTitles[id] ?? id}</Link></li>)}</ul></div> : <p className="mt-4 text-sm text-slate-400">{t("noMappedTopics")}</p>}
              {row.note && <p className="mt-3 border-t border-slate-700 pt-3 text-sm text-slate-300">{row.note}</p>}
            </li>)}
          </ul>}
      </section>
    </div>
  );
}
