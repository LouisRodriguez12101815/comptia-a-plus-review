"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { drillHref, getDeck, itemsForMode, shuffle, type DrillItem } from "@/lib/practice/drills";
import { ServiceFactMatch } from "@/app/components/practice/ServiceFactMatch";

// Spot It-style pair matching: four items per round, tap a left card then its right-hand match.
const ROUND = 4;

export function MatchGame({ deckId }: { deckId: string }) {
  if (deckId === "aws-saa-service-facts") return <ServiceFactMatch />;
  return <LegacyMatch deckId={deckId} />;
}

function LegacyMatch({ deckId }: { deckId: string }) {
  const t = useTranslations("matchGame");
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const deck = getDeck(deckId)!;
  const boards = [...new Set(deck.items.map((item) => item.fields.board).filter(Boolean))];
  const [board, setBoard] = useState(boards[0] ?? "");
  const [pair, setPair] = useState<"definition" | "acronym">("definition");
  const mode = pair === "acronym"
    ? deck.modes.find((item) => item.id === "acronymToExpansion") ?? deck.modes[0]
    : deck.modes[0];
  const pool = itemsForMode(deck, mode).filter((item) => {
    if (!boards.length) return true;
    if (item.fields.board !== board) return false;
    if (!item.fields.board) return true;
    return pair === "acronym" ? item.id.endsWith("-acronym") : item.id.endsWith("-definition");
  });
  const total = boards.length ? pool.length : itemsForMode(deck, mode).length;

  // Nothing is shuffled until the learner starts, so server and client HTML match.
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<DrillItem[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightValue, setRightValue] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ id: string; value: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const round = queue.slice(0, ROUND);
  const roundDone = round.length > 0 && matched.size === round.length;
  const allDone = started && queue.length === 0;

  function loadRound(rest: DrillItem[]) {
    setQueue(rest);
    setValues(shuffle(rest.slice(0, ROUND).map((i) => i.fields[mode.to])));
    setMatched(new Set());
    setLeftId(null);
    setRightValue(null);
    setWrong(null);
  }

  function start() {
    setStarted(true);
    setCorrect(0);
    setAttempts(0);
    loadRound(shuffle(boards.length ? pool : itemsForMode(deck, mode)));
  }

  function check(id: string, value: string) {
    setAttempts((n) => n + 1);
    const item = round.find((i) => i.id === id);
    setLeftId(null);
    setRightValue(null);
    if (item && item.fields[mode.to] === value) {
      setCorrect((n) => n + 1);
      setWrong(null);
      setMatched((m) => new Set(m).add(id));
    } else {
      setWrong({ id, value });
    }
  }

  function pickLeft(id: string) {
    if (matched.has(id) || roundDone) return;
    setWrong(null);
    if (rightValue !== null) {
      check(id, rightValue);
    } else {
      setLeftId(id);
    }
  }

  function pickRight(value: string) {
    if (matchedValues.includes(value) || roundDone) return;
    setWrong(null);
    if (leftId !== null) {
      check(leftId, value);
    } else {
      setRightValue(value);
    }
  }

  const matchedValues = round.filter((i) => matched.has(i.id)).map((i) => i.fields[mode.to]);

  function nextRound() {
    loadRound(queue.slice(ROUND));
  }

  const cardState = (selected: boolean, done: boolean, bad: boolean) =>
    done ? "border-emerald-400 bg-emerald-950 opacity-80"
      : bad ? "border-rose-400 bg-rose-950"
      : selected ? "border-cyan-300 bg-cyan-950"
      : "border-slate-600 bg-slate-950 hover:border-cyan-300";

  return <div className="mx-auto max-w-3xl space-y-5">
    <Link href={drillHref(deck.id)} className="text-cyan-200 underline">{t("backToDrill")}</Link>
    <header className="space-y-2">
      <h1 className="text-3xl font-bold">{d(`${deck.id}.title`)}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>

    {boards.length > 0 && <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
        {boards.map((name) => <button key={name} type="button" aria-pressed={board === name} onClick={() => { setBoard(name); setStarted(false); }} className={`min-h-11 rounded-full border px-4 text-sm ${board === name ? "border-teal-300 bg-teal-300 font-semibold text-slate-950" : "border-slate-600 text-slate-100"}`}>{name}</button>)}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pair">
        {(["definition", "acronym"] as const).map((kind) => <button key={kind} type="button" aria-pressed={pair === kind} onClick={() => { setPair(kind); setStarted(false); }} className={`min-h-11 rounded-full border px-4 text-sm ${pair === kind ? "border-cyan-300 bg-cyan-300 font-semibold text-slate-950" : "border-slate-600 text-slate-100"}`}>{kind === "definition" ? "Service and definition" : "Acronym and expansion"}</button>)}
      </div>
    </div>}

    {!started && <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <p className="text-slate-300">{t("ready", { count: total })}</p>
      <button type="button" disabled={total < 1} onClick={start} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 disabled:opacity-50">{t("start")}</button>
    </section>}

    {started && !allDone && <>
      <p className="font-mono text-sm text-slate-300" aria-live="polite">{t("score", { correct, attempts, left: queue.length })}</p>
      <p role="status" className="min-h-6 text-sm text-cyan-100">
        {wrong ? t("wrong") : roundDone ? t("roundDone") : t("pickPrompt")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-3">
          {round.map((item) => {
            const done = matched.has(item.id);
            const bad = wrong?.id === item.id;
            return <button key={item.id} type="button" disabled={done} onClick={() => pickLeft(item.id)} aria-pressed={leftId === item.id} className={`min-h-14 rounded-xl border p-3 text-left font-mono text-sm ${cardState(leftId === item.id, done, bad)}`}>{item.fields.matchLeft ?? item.fields[mode.from]}</button>;
          })}
        </div>
        <div className="grid gap-3">
          {values.map((value) => {
            const done = matchedValues.includes(value);
            const bad = wrong?.value === value;
            return <button key={value} type="button" disabled={done} onClick={() => pickRight(value)} aria-pressed={rightValue === value} className={`min-h-14 rounded-xl border p-3 text-left text-sm ${cardState(rightValue === value, done, bad)}`}>{value}</button>;
          })}
        </div>
      </div>
      {roundDone && <button type="button" onClick={nextRound} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("nextRound")}</button>}
    </>}

    {allDone && <section className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
      <p>{t("doneBody", { correct, attempts })}</p>
      <button type="button" onClick={start} className="min-h-11 rounded-xl border border-cyan-300 px-5 py-2 text-cyan-100">{t("playAgain")}</button>
    </section>}
  </div>;
}
