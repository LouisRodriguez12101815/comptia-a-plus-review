"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { choicesFor, drillDecks, drillHref, getDeck, itemsForMode, shuffle, type DrillItem } from "@/lib/practice/drills";

type Answer = { item: DrillItem; picked: string };

export function FactDrill({ deckId }: { deckId: string }) {
  const t = useTranslations("factDrill");
  // Deck keys are data-driven, so the typed key union is widened here.
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const deck = getDeck(deckId)!;
  const [modeId, setModeId] = useState(deck.modes[0].id);
  const mode = deck.modes.find((m) => m.id === modeId) ?? deck.modes[0];
  // Nothing is shuffled until the learner starts, so server and client HTML match.
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<DrillItem[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [missed, setMissed] = useState<Set<string>>(() => new Set());

  const current = queue[0];
  const total = itemsForMode(deck, mode).length;

  // Choices are drawn once per question so they don't reshuffle on re-render.
  function show(nextQueue: DrillItem[], nextMode = mode) {
    setQueue(nextQueue);
    setChoices(nextQueue[0] ? choicesFor(deck, nextMode, nextQueue[0]) : []);
  }

  function restart(nextModeId: string = modeId, onlyMissed = false) {
    const nextMode = deck.modes.find((m) => m.id === nextModeId) ?? deck.modes[0];
    const all = itemsForMode(deck, nextMode);
    const pool = onlyMissed ? all.filter((i) => missed.has(i.id)) : all;
    setModeId(nextMode.id);
    setStarted(true);
    show(shuffle(pool.length ? pool : all), nextMode);
    setAnswer(null);
    setCorrect(0);
    setAttempts(0);
    setStreak(0);
    if (!onlyMissed) setMissed(new Set());
  }

  function pick(choice: string) {
    if (answer || !current) return;
    setAnswer({ item: current, picked: choice });
    setAttempts((n) => n + 1);
    if (choice === current.fields[mode.to]) {
      setCorrect((n) => n + 1);
      setStreak((s) => {
        setBest((b) => Math.max(b, s + 1));
        return s + 1;
      });
    } else {
      setStreak(0);
      setMissed((m) => new Set(m).add(current.id));
    }
  }

  function next() {
    if (!answer) return;
    const wasRight = answer.picked === answer.item.fields[mode.to];
    const [head, ...rest] = queue;
    // A miss comes back three questions later (or last).
    const at = Math.min(3, rest.length);
    show(wasRight ? rest : [...rest.slice(0, at), head, ...rest.slice(at)]);
    setAnswer(null);
  }

  const others = drillDecks.filter((o) => o.id !== deck.id);

  return <div className="mx-auto max-w-3xl space-y-5">
    <Link href="/practice-games" className="text-cyan-200 underline">{t("back")}</Link>
    <header className="space-y-2">
      <p className="text-sm text-cyan-100">{t("meta", { objective: deck.objective, topic: d(`${deck.id}.topic`) })}</p>
      <h1 className="text-3xl font-bold">{d(`${deck.id}.title`)}</h1>
      <p className="text-slate-300">{d(`${deck.id}.intro`)} {t("missesReturn")}</p>
    </header>

    <div role="group" aria-label={t("modeLabel")} className="flex flex-wrap gap-2">
      {deck.modes.map((m) => <button key={m.id} type="button" aria-pressed={mode.id === m.id} onClick={() => restart(m.id)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm ${mode.id === m.id ? "border-cyan-300 bg-cyan-300 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-100"}`}>{d(`${deck.id}.modes.${m.id}.label`)}</button>)}
    </div>

    <p className="font-mono text-sm text-slate-300" aria-live="polite">{t("score", { correct, attempts, left: queue.length, streak, best })}</p>

    {!started && <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <p className="text-slate-300">{t("ready", { count: total, mode: d(`${deck.id}.modes.${mode.id}.label`) })}</p>
      <button type="button" onClick={() => restart(mode.id)} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("start")}</button>
    </section>}

    {current && <section className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <p className="text-sm text-cyan-100">{d(`${deck.id}.modes.${mode.id}.ask`)}</p>
      <p className={`font-mono font-bold text-white ${current.fields[mode.from].length > 24 ? "text-xl" : "text-4xl"}`}>{current.fields[mode.from]}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((choice) => {
          const isAnswer = choice === current.fields[mode.to];
          const isPicked = answer?.picked === choice;
          const state = !answer ? "border-slate-600 bg-slate-950 hover:border-cyan-300" : isAnswer ? "border-emerald-400 bg-emerald-950" : isPicked ? "border-rose-400 bg-rose-950" : "border-slate-700 bg-slate-950 opacity-60";
          return <button key={choice} type="button" disabled={!!answer} onClick={() => pick(choice)} className={`min-h-14 rounded-xl border p-3 text-left ${choice.length > 24 ? "text-sm" : "font-mono text-lg"} ${state}`}>{choice}{answer && isAnswer ? " ✓" : answer && isPicked ? " ✗" : ""}</button>;
        })}
      </div>
      {answer && <div role="status" className="space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <p className="font-semibold">{answer.picked === answer.item.fields[mode.to] ? t("right") : t("wrong", { answer: answer.item.fields[mode.to] })}</p>
        <p className="text-sm text-slate-200">{answer.item.detail}</p>
        <p className="text-sm text-cyan-100">{answer.item.hook}</p>
        <button type="button" onClick={next} autoFocus className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("next")}</button>
      </div>}
    </section>}

    {started && !current && <section className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
      <p>{t("doneBody", { correct, attempts, total })}</p>
      <div className="flex flex-wrap gap-3">
        {missed.size > 0 && <button type="button" onClick={() => restart(mode.id, true)} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("retryMissed", { count: missed.size })}</button>}
        <button type="button" onClick={() => restart(mode.id)} className="min-h-11 rounded-xl border border-cyan-300 px-5 py-2 text-cyan-100">{t("playAgain")}</button>
      </div>
    </section>}

    <details className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <summary className="cursor-pointer text-cyan-100">{t("tableToggle")}</summary>
      {deck.tables.map((table) => {
        const rows = deck.items.filter((i) => table.fields.some((f) => i.fields[f]) && i.fields[table.fields[0]]);
        return <div key={table.id} className="mt-4 overflow-x-auto">
          {deck.tables.length > 1 && <h2 className="mb-2 font-semibold">{d(`${deck.id}.tables.${table.id}`)}</h2>}
          <table className="w-full text-left text-sm">
            <thead><tr className="text-slate-400">{table.fields.map((f) => <th key={f} className="py-1 pr-3">{d(`${deck.id}.fields.${f}`)}</th>)}</tr></thead>
            <tbody>{rows.map((i) => <tr key={i.id} className="border-t border-slate-800">{table.fields.map((f) => <td key={f} className="py-1 pr-3 align-top">{i.fields[f] ?? "—"}</td>)}</tr>)}</tbody>
          </table>
        </div>;
      })}
    </details>

    <nav aria-label={t("otherDrills")} className="space-y-2">
      <h2 className="font-semibold">{t("otherDrills")}</h2>
      <ul className="flex flex-wrap gap-2">{others.map((o) => <li key={o.id}><Link href={drillHref(o.id)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{d(`${o.id}.title`)}</Link></li>)}</ul>
    </nav>
  </div>;
}
