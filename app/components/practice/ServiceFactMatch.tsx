"use client";

import { Link } from "@/i18n/navigation";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { drillHref } from "@/lib/practice/drills";
import { SAA_TASK_IDS, saaDomainFromTask, type SaaDomainId } from "@/lib/saa-tags";
import { recordMatchMiss } from "@/lib/progress";
import {
  filterMatchPairs,
  memoryMatchPairs,
  seededShuffle,
  takeMatchRound,
  type MatchField,
  type MatchSelection,
  type MemoryMatchPair,
} from "@/lib/study/memory-match";

const DOMAINS: SaaDomainId[] = ["D1", "D2", "D3", "D4"];
const FIELDS: MatchField[] = ["definition", "acronym", "class", "cost"];
const DECK_ID = "aws-saa-service-facts";

const initialSelection: MatchSelection = { domain: "", task: "", tier: "all", field: "" };

export function ServiceFactMatch() {
  const t = useTranslations("matchGame");
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const [selection, setSelection] = useState<MatchSelection>(initialSelection);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState<MemoryMatchPair[]>([]);
  const [rights, setRights] = useState<MemoryMatchPair[]>([]);
  const [rest, setRest] = useState<MemoryMatchPair[]>([]);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const logged = useRef(new Set<string>());

  const pool = useMemo(
    () => filterMatchPairs(memoryMatchPairs(), selection),
    [selection],
  );
  const tasks = SAA_TASK_IDS.filter((id) => !selection.domain || saaDomainFromTask(id) === selection.domain);
  const roundDone = round.length > 0 && matched.size === round.length;
  const allDone = started && round.length === 0;

  function choose(next: Partial<MatchSelection>) {
    setSelection((current) => {
      const picked = { ...current, ...next };
      if (picked.task && picked.domain && saaDomainFromTask(picked.task) !== picked.domain) picked.task = "";
      return picked;
    });
    setStarted(false);
  }

  function deal(source: MemoryMatchPair[], seed: number) {
    const dealt = takeMatchRound(source, seed);
    setRound(dealt.round);
    setRights(seededShuffle(dealt.round, seed + 1));
    setRest(dealt.rest);
    setMatched(new Set());
    setLeftId(null);
    setRightId(null);
    setWrong(null);
    logged.current = new Set();
  }

  function start() {
    setStarted(true);
    setCorrect(0);
    setAttempts(0);
    deal(pool, Date.now());
  }

  function check(left: string, right: string) {
    setAttempts((count) => count + 1);
    setLeftId(null);
    setRightId(null);
    if (left === right) {
      setCorrect((count) => count + 1);
      setWrong(null);
      setMatched((current) => new Set(current).add(left));
      return;
    }
    setWrong({ left, right });
    if (logged.current.has(left)) return;
    logged.current.add(left);
    const pair = round.find((item) => item.id === left);
    if (!pair) return;
    recordMatchMiss({ id: pair.id, task: pair.task, prompt: `${pair.left} → ${pair.right}` });
  }

  function pickLeft(id: string) {
    if (matched.has(id) || roundDone) return;
    setWrong(null);
    if (rightId !== null) check(id, rightId);
    else setLeftId(id);
  }

  function pickRight(id: string) {
    if (matched.has(id) || roundDone) return;
    setWrong(null);
    if (leftId !== null) check(leftId, id);
    else setRightId(id);
  }

  function nextRound() {
    if (!roundDone) return;
    if (rest.length === 0) {
      setRound([]);
      setRights([]);
      return;
    }
    deal(rest, Date.now());
  }

  const cardState = (selected: boolean, done: boolean, bad: boolean) =>
    done ? "border-emerald-400 bg-emerald-950 opacity-80"
      : bad ? "border-rose-400 bg-rose-950"
      : selected ? "border-cyan-300 bg-cyan-950"
      : "border-slate-600 bg-slate-950 hover:border-cyan-300";

  return <div className="mx-auto max-w-3xl space-y-5">
    <Link href={drillHref(DECK_ID)} className="text-cyan-200 underline">{t("backToDrill")}</Link>
    <header className="space-y-2">
      <h1 className="text-3xl font-bold">{d(`${DECK_ID}.title`)}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>

    <form className="grid gap-3 sm:grid-cols-2" aria-label={t("filters")}>
      <label className="text-sm text-slate-300">
        {t("domain")}
        <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={selection.domain} onChange={(event) => choose({ domain: event.target.value as MatchSelection["domain"] })}>
          <option value="">{t("all")}</option>
          {DOMAINS.map((domain) => <option key={domain} value={domain}>{t("domainOption", { domain: domain.slice(1) })}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-300">
        {t("task")}
        <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={selection.task} onChange={(event) => choose({ task: event.target.value })}>
          <option value="">{t("all")}</option>
          {tasks.map((task) => <option key={task} value={task}>{task}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-300">
        {t("tier")}
        <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={selection.tier} onChange={(event) => choose({ tier: event.target.value as MatchSelection["tier"] })}>
          <option value="all">{t("allServices")}</option>
          <option value="core">{t("core")}</option>
        </select>
      </label>
      <label className="text-sm text-slate-300">
        {t("field")}
        <select className="mt-1 block min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-slate-100" value={selection.field} onChange={(event) => choose({ field: event.target.value as MatchSelection["field"] })}>
          <option value="">{t("all")}</option>
          {FIELDS.map((field) => <option key={field} value={field}>{t(`fields.${field}`)}</option>)}
        </select>
      </label>
    </form>

    {!started && <section className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <p className="text-slate-300">{t("readyFacts", { count: pool.length })}</p>
      <button type="button" disabled={pool.length < 1} onClick={start} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 disabled:opacity-50">{t("start")}</button>
    </section>}

    {started && !allDone && <>
      <p className="font-mono text-sm text-slate-300" aria-live="polite">{t("score", { correct, attempts, left: round.length - matched.size + rest.length })}</p>
      <p role="status" className="min-h-6 text-sm text-cyan-100">
        {wrong ? t("wrong") : roundDone ? t("roundDone") : t("pickPrompt")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-3">
          {round.map((pair) => {
            const done = matched.has(pair.id);
            const bad = wrong?.left === pair.id;
            return <button key={pair.id} type="button" disabled={done} onClick={() => pickLeft(pair.id)} aria-pressed={leftId === pair.id} className={`min-h-14 rounded-xl border p-3 text-left text-sm break-words ${cardState(leftId === pair.id, done, bad)}`}>
              <span className="block text-xs uppercase tracking-wide text-slate-400">{t(`fields.${pair.field}`)}</span>
              {pair.left}
            </button>;
          })}
        </div>
        <div className="grid gap-3">
          {rights.map((pair) => {
            const done = matched.has(pair.id);
            const bad = wrong?.right === pair.id;
            return <button key={pair.id} type="button" disabled={done} onClick={() => pickRight(pair.id)} aria-pressed={rightId === pair.id} className={`min-h-14 rounded-xl border p-3 text-left text-sm break-words ${cardState(rightId === pair.id, done, bad)}`}>{pair.right}</button>;
          })}
        </div>
      </div>
      <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 py-3">
        <button type="button" disabled={!roundDone} onClick={nextRound} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 disabled:opacity-50">{t("nextRound")}</button>
      </div>
    </>}

    {allDone && <section className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
      <p>{t("doneBody", { correct, attempts })}</p>
      <button type="button" onClick={start} className="min-h-11 rounded-xl border border-cyan-300 px-5 py-2 text-cyan-100">{t("playAgain")}</button>
    </section>}
  </div>;
}
