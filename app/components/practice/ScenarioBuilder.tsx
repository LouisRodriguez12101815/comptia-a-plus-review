"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { scenarios, type Scenario } from "@/lib/practice/scenarios";

// Story Cubes style: each roll shows a device cube and a symptom cube for one scenario.
function pickNext(previous: string | null): Scenario {
  const pool = scenarios.filter((s) => s.id !== previous);
  return pool[Math.floor(Math.random() * pool.length)];
}

function orderChoices(scenario: Scenario): string[] {
  const all = [scenario.best, ...scenario.wrong];
  // Shuffle so the best step is not always first.
  return all.map((value) => ({ value, key: Math.random() })).sort((a, b) => a.key - b.key).map((x) => x.value);
}

export function ScenarioBuilder() {
  const t = useTranslations("scenarioBuilder");
  const [current, setCurrent] = useState<Scenario | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [rolls, setRolls] = useState(0);
  const [correct, setCorrect] = useState(0);

  function roll() {
    const next = pickNext(current?.id ?? null);
    setCurrent(next);
    setChoices(orderChoices(next));
    setPicked(null);
    setRolls((n) => n + 1);
  }

  function choose(choice: string) {
    if (!current || picked) return;
    setPicked(choice);
    if (choice === current.best) setCorrect((n) => n + 1);
  }

  const answered = picked !== null;
  const right = answered && picked === current?.best;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" onClick={roll} className="min-h-11 rounded-xl bg-teal-300 px-5 py-2 font-semibold text-slate-950">
        {current ? t("rollAgain") : t("roll")}
      </button>
      <p className="font-mono text-sm text-slate-300" aria-live="polite">{t("score", { correct, rolls })}</p>
    </div>

    {!current && <p className="text-slate-300">{t("ready")}</p>}

    {current && <section className="space-y-4 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t("deviceCube")}</p>
          <p className="mt-1 text-xl font-semibold text-white">{current.device}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">{t("symptomCube")}</p>
          <p className="mt-1 text-xl font-semibold text-white">{current.symptom}</p>
        </div>
      </div>
      <p className="text-slate-200">{current.situation}</p>
      <p className="font-semibold text-cyan-100">{t("prompt")}</p>
      <div className="grid gap-3">
        {choices.map((choice) => {
          const isBest = choice === current.best;
          const isPicked = picked === choice;
          const state = !answered ? "border-slate-600 bg-slate-950 hover:border-cyan-300"
            : isBest ? "border-emerald-400 bg-emerald-950"
            : isPicked ? "border-rose-400 bg-rose-950"
            : "border-slate-700 bg-slate-950 opacity-60";
          return <button key={choice} type="button" disabled={answered} onClick={() => choose(choice)} className={`min-h-12 rounded-xl border p-3 text-left text-sm ${state}`}>{choice}</button>;
        })}
      </div>
      {answered && <div role="status" className="space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <p className="font-semibold">{right ? t("right") : t("wrong")}</p>
        <p className="text-sm text-slate-200">{current.why}</p>
        <p className="text-xs text-slate-400">{t("objective", { objective: current.objective })}</p>
        <button type="button" onClick={roll} className="min-h-11 rounded-xl bg-teal-300 px-5 py-2 font-semibold text-slate-950">{t("next")}</button>
      </div>}
    </section>}
  </div>;
}
