"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { nextHopMission as mission } from "@/lib/practice/mission-catalog";
import { completed, emptyMission, missionAnswer, missionHint, missionSummary, restoreMission } from "@/lib/practice/mission";
import { getMissionSnapshot, getMissionServerSnapshot, subscribeMission, updateMission, resetMission, missionStorageUnavailable } from "@/lib/practice/mission-store";
import { shuffle } from "@/lib/practice/session";
import type { Choice } from "@/lib/practice/types";
import { PacketDiagram } from "@/app/components/practice/PacketDiagram";
const primary = "rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-60";
const secondary = "rounded-xl border border-cyan-300/60 px-4 py-3 text-cyan-100 hover:bg-cyan-300/10";
export function MissionPlayer() {
  const t = useTranslations("missionPlayer");
  const raw = useSyncExternalStore(subscribeMission, getMissionSnapshot, getMissionServerSnapshot);
  const record = useMemo(() => restoreMission(raw, mission) ?? emptyMission(mission), [raw]);
  const summary = missionSummary(record, mission);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [order, setOrder] = useState<Choice[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [activeId]);
  const question = mission.questions.find((q) => q.id === activeId);
  const objective = summary.objectives.find((o) => o.id === question?.objectiveId);
  const receipt = question ? record.receipts[question.id] : undefined;
  const last = question?.choices.find((c) => c.id === receipt?.attemptedIds.at(-1));
  const correct = !!question && completed(record,question);
  const accuracy = summary.accuracy === null ? "—" : `${summary.accuracy}%`;
  function open(id: string) { const q = mission.questions.find((q) => q.id === id)!; setOrder(shuffle(q.choices)); setActiveId(id); setNotice(""); }
  function reviews(id: string) { return mission.objectives.find((o) => o.id === id)!.review.map((r) => <Link key={r.href} href={r.href} className="mr-4 inline-block py-2 text-cyan-200 underline">{r.label}</Link>); }
  return <div className="mx-auto max-w-4xl space-y-5">
    <Link href="/practice-games" className="text-cyan-200 underline">{t("backToPractice")}</Link>
    <header className="space-y-3"><p className="text-cyan-100">{t("track")}</p><h1 className="text-3xl font-bold">{mission.title}</h1><p className="text-slate-300">{mission.description}</p></header>
    <section aria-label={t("progressAria")} className="space-y-2 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <p>{t("accuracyLine", { accuracy, firstCorrect: summary.firstCorrect, attempted: summary.attempted, hints: summary.hints, retries: summary.retries })}</p>
      <p>{t("progressLine", { completed: summary.completed, achievements: summary.achievements.length, total: mission.objectives.length, points: summary.points })}</p>
      <progress aria-label={t("independentAria")} value={summary.achievements.length} max={mission.objectives.length} className="h-3 w-full accent-teal-300" />
      <p className="text-sm text-slate-300">{t("proficiencyNote")}</p>
    </section>
    {raw && !restoreMission(raw,mission) && <p role="status" className="text-amber-100">{t("incompatible")}</p>}
    {question && objective ? <section data-mission-question={question.id} className="space-y-4 rounded-2xl border border-cyan-300/40 bg-slate-900 p-5">
      <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold">{question.title}</h2>
      <p className="text-sm text-cyan-100">{t("questionMeta", { kind: question.stage === "practice" ? t("kindPractice") : t("kindApplication"), objective: objective.label })}</p>
      <p>{question.prompt}</p>
      <details><summary className="cursor-pointer text-cyan-200">{t("openPlan")}</summary><div className="mt-3"><PacketDiagram scenario={mission.scenarios.find((s) => s.id === question.scenarioId)!} decisionId="plan" planOnly /></div></details>
      <p className="text-sm text-slate-300">{t("instructions")}</p>
      <div className="grid gap-3 sm:grid-cols-2">{(order.length ? order : question.choices).map((choice) => <button key={choice.id} data-mission-answer={choice.id} disabled={correct || receipt?.attemptedIds.includes(choice.id)} onClick={() => updateMission((r) => missionAnswer(r,mission,question.id,choice.id))} className="min-h-24 rounded-xl border border-slate-600 bg-slate-950 p-4 text-left text-slate-100 hover:border-cyan-300 disabled:opacity-60">{choice.label}</button>)}</div>
      {last && <div role="status" className={`space-y-2 rounded-xl border p-4 ${correct ? "border-teal-300/50 text-teal-100" : "border-amber-300/50 text-amber-100"}`}><p className="font-semibold">{correct ? t("supportedDecision") : t("reconsider")}</p><p>{last.explanation}</p>{correct && <><p>{question.success}</p><p>{t("pointsOnceFor", { points: receipt?.hintUsed ? 75 : 100, objective: objective.label.toLowerCase() })}</p><p>{question.stage === "application" && receipt?.attemptedIds.length === 1 && !receipt.hintUsed ? t("achievementEarned", { title: objective.achievement.title, reason: objective.achievement.reason }) : t("practiceCompleted")}</p></>}</div>}
      {receipt?.hintUsed && <p role="status" className="rounded-xl border border-amber-300/40 p-4 text-amber-100">{t("hintLine", { hint: question.hint })}</p>}
      <div className="rounded-xl bg-slate-950 p-4"><h3 className="font-semibold">{t("reviewHeading")}</h3><div className="text-sm">{reviews(objective.id)}</div><p className="text-xs text-slate-300">{t("reviewNote")}</p></div>
      <div className="flex flex-wrap gap-3">{!correct && <button className={secondary} disabled={receipt?.hintUsed} onClick={() => updateMission((r) => missionHint(r,mission,question.id))}>{receipt?.hintUsed ? t("hintUsed") : t("useHint")}</button>}{correct && objective.next && <button className={primary} onClick={() => open(objective.next!.id)}>{t("applyScenario")}</button>}<button className={secondary} onClick={() => setActiveId(null)}>{t("overview")}</button></div>
      <p className="text-xs text-slate-300">{t("examAreas", { areas: question.examMappings.map((m) => `${m.exam.toUpperCase()} · ${m.area}`).join("; ") })}</p>
    </section> : <>
      <section aria-label={t("nextAria")} className="space-y-3 rounded-2xl border border-cyan-300/40 bg-slate-900 p-5">
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">{t("nextHeading")}</h2>
        {summary.recommendation ? <><p>{summary.recommendation.label}</p><p className="text-sm text-slate-300">{summary.recommendation.mistakes.length ? t("recommendedMistakes") : t("recommendedNoApplication")}</p>{reviews(summary.recommendation.id)}{summary.recommendation.next ? <div><button className={primary} onClick={() => open(summary.recommendation!.next!.id)}>{summary.recommendation.next.stage === "practice" ? t("practiceRecommended") : t("tryApplication")}</button></div> : <p className="text-amber-100">{t("bothChecks")}</p>}</> : <><p>{t("allThree")}</p><Link href="/labs/two-subnet-lan#verification" className="text-cyan-200 underline">{t("labVerification")}</Link></>}
      </section>
      <section aria-label={t("objectivesAria")} className="space-y-3"><h2 className="text-xl font-semibold">{t("objectivesHeading")}</h2>{summary.objectives.map((o) => <article key={o.id} data-objective={o.id} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5"><h3 className="font-semibold">{o.label}</h3><p className={o.proof ? "text-teal-100" : "text-amber-100"}>{o.proof ? t("proficient") : o.practiced ? t("practiceDone") : t("practicePending")}</p>{o.mistakes.flatMap((row) => row.mistakes.map((choice) => <p key={choice.id} className="text-sm text-slate-300">{t("reviewLine", { explanation: choice.explanation })}</p>))}{o.mistakes.some((r) => r.hintUsed) && <p className="text-sm text-amber-100">{t("hintAssistedObjective")}</p>}<div className="text-sm">{reviews(o.id)}</div>{o.next && <button className={secondary} onClick={() => open(o.next!.id)}>{o.next.stage === "practice" ? t("practiceObjective") : t("newApplication")}</button>}{o.proof && <p className="text-sm text-slate-300">{t("evidenceLine", { title: o.proof.title })}</p>}</article>)}</section>
    </>}
    <section aria-label={t("achievementsAria")} className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5"><h2 className="text-xl font-semibold">{t("achievementsHeading")}</h2>{summary.achievements.length ? summary.achievements.map((a) => <p key={a.id} data-achievement={a.id}><strong>✓ {a.title}</strong> — {a.reason}</p>) : <p className="text-slate-300">{t("noAchievements")}</p>}</section>
    <section className="space-y-3 rounded-2xl border border-slate-700 p-5"><h2 className="font-semibold">{t("storageHeading")}</h2><p className="text-sm text-slate-300">{t("storageNote")}</p>{missionStorageUnavailable() && <p role="status" className="text-amber-100">{t("storageUnavailable")}</p>}{confirmReset ? <div className="flex flex-wrap gap-3"><button className={secondary} onClick={() => { resetMission(); setActiveId(null); setConfirmReset(false); setNotice(t("resetDone")); }}>{t("confirmReset")}</button><button className={secondary} onClick={() => setConfirmReset(false)}>{t("keepProgress")}</button></div> : <button className={secondary} onClick={() => setConfirmReset(true)}>{t("resetProgress")}</button>}{notice && <p role="status">{notice}</p>}</section>
  </div>;
}
