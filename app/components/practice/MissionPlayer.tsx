"use client";
import Link from "next/link";
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
  function open(id: string) { const q = mission.questions.find((q) => q.id === id)!; setOrder(shuffle(q.choices)); setActiveId(id); setNotice(""); }
  function reviews(id: string) { return mission.objectives.find((o) => o.id === id)!.review.map((r) => <Link key={r.href} href={r.href} className="mr-4 inline-block py-2 text-cyan-200 underline">{r.label}</Link>); }
  return <div className="mx-auto max-w-4xl space-y-5">
    <Link href="/practice-games" className="text-cyan-200 underline">← Practice Games</Link>
    <header className="space-y-3"><p className="text-cyan-100">Network+ · N10-009 · IPv4 next-hop troubleshooting · Solo topic mission</p><h1 className="text-3xl font-bold">{mission.title}</h1><p className="text-slate-300">{mission.description}</p></header>
    <section aria-label="Mission progress" className="space-y-2 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <p>First-attempt accuracy {summary.accuracy === null ? "—" : `${summary.accuracy}%`} ({summary.firstCorrect}/{summary.attempted}) · Hints {summary.hints} · Retries {summary.retries}</p>
      <p>Completed decisions {summary.completed} · Independent applications {summary.achievements.length}/{mission.objectives.length} · Practice points {summary.points}</p>
      <progress aria-label="Independent application progress" value={summary.achievements.length} max={mission.objectives.length} className="h-3 w-full accent-teal-300" />
      <p className="text-sm text-slate-300">A correct answer after feedback counts as completion, not proficiency. “Proficient in this check” requires a first correct answer on a new application, without hints. It is evidence from one check, not lasting mastery.</p>
    </section>
    {raw && !restoreMission(raw,mission) && <p role="status" className="text-amber-100">Saved mission data is incompatible or invalid. Practice starts fresh; reset can remove the old record.</p>}
    {question && objective ? <section data-mission-question={question.id} className="space-y-4 rounded-2xl border border-cyan-300/40 bg-slate-900 p-5">
      <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold">{question.title}</h2>
      <p className="text-sm text-cyan-100">{question.stage === "practice" ? "Supported practice" : "New application check"} · Objective: {objective.label}</p>
      <p>{question.prompt}</p>
      <details><summary className="cursor-pointer text-cyan-200">Open the network plan and assumptions</summary><div className="mt-3"><PacketDiagram scenario={mission.scenarios.find((s) => s.id === question.scenarioId)!} decisionId="plan" planOnly /></div></details>
      <p className="text-sm text-slate-300">Choose a justified action with click/tap or Tab then Enter/Space. Wrong answers give feedback and allow another choice. No timer. Each decision earns 100 once, or 75 with a hint; rewards add no extra points.</p>
      <div className="grid gap-3 sm:grid-cols-2">{(order.length ? order : question.choices).map((choice) => <button key={choice.id} data-mission-answer={choice.id} disabled={correct || receipt?.attemptedIds.includes(choice.id)} onClick={() => updateMission((r) => missionAnswer(r,mission,question.id,choice.id))} className="min-h-24 rounded-xl border border-slate-600 bg-slate-950 p-4 text-left text-slate-100 hover:border-cyan-300 disabled:opacity-60">{choice.label}</button>)}</div>
      {last && <div role="status" className={`space-y-2 rounded-xl border p-4 ${correct ? "border-teal-300/50 text-teal-100" : "border-amber-300/50 text-amber-100"}`}><p className="font-semibold">{correct ? "✓ Decision supported" : "↻ Reconsider this action"}</p><p>{last.explanation}</p>{correct && <><p>{question.success}</p><p>+{receipt?.hintUsed ? 75 : 100} once for {objective.label.toLowerCase()}.</p><p>{question.stage === "application" && receipt?.attemptedIds.length === 1 && !receipt.hintUsed ? `Achievement earned: ${objective.achievement.title}. ${objective.achievement.reason}` : "Completed practice. This assisted or initial decision does not establish proficiency; use a new application to check understanding."}</p></>}</div>}
      {receipt?.hintUsed && <p role="status" className="rounded-xl border border-amber-300/40 p-4 text-amber-100">Hint: {question.hint}</p>}
      <div className="rounded-xl bg-slate-950 p-4"><h3 className="font-semibold">Review this objective, then check again</h3><div className="text-sm">{reviews(objective.id)}</div><p className="text-xs text-slate-300">Review opens in this tab. Use “Return to next-hop mission” on the review page; your recorded attempts remain saved. Visiting a page earns no reward and does not prove that it was read.</p></div>
      <div className="flex flex-wrap gap-3">{!correct && <button className={secondary} disabled={receipt?.hintUsed} onClick={() => updateMission((r) => missionHint(r,mission,question.id))}>{receipt?.hintUsed ? "Hint used" : "Use hint (award becomes 75)"}</button>}{correct && objective.next && <button className={primary} onClick={() => open(objective.next!.id)}>Apply to a new scenario</button>}<button className={secondary} onClick={() => setActiveId(null)}>Mission overview</button></div>
      <p className="text-xs text-slate-300">Exam areas: {question.examMappings.map((m) => `${m.exam.toUpperCase()} · ${m.area}`).join("; ")}. Based on Chapter 9 routing/ARP and Lab 01 addressing, break/fix and verification.</p>
    </section> : <>
      <section aria-label="Recommended next practice" className="space-y-3 rounded-2xl border border-cyan-300/40 bg-slate-900 p-5">
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">What should I practice next?</h2>
        {summary.recommendation ? <><p>{summary.recommendation.label}</p><p className="text-sm text-slate-300">{summary.recommendation.mistakes.length ? "Recommended from recorded mistakes or hint use." : "Recommended because this objective has no independent application yet."}</p>{reviews(summary.recommendation.id)}{summary.recommendation.next ? <div><button className={primary} onClick={() => open(summary.recommendation!.next!.id)}>{summary.recommendation.next.stage === "practice" ? "Practice recommended objective" : "Try a new application"}</button></div> : <p className="text-amber-100">Both fresh checks have been completed with assistance. Review the sources; more unseen questions or a real lab task are needed before claiming proficiency. Repeating the same answers cannot earn it.</p>}</> : <><p>All three objectives have an independent application recorded. Next, test the principle in Packet Tracer and explain the evidence in your own words.</p><Link href="/labs/two-subnet-lan#verification" className="text-cyan-200 underline">Try Lab 01 verification</Link></>}
      </section>
      <section aria-label="Mission objectives" className="space-y-3"><h2 className="text-xl font-semibold">Topic objectives</h2>{summary.objectives.map((o) => <article key={o.id} data-objective={o.id} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5"><h3 className="font-semibold">{o.label}</h3><p className={o.proof ? "text-teal-100" : "text-amber-100"}>{o.proof ? "✓ Proficient in this check · independent new application" : o.practiced ? "◌ Practice completed · independent application pending" : "○ Practice pending"}</p>{o.mistakes.flatMap((row) => row.mistakes.map((choice) => <p key={choice.id} className="text-sm text-slate-300">Review: {choice.explanation}</p>))}{o.mistakes.some((r) => r.hintUsed) && <p className="text-sm text-amber-100">Hint-assisted decisions recorded for this objective.</p>}<div className="text-sm">{reviews(o.id)}</div>{o.next && <button className={secondary} onClick={() => open(o.next!.id)}>{o.next.stage === "practice" ? "Practice objective" : "New application"}</button>}{o.proof && <p className="text-sm text-slate-300">Evidence: {o.proof.title}. Check again in a different setting before claiming retention.</p>}</article>)}</section>
    </>}
    <section aria-label="Earned achievements" className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Earned achievements</h2>{summary.achievements.length ? summary.achievements.map((a) => <p key={a.id} data-achievement={a.id}><strong>✓ {a.title}</strong> — {a.reason}</p>) : <p className="text-slate-300">Earn one per objective by applying it to a fresh scenario without feedback or hints. No streak or speed requirements.</p>}</section>
    <section className="space-y-3 rounded-2xl border border-slate-700 p-5"><h2 className="font-semibold">Storage and reset</h2><p className="text-sm text-slate-300">Only this browser stores this mission’s answers, hints and rewards in localStorage. No account, analytics or shared leaderboard. Reset clears this mission, including achievements; other study progress and Outage Ops rooms are unaffected.</p>{missionStorageUnavailable() && <p role="status" className="text-amber-100">Browser storage is unavailable. Practice works in memory; closing or reloading may lose this record.</p>}{confirmReset ? <div className="flex flex-wrap gap-3"><button className={secondary} onClick={() => { resetMission(); setActiveId(null); setConfirmReset(false); setNotice("Mission progress and achievements reset."); }}>Confirm mission reset</button><button className={secondary} onClick={() => setConfirmReset(false)}>Keep progress</button></div> : <button className={secondary} onClick={() => setConfirmReset(true)}>Reset mission progress</button>}{notice && <p role="status">{notice}</p>}</section>
  </div>;
}
