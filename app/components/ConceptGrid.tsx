"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { conceptProgress, type ConceptStatus } from "@/lib/concept-status";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";

export type ConceptCard = {
  id: string;
  title: string;
  summary: string;
  questionIds: string[];
  videos: { slug: string; title: string }[];
  visuals: { file: string; title: string }[];
  named: boolean;
};
export type DomainCards = { id: string; title: string; objectives: { id: string; title: string; concepts: ConceptCard[] }[] };

const badge: Record<ConceptStatus, string> = {
  untested: "border-slate-600 text-slate-300",
  weak: "border-rose-400 text-rose-200",
  improving: "border-amber-400 text-amber-200",
  solid: "border-emerald-400 text-emerald-200",
};

function Card({ concept }: { concept: ConceptCard }) {
  const t = useTranslations("networkPlusConcepts");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const result = conceptProgress(concept.questionIds, progress);
  return (
    <li id={`concept-${concept.id}`} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-white">{concept.title}</h4>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${badge[result.status]}`}>{t(`status.${result.status}`)}</span>
        </div>
        {concept.summary ? <p className="mt-1 text-sm text-slate-400">{concept.summary}</p> : null}
        <p className="mt-1 text-xs text-slate-400">
          {t("progress", { answered: result.answered, total: concept.questionIds.length, correct: result.correct })}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={`/quiz?concept=${encodeURIComponent(concept.id)}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal-500 px-4 py-2 font-medium text-slate-950 hover:bg-teal-400"
        >
          {t("drill", { count: concept.questionIds.length })}
        </Link>
        {concept.videos.map((video) => (
          <Link key={video.slug} href={`/networking/videos/${video.slug}`} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">
            {t("video", { title: video.title })}
          </Link>
        ))}
        {concept.visuals.map((visual) => (
          <a key={visual.file} href={`/visuals/${visual.file}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">
            {t("diagram", { title: visual.title })}
          </a>
        ))}
      </div>
    </li>
  );
}

export function ConceptGrid({ domains, pairs }: { domains: DomainCards[]; pairs: ConceptCard[] }) {
  const t = useTranslations("networkPlusConcepts");
  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <details key={domain.id} className="rounded-2xl border border-slate-800 p-4" open={domain.id === "1" || domain.id === "2"}>
          <summary className="cursor-pointer font-medium text-white">{t("domain", { id: domain.id, title: domain.title })}</summary>
          <div className="mt-4 space-y-5">
            {domain.objectives.map((objective) => (
              <div key={objective.id}>
                <h3 className="text-sm font-medium text-slate-200">{objective.id} · {objective.title}</h3>
                <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                  {objective.concepts.map((concept) => <Card key={concept.id} concept={concept} />)}
                </ul>
              </div>
            ))}
          </div>
        </details>
      ))}
      <section id="look-alike-pairs" aria-labelledby="pairs-heading" className="space-y-3">
        <div>
          <h3 id="pairs-heading" className="text-base font-medium text-white">{t("pairsTitle")}</h3>
          <p className="mt-1 text-sm text-slate-400">{t("pairsBody")}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {pairs.map((pair) => <Card key={pair.id} concept={pair} />)}
        </ul>
      </section>
    </div>
  );
}
