"use client";
import Link from "next/link";
import { NextPractice } from "@/app/components/practice/NextPractice";
import { useState } from "react";
import type { Challenge } from "@/lib/practice/types";
export function ChallengeCatalog({ challenges }: { challenges: Challenge[] }) {
  const [certification, setCertification] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");
  const visible = challenges.filter((c) => (certification === "all" || c.certification === certification) && (difficulty === "all" || c.difficulty === difficulty) && (topic === "all" || c.topic === topic));
  return <div className="space-y-6">
    <header className="space-y-3"><p className="text-sm text-cyan-100">Learn by making a decision</p><h1 className="text-4xl font-bold">Practice Games</h1><p className="max-w-2xl text-slate-300">Match a component or build a packet’s journey. Each solo challenge explains your decision, supports retries, and tracks first attempts separately from completion.</p></header>
    <NextPractice />
    <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-3">{[
      { label: "Certification", value: certification, set: setCertification, options: challenges.map((c) => c.certification) },
      { label: "Topic", value: topic, set: setTopic, options: challenges.map((c) => c.topic) },
      { label: "Difficulty", value: difficulty, set: setDifficulty, options: challenges.map((c) => c.difficulty) },
    ].map((filter) => <label key={filter.label} className="text-sm">{filter.label}<select aria-label={filter.label} value={filter.value} onChange={(event) => filter.set(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="all">All</option>{[...new Set(filter.options)].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">{visible.map((challenge) => <article key={challenge.id} className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5"><p className="text-sm text-cyan-100">{challenge.certification} · {challenge.exam.toUpperCase()} · Solo</p><h2 className="text-2xl font-semibold">{challenge.title}</h2><p className="text-slate-300">{challenge.description}</p><p className="text-sm">{challenge.topic} · {challenge.difficulty} · {challenge.rounds.length} objectives</p><details><summary className="cursor-pointer text-sm text-cyan-100">Learning objectives</summary><ul className="mt-2 space-y-2 text-sm">{challenge.rounds.map((round) => <li key={round.id}>{round.objective}</li>)}</ul></details><Link href={`/practice-games/${challenge.id}`} className="inline-block rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Play {challenge.kind === "component" ? "Component Match" : "Follow the Packet"}</Link></article>)}</div>
    {!visible.length && <p role="status">No challenges match these filters. Choose All to see the available practice.</p>}
    <article className="space-y-3 rounded-2xl border border-amber-300/30 bg-slate-900 p-5"><h2 className="text-2xl font-semibold">Outage Ops</h2><p className="text-slate-300">Cooperative troubleshooting with Guided Demo and existing Twilio rooms. Investigate evidence, diagnose the incident, repair and verify.</p><p className="text-sm">A+ / Network+ · Troubleshooting · Applied</p><Link href="/game" className="inline-block rounded-xl border border-amber-300 px-4 py-3 text-amber-100">Open Outage Ops</Link></article>
  </div>;
}
