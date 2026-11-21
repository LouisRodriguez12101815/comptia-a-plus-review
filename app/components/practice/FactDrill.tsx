"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { choicesFor, drillDecks, drillHref, getDeck, itemsForMode, shuffle, type DrillDeck, type DrillItem, type DrillMode } from "@/lib/practice/drills";
import { applyResult, finishForTime, sessionKind, speedRemaining, startSession, type DrillSession, type SessionKind } from "@/lib/practice/drill-session";
import { getProgressSnapshot, getServerProgressSnapshot, recordDrillOutcome, recordDrillScore, subscribeProgress } from "@/lib/progress";

type Answer = { item: DrillItem; picked: string; correct: boolean };

function copyId(deck: DrillDeck) {
  return deck.id.startsWith("aws-saa-domain-boss") ? "aws-saa-domain-boss" : deck.id;
}

function requiredCount(item: DrillItem) {
  return item.select?.filter((choice) => choice.correct).length ?? 1;
}

export function FactDrill({
  deckId,
  deck: provided,
  session = "practice",
  mode: initialMode,
}: {
  deckId?: string;
  deck?: DrillDeck;
  session?: string;
  mode?: string;
}) {
  const t = useTranslations("factDrill");
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const deck = provided ?? getDeck(deckId!)!;
  const textId = copyId(deck);
  const initialKind = sessionKind(session);
  const [modeId, setModeId] = useState(() => deck.modes.some((mode) => mode.id === initialMode) ? initialMode! : deck.modes[0].id);
  const mode = deck.modes.find((item) => item.id === modeId) ?? deck.modes[0];
  const [kind, setKind] = useState<SessionKind>(initialKind);
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<DrillItem[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [round, setRound] = useState<DrillSession>(() => startSession(initialKind, 0));
  const [now, setNow] = useState(0);
  const [emptyMissed, setEmptyMissed] = useState(false);
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const savedMisses = new Set(
    (progress.drillPractice?.missedIds ?? [])
      .filter((id) => id.startsWith(`${deck.id}/`))
      .map((id) => id.slice(deck.id.length + 1)),
  );

  const current = queue[0];
  const total = itemsForMode(deck, mode).length;
  const finished = started && (round.finished || emptyMissed || !current);
  const best = Math.max(round.bestStreak, progress.drillPractice?.bestStreak ?? 0);

  useEffect(() => {
    if (!started || round.kind !== "speed" || round.finished) return;
    const id = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      setRound((currentRound) => finishForTime(currentRound, at));
    }, 250);
    return () => window.clearInterval(id);
  }, [started, round.kind, round.finished]);

  function show(nextQueue: DrillItem[], nextMode = mode) {
    setQueue(nextQueue);
    setChoices(nextQueue[0]?.select ? [] : nextQueue[0] ? choicesFor(deck, nextMode, nextQueue[0]) : []);
    setSelected([]);
  }

  function restart(nextModeId: string, nextKind: SessionKind, at: number) {
    const nextMode = deck.modes.find((item) => item.id === nextModeId) ?? deck.modes[0];
    const all = itemsForMode(deck, nextMode);
    const pool = nextKind === "missed" ? all.filter((item) => savedMisses.has(item.id)) : all;
    setModeId(nextMode.id);
    setKind(nextKind);
    setStarted(true);
    setAnswer(null);
    setRound(startSession(nextKind, at));
    setNow(at);
    setEmptyMissed(nextKind === "missed" && pool.length === 0);
    show(shuffle(pool), nextMode);
  }

  function grade(item: DrillItem, correct: boolean, picked: string) {
    if (answer || round.finished) return;
    const at = Date.now();
    const next = applyResult(round, correct, at);
    setRound(next);
    setNow(at);
    setAnswer({ item, picked, correct });
    recordDrillOutcome(deck.id, item.id, correct, next.bestStreak);
    recordDrillScore(deck.id, next.score);
  }

  function pick(choice: string) {
    if (!current || current.select) return;
    const extras = current.also?.[mode.to] ?? [];
    grade(current, choice === current.fields[mode.to] || extras.includes(choice), choice);
  }

  function toggle(text: string) {
    if (!current?.select || answer) return;
    const limit = requiredCount(current);
    setSelected((currentSelected) => {
      if (limit === 1) return [text];
      if (currentSelected.includes(text)) return currentSelected.filter((item) => item !== text);
      if (currentSelected.length >= limit) return currentSelected;
      return [...currentSelected, text];
    });
  }

  function submitSelect() {
    if (!current?.select || answer) return;
    const keyed = current.select.filter((choice) => choice.correct).map((choice) => choice.text).sort();
    const picked = [...selected].sort();
    const correct = picked.length === keyed.length && picked.every((text, index) => text === keyed[index]);
    grade(current, correct, picked.join("\n"));
  }

  function next() {
    if (!answer) return;
    if (round.finished) {
      setQueue([]);
      setAnswer(null);
      return;
    }
    const [head, ...rest] = queue;
    const at = Math.min(3, rest.length);
    show(answer.correct ? rest : [...rest.slice(0, at), head, ...rest.slice(at)]);
    setAnswer(null);
  }

  const others = drillDecks.filter((other) => other.id !== deck.id);
  const seconds = Math.ceil(speedRemaining({ ...round, startedAt: round.startedAt || now }, now || round.startedAt) / 1000);

  return <div className="mx-auto max-w-3xl space-y-5">
    <Link href={deck.exam === "saa-c03" ? "/aws-saa/drills" : "/practice-games"} className="text-cyan-200 underline">{deck.exam === "saa-c03" ? t("backDrills") : t("back")}</Link>
    <header className="space-y-2">
      <p className="text-sm text-cyan-100">{t("meta", { certification: deck.certification, exam: deck.exam, objective: deck.objective, topic: d(`${textId}.topic`) })}</p>
      <h1 className="text-3xl font-bold">{d(`${textId}.title`)}</h1>
      <p className="text-slate-300">{d(`${textId}.intro`)} {t("missesReturn")}</p>
      {getDeck(deck.id) && <Link href={`/practice-games/match/${deck.id}`} className="text-cyan-200 underline">{t("matchLink")}</Link>}
    </header>

    <div role="group" aria-label={t("modeLabel")} className="flex flex-wrap gap-2">
      {deck.modes.map((item) => <button key={item.id} type="button" aria-pressed={mode.id === item.id} onClick={() => restart(item.id, kind, Date.now())} className={`min-h-11 rounded-xl border px-4 py-2 text-sm ${mode.id === item.id ? "border-cyan-300 bg-cyan-300 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-100"}`}>{d(`${textId}.modes.${item.id}.label`)}</button>)}
    </div>
    {deck.exam === "saa-c03" && <div role="group" aria-label={t("sessionLabel")} className="flex flex-wrap gap-2">
      {(["practice", "speed", "survival", "missed"] as const).map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => restart(mode.id, item, Date.now())} className={`min-h-11 rounded-xl border px-4 py-2 text-sm ${kind === item ? "border-teal-300 bg-teal-300 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-100"}`}>{t(item)}</button>)}
    </div>}

    <p className="font-mono text-sm text-slate-300" aria-live="polite">
      {t("score", { correct: round.correct, attempts: round.attempts, left: queue.length, streak: round.streak, best })}
      {kind === "survival" ? ` · ${t("lives", { lives: round.lives })}` : ""}
      {kind === "speed" && started ? ` · ${t("speedStatus", { seconds, combo: round.combo, score: round.score })}` : ""}
    </p>

    {!started && <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <p className="text-slate-300">{t("ready", { count: kind === "missed" ? savedMisses.size : total, mode: d(`${textId}.modes.${mode.id}.label`) })}</p>
      <button type="button" onClick={() => restart(mode.id, kind, Date.now())} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("start")}</button>
    </section>}

    {started && current && !round.finished && <Question
      mode={mode}
      item={current}
      choices={choices}
      selected={selected}
      answer={answer}
      ask={d(`${textId}.modes.${mode.id}.ask`)}
      onPick={pick}
      onToggle={toggle}
      onSubmit={submitSelect}
      onNext={next}
    />}

    {finished && <section className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
      <p>{emptyMissed ? t("noneMissed") : t("doneBody", { correct: round.correct, attempts: round.attempts, total: kind === "missed" ? savedMisses.size : total })}</p>
      {kind === "speed" && <p>{t("speedDone", { score: round.score })}</p>}
      {kind === "survival" && <p>{t("survivalDone", { streak: round.bestStreak })}</p>}
      <div className="flex flex-wrap gap-3">
        {savedMisses.size > 0 && <button type="button" onClick={() => restart(mode.id, "missed", Date.now())} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("retryMissed", { count: savedMisses.size })}</button>}
        <button type="button" onClick={() => restart(mode.id, kind, Date.now())} className="min-h-11 rounded-xl border border-cyan-300 px-5 py-2 text-cyan-100">{t("playAgain")}</button>
      </div>
    </section>}

    <details className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <summary className="cursor-pointer text-cyan-100">{t("tableToggle")}</summary>
      {deck.tables.map((table) => {
        const rows = deck.items.filter((item) => table.fields.some((field) => item.fields[field]) && item.fields[table.fields[0]]);
        return <div key={table.id} className="mt-4 overflow-x-auto">
          {deck.tables.length > 1 && <h2 className="mb-2 font-semibold">{d(`${textId}.tables.${table.id}`)}</h2>}
          <table className="w-full text-left text-sm">
            <thead><tr className="text-slate-400">{table.fields.map((field) => <th key={field} className="py-1 pr-3">{d(`${textId}.fields.${field}`)}</th>)}</tr></thead>
            <tbody>{rows.map((item) => <tr key={item.id} className="border-t border-slate-800">{table.fields.map((field) => <td key={field} className="py-1 pr-3 align-top">{item.fields[field] ?? "—"}</td>)}</tr>)}</tbody>
          </table>
        </div>;
      })}
    </details>

    <nav aria-label={t("otherDrills")} className="space-y-2">
      <h2 className="font-semibold">{t("otherDrills")}</h2>
      <ul className="flex flex-wrap gap-2">{others.map((other) => <li key={other.id}><Link href={drillHref(other.id)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100">{d(`${other.id}.title`)}</Link></li>)}</ul>
    </nav>
  </div>;
}

function Question({
  mode,
  item,
  choices,
  selected,
  answer,
  ask,
  onPick,
  onToggle,
  onSubmit,
  onNext,
}: {
  mode: DrillMode;
  item: DrillItem;
  choices: string[];
  selected: string[];
  answer: Answer | null;
  ask: string;
  onPick: (choice: string) => void;
  onToggle: (text: string) => void;
  onSubmit: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("factDrill");
  const prompt = item.fields[mode.from];
  const limit = requiredCount(item);
  const keyed = item.select?.filter((choice) => choice.correct).map((choice) => choice.text) ?? [];

  return <section className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
    <p className="text-sm text-cyan-100">{ask}</p>
    <p className={`font-mono font-bold text-white ${prompt.length > 24 ? "text-xl" : "text-4xl"}`}>{prompt}</p>
    {item.select ? <fieldset className="space-y-3">
      <legend className="text-sm text-slate-300">{t("selectNeed", { count: limit })}</legend>
      {item.select.map((choice) => {
        const on = selected.includes(choice.text);
        const show = !!answer;
        const state = !show ? "border-slate-600 bg-slate-950" : choice.correct ? "border-emerald-400 bg-emerald-950" : on ? "border-rose-400 bg-rose-950" : "border-slate-700 bg-slate-950 opacity-70";
        return <label key={choice.text} className={`block rounded-xl border p-3 ${state}`}>
          <span className="flex min-h-11 items-start gap-3">
            <input
              type={limit === 1 ? "radio" : "checkbox"}
              name={item.id}
              checked={on}
              disabled={!!answer}
              onChange={() => onToggle(choice.text)}
              className="mt-1"
            />
            <span>
              <span className="block text-white">{choice.text}</span>
              {show && <span className="mt-1 block text-sm text-slate-200">{choice.why}</span>}
            </span>
          </span>
        </label>;
      })}
      {!answer && <button type="button" disabled={selected.length !== limit} onClick={onSubmit} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 disabled:opacity-50">{t("selectSubmit")}</button>}
    </fieldset> : <div className="grid gap-3 sm:grid-cols-2">
      {choices.map((choice) => {
        const isAnswer = choice === item.fields[mode.to] || (item.also?.[mode.to] ?? []).includes(choice);
        const isPicked = answer?.picked === choice;
        const state = !answer ? "border-slate-600 bg-slate-950 hover:border-cyan-300" : isAnswer ? "border-emerald-400 bg-emerald-950" : isPicked ? "border-rose-400 bg-rose-950" : "border-slate-700 bg-slate-950 opacity-60";
        return <button key={choice} type="button" disabled={!!answer} onClick={() => onPick(choice)} className={`min-h-14 rounded-xl border p-3 text-left ${choice.length > 24 ? "text-sm" : "font-mono text-lg"} ${state}`}>{choice}{answer && isAnswer ? " ✓" : answer && isPicked ? " ✗" : ""}</button>;
      })}
    </div>}
    {answer && <div role="status" className="space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <p className="font-semibold">{answer.correct ? t("right") : t("wrong", { answer: item.select ? keyed.join("; ") : [item.fields[mode.to], ...(item.also?.[mode.to] ?? [])].join(" or ") })}</p>
      <p className="text-sm text-slate-200">{answer.item.detail}</p>
      <p className="text-sm text-cyan-100">{answer.item.hook}</p>
      {answer.item.docsUrl && <a href={answer.item.docsUrl} className="inline-flex min-h-11 items-center text-sm text-cyan-200 underline">{t("docs")}</a>}
      <button type="button" onClick={onNext} autoFocus className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("next")}</button>
    </div>}
  </section>;
}
