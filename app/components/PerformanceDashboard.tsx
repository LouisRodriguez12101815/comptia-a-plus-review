"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions, topics } from "@/lib/content";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import {
  attemptsForWindow,
  objectivePerformance,
  performanceSummary,
  questionPerformance,
  recentActivity,
  recommendedQuestions,
  recoveredQuestions,
  repeatedMisses,
  scoreTrend,
  topicPerformance,
  remediationOutcomes,
  resourceOutcomes,
  telemetryForWindow,
  type PerformanceWindow,
  type QuestionPerformance,
} from "@/lib/learner-performance";
import type { StudyEvent } from "@/lib/learner/telemetry";

const windows: PerformanceWindow[] = ["24h", "7d", "30d", "history"];
const filters = ["all", "incorrect", "correct", "repeated", "recovered"] as const;
const sorts = ["misses", "accuracy", "recent", "attempted"] as const;
type Filter = (typeof filters)[number];
type Sort = (typeof sorts)[number];

const formatDate = (value: number) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function QuestionRow({ row, t }: { row: QuestionPerformance; t: ReturnType<typeof useTranslations<"performance">> }) {
  return <details className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
    <summary className="cursor-pointer list-inside text-slate-100">
      <span className="font-medium">{row.question.prompt}</span>
      <span className="ml-2 text-sm text-slate-400">{row.accuracy}% · {t("attempts", { count: row.attempts })}</span>
    </summary>
    <div className="mt-3 space-y-2 pl-5 text-sm text-slate-300">
      <p>{t("correctCount", { correct: row.correct, incorrect: row.incorrect })}</p>
      <p>{t("lastAttempt")}: {formatDate(row.lastSeenAt)}</p>
      {row.lastMissAt && <p>{t("lastMissed")}: {formatDate(row.lastMissAt)}</p>}
      {row.selectedWrongAnswer && <p>{t("selectedWrong")}: {row.selectedWrongAnswer}</p>}
      {row.mostCommonWrongChoice && <p>{t("mostCommonWrong", { percent: row.mostCommonWrongChoice.percent, answer: row.question.choices[row.mostCommonWrongChoice.index] ?? "" })}</p>}
      {row.currentlyRecovered && <p className="text-teal-200">{t("recoveredLabel")}</p>}
      {row.everRecovered && !row.currentlyRecovered && <p className="text-slate-400">{t("previouslyRecovered")}</p>}
      {row.history.length > 1 && <ul aria-label={t("attemptTimeline")} className="border-l border-slate-700 pl-3">{row.history.map((entry, index) => <li key={`${entry.at}-${index}`}>{formatDate(entry.at)} · {entry.correct ? t("correctEvent") : t("incorrectEvent")}</li>)}</ul>}
      <div className="flex flex-wrap gap-3 pt-1">
        <Link className="text-teal-200 underline underline-offset-4" href={`/quiz?topic=${encodeURIComponent(row.question.topicId)}`}>{t("retry")}</Link>
        <Link className="text-teal-200 underline underline-offset-4" href={`/notes/${row.question.topicId}`}>{t("notes")}</Link>
      </div>
    </div>
  </details>;
}

