"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import objectives from "@/content/objectives.json";
import { NextPractice } from "@/app/components/practice/NextPractice";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import type { Challenge } from "@/lib/practice/types";
import { drillDecks, drillHref } from "@/lib/practice/drills";
import { certificationForFocus, groupDrills, recommendDrills } from "@/lib/practice/grouping";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import { weakObjectiveIds } from "@/lib/weakness";

type ExamDomains = { code: string; domains: { id: string; title: string }[] };
const exams = (objectives as { exams: ExamDomains[] }).exams;
const domainTitle = (exam: string, major: string) => exams.find((e) => e.code.toLowerCase() === exam.toLowerCase())?.domains.find((d) => d.id === `${major}.0`)?.title;
const card = "rounded-2xl border border-slate-700 bg-slate-900 p-5";

export function ChallengeCatalog({ challenges }: { challenges: Challenge[] }) {
  const t = useTranslations("challengeCatalog");
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const [focus] = useStudyFocus();
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  // Opens on the exam being studied; choosing a certification here overrides that.
  const [picked, setPicked] = useState<string | null>(null);
  const certification = picked ?? certificationForFocus(focus);
  const [difficulty, setDifficulty] = useState("all");
  const [pickedTopic, setPickedTopic] = useState("all");

  const certificationDecks = drillDecks.filter((deck) => certification === "all" || deck.certification === certification);
  const topicOptions = [...new Set([
    ...challenges.filter((c) => certification === "all" || c.certification === certification).map((c) => c.topic),
    ...(certification === "all" || certification === "Network+" ? ["IPv4 subnetting and VLSM"] : []),
    ...certificationDecks.map((deck) => deck.topic),
  ])];
  const topic = topicOptions.includes(pickedTopic) ? pickedTopic : "all";

  const visible = challenges.filter((c) => (certification === "all" || c.certification === certification) && (difficulty === "all" || c.difficulty === difficulty) && (topic === "all" || c.topic === topic));
  const showSubnet = (certification === "all" || certification === "Network+") && (topic === "all" || topic === "IPv4 subnetting and VLSM") && (difficulty === "all" || difficulty === "Foundation → Applied");
  const drills = certificationDecks.filter((deck) => (difficulty === "all" || difficulty === "Rapid-fire") && (topic === "all" || topic === deck.topic));
  const groups = groupDrills(drills, domainTitle, { mixed: t("mixedGroup"), other: t("otherGroup") }, certification === "all");

  // "Start here" points at drills for the objectives the timed tests found weak.
  const exam = certification === "all" ? undefined : certificationDecks[0]?.exam;
  const weak = exam ? weakObjectiveIds(progress.mockAttempts, exam) : [];
  const picks = recommendDrills(certificationDecks, weak);
  const tested = exam ? progress.mockAttempts.some((attempt) => attempt.exam === exam) : false;

  const filters = [
    { label: t("certification"), value: certification, set: (v: string) => { setPicked(v); setPickedTopic("all"); }, options: [...new Set([...challenges.map((c) => c.certification), "Network+", ...drillDecks.map((deck) => deck.certification)])] },
    { label: t("topic"), value: topic, set: setPickedTopic, options: topicOptions },
    { label: t("difficulty"), value: difficulty, set: setDifficulty, options: [...new Set([...challenges.map((c) => c.difficulty), "Foundation → Applied", "Rapid-fire"])] },
  ];
  const showNextHop = certification === "all" || certification === "Network+";
  const nothing = !visible.length && !showSubnet && !drills.length;

  return <div className="space-y-6">
    <header className="space-y-3"><p className="text-sm text-cyan-100">{t("eyebrow")}</p><h1 className="text-4xl font-bold">{t("title")}</h1><p className="max-w-2xl text-slate-300">{t("intro")}</p></header>

    <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-3">{filters.map((filter) => <label key={filter.label} className="text-sm">{filter.label}<select aria-label={filter.label} value={filter.value} onChange={(event) => filter.set(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="all">{t("all")}</option>{filter.options.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</div>

    {showNextHop && <NextPractice />}

    {exam && drills.length > 0 && <section aria-labelledby="start-here" className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <h2 id="start-here" className="text-xl font-semibold">{t("startHereHeading")}</h2>
      {picks.length > 0 ? <>
        <p className="text-sm text-slate-300">{t("startHereWeak", { objectives: weak.join(", ") })}</p>
        <ul className="grid gap-2 sm:grid-cols-3">{picks.map(({ deck, objectiveIds }) => <li key={deck.id}><Link href={drillHref(deck.id)} className="flex h-full min-h-11 flex-col gap-1 rounded-xl bg-cyan-300 px-4 py-3 text-slate-950 hover:bg-cyan-200"><span className="font-semibold">{d(`${deck.id}.title`)}</span><span className="text-sm">{t("startHereCovers", { objectives: objectiveIds.join(", ") })}</span></Link></li>)}</ul>
      </> : tested && weak.length === 0 ? <p className="text-sm text-slate-300">{t("startHereClear")}</p>
        : weak.length > 0 ? <p className="text-sm text-slate-300">{t("startHereNoDrill", { objectives: weak.join(", ") })}</p>
        : <>
          <p className="text-sm text-slate-300">{t("startHereNone")}</p>
          <Link href={`/test?exam=${exam}`} className="inline-flex min-h-11 items-center rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("startHereTest")}</Link>
        </>}
    </section>}

    {groups.length > 0 && <section aria-labelledby="memory-drills" className="space-y-4 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <div><h2 id="memory-drills" className="text-2xl font-semibold">{t("drillsTitle")}</h2><p className="mt-1 text-slate-300">{t("drillsBody")}</p></div>
      {groups.map((group) => <section key={group.id} aria-labelledby={`group-${group.id.replace(/[^\w]+/g, "-")}`} className="space-y-2">
        <h3 id={`group-${group.id.replace(/[^\w]+/g, "-")}`} className="flex flex-wrap items-baseline gap-2 text-lg font-semibold text-white">{group.title}<span className="text-sm font-normal text-slate-400">{t("drillCount", { count: group.decks.length })}</span></h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{group.decks.map((deck) => {
          const title = d(`${deck.id}.title`);
          return <li key={deck.id}><Link href={drillHref(deck.id)} className="flex h-full min-h-11 flex-col gap-1 rounded-xl border border-slate-700 bg-slate-950 p-3 hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"><span className="font-medium text-white">{deck.id.includes("assessment") ? title.replace(/^[^:]{3,30}:\s+/, "") : title}</span><span className="text-xs text-cyan-100">{t("drillObjectives", { objective: deck.objective })}</span></Link></li>;
        })}</ul>
      </section>)}
    </section>}

    {(showSubnet || visible.length > 0) && <section aria-labelledby="games-heading" className="space-y-4">
      <h2 id="games-heading" className="text-2xl font-semibold">{t("gamesHeading")}</h2>
      {showSubnet && <article className={`space-y-3 ${card} border-teal-300/40`}><h3 className="text-xl font-semibold">{t("subnetTitle")}</h3><p>{t("subnetMeta")}</p><p className="text-slate-300">{t("subnetBody")}</p><Link href="/practice-games/subnet-architect" className="inline-block rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{t("playSubnet")}</Link></article>}
      <div className="grid gap-4 sm:grid-cols-2">{visible.map((challenge) => <article key={challenge.id} className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5"><p className="text-sm text-cyan-100">{t("challengeMeta", { certification: challenge.certification, exam: challenge.exam.toUpperCase() })}</p><h3 className="text-2xl font-semibold">{challenge.title}</h3><p className="text-slate-300">{challenge.description}</p><p className="text-sm">{t("challengeStats", { topic: challenge.topic, difficulty: challenge.difficulty, count: challenge.rounds.length })}</p><details><summary className="cursor-pointer text-sm text-cyan-100">{t("objectivesSummary")}</summary><ul className="mt-2 space-y-2 text-sm">{challenge.rounds.map((round) => <li key={round.id}>{round.objective}</li>)}</ul></details><Link href={`/practice-games/${challenge.id}`} className="inline-block rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">{t("play", { mode: challenge.kind === "component" ? t("componentMatch") : t("followPacket") })}</Link></article>)}</div>
    </section>}
    {nothing && <p role="status">{t("noMatches")}</p>}
    {certification !== "all" && !showSubnet && !visible.length && drills.length > 0 && <p className="text-sm text-slate-400">{t("noGamesForExam")}</p>}

    <article className="space-y-3 rounded-2xl border border-amber-300/30 bg-slate-900 p-5"><h2 className="text-2xl font-semibold">{t("outageTitle")}</h2><p className="text-slate-300">{t("outageBody")}</p><p className="text-sm">{t("outageMeta")}</p><Link href="/game" className="inline-block rounded-xl border border-amber-300 px-4 py-3 text-amber-100">{t("openOutage")}</Link></article>
  </div>;
}
