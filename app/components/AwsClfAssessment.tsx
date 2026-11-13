"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions, topics } from "@/lib/content";
import { buildExamPool, assessmentVersion } from "@/lib/exam-test.mjs";
import { assessAwsClf, type ClfAssessmentState } from "@/lib/aws-clf-assessment";
import { resourcesForAwsClfObjective } from "@/lib/aws-clf-resources";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";

const pool = buildExamPool({ objectives, questions, topics, examCode: "clf-c02" });
const bankVersion = assessmentVersion(pool.domains.flatMap((domain) => domain.objectives.flatMap((objective) => objective.questionIds)).map((id) => questions.find((question) => question.id === id)).filter((question): question is (typeof questions)[number] => Boolean(question)));
const stateStyle: Record<ClfAssessmentState, string> = {
  "not-assessed": "border-slate-700 text-slate-300",
  insufficient: "border-amber-400/50 text-amber-200",
  weak: "border-rose-400/50 text-rose-200",
  developing: "border-sky-400/50 text-sky-200",
  strong: "border-emerald-400/50 text-emerald-200",
};

export function AwsClfAssessment() {
  const t = useTranslations("awsClfAssessment");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const rows = useMemo(() => assessAwsClf(progress, pool, questions, bankVersion), [progress]);
  const counts = rows.reduce((all, row) => ({ ...all, [row.state]: all[row.state] + 1 }), { "not-assessed": 0, insufficient: 0, weak: 0, developing: 0, strong: 0 } as Record<ClfAssessmentState, number>);
  const assessed = rows.filter((row) => row.state !== "not-assessed").length;

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm uppercase tracking-wide text-cyan-300">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
      <p className="max-w-3xl text-slate-300">{t("intro")}</p>
      <p className="max-w-3xl text-xs text-slate-400">{t("heuristic")}</p>
    </header>
    <section className="grid gap-3 sm:grid-cols-4" aria-label={t("summaryLabel")}>
      <Summary label={t("assessed")} value={`${assessed}/${rows.length}`} />
      <Summary label={t("insufficient")} value={`${counts.insufficient}`} />
      <Summary label={t("weak")} value={`${counts.weak}`} />
      <Summary label={t("strong")} value={`${counts.strong}`} />
    </section>
    {assessed === 0 && <section className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.06] p-5">
      <p className="text-slate-200">{t("empty")}</p>
      <Link href="/test?exam=clf-c02" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("startAssessment")}</Link>
    </section>}
    <div className="space-y-4">
      {rows.map((row) => <article key={row.objectiveId} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-mono text-sm text-cyan-300">{row.objectiveId} · {row.domainTitle}</p><h2 className="mt-1 text-lg font-semibold text-white">{row.title}</h2></div>
          <span className={`rounded-full border px-3 py-1 text-sm ${stateStyle[row.state]}`}>{t(`state.${row.state}`)}</span>
        </div>
        <p className="mt-3 text-sm text-slate-300">{row.distinctQuestions === 0 ? t("noEvidence") : t("evidence", { distinct: row.distinctQuestions, answers: row.totalAnswers, accuracy: row.accuracy ?? 0 })}</p>
        {row.evidence !== "none" && <p className="mt-1 text-xs text-amber-200">{t(`evidenceClass.${row.evidence}`)}</p>}
        {row.state === "insufficient" && <p className="mt-1 text-xs text-amber-200">{t("limitedEvidence")}</p>}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {resourcesForAwsClfObjective(row.objectiveId).map((resource) => <Link key={resource.href} href={resource.href} className="inline-flex min-h-10 items-center rounded-full border border-slate-600 px-3 text-teal-200 underline underline-offset-4 hover:border-teal-300">{t(`resource.${resource.type}`)}</Link>)}
        </div>
      </article>)}
    </div>
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>; }
