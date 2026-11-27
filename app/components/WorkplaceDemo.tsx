"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const choices = ["follow", "wait", "elsewhere"] as const;

/** An illustrative exercise; it neither stores progress nor reads learner data. */
export function WorkplaceDemo() {
  const t = useTranslations("workplaceDemo");
  const paths = useTranslations("projectPaths");
  const [selected, setSelected] = useState<(typeof choices)[number] | null>(null);
  const [checked, setChecked] = useState(false);
  const [transfer, setTransfer] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 text-slate-200">
      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-widest text-teal-300">{t("eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
        <p className="leading-7">{t("intro")}</p>
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">{t("notice")}</p>
      </header>
      <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7" aria-labelledby="demo-question">
        <p className="text-sm leading-6 text-slate-300">{t("scenario")}</p>
        <fieldset disabled={checked}>
          <legend id="demo-question" className="mb-4 text-lg font-semibold text-white">{t("question")}</legend>
          <div className="space-y-2">
            {choices.map(choice => <label key={choice} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-600 p-3 has-[:checked]:border-teal-300">
              <input className="mt-1" type="radio" name="workplace-answer" value={choice} checked={selected === choice} onChange={() => setSelected(choice)} />
              <span>{t(`choices.${choice}`)}</span>
            </label>)}
          </div>
        </fieldset>
        {!checked ? <button type="button" disabled={!selected} onClick={() => setChecked(true)} className="min-h-11 rounded-lg bg-teal-300 px-5 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{t("check")}</button> :
          <div role="status" className="space-y-3 rounded-xl border border-teal-500/40 bg-teal-500/10 p-4 leading-6">
            <p className="font-semibold text-white">{selected === "follow" ? t("correct") : t("incorrect")}</p>
            <p><strong>{t("yourAnswer")}</strong> {selected && t(`choices.${selected}`)}</p>
            <p><strong>{t("correctAnswer")}</strong> {t("choices.follow")}</p>
            <p>{t("explanation")}</p>
            <button type="button" onClick={() => { setSelected(null); setChecked(false); setTransfer(false); }} className="min-h-11 rounded-lg border border-slate-500 px-4 py-2 hover:border-teal-300">{t("retry")}</button>
          </div>}
      </section>
      {checked && <section className="space-y-3 rounded-2xl border border-slate-700 p-5" aria-labelledby="demo-transfer">
        <h2 id="demo-transfer" className="text-xl font-semibold text-white">{t("transferTitle")}</h2>
        <p>{t("transferQuestion")}</p>
        <button type="button" aria-expanded={transfer} onClick={() => setTransfer(value => !value)} className="min-h-11 rounded-lg border border-slate-500 px-4 py-2 hover:border-teal-300">{transfer ? t("hideReasoning") : t("showReasoning")}</button>
        {transfer && <p className="leading-6 text-teal-100">{t("transferAnswer")}</p>}
      </section>}
      <footer className="space-y-3 text-sm leading-6 text-slate-300">
        <h2 className="text-lg font-semibold text-white">{paths("pilotBuiltTitle")}</h2>
        <p>{paths("pilotBuiltBody")}</p>
        <Link className="inline-flex min-h-11 items-center text-teal-300 underline" href="/methodology#build">{paths("pilotMethod")}</Link>
        <p><a className="text-teal-300 underline" href="https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/feature/workplace-learning-pilot/docs/examples/workplace-emergency-training-pilot.md">{paths("pilotSource")}</a></p>
        <p>{t("sourceContext")} <a className="text-teal-300 underline" href="https://www.osha.gov/emergency-preparedness/getting-started">{t("sourceLink")}</a></p>
        <p>{t("review")}</p>
        <Link className="inline-flex min-h-11 items-center text-teal-300 underline" href="/">{t("back")}</Link>
      </footer>
    </div>
  );
}
