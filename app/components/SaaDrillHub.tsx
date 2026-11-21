"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions } from "@/lib/content";
import { drillDecks, type DrillDeck } from "@/lib/practice/drills";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";
import { weakestSaaDomain } from "@/lib/saa-study-loop";
import { deckCardFacts } from "@/lib/saa-test-skills";

const domains = objectives.exams.find((exam) => exam.code === "saa-c03")?.domains.map((domain) => ({
  id: domain.id,
  title: domain.title,
})) ?? [];

function drills(): DrillDeck[] {
  return drillDecks.filter((deck) => deck.exam === "saa-c03" && (deck.id.startsWith("aws-saa-") || deck.id.startsWith("hy-")));
}

export function SaaDrillHub() {
  const t = useTranslations("saaDrills");
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const domain = useMemo(
    () => weakestSaaDomain([...progress.quizAttempts, ...progress.mockAttempts], questions, domains),
    [progress],
  );
  const decks = drills();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="max-w-prose text-slate-300">{t("intro")}</p>
        <Link href={`/aws-saa/drills/boss?domain=${domain}`} className="inline-flex min-h-11 items-center rounded-xl bg-teal-300 px-5 font-semibold text-slate-950">
          {t("weakest")}
        </Link>
        <p className="text-sm text-slate-400">{t("weakestHint", { domain })}</p>
      </header>
      <ul className="grid gap-4">
        {decks.map((deck) => {
          const reverse = deck.modes.find((mode) => mode.id === "answerToCue" || mode.id === "answerToScenario" || mode.id === "rightToLeft");
          const facts = deckCardFacts(deck, progress.drillPractice?.decks?.[deck.id]);
          const modeLabels = [t("practice"), ...(reverse ? [t("reverse")] : []), t("speed"), t("survival"), t("missed")].join(", ");
          return (
            <li key={deck.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-medium text-white">{d(`${deck.id}.title`)}</h2>
              <p className="mt-1 text-sm text-slate-300">{t("deckStats", { count: facts.count, modes: modeLabels, score: facts.bestScore, streak: facts.bestStreak })}</p>
              <p className="mt-1 text-sm text-slate-400">{d(`${deck.id}.cardBody`)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/practice-games/drills/${deck.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{t("practice")}</Link>
                {reverse && <Link href={`/practice-games/drills/${deck.id}?mode=${reverse.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{t("reverse")}</Link>}
                <Link href={`/practice-games/drills/${deck.id}?session=speed`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{t("speed")}</Link>
                <Link href={`/practice-games/drills/${deck.id}?session=survival`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{t("survival")}</Link>
                <Link href={`/practice-games/drills/${deck.id}?session=missed`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{t("missed")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
