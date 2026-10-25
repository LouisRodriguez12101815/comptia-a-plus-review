"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import objectives from "@/content/objectives.json";
import { reportContent } from "@/app/components/ReportIssue";
import { getTopic, questions, topics } from "@/lib/content";
import {
  EXAM_FORMATS, TEST_LENGTHS, allocateByWeight, assessmentVersion, shuffleChoiceOrder, buildExamPool,
  draftFocused, draftTest, gradeTest, isCorrect, questionsForLength, secondsPerQuestion, sessionDurationSeconds,
  type TestPick, type TestResponse,
} from "@/lib/exam-test.mjs";
import type { CoverageMatrix } from "@/lib/objective-coverage.mjs";
import { getProgressSnapshot, getServerProgressSnapshot, recordMock, recordQuiz, subscribeProgress, type MockAttempt } from "@/lib/progress";
import { objectiveStats, weakestObjectives } from "@/lib/weakness";
import { evaluateReadiness } from "@/lib/readiness";
import type { Question } from "@/lib/types";

const examCodes = ["220-1201", "220-1202", "n10-009", "clf-c02", "saa-c03"] as const;
type ExamCode = (typeof examCodes)[number];
type Phase = "setup" | "running" | "done";
type RunKind = "standard" | "targeted" | "retest";
export type LabLink = { file: string; title: string };
/** A retest after a test: five questions on the objectives just missed. */
const RETEST_QUESTIONS = 5;

/** Strips the leading "Objective 1.2." label some explanations start with. */
function ruleText(explanation: string) {
  return explanation.replace(/^Objective [\d.]+\.\s*/, "");
}

// Exam-style labs for 220-1202 are done in a browser before the timed multiple-choice block.
const coreTwoLabs = [
  { file: "core2-pbq-command-line.html", title: "Command line" },
  { file: "core2-pbq-malware-removal.html", title: "Malware removal" },
  { file: "core2-pbq-tool-match.html", title: "Tool match" },
  { file: "core2-pbq-soho-router.html", title: "SOHO router" },
  { file: "core2-pbq-mobile-troubleshooting.html", title: "Mobile troubleshooting" },
  { file: "core2-pbq-pc-security-issues.html", title: "PC security issues" },
];

const questionsById: Record<string, Question> = Object.fromEntries(questions.map((q) => [q.id, q]));
const matrix = objectives as CoverageMatrix;

const card = "rounded-2xl border border-slate-700 bg-slate-900/60 p-5";
const primary = "inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";
const secondary = "inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-teal-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function answerText(question: Question, pick: number | number[] | undefined, noAnswer: string) {
  if (pick === undefined) return noAnswer;
  return (Array.isArray(pick) ? pick : [pick]).map((i) => question.choices[i]).join(" · ");
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-mono text-lg text-white">{value}</dd>
    </div>
  );
}