export function PerformanceDashboard() {
  const t = useTranslations("performance");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const [window, setWindow] = useState<PerformanceWindow>("24h");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("misses");
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());
  const [telemetry, setTelemetry] = useState<StudyEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/learner/telemetry", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ events?: StudyEvent[] }> : { events: [] })
      .then((body) => { if (!cancelled) setTelemetry(Array.isArray(body.events) ? body.events : []); })
      .catch(() => { if (!cancelled) setTelemetry([]); });
    return () => { cancelled = true; };
  }, []);

  const data = useMemo(() => {
    const rows = questionPerformance(progress, questions, { window, now, topics });
    const objectiveTitles = Object.fromEntries(objectives.exams.flatMap((exam) => exam.domains.flatMap((domain) => domain.objectives.map((objective) => [`${exam.code}:${objective.id}`, objective.title]))));
    const summary = performanceSummary(progress, window, now);
    const events = telemetryForWindow(telemetry, window, now);
    const remediation = remediationOutcomes(events);
    const filtered = rows.filter((row) => {
      if (filter === "incorrect" && row.incorrect === 0) return false;
      if (filter === "correct" && row.correct === 0) return false;
      if (filter === "repeated" && row.incorrect < 2) return false;
      if (filter === "recovered" && !row.currentlyRecovered) return false;
      return !query.trim() || `${row.question.prompt} ${row.questionId} ${row.topic?.title ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    });
    const sorted = [...filtered].sort((a, b) => sort === "accuracy"
      ? a.accuracy - b.accuracy || b.incorrect - a.incorrect
      : sort === "recent"
        ? b.lastSeenAt - a.lastSeenAt
        : sort === "attempted"
          ? b.attempts - a.attempts || b.incorrect - a.incorrect
          : b.incorrect - a.incorrect || (b.lastMissAt ?? 0) - (a.lastMissAt ?? 0) || a.questionId.localeCompare(b.questionId));
    return {
      summary,
      rows: sorted,
      objectives: objectivePerformance(rows, objectiveTitles),
      topics: topicPerformance(rows),
      repeated: repeatedMisses(rows),
      recovered: recoveredQuestions(rows),
      recommended: recommendedQuestions(rows),
      trend: scoreTrend(progress, window, now),
      activity: recentActivity(progress, window, now).slice(0, 10),
      mocks: attemptsForWindow(progress, window, now).filter((attempt) => attempt.kind === "mock"),
      remediation,
      resourceOutcomes: resourceOutcomes(events),
    };
  }, [filter, now, progress, query, sort, telemetry, window]);

  return <div className="space-y-8">
    <section aria-labelledby="performance-window-heading" className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 id="performance-window-heading" className="text-lg font-semibold text-white">{t("windowLabel")}</h2><p className="text-sm text-slate-400">{t("windowDescription")}</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("windowLabel")}>
          {windows.map((item) => <button key={item} type="button" onClick={() => setWindow(item)} aria-pressed={window === item} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${window === item ? "border-teal-400 bg-teal-400 text-slate-950" : "border-slate-600 text-slate-200"}`}>{t(`window${item === "24h" ? "24h" : item === "7d" ? "7d" : item === "30d" ? "30d" : "History"}` as never)}</button>)}
        </div>
      </div>
    </section>

    <section aria-labelledby="performance-summary-heading" className="space-y-3">
      <h2 id="performance-summary-heading" className="text-xl font-semibold text-white">{t("summaryHeading")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[["quizzes", data.summary.quizzes], ["mockExams", data.summary.mocks], ["questions", data.summary.questions], ["accuracy", `${data.summary.accuracy}%`], ["needsReview", data.repeated.length]] .map(([key, value]) => <div key={key} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4"><p className="text-sm text-slate-400">{t(key as never)}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></div>)}
      </div>
    </section>

    {data.summary.quizzes + data.summary.mocks === 0 ? <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5"><p className="text-slate-300">{t("noAttempts")}</p><Link href="/quiz" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950">{t("takeQuiz")}</Link></section> : <>
      <section aria-labelledby="performance-trend-heading" className="space-y-3">
        <h2 id="performance-trend-heading" className="text-xl font-semibold text-white">{t("trendHeading")}</h2>
        <figure className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <figcaption className="text-sm text-slate-300">{t("trendDescription")}</figcaption>
          <svg role="img" aria-label={t("trendChartLabel")} viewBox="0 0 600 160" className="mt-4 h-40 w-full" preserveAspectRatio="none">
            <path d="M0 140H600" stroke="currentColor" className="text-slate-700" />
            {data.trend.length > 0 && <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-teal-300" points={data.trend.map((point, index) => `${data.trend.length === 1 ? 300 : (index / (data.trend.length - 1)) * 600},${150 - point.percent * 1.3}`).join(" ")} />}
          </svg>
          <p className="mt-2 text-sm text-slate-400">{data.trend.map((point) => `${point.label}: ${point.percent}%`).join(" · ")}</p>
        </figure>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("objectivesHeading")}</h2>{data.objectives.length === 0 ? <p className="text-slate-400">{t("noData")}</p> : <ul className="space-y-2">{data.objectives.slice(0, 6).map((item) => <li key={item.key} className="rounded-xl border border-slate-800 p-3"><div className="flex justify-between gap-3"><span className="text-slate-200">{item.exam} · {item.objectiveId}</span><span className="font-mono text-slate-400">{item.accuracy}%</span></div><p className="mt-1 text-sm text-slate-400">{item.title}</p></li>)}</ul>}</div>
        <div className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("topicsHeading")}</h2>{data.topics.length === 0 ? <p className="text-slate-400">{t("noData")}</p> : <ul className="space-y-2">{data.topics.slice(0, 6).map((item) => <li key={item.topicId} className="rounded-xl border border-slate-800 p-3"><div className="flex justify-between gap-3"><span className="text-slate-200">{item.title}</span><span className="font-mono text-slate-400">{item.accuracy}%</span></div><p className="mt-1 text-sm text-slate-400">{t("missedCount", { count: item.incorrect })}</p></li>)}</ul>}</div>
      </section>

      <section aria-labelledby="performance-remediation-heading" className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3"><h2 id="performance-remediation-heading" className="text-xl font-semibold text-white">{t("remediationActivityHeading")}</h2><p className="text-sm text-slate-400">{t("telemetryNote")}</p><div className="grid grid-cols-3 gap-2">{[["remediationOpened", data.remediation.reduce((sum, row) => sum + row.opened, 0)], ["resourcesOpened", data.remediation.reduce((sum, row) => sum + row.resources, 0)], ["retriesStarted", data.remediation.reduce((sum, row) => sum + row.retries, 0)]].map(([key, value]) => <div key={key} className="rounded-xl border border-slate-800 p-3"><p className="text-xs text-slate-400">{t(key as never)}</p><p className="text-xl font-semibold text-white">{value}</p></div>)}</div><ul className="space-y-2">{data.remediation.slice(0, 5).map((row) => <li key={row.questionId} className="rounded-xl border border-slate-800 p-3 text-sm text-slate-300">{row.questionId} · {row.laterCorrect ? t("laterCorrect") : t("stillMissed")}</li>)}</ul></div>
        <div className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("resourceOutcomesHeading")}</h2><ul className="space-y-2">{data.resourceOutcomes.map((row) => <li key={row.resourceType} className="flex justify-between rounded-xl border border-slate-800 p-3 text-sm text-slate-300"><span>{t(`resourceType${row.resourceType[0].toUpperCase()}${row.resourceType.slice(1)}` as never)}</span><span>{row.opened} · {row.laterCorrect} {t("laterCorrect")}</span></li>)}</ul></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("repeatedHeading")}</h2>{data.repeated.length === 0 ? <p className="text-slate-400">{t("noRepeated")}</p> : data.repeated.slice(0, 5).map((row) => <QuestionRow key={row.questionId} row={row} t={t} />)}</div>
        <div className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("recoveredHeading")}</h2><p className="text-sm text-slate-400">{t("recoveredIntro")}</p>{data.recovered.length === 0 ? <p className="text-slate-400">{t("noRecovered")}</p> : data.recovered.slice(0, 5).map((row) => <QuestionRow key={row.questionId} row={row} t={t} />)}</div>
      </section>

      <section aria-labelledby="performance-history-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="performance-history-heading" className="text-xl font-semibold text-white">{t("historyHeading")}</h2><p className="text-sm text-slate-400">{t("historyDescription")}</p></div><Link href="/weak-areas" className="text-teal-200 underline underline-offset-4">{t("weakAreas")}</Link></div>
        <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm text-slate-300">{t("searchLabel")}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white" /></label><label className="text-sm text-slate-300">{t("filterLabel")}<select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white">{filters.map((item) => <option key={item} value={item}>{t(`filter${item[0].toUpperCase()}${item.slice(1)}` as never)}</option>)}</select></label><label className="text-sm text-slate-300">{t("sortLabel")}<select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white">{sorts.map((item) => <option key={item} value={item}>{t(`sort${item[0].toUpperCase()}${item.slice(1)}` as never)}</option>)}</select></label></div>
        {data.rows.length === 0 ? <p className="rounded-xl border border-slate-800 p-4 text-slate-400">{t("noQuestionHistory")}</p> : <div className="space-y-2">{data.rows.map((row) => <QuestionRow key={row.questionId} row={row} t={t} />)}</div>}
      </section>

      <section className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("mockHeading")}</h2>{data.mocks.length === 0 ? <p className="text-slate-400">{t("noMocks")}</p> : <ul className="space-y-2">{data.mocks.map((mock) => <li key={`${mock.at}-${mock.exam}`} className="rounded-xl border border-slate-800 p-4"><div className="flex justify-between gap-3"><span className="font-mono text-slate-200">{mock.exam}</span><span className="text-slate-300">{mock.percent}%</span></div><p className="mt-1 text-sm text-slate-400">{formatDate(mock.at)} · {mock.full ? t("full") : t("partial")}</p></li>)}</ul>}</section>
      <section className="space-y-3"><h2 className="text-xl font-semibold text-white">{t("activityHeading")}</h2><ul className="space-y-2">{data.activity.map((item) => <li key={`${item.kind}-${item.at}`} className="rounded-xl border border-slate-800 p-3 text-sm text-slate-300">{formatDate(item.at)} · {item.kind === "quiz" ? t("activityQuiz", { label: item.topicId ?? t("quiz") }) : t("activityMock", { label: item.exam ?? t("mock") })} · {item.percent}%</li>)}</ul></section>
      <section className="rounded-2xl border border-teal-900/60 bg-teal-950/20 p-5"><h2 className="text-xl font-semibold text-white">{t("recommendedHeading")}</h2><p className="mt-1 text-sm text-slate-300">{t("recommendedIntro")}</p>{data.recommended.length > 0 && <ul className="mt-3 space-y-2">{data.recommended.map((row) => <li key={row.questionId} className="text-sm text-slate-200">{row.question.prompt} <Link href={`/quiz?topic=${encodeURIComponent(row.question.topicId)}`} className="ml-2 text-teal-200 underline underline-offset-4">{t("retry")}</Link></li>)}</ul>}<Link href="/weak-areas" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950">{t("reviewWeakAreas")}</Link></section>
    </>}
  </div>;
}
