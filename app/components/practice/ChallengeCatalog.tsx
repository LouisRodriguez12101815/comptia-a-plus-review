"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { NextPractice } from "@/app/components/practice/NextPractice";
import { useState } from "react";
import type { Challenge } from "@/lib/practice/types";
export function ChallengeCatalog({ challenges }: { challenges: Challenge[] }) {
  const t = useTranslations("challengeCatalog");
  const [certification, setCertification] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");
  const visible = challenges.filter((c) => (certification === "all" || c.certification === certification) && (difficulty === "all" || c.difficulty === difficulty) && (topic === "all" || c.topic === topic));
  const showSubnet = (certification === "all" || certification === "Network+") && (topic === "all" || topic === "IPv4 subnetting and VLSM") && (difficulty === "all" || difficulty === "Foundation → Applied");
  return <div className="space-y-6">
    <header className="space-y-3"><p className="text-sm text-cyan-100">{t("eyebrow")}</p><h1 className="text-4xl font-bold">{t("title")}</h1><p className="max-w-2xl text-slate-300">{t("intro")}</p></header>
    <NextPractice />
    {showSubnet && <article className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5"><h2 className="text-2xl font-semibold">{t("subnetTitle")}</h2><p>{t("subnetMeta")}</p><p className="text-slate-300">{t("subnetBody")}</p><Link href="/practice-games/subnet-architect" className="inline-block rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{t("playSubnet")}</Link></article>}
    <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-3">{[
      { label: t("certification"), value: certification, set: setCertification, options: [...challenges.map((c) => c.certification), "Network+"] },
      { label: t("topic"), value: topic, set: setTopic, options: [...challenges.map((c) => c.topic), "IPv4 subnetting and VLSM"] },
      { label: t("difficulty"), value: difficulty, set: setDifficulty, options: [...challenges.map((c) => c.difficulty), "Foundation → Applied"] },
    ].map((filter) => <label key={filter.label} className="text-sm">{filter.label}<select aria-label={filter.label} value={filter.value} onChange={(event) => filter.set(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="all">{t("all")}</option>{[...new Set(filter.options)].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">{visible.map((challenge) => <article key={challenge.id} className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5"><p className="text-sm text-cyan-100">{t("challengeMeta", { certification: challenge.certification, exam: challenge.exam.toUpperCase() })}</p><h2 className="text-2xl font-semibold">{challenge.title}</h2><p className="text-slate-300">{challenge.description}</p><p className="text-sm">{t("challengeStats", { topic: challenge.topic, difficulty: challenge.difficulty, count: challenge.rounds.length })}</p><details><summary className="cursor-pointer text-sm text-cyan-100">{t("objectivesSummary")}</summary><ul className="mt-2 space-y-2 text-sm">{challenge.rounds.map((round) => <li key={round.id}>{round.objective}</li>)}</ul></details><Link href={`/practice-games/${challenge.id}`} className="inline-block rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">{t("play", { mode: challenge.kind === "component" ? t("componentMatch") : t("followPacket") })}</Link></article>)}</div>
    {!visible.length && !showSubnet && <p role="status">{t("noMatches")}</p>}
    <article className="space-y-3 rounded-2xl border border-amber-300/30 bg-slate-900 p-5"><h2 className="text-2xl font-semibold">{t("outageTitle")}</h2><p className="text-slate-300">{t("outageBody")}</p><p className="text-sm">{t("outageMeta")}</p><Link href="/game" className="inline-block rounded-xl border border-amber-300 px-4 py-3 text-amber-100">{t("openOutage")}</Link></article>
  </div>;
}
