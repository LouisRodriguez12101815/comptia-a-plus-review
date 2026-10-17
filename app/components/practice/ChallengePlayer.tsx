"use client";

import Link from "next/link";
import { NextPractice } from "@/app/components/practice/NextPractice";
import { useEffect, useRef, useState } from "react";
import { ComponentArt } from "@/app/components/practice/ComponentArt";
import { PacketDiagram } from "@/app/components/practice/PacketDiagram";
import { advance, isComplete, newSession, restoreSession, shuffle, solved, submit, summarize, requestHint } from "@/lib/practice/session";
import type { Challenge, Choice, Session, Source } from "@/lib/practice/types";

const button = "rounded-xl border border-cyan-300 bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-50";
export function ChallengePlayer({ challenge, sources }: { challenge: Challenge; sources: Source[] }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Record<string, Choice[]>>({});
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const key = `practice-game:${challenge.id}:v${challenge.version}`;
  useEffect(() => { if (session) { try { localStorage.setItem(key, JSON.stringify(session)); } catch { /* Practice remains playable without browser storage. */ } } }, [session, key]);
  const roundIndex = session?.roundIndex;
  const started = session !== null;
  useEffect(() => { if (started) heading.current?.focus(); }, [roundIndex, started]); // Focus follows the learning task, never an animation.
  function begin(resume = false) {
    let saved: Session | null = null;
    if (resume) { try { saved = restoreSession(localStorage.getItem(key), challenge); } catch {} }
    if (resume && !saved) { setNotice("No valid saved session for this challenge version. Start a new practice session."); return; }
    setNotice(""); setOrders(Object.fromEntries(challenge.rounds.map((round) => [round.id, shuffle(round.choices)])));
    setSession(saved ?? newSession(challenge));
  }
  function choose(roundId: string, answerId: string) { setSession((current) => current ? submit(current, challenge, roundId, answerId) : current); }
  const summary = session ? summarize(session, challenge) : null;
  const round = session ? challenge.rounds[session.roundIndex] : null;
  const receipt = round && session ? session.receipts[round.id] : null;
  const last = round?.choices.find((choice) => choice.id === receipt?.attemptedIds.at(-1));
  const correct = !!session && solved(session, challenge);
  const scenario = challenge.scenarios.find((s) => s.id === round?.scenarioId);
  const effectRow = session && round ? challenge.rounds.slice(0, session.roundIndex + 1).findLast((r) => r.scenarioId === round.scenarioId && session.receipts[r.id]?.attemptedIds.includes(r.correctAnswerId)) : undefined;
  function reviewLinks(ids: string[]) { return [...new Set(ids)].map((id) => { const source = sources.find((s) => s.id === id)!; return <Link key={id} href={source.href} className="mr-4 inline-block text-sm text-cyan-200 underline">{source.title}</Link>; }); }
  return <div className="mx-auto max-w-4xl space-y-5">
    <Link href="/practice-games" className="text-cyan-200 underline">← Practice Games</Link>
    <header className="space-y-2"><p className="text-sm text-cyan-100">{challenge.certification} · {challenge.exam.toUpperCase()} · {challenge.difficulty} · Solo practice</p><h1 className="text-3xl font-bold">{challenge.title}</h1></header>
    {!session ? <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <p>{challenge.description}</p><p className="text-sm text-slate-300">Click or tap an answer to match it{challenge.kind === "packet" ? " into the next position in the journey" : " to the function, specification or symptom"}. Keyboard: Tab to a card, Enter or Space to choose. Mouse dragging onto the target is optional.</p>
      <p className="text-sm text-slate-300">Correct completion earns 100 once per round. A hint reduces that round’s award to 75. Retries earn no extra points; first-attempt accuracy and hint use are tracked separately. No timer or speed bonus.</p>
      <p className="text-sm text-slate-300">Progress stays in this browser when storage is available. These local scores are solo practice records.</p>
      <div className="flex flex-wrap gap-3"><button className={button} onClick={() => begin()}>Start challenge</button><button className="rounded-xl border border-slate-600 px-5 py-3" onClick={() => begin(true)}>Resume saved practice</button></div>
      {notice && <p role="status" className="text-amber-100">{notice}</p>}
      <details><summary className="cursor-pointer text-cyan-100">Learning objectives</summary><ul className="mt-2 space-y-2 text-sm">{challenge.rounds.map((r) => <li key={r.id}>{r.objective}</li>)}</ul></details>
    </section> : <>
      <section aria-label="Practice progress" className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <p>Score {summary?.points} · Completed {summary?.completed}/{challenge.rounds.length} · First-attempt accuracy {summary?.firstAttemptAccuracy === null ? "—" : `${summary?.firstAttemptAccuracy}%`} · Hints {summary?.hints} · Retries {summary?.retries}</p>
        <progress aria-label="Challenge completion" value={summary?.completed} max={challenge.rounds.length} className="h-3 w-full accent-teal-400" />
      </section>
      {isComplete(session, challenge) ? <section className="space-y-5 rounded-2xl border border-teal-300/30 bg-slate-900 p-6" aria-label="Challenge debrief">
        <h2 ref={heading} tabIndex={-1} className="text-2xl font-bold">Practice debrief</h2>
        <p>Final completion {summary?.completed}/{challenge.rounds.length}. First attempts {summary?.firstCorrect}/{summary?.attempted} correct. Hints {summary?.hints}. Points record practice, not mastery.</p>
        <p>Score math: {summary?.fullAwards} × 100 + {summary?.hintedAwards} × 75 = {summary?.points}</p>
        <h3 className="text-xl font-semibold">Matched on first attempt without hints</h3>
        <ul className="space-y-1 text-sm">{summary?.rows.filter((row) => row.firstAttemptCorrect && !row.hintUsed).map((row) => <li key={row.round.id}>✓ {row.round.title}: {row.round.objective}</li>)}</ul>
        {!summary?.rows.some((row) => row.firstAttemptCorrect && !row.hintUsed) && <p>No unaided first-attempt matches yet. Completed retries are still useful practice.</p>}
        <h3 className="text-xl font-semibold">Misconceptions and recommended review</h3>
        {summary?.rows.filter((row) => row.misconceptions.length || row.hintUsed).map((row) => <article key={row.round.id} className="space-y-2 rounded-xl border border-amber-300/30 p-4"><h4 className="font-semibold">Review: {row.round.objective}</h4>{row.misconceptions.map((choice) => <p key={choice.id} className="text-sm text-slate-200">{choice.label} — {choice.explanation}</p>)}{row.hintUsed && <p className="text-sm text-amber-100">Hint-assisted practice; revisit the source without the hint.</p>}{reviewLinks(row.round.sourceIds)}</article>)}
        {!summary?.recommendations.length && <p>No mistakes or hints recorded. Explain the principle in your own words and try a new example before treating it as understood.</p>}
        <h3 className="text-xl font-semibold">Exam objectives practiced</h3>
        <ul className="space-y-2 text-sm">{[...new Set(challenge.rounds.flatMap((r) => r.examMappings.map((m) => `${m.exam.toUpperCase()}: ${m.area}`)))].map((mapping) => <li key={mapping}>{mapping}</li>)}</ul>
        <p className="text-sm">{challenge.kind === "component" ? "Transfer: a replacement has the right connector but the wrong generation. What manual checks would prevent an incompatible purchase?" : "Transfer recap: warm ARP caches avoided new broadcasts, the /26 won over /24, the frame was rebuilt, and one routed hop reduced TTL to 63. Explain which fields would differ if NAT were introduced."}</p>
        <div>{reviewLinks(challenge.rounds.flatMap((r) => r.sourceIds))}</div>
        {challenge.id === "follow-packet" && <NextPractice />}
        <button className={button} onClick={() => begin()}>Practice again</button>
      </section> : round && <section className="space-y-5 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5 sm:p-7" data-round-id={round.id}>
        <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold">{round.title}</h2><p className="text-sm text-cyan-100"><strong>Objective:</strong> {round.objective}</p>
        {round.art && <ComponentArt kind={round.art} />}
        {scenario && <><p className="text-sm text-amber-100"><strong>Assumptions:</strong> {scenario.assumptions}</p><PacketDiagram scenario={scenario} effect={effectRow?.effect} decisionId={effectRow?.id ?? "initial"} /></>}
        <div role="group" aria-label={challenge.kind === "packet" ? "Next journey position" : "Match target"} className="rounded-xl border-2 border-dashed border-cyan-300/50 p-4" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const [roundId, answerId] = event.dataTransfer.getData("text/plain").split("/"); if (roundId === round.id) choose(roundId, answerId); }}>
          <h3 className="font-semibold">{challenge.kind === "packet" ? `Journey position ${challenge.rounds.filter((r,i) => i < session.roundIndex && r.scenarioId === round.scenarioId).length + 1}` : "Match the component"}</h3><p className="mt-2">{round.prompt}</p><p className="mt-1 text-xs text-slate-300">Choose a card below, or drag it here. Both interactions use the same scoring rules.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{(orders[round.id] ?? round.choices).map((choice) => <button key={choice.id} data-answer-id={choice.id} draggable={!correct && !receipt?.attemptedIds.includes(choice.id)} onDragStart={(event) => event.dataTransfer.setData("text/plain", `${round.id}/${choice.id}`)} disabled={correct || receipt?.attemptedIds.includes(choice.id)} onClick={() => choose(round.id, choice.id)} className="flex min-h-24 flex-wrap items-center gap-3 rounded-xl border border-slate-600 bg-slate-950 p-4 text-left text-slate-100 hover:border-cyan-300 disabled:opacity-60">{choice.art && <ComponentArt kind={choice.art} small />}<span className="flex-1">{choice.label}</span></button>)}</div>
        {last && <div role="status" aria-live="polite" className={`space-y-2 rounded-xl border p-4 ${correct ? "border-teal-300/50 bg-teal-300/10 text-teal-100" : "border-rose-300/50 bg-rose-300/10 text-rose-100"}`}><p className="font-semibold">{correct ? "✓ Supported match" : "↻ Try a different match"}</p><p>{last.explanation}</p>{correct ? <><p>{round.success}</p><p className="text-sm">+{receipt?.hintUsed ? 75 : 100} once for this objective.</p></> : <p className="text-sm">No points awarded. Read the explanation, then choose another card.</p>}</div>}
        {receipt?.hintUsed && <p role="status" className="rounded-xl border border-amber-300/30 p-4 text-amber-100">Hint: {round.hint}</p>}
        <div className="flex flex-wrap gap-3">{!correct && <button className="rounded-xl border border-amber-300/50 px-4 py-3 text-amber-100 disabled:opacity-50" disabled={receipt?.hintUsed} onClick={() => setSession((current) => current ? requestHint(current, challenge) : current)}>{receipt?.hintUsed ? "Hint already used" : "Use hint (−25 from this round’s award)"}</button>}{correct && <button className={button} onClick={() => setSession((current) => current ? advance(current, challenge) : current)}>Continue</button>}</div>
        {challenge.kind === "packet" && <section aria-label="Arranged packet journey"><h3 className="font-semibold">Your arranged journey</h3><ol className="mt-2 list-inside list-decimal space-y-2 text-sm">{summary?.rows.filter((row) => row.complete && row.round.scenarioId === round.scenarioId).map((row) => <li key={row.round.id}>{row.round.choices.find((c) => c.id === row.round.correctAnswerId)?.label}</li>)}</ol></section>}
        <details><summary className="cursor-pointer text-sm text-cyan-200">Sources for this objective</summary><div className="mt-2">{reviewLinks(round.sourceIds)}</div></details>
      </section>}
    </>}
  </div>;
}