export function ExamTest({ initialExam, initialFocus = [], labsByTopic = {} }: { initialExam?: ExamCode; initialFocus?: string[]; labsByTopic?: Record<string, LabLink[]> }) {
  const t = useTranslations("examTest");
  const [exam, setExam] = useState<ExamCode>(initialExam ?? "220-1201");
  const [lengthId, setLengthId] = useState(initialFocus.length > 0 ? "quick" : "full");
  const [mode, setMode] = useState<"standard" | "targeted">(initialFocus.length > 0 ? "targeted" : "standard");
  const [runInfo, setRunInfo] = useState<{ kind: RunKind; objectiveIds: string[] }>({ kind: "standard", objectiveIds: [] });
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("setup");
  const [picks, setPicks] = useState<TestPick[]>([]);
  const [scoredPicks, setScoredPicks] = useState<TestPick[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [responses, setResponses] = useState<Record<string, TestResponse>>({});
  const [remaining, setRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [missedOnly, setMissedOnly] = useState(true);
  const [announce, setAnnounce] = useState("");
  const [mockHistory, setMockHistory] = useState<MockAttempt[]>([]);

  const pool = useMemo(() => buildExamPool({ objectives: matrix, questions, topics, examCode: exam }), [exam]);
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const stats = useMemo(() => objectiveStats(pool, progress.mockAttempts, exam), [pool, progress.mockAttempts, exam]);
  const validFocus = useMemo(() => initialFocus.filter((id) => stats.some((s) => s.id === id)), [initialFocus, stats]);
  const focusObjectives = validFocus.length > 0 ? stats.filter((s) => validFocus.includes(s.id)) : weakestObjectives(stats);
  const focusIds = focusObjectives.map((s) => s.id);
  const format = EXAM_FORMATS[exam];
  const perQuestion = secondsPerQuestion(exam);
  const requested = questionsForLength(exam, lengthId);
  const planned = Math.min(requested, pool.totalUnique);
  const quota = useMemo(() => allocateByWeight(pool.domains, planned), [pool, planned]);

  const lengthLabel = (id: string) => (id === "half" ? t("halfExam") : id === "quick" ? t("quickCheck") : t("fullExam"));

  const deadline = useRef(0);
  const completed = useRef(false);
  const startedAt = useRef(0);
  const selectedRef = useRef<number[]>([]);
  const responsesRef = useRef<Record<string, TestResponse>>({});
  const visited = useRef(new Set<string>());
  const [orders, setOrders] = useState<Record<string, number[]>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const warnedIndex = useRef(-1);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const choose = useCallback((next: number[]) => {
    selectedRef.current = next;
    setSelected(next);
  }, []);

  /** Starts one countdown for the complete session. Called from the start event handler. */
  const beginQuestion = useCallback((seconds: number) => {
    warnedIndex.current = -1;
    startedAt.current = Date.now();
    deadline.current = startedAt.current + seconds * 1000;
    sessionRef.current = seconds;
    setSessionSeconds(seconds);
    setRemaining(seconds);
  }, []);

  const current = phase === "running" ? questionsById[picks[index]?.questionId] : undefined;
  const multi = current !== undefined && Array.isArray(current.answer);

  const finish = useCallback((finalResponses: Record<string, TestResponse>, finalPicks: TestPick[], timedOut = false) => {
    if (completed.current) return;
    completed.current = true;
    if (timedOut) finalResponses = Object.fromEntries(finalPicks.map(p => [p.questionId, finalResponses[p.questionId] ?? { answer: undefined, timedOut: true, seconds: 0 }]));
    responsesRef.current = finalResponses;
    setResponses(finalResponses);
    setElapsed(Math.min(sessionRef.current, Math.max(0, (Date.now() - startedAt.current) / 1000)));
    const missed = finalPicks.filter((p) => !isCorrect(questionsById[p.questionId], finalResponses[p.questionId]?.answer)).map((p) => p.questionId);
    const graded = gradeTest({ pool, picks: finalPicks, questionsById, responses: finalResponses });
    const multiPicks = finalPicks.filter((p) => Array.isArray(questionsById[p.questionId].answer));
    const multiCorrect = multiPicks.filter((p) => isCorrect(questionsById[p.questionId], finalResponses[p.questionId]?.answer)).length;
    setScoredPicks(finalPicks);
    recordQuiz({ topicId: `exam-test:${exam}`, correct: finalPicks.length - missed.length, total: finalPicks.length, missedIds: missed });
    const next = recordMock({
      exam,
      full: finalPicks.length === EXAM_FORMATS[exam].maxQuestions,
      correct: graded.correct,
      total: graded.total,
      percent: graded.percent,
      domains: graded.domains.map((d) => ({ id: d.id, title: d.title, correct: d.correct, total: d.total })),
      multiCorrect,
      multiTotal: multiPicks.length,
      questionIds: finalPicks.map((pick) => pick.questionId).filter(id => visited.current.has(id)),
      objectiveByQuestion: Object.fromEntries(finalPicks.map((pick) => [pick.questionId, pick.objectiveId])),
      correctIds: finalPicks.filter(p => isCorrect(questionsById[p.questionId], finalResponses[p.questionId]?.answer)).map(p => p.questionId),
      multiQuestionIds: multiPicks.filter(p => visited.current.has(p.questionId)).map(p => p.questionId),
      bankVersion: assessmentVersion(pool.domains.flatMap(d => d.objectives.flatMap(o => o.questionIds)).filter((id, i, ids) => ids.indexOf(id) === i).map(id => questionsById[id])),
      missedIds: missed,
    });
    setMockHistory(next.mockAttempts);
    setPhase("done");
    setConfirmEnd(false);
  }, [exam, pool]);

  const navigate = useCallback((nextIndex: number) => {
    const next = Math.max(0, Math.min(picks.length - 1, nextIndex));
    setIndex(next);
    const id = picks[next].questionId;
    visited.current.add(id);
    const answer = responsesRef.current[id]?.answer;
    choose(answer === undefined ? [] : Array.isArray(answer) ? [...answer] : [answer]);
    setReviewing(false);
  }, [picks, choose, setReviewing]);

  const lockIn = useCallback(() => {
    if (index + 1 < picks.length) navigate(index + 1);
    else setReviewing(true);
  }, [index, picks.length, navigate, setReviewing]);

  // Move focus to each new question so screen readers start there.
  useEffect(() => {
    if (phase === "running") headingRef.current?.focus();
  }, [phase, index]);

  // Tick against a wall-clock deadline so background-tab throttling cannot add time.
  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      const left = (deadline.current - Date.now()) / 1000;
      setRemaining(left);
      if (left <= 10 && left > 0 && warnedIndex.current !== index) {
        warnedIndex.current = index;
        setAnnounce(t("tenSecondsLeft"));
      }
      if (left <= 0) finish(responsesRef.current, picks, true);
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase, index, finish, picks, t]);

  const warned = remaining <= 10;

  const toggle = useCallback((choice: number) => {
    const prev = selectedRef.current;
    const next = !multi ? [choice] : prev.includes(choice) ? prev.filter((i) => i !== choice) : [...prev, choice];
    choose(next);
    if (current) {
      const answer = next.length === 0 ? undefined : multi ? next : next[0];
      const updated = { ...responsesRef.current, [current.id]: { answer, timedOut: false, seconds: 0 } };
      responsesRef.current = updated;
      setResponses(updated);
    }
  }, [multi, current, choose]);

  // Number keys pick a choice; Enter submits.
  useEffect(() => {
    if (phase !== "running" || !current || reviewing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= current.choices.length) { event.preventDefault(); toggle(orders[current.id]?.[n - 1] ?? n - 1); }
      else if (event.key === "Enter" && selectedRef.current.length > 0 && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); lockIn(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, toggle, lockIn, orders, reviewing]);

  function start(kind: RunKind = mode, objectiveIds: string[] = focusIds) {
    completed.current = false;
    // Earlier sittings for this exam, oldest first, so unseen questions come up first.
    const history = getProgressSnapshot().mockAttempts
      .filter((attempt) => attempt.exam === exam)
      .reverse()
      .flatMap((attempt) => attempt.questionIds ?? []);
    const draft = kind === "standard" || objectiveIds.length === 0
      ? draftTest(pool, requested, Math.random, { history })
      : kind === "targeted"
        ? draftFocused(pool, requested, Math.random, { history, objectiveIds, share: validFocus.length > 0 ? 1 : 0.6 })
        : draftFocused(pool, RETEST_QUESTIONS, Math.random, { history, objectiveIds, share: 1 });
    setRunInfo({ kind: objectiveIds.length === 0 ? "standard" : kind, objectiveIds: kind === "standard" ? [] : objectiveIds });
    setPicks(draft);
    setIndex(0);
    choose([]);
    beginQuestion(sessionDurationSeconds(exam, draft.length));
    responsesRef.current = {};
    visited.current = new Set(draft.slice(0, 1).map(p => p.questionId));
    setOrders(Object.fromEntries(draft.map(p => [p.questionId, shuffleChoiceOrder(questionsById[p.questionId])])));
    setFlags([]);
    setReviewing(false);
    setResponses({});
    setMissedOnly(true);
    setAnnounce("");
    setPhase("running");
  }

  if (phase === "setup") {
    const capped = pool.totalUnique < requested;
    const empty = pool.domains.filter((d) => d.available === 0);
    return (
      <div className="space-y-6">
        <fieldset className={card}>
          <legend className="px-1 text-lg font-semibold text-white">{t("certification")}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {examCodes.map((code) => (
              <label key={code} className={`flex min-h-11 cursor-pointer flex-col rounded-xl border p-4 ${exam === code ? "border-teal-400 bg-teal-400/10" : "border-slate-700 hover:border-slate-500"}`}>
                <span className="flex items-center gap-2">
                  <input type="radio" name="exam" value={code} checked={exam === code} onChange={() => setExam(code)} className="accent-teal-400" />
                  <span className="font-medium text-white">{EXAM_FORMATS[code].label}</span>
                </span>
                <span className="mt-1 font-mono text-sm text-teal-300">{code}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={card}>
          <legend className="px-1 text-lg font-semibold text-white">{t("length")}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {TEST_LENGTHS.map((length) => {
              const requestedForLength = questionsForLength(exam, length.id);
              const count = Math.min(requestedForLength, pool.totalUnique);
              return (
                <label key={length.id} className={`flex min-h-11 cursor-pointer flex-col rounded-xl border p-4 ${lengthId === length.id ? "border-teal-400 bg-teal-400/10" : "border-slate-700 hover:border-slate-500"}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="length" value={length.id} checked={lengthId === length.id} onChange={() => setLengthId(length.id)} className="accent-teal-400" />
                    <span className="font-medium text-white">{lengthLabel(length.id)}</span>
                  </span>
                  <span className="mt-1 text-sm text-slate-300">{t("questionCount", { count, minutes: Math.round((count * perQuestion) / 60) })}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={card}>
          <legend className="px-1 text-lg font-semibold text-white">{t("modeHeading")}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={`flex min-h-11 cursor-pointer flex-col rounded-xl border p-4 ${mode === "standard" ? "border-teal-400 bg-teal-400/10" : "border-slate-700 hover:border-slate-500"}`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="mode" value="standard" checked={mode === "standard"} onChange={() => setMode("standard")} className="accent-teal-400" />
                <span className="font-medium text-white">{t("modeStandard")}</span>
              </span>
              <span className="mt-1 text-sm text-slate-300">{t("modeStandardDetail")}</span>
            </label>
            <label className={`flex min-h-11 flex-col rounded-xl border p-4 ${focusIds.length === 0 ? "cursor-not-allowed border-slate-800 opacity-60" : `cursor-pointer ${mode === "targeted" ? "border-teal-400 bg-teal-400/10" : "border-slate-700 hover:border-slate-500"}`}`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="mode" value="targeted" disabled={focusIds.length === 0} checked={mode === "targeted"} onChange={() => setMode("targeted")} className="accent-teal-400" />
                <span className="font-medium text-white">{validFocus.length > 0 ? t("modeFocused") : t("modeTargeted")}</span>
              </span>
              <span className="mt-1 text-sm text-slate-300">{focusIds.length === 0 ? t("modeTargetedEmpty") : validFocus.length > 0 ? t("modeFocusedDetail") : t("modeTargetedDetail")}</span>
            </label>
          </div>
          {focusIds.length > 0 && mode === "targeted" && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("modeFocusList")}>
              {focusObjectives.map((s) => (
                <li key={s.id} className="rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 text-sm text-amber-100">
                  <span className="font-mono">{s.id}</span> {s.title}{s.recent !== null ? ` · ${s.recent}%` : ""}
                </li>
              ))}
            </ul>
          )}
          <Link href={`/scorecard?exam=${exam}`} className="mt-3 inline-flex min-h-11 items-center text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">{t("scorecardLink")}</Link>
        </fieldset>

        {exam === "220-1202" && <section className={card} aria-labelledby="labs-first-heading">
          <h2 id="labs-first-heading" className="text-lg font-semibold text-white">{t("labsFirstHeading")}</h2>
          <p className="mt-1 text-sm text-slate-300">{t("labsFirstIntro")}</p>
          <p className="mt-2 text-sm text-cyan-100">{t("labsFirstPacing")}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {coreTwoLabs.map((lab) => <li key={lab.file}><a href={`/visuals/${lab.file}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center rounded-xl border border-slate-700 px-4 py-2 text-teal-200 underline underline-offset-4 hover:border-teal-400">{lab.title}</a></li>)}
          </ul>
        </section>}

        <section className={card} aria-labelledby="blueprint-heading">
          <h2 id="blueprint-heading" className="text-lg font-semibold text-white">{t("blueprintHeading")}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {t.rich("blueprintIntro", {
              exam: format.label,
              maxQuestions: format.maxQuestions,
              minutes: format.minutes,
              seconds: perQuestion,
              strong: (chunks) => <strong className="text-white">{chunks}</strong>,
            })}
          </p>
          <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label={t("tableLabel")}>
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="py-2 pr-3 font-medium">{t("colDomain")}</th><th className="py-2 pr-3 font-medium">{t("colWeight")}</th><th className="py-2 pr-3 font-medium">{t("colThisTest")}</th><th className="py-2 font-medium">{t("colInBank")}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pool.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td className="py-2 pr-3 text-slate-100"><span className="font-mono text-teal-300">{domain.id}</span> {domain.title}</td>
                    <td className="py-2 pr-3 font-mono text-slate-300">{domain.weight}%</td>
                    <td className="py-2 pr-3 font-mono text-white">{quota[domain.id] ?? 0}</td>
                    <td className={`py-2 font-mono ${domain.available === 0 ? "text-amber-200" : "text-slate-300"}`}>{domain.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(capped || empty.length > 0) && (
            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-100">
              {capped && <p>{t("capped", { total: pool.totalUnique, exam, planned, requested })}</p>}
              {empty.length > 0 && <p className={capped ? "mt-1" : ""}>{t("noQuestionsMapped", { domains: empty.map((d) => `${d.id} ${d.title}`).join(", ") })}</p>}
            </div>
          )}
        </section>

        <section className={card} aria-labelledby="rules-heading">
          <h2 id="rules-heading" className="text-lg font-semibold text-white">{t("howItWorks")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>{t("rule1", { seconds: perQuestion })}</li>
            <li>{t("rule2")}</li>
            <li>{t("rule3")}</li>
            <li>{t("rule4")}</li>
          </ul>
        </section>

        <button type="button" onClick={() => start()} disabled={planned === 0} className={primary}>
          {t("startTest", { count: planned })}
        </button>
      </div>
    );
  }

  if (phase === "running" && current) {
    const fraction = Math.max(0, Math.min(1, remaining / (sessionSeconds || 1)));
    return (
      <div className="space-y-5">
        <p className="sr-only" role="status" aria-live="polite">{announce}</p>
        <div className={`${card} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              <span className="font-mono text-teal-300">{exam}</span> · {multi
                ? t("questionProgressMulti", { current: index + 1, total: picks.length })
                : t("questionProgress", { current: index + 1, total: picks.length })}
            </p>
            <p role="timer" aria-label={t("timeLeft", { time: formatClock(remaining) })} className={`font-mono text-2xl font-semibold tabular-nums ${warned ? "text-amber-300" : "text-white"}`}>
              {formatClock(remaining)}
            </p>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full transition-[width] duration-200 ${warned ? "bg-amber-400" : "bg-teal-400"}`} style={{ width: `${100 * fraction}%` }} />
          </div>
          <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-slate-500" style={{ width: `${(100 * index) / picks.length}%` }} />
          </div>
        </div>

        {reviewing ? <section className={card}>
          <h2 className="text-lg font-semibold">{t("reviewBeforeFinish")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">{picks.map((pick, i) => <button key={pick.questionId} type="button" className={secondary} onClick={() => navigate(i)}>{i + 1} · {responses[pick.questionId]?.answer === undefined ? t("unanswered") : t("answered")}{flags.includes(pick.questionId) ? " ⚑" : ""}</button>)}</div>
          <button type="button" className={`${primary} mt-4`} onClick={() => finish(responsesRef.current, picks)}>{t("scoreAll")}</button>
        </section> : <>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-medium text-white focus:outline-none">{current.prompt}</h2>
        <ul className="space-y-2" aria-label={t("choices")}>
          {(orders[current.id] ?? current.choices.map((_, i) => i)).map((choiceIndex, displayIndex) => {
            const choice = current.choices[choiceIndex];
            const on = selected.includes(choiceIndex);
            return (
              <li key={`${current.id}-${choiceIndex}`}>
                <button type="button" aria-pressed={on} onClick={() => toggle(choiceIndex)}
                  className={`flex min-h-11 w-full gap-3 rounded-xl border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${on ? "border-teal-400 bg-teal-950/50 text-white" : "border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500"}`}>
                  <span className="font-mono text-slate-400" aria-hidden="true">{displayIndex + 1}</span>
                  <span>{choice}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={lockIn} className={primary}>
            {index + 1 === picks.length ? t("reviewBeforeFinish") : t("nextQuestion")}
          </button>
          <button type="button" className={secondary} disabled={index === 0} onClick={() => navigate(index - 1)}>{t("previousQuestion")}</button>
          <button type="button" className={secondary} aria-pressed={flags.includes(current.id)} onClick={() => setFlags(prev => prev.includes(current.id) ? prev.filter(id => id !== current.id) : [...prev, current.id])}>{t("flagQuestion")}</button>
          <button type="button" className={secondary} onClick={() => setReviewing(true)}>{t("reviewBeforeFinish")}</button>
          {!confirmEnd ? (
            <button type="button" onClick={() => setConfirmEnd(true)} className={secondary}>{t("endTest")}</button>
          ) : (
            <span className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              {t("endNowPrompt")}
              <button type="button" onClick={() => finish(responsesRef.current, picks)} className={secondary}>{t("scoreAll")}</button>
              <button type="button" onClick={() => setConfirmEnd(false)} className={secondary}>{t("keepGoing")}</button>
            </span>
          )}
        </div>
        </>}
      </div>
    );
  }

  // Results
  const scored = scoredPicks;
  const result = gradeTest({ pool, picks: scored, questionsById, responses });
  const passPercent = 80;
  const passed = result.percent >= passPercent;
  const usedSeconds = elapsed;
  const objectiveTitle = (domainId: string, objectiveId: string) =>
    pool.domains.find((d) => d.id === domainId)?.objectives.find((o) => o.id === objectiveId)?.title ?? "";
  const review = scored.filter((p) => !missedOnly || !isCorrect(questionsById[p.questionId], responses[p.questionId]?.answer));
  const examMatrix = matrix.exams.find((item) => item.code === exam);
  const missingObjectives = examMatrix?.domains.flatMap((domain) => domain.objectives).filter((objective) => objective.status !== "covered").length ?? 0;
  const awsReadiness = exam === "clf-c02" || exam === "saa-c03"
    ? evaluateReadiness(mockHistory, exam, missingObjectives, pool.totalUnique, {
      version: assessmentVersion(pool.domains.flatMap(d => d.objectives.flatMap(o => o.questionIds)).filter((id, i, ids) => ids.indexOf(id) === i).map(id => questionsById[id])),
      questionIds: pool.domains.flatMap(d => d.objectives.flatMap(o => o.questionIds)),
      multiIds: pool.domains.flatMap(d => d.objectives.flatMap(o => o.questionIds)).filter(id => Array.isArray(questionsById[id].answer)),
      expectedDomains: pool.domains.map(d => d.id),
    })
    : null;

  const missedPicks = scored.filter((p) => !isCorrect(questionsById[p.questionId], responses[p.questionId]?.answer));
  const missedByObjective = [...missedPicks.reduce((map, p) => {
    const key = p.objectiveId;
    map.set(key, [...(map.get(key) ?? []), p]);
    return map;
  }, new Map<string, TestPick[]>())];
  const missedObjectiveIds = missedByObjective.map(([id]) => id);

  return (
    <div className="space-y-6">
      {runInfo.kind === "retest" && (
        <section className={card} aria-labelledby="retest-heading">
          <h2 id="retest-heading" className="text-lg font-semibold text-white">{t("retestHeading")}</h2>
          <ul className="mt-3 space-y-2">
            {runInfo.objectiveIds.map((id) => {
              const picksFor = scored.filter((p) => p.objectiveId === id);
              const right = picksFor.filter((p) => isCorrect(questionsById[p.questionId], responses[p.questionId]?.answer)).length;
              const fixed = picksFor.length > 0 && right === picksFor.length;
              const domainId = pool.domains.find((d) => d.objectives.some((o) => o.id === id))?.id ?? "";
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm">
                  <span className="text-slate-100"><span className="font-mono text-teal-300">{id}</span> {objectiveTitle(domainId, id)}</span>
                  <span className={`rounded-full border px-3 py-1 font-medium ${fixed ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-amber-400/50 bg-amber-400/10 text-amber-200"}`}>
                    {picksFor.length === 0 ? t("retestNotAsked") : `${fixed ? t("retestFixed") : t("retestStillWeak")} · ${t("retestLine", { correct: right, total: picksFor.length })}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className={card} aria-labelledby="fix-heading">
        <h2 id="fix-heading" className="text-lg font-semibold text-white">{t("fixHeading")}</h2>
        {missedByObjective.length === 0 ? (
          <p className="mt-1 text-sm text-slate-300">{t("fixNone")}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-300">{t("fixIntro", { count: missedByObjective.length })}</p>
            <ol className="mt-4 space-y-4">
              {missedByObjective.map(([objectiveId, picksFor]) => {
                const domainId = picksFor[0].domainId;
                return (
                  <li key={objectiveId} className="rounded-xl border border-amber-900/70 bg-slate-950/50 p-4">
                    <h3 className="font-medium text-white"><span className="font-mono text-teal-300">{objectiveId}</span> {objectiveTitle(domainId, objectiveId)}</h3>
                    <ul className="mt-2 space-y-3">
                      {picksFor.map((p) => {
                        const q = questionsById[p.questionId];
                        const topic = getTopic(q.topicId);
                        const labs = labsByTopic[q.topicId] ?? [];
                        return (
                          <li key={p.questionId} className="text-sm">
                            <p className="text-slate-400">{q.prompt}</p>
                            <p className="mt-1 text-cyan-100"><span className="font-medium text-white">{t("fixRule")}</span> {ruleText(q.explanation)}</p>
                            <div className="mt-1 flex flex-wrap gap-x-4">
                              {topic && <Link href={`/notes/${encodeURIComponent(topic.id)}`} className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4 hover:text-teal-200">{t("fixNotes", { title: topic.title })}</Link>}
                              {labs.slice(0, 2).map((lab) => <a key={lab.file} href={`/visuals/${lab.file}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4 hover:text-teal-200">{t("fixLab", { title: lab.title })}</a>)}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={() => start("retest", missedObjectiveIds)} className={`${primary} mt-4`}>
              {t("fixRetest", { count: RETEST_QUESTIONS, minutes: Math.max(1, Math.round(sessionDurationSeconds(exam, RETEST_QUESTIONS) / 60)) })}
            </button>
          </>
        )}
        <Link href={`/scorecard?exam=${exam}`} className="mt-3 block w-fit text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">{t("scorecardLink")}</Link>
      </section>

      <section className={card} aria-labelledby="weak-loop-heading">
        <h2 id="weak-loop-heading" className="text-lg font-semibold text-white">{t("weakAreasLink")}</h2>
        <p className="mt-1 text-sm text-slate-300">{t("weakAreasIntro")}</p>
        <Link href="/weak-areas" className="mt-3 inline-flex min-h-11 items-center rounded-full border border-teal-300 px-5 py-2 text-teal-100">{t("weakAreasLink")}</Link>
      </section>
      <section className={card} aria-labelledby="score-heading">
        <h2 id="score-heading" className="text-sm uppercase tracking-wide text-teal-300">{format.label} · {exam}</h2>
        <p className="mt-2 text-4xl font-semibold text-white">{result.correct}/{result.total} <span className="text-2xl text-slate-300">({result.percent}%)</span></p>
        <p className={`mt-2 font-medium ${passed ? "text-emerald-300" : "text-amber-300"}`}>
          {passed ? t("passedLine", { percent: passPercent }) : t("failedLine", { percent: passPercent })}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {t("scaleNote", { min: format.scaleMin, max: format.scaleMax, passing: format.passingScore })}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-slate-400">{t("timeUsed")}</dt><dd className="mt-1 font-mono text-lg text-slate-100">{formatClock(usedSeconds)}</dd></div>
          <div><dt className="text-xs text-slate-400">{t("timeAllowed")}</dt><dd className="mt-1 font-mono text-lg text-slate-100">{formatClock(sessionSeconds)}</dd></div>
          <div><dt className="text-xs text-slate-400">{t("timedOut")}</dt><dd className="mt-1 font-mono text-lg text-slate-100">{result.timedOut}</dd></div>
        </dl>
      </section>

      <section className={card} aria-labelledby="domains-heading">
        <h2 id="domains-heading" className="text-lg font-semibold text-white">{t("byDomain")}</h2>
        <ul className="mt-3 space-y-3">
          {result.domains.map((d) => {
            const pct = Math.round((100 * d.correct) / d.total);
            return (
              <li key={d.id}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-slate-100"><span className="font-mono text-teal-300">{d.id}</span> {d.title}</span>
                  <span className="font-mono text-slate-300">{d.correct}/{d.total} · {pct}%</span>
                </div>
                <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full ${pct >= passPercent ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {awsReadiness && (
        <section className={card} aria-labelledby="readiness-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-teal-300">{t("readinessEyebrow")}</p>
              <h2 id="readiness-heading" className="mt-1 text-lg font-semibold text-white">{t("readinessHeading")}</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-sm font-medium ${
              awsReadiness.status === "ready"
                ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                : awsReadiness.status === "near"
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
                  : "border-rose-400/50 bg-rose-400/10 text-rose-200"
            }`}>
              {t(`readinessStatus.${awsReadiness.status}`)}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-300">{t("readinessHeuristic")}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatMini label={t("readinessFullMocks")} value={`${awsReadiness.fullAttempts}/3`} />
            <StatMini label={t("readinessScores")} value={awsReadiness.overallScores.length ? awsReadiness.overallScores.map((score) => `${score}%`).join(" · ") : "—"} />
            <StatMini label={t("readinessDomainFloor")} value={awsReadiness.domainFloor === null ? "—" : `${awsReadiness.domainFloor}%`} />
            <StatMini label={t("readinessMulti")} value={awsReadiness.multiPercent === null ? "—" : `${awsReadiness.multiPercent}%`} />
            <StatMini label={t("readinessExposure")} value={awsReadiness.exposurePercent === null ? "—" : `${awsReadiness.exposurePercent}%`} />
          </dl>
          {awsReadiness.weakDomains.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-white">{t("weakDomains")}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {awsReadiness.weakDomains.map((domain) => (
                  <li key={domain.id} className="rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 text-sm text-amber-100">
                    {domain.id} {domain.title} · {domain.percent}%
                  </li>
                ))}
              </ul>
            </div>
          )}
          {awsReadiness.blockers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-white">{t("readinessBlockers")}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {awsReadiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4" aria-labelledby="review-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="review-heading" className="text-lg font-semibold text-white">{t("review")}</h2>
          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={missedOnly} onChange={(e) => setMissedOnly(e.target.checked)} className="accent-teal-400" />
            {t("missedOnly")}
          </label>
        </div>
        {review.length === 0 ? <p className="text-slate-300">{t("nothingToReview")}</p> : (
          <ol className="space-y-4">
            {review.map((p) => {
              const q = questionsById[p.questionId];
              const r = responses[p.questionId];
              const ok = isCorrect(q, r?.answer);
              const topic = getTopic(q.topicId);
              return (
                <li key={p.questionId} className={`rounded-xl border p-4 ${ok ? "border-slate-700" : "border-amber-900/70"} bg-slate-900`}>
                  <p className="font-mono text-xs text-teal-300">{exam} / {p.objectiveId} · {objectiveTitle(p.domainId, p.objectiveId)}</p>
                  <p className="mt-2 font-medium text-white">{q.prompt}</p>
                  <p className={`mt-2 text-sm ${ok ? "text-emerald-300" : "text-red-300"}`}>
                    {t("answerLine", {
                      answer: answerText(q, r?.answer, t("noAnswer")),
                      timedOut: r?.timedOut ? "yes" : "no",
                      answered: r ? "yes" : "no",
                      seconds: r?.seconds ?? 0,
                    })}
                  </p>
                  {!ok && <p className="mt-1 text-sm text-teal-200">{t("correctAnswer", { answer: answerText(q, q.answer, t("noAnswer")) })}</p>}
                  <p className="mt-2 text-sm text-slate-400">{q.explanation}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4">
                    {topic && <Link href={`/notes/${encodeURIComponent(topic.id)}`} className="inline-flex min-h-11 items-center text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">{t("studyTopic", { title: topic.title })}</Link>}
                    <button type="button" onClick={() => reportContent(`Question ${q.id}: ${q.prompt}`, "Wrong answer key")} className="inline-flex min-h-11 items-center text-xs text-slate-400 underline decoration-dotted underline-offset-4 hover:text-amber-200">{t("disputeQuestion")}</button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => start(runInfo.kind, runInfo.objectiveIds)} className={primary}>{t("retake")}</button>
        <button type="button" onClick={() => setPhase("setup")} className={secondary}>{t("changeExam")}</button>
      </div>
    </div>
  );
}
