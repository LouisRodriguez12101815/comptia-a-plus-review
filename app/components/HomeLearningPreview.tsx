"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HomeLearningPreview() {
  const t = useTranslations("homePage");
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === 2;
  return (
    <section aria-labelledby="intuition-heading" className="rounded-2xl border border-cyan-400/25 bg-slate-900/75 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">{t("previewEyebrow")}</p><h2 id="intuition-heading" className="mt-2 text-xl font-semibold text-white">{t("previewHeading")}</h2></div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{t("previewLabel")}</span>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">{t("previewPrompt")}</p>
      <fieldset className="mt-4 grid gap-2 sm:grid-cols-2" disabled={submitted}>
        <legend className="sr-only">{t("previewPrompt")}</legend>
        {(["previewChoice1", "previewChoice2", "previewChoice3", "previewChoice4"] as const).map((key, index) => <label key={index} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${selected === index ? "border-cyan-300 bg-cyan-300/10 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}><input type="radio" name="home-preview" checked={selected === index} onChange={() => setSelected(index)} className="accent-cyan-300" />{t(key)}</label>)}
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={selected === null || submitted} onClick={() => setSubmitted(true)} className="min-h-11 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{t("previewSubmit")}</button><Link href="/aws-clf" className="text-sm text-cyan-200 underline underline-offset-4">{t("previewStudyLink")}</Link></div>
      {submitted ? <div role="status" className={`mt-4 rounded-xl border p-4 text-sm ${correct ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-amber-400/40 bg-amber-400/10 text-amber-100"}`}><p className="font-semibold">{correct ? t("previewCorrect") : t("previewIncorrect")}</p><p className="mt-1">{t("previewExplanation")}</p><Link href="/notes/aws-clf-cloud-concepts" className="mt-2 inline-block underline underline-offset-4">{t("previewReview")}</Link></div> : null}
    </section>
  );
}
