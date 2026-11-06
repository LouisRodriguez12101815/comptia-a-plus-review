"use client";

import { useTranslations } from "next-intl";

const steps = ["ingest", "map", "assess", "drill", "remediate", "measure"] as const;

export function MethodologyWorkflow() {
  const t = useTranslations("methodologyPage");
  return (
    <section aria-labelledby="workflow-heading" className="methodology-workflow rounded-3xl border border-indigo-400/30 bg-slate-950/60 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-300">{t("systemLoopLabel")}</p>
          <h2 id="workflow-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white">{t("workflowHeading")}</h2>
        </div>
        <p className="max-w-md text-sm text-slate-400">{t("workflowBody")}</p>
      </div>
      <svg aria-hidden="true" viewBox="0 0 1000 120" className="methodology-flow mt-6 hidden w-full md:block">
        <path id="methodology-workflow-path" d="M70 60 C220 12 330 108 500 60 S780 12 930 60" fill="none" stroke="var(--track-accent-line)" strokeWidth="2" strokeDasharray="4 8" />
        <circle className="workflow-packet" cx="70" cy="60" r="5" fill="var(--color-cyan-300)">
          <animateMotion dur="9s" repeatCount="indefinite"><mpath href="#methodology-workflow-path" /></animateMotion>
        </circle>
      </svg>
      <ol className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, index) => (
          <li key={step} className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-indigo-300/60 hover:bg-slate-900">
            <span className="font-mono text-xs text-indigo-300">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 font-semibold text-white">{t(`${step}Title`)}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">{t(`${step}Body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
