"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { corePorts, optionsFor, shuffle, type PortEntry, type PortMode } from "@/lib/practice/ports";

type Answer = { entry: PortEntry; picked: PortEntry };

function prompt(entry: PortEntry, mode: PortMode) {
  if (mode === "port-to-protocol") return entry.port;
  if (mode === "protocol-to-port") return entry.protocol;
  return entry.purpose;
}
function label(entry: PortEntry, mode: PortMode) {
  return mode === "protocol-to-port" ? entry.port : entry.protocol;
}

export function PortDrill() {
  const t = useTranslations("portDrill");
  const [mode, setMode] = useState<PortMode>("port-to-protocol");
  const [queue, setQueue] = useState<PortEntry[]>(() => shuffle(corePorts));
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [missed, setMissed] = useState<Set<string>>(() => new Set());
  const [showTable, setShowTable] = useState(false);

  const current = queue[0];
  const done = !current;
  // Options are fixed per question; recompute only when the question or mode changes.
  const options = useMemo(() => (current ? optionsFor(current) : []), [current]);

  function restart(nextMode: PortMode = mode, onlyMissed = false) {
    const pool = onlyMissed ? corePorts.filter((p) => missed.has(p.id)) : corePorts;
    setMode(nextMode);
    setQueue(shuffle(pool.length ? pool : corePorts));
    setAnswer(null);
    setCorrect(0);
    setAttempts(0);
    setStreak(0);
    if (!onlyMissed) setMissed(new Set());
  }

  function pick(option: PortEntry) {
    if (answer || !current) return;
    setAnswer({ entry: current, picked: option });
    setAttempts((n) => n + 1);
    if (option.id === current.id) {
      setCorrect((n) => n + 1);
      setStreak((s) => {
        const next = s + 1;
        setBest((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
      setMissed((m) => new Set(m).add(current.id));
    }
  }

  function next() {
    if (!answer) return;
    const wasRight = answer.picked.id === answer.entry.id;
    setQueue(([head, ...rest]) => {
      if (wasRight) return rest;
      // Missed items come back three questions later (or at the end).
      const at = Math.min(3, rest.length);
      return [...rest.slice(0, at), head, ...rest.slice(at)];
    });
    setAnswer(null);
  }

  const modes: { id: PortMode; text: string }[] = [
    { id: "port-to-protocol", text: t("modePortToProtocol") },
    { id: "protocol-to-port", text: t("modeProtocolToPort") },
    { id: "purpose-to-protocol", text: t("modePurpose") },
  ];

  return <div className="mx-auto max-w-3xl space-y-5">
    <Link href="/practice-games" className="text-cyan-200 underline">{t("back")}</Link>
    <header className="space-y-2">
      <p className="text-sm text-cyan-100">{t("meta")}</p>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>

    <div role="group" aria-label={t("modeLabel")} className="flex flex-wrap gap-2">
      {modes.map((m) => <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => restart(m.id)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm ${mode === m.id ? "border-cyan-300 bg-cyan-300 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-100"}`}>{m.text}</button>)}
    </div>

    <p className="font-mono text-sm text-slate-300" aria-live="polite">{t("score", { correct, attempts, left: queue.length, streak, best })}</p>

    {!done && current && <section className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <p className="text-sm text-cyan-100">{mode === "port-to-protocol" ? t("askProtocolForPort") : mode === "protocol-to-port" ? t("askPortForProtocol") : t("askProtocolForPurpose")}</p>
      <p className="font-mono text-4xl font-bold text-white">{prompt(current, mode)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isAnswer = option.id === current.id;
          const isPicked = answer?.picked.id === option.id;
          const state = !answer ? "border-slate-600 bg-slate-950 hover:border-cyan-300" : isAnswer ? "border-emerald-400 bg-emerald-950" : isPicked ? "border-rose-400 bg-rose-950" : "border-slate-700 bg-slate-950 opacity-60";
          return <button key={option.id} type="button" disabled={!!answer} onClick={() => pick(option)} className={`min-h-14 rounded-xl border p-3 text-left font-mono text-lg ${state}`}>{label(option, mode)}{answer && isAnswer ? ` ✓` : answer && isPicked ? ` ✗` : ""}</button>;
        })}
      </div>
      {answer && <div role="status" className="space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <p className="font-semibold">{answer.picked.id === answer.entry.id ? t("right") : t("wrong", { answer: `${answer.entry.protocol} = ${answer.entry.port}` })}</p>
        <p className="text-sm text-slate-200"><span className="font-mono">{answer.entry.protocol} · {answer.entry.port} · {answer.entry.transport}</span> — {answer.entry.purpose}</p>
        <p className="text-sm text-cyan-100">{answer.entry.hook}</p>
        <button type="button" onClick={next} autoFocus className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("next")}</button>
      </div>}
    </section>}

    {done && <section className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
      <p>{t("doneBody", { correct, attempts, total: corePorts.length })}</p>
      <div className="flex flex-wrap gap-3">
        {missed.size > 0 && <button type="button" onClick={() => restart(mode, true)} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950">{t("retryMissed", { count: missed.size })}</button>}
        <button type="button" onClick={() => restart(mode)} className="min-h-11 rounded-xl border border-cyan-300 px-5 py-2 text-cyan-100">{t("playAgain")}</button>
      </div>
    </section>}

    <details open={showTable} onToggle={(e) => setShowTable((e.target as HTMLDetailsElement).open)} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <summary className="cursor-pointer text-cyan-100">{t("tableToggle")}</summary>
      <table className="mt-3 w-full text-left text-sm">
        <thead><tr className="text-slate-400"><th className="py-1">{t("colPort")}</th><th>{t("colProtocol")}</th><th>{t("colTransport")}</th><th>{t("colPurpose")}</th></tr></thead>
        <tbody>{corePorts.map((p) => <tr key={p.id} className="border-t border-slate-800"><td className="py-1 font-mono">{p.port}</td><td className="font-mono">{p.protocol}</td><td>{p.transport}</td><td className="text-slate-300">{p.purpose}</td></tr>)}</tbody>
      </table>
    </details>
  </div>;
}
