"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { buildRound, choicesFor, getFinalReview, reviewPool, shuffle, trapQuestion, type DomainPlan, type ReviewQuestion } from "@/lib/practice/finalReview";

type Tab = "mixed" | "order" | "traps";
type Asked = ReviewQuestion & { choices: string[] };
type Quiz = { kind: "mixed" | "traps"; queue: Asked[]; missed: Asked[]; answered: { pick: string } | null };
type Order = { index: number; placed: string[]; remaining: string[]; checked: boolean };

const btn = "min-h-11 rounded-xl border px-4 py-2";
const primary = `${btn} border-cyan-300 bg-cyan-300 font-semibold text-slate-950`;
const secondary = `${btn} border-slate-600 bg-slate-900 text-slate-100`;

export function FinalReview({ reviewId, plan, troubleshooting }: { reviewId: string; plan: DomainPlan[]; troubleshooting?: string }) {
  const t = useTranslations("finalReview");
  // Deck keys are data-driven, so the typed key union is widened here.
  const d = useTranslations("drillDecks") as unknown as (key: string) => string;
  const review = getFinalReview(reviewId)!;
  const roundSize = plan.reduce((n, p) => n + p.count, 0) + review.trapsPerRound;

  const [tab, setTab] = useState<Tab>("mixed");
  // Nothing is shuffled until the learner starts, so server and client HTML match.
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [totals, setTotals] = useState({ correct: 0, attempts: 0, streak: 0 });
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endAt]);
  const secondsLeft = endAt === null ? review.minutes * 60 : Math.max(0, Math.round((endAt - now) / 1000));
  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  function score(ok: boolean) {
    setTotals((s) => ({ correct: s.correct + (ok ? 1 : 0), attempts: s.attempts + 1, streak: ok ? s.streak + 1 : 0 }));
  }
  function ask(q: ReviewQuestion): Asked {
    return { ...q, choices: choicesFor(q) };
  }
  function startQuiz(kind: "mixed" | "traps") {
    const questions = kind === "traps" ? shuffle(review.traps).map(trapQuestion) : buildRound(review, plan, reviewPool(review, troubleshooting));
    setQuiz({ kind, queue: questions.map(ask), missed: [], answered: null });
  }
  function startOrder(index: number) {
    setOrder({ index, placed: [], remaining: shuffle(review.sequences[index].steps), checked: false });
  }
  function open(next: Tab) {
    setTab(next);
    if (next === "order") startOrder(0);
    else startQuiz(next);
  }

  function pick(choice: string) {
    if (!quiz || quiz.answered) return;
    const current = quiz.queue[0];
    const ok = choice === current.answer;
    score(ok);
    setQuiz({ ...quiz, answered: { pick: choice }, missed: ok || quiz.missed.some((m) => m.id === current.id) ? quiz.missed : [...quiz.missed, current] });
  }
  function next() {
    if (!quiz?.answered) return;
    const [head, ...rest] = quiz.queue;
    const ok = quiz.answered.pick === head.answer;
    // A miss comes back three questions later (or last), with fresh choices.
    const at = Math.min(3, rest.length);
    setQuiz({ ...quiz, answered: null, queue: ok ? rest : [...rest.slice(0, at), ask(head), ...rest.slice(at)] });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "mixed", label: t("tabMixed", { count: roundSize }) },
    { id: "order", label: t("tabOrder") },
    { id: "traps", label: t("tabTraps", { count: review.traps.length }) },
  ];

  return <div className="mx-auto max-w-3xl space-y-5">
    <header className="space-y-2">
      <p className="text-sm text-cyan-100">{t("eyebrow", { certification: review.certification, exam: review.exam, minutes: review.minutes })}</p>
      <h1 className="text-3xl font-bold">{t("title", { certification: review.certification })}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>

    <aside aria-labelledby="final15-note" className="space-y-3 rounded-2xl border border-amber-300/50 bg-amber-300/10 p-5">
      <h2 id="final15-note" className="text-lg font-semibold text-amber-100">{t("noteTitle", { minutes: review.minutes })}</h2>
      <p>{t("noteTime", { minutes: review.minutes })}</p>
      <p>{t("noteWeighted", { exam: review.exam })}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="mb-2 text-left text-slate-300">{t("planCaption")}</caption>
          <thead><tr className="text-slate-400"><th className="py-1 pr-3">{t("colDomain")}</th><th className="py-1 pr-3">{t("colWeight")}</th><th className="py-1">{t("colQuestions")}</th></tr></thead>
          <tbody>
            {[...plan].sort((a, b) => b.weight - a.weight).map((p) => <tr key={p.domain} className="border-t border-slate-700"><td className="py-1 pr-3">{p.domain}.0 {p.title}</td><td className="py-1 pr-3 font-mono">{p.weight}%</td><td className="py-1 font-mono">{p.count}</td></tr>)}
            <tr className="border-t border-slate-700"><td className="py-1 pr-3">{t("trapsLabel")}</td><td className="py-1 pr-3 font-mono">—</td><td className="py-1 font-mono">{review.trapsPerRound}</td></tr>
          </tbody>
        </table>
      </div>
    </aside>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`font-mono text-2xl font-semibold tabular-nums ${secondsLeft === 0 ? "text-rose-300" : secondsLeft <= 180 && endAt !== null ? "text-amber-200" : "text-cyan-200"}`}>{clock}</span>
        <button type="button" className={secondary} onClick={() => { setNow(Date.now()); setEndAt(Date.now() + review.minutes * 60_000); }}>{endAt === null ? t("timerStart", { minutes: review.minutes }) : t("timerRestart")}</button>
      </div>
      <p className="font-mono text-sm text-slate-300" aria-live="polite">{t("stats", totals)}</p>
    </div>
    {endAt !== null && secondsLeft === 0 && <p role="status" className="font-semibold text-rose-200">{t("timerDone")}</p>}

    <div role="group" aria-label={t("activityLabel")} className="flex flex-wrap gap-2">
      {tabs.map((x) => <button key={x.id} type="button" aria-pressed={tab === x.id} onClick={() => open(x.id)} className={tab === x.id ? primary : secondary}>{x.label}</button>)}
    </div>

    <section aria-live="polite" className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      {tab !== "order" && (!quiz || quiz.kind !== tab) && <div className="space-y-3">
        <p className="text-slate-300">{tab === "mixed" ? t("readyMixed", { count: roundSize }) : t("readyTraps", { count: review.traps.length })}</p>
        <button type="button" className={primary} onClick={() => startQuiz(tab)}>{tab === "mixed" ? t("startMixed") : t("startTraps")}</button>
      </div>}

      {tab !== "order" && quiz && quiz.kind === tab && quiz.queue[0] && (() => {
        const q = quiz.queue[0];
        const label = q.deckId === "traps" ? t("trapsLabel") : d(`${q.deckId}.title`);
        const prompt = q.deckId === "traps" ? t("trapAsk") : d(`${q.deckId}.modes.${q.modeId}.ask`);
        return <>
          <div className="flex justify-between gap-3 text-sm text-slate-400"><span>{label}</span><span className="font-mono">{t("left", { count: quiz.queue.length })}</span></div>
          <p className="text-sm text-cyan-100">{prompt}</p>
          <p className={`font-mono font-bold text-white ${q.prompt.length > 30 ? "text-xl" : "text-3xl"}`}>{q.prompt}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {q.choices.map((c) => {
              const a = quiz.answered;
              const state = !a ? "border-slate-600 bg-slate-950 hover:border-cyan-300" : c === q.answer ? "border-emerald-400 bg-emerald-950" : c === a.pick ? "border-rose-400 bg-rose-950" : "border-slate-700 bg-slate-950 opacity-60";
              return <button key={c} type="button" disabled={!!a} onClick={() => pick(c)} className={`min-h-14 rounded-xl border p-3 text-left ${state}`}>{c}{a && c === q.answer ? " ✓" : a && c === a.pick ? " ✗" : ""}</button>;
            })}
          </div>
          {quiz.answered && <div role="status" className="space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="font-semibold">{quiz.answered.pick === q.answer ? t("right") : t("wrong", { answer: q.answer })}</p>
            <p className="text-sm text-slate-200">{q.detail}</p>
            <p className="text-sm text-cyan-100">{q.hook}</p>
            <button type="button" autoFocus onClick={next} className={primary}>{t("next")}</button>
          </div>}
        </>;
      })()}

      {tab !== "order" && quiz && quiz.kind === tab && !quiz.queue[0] && <div className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("doneTitle")}</h2>
        <p>{quiz.missed.length ? t("doneMissed", { count: quiz.missed.length }) : t("doneClean")}</p>
        {quiz.missed.length > 0 && <ul className="space-y-2">{quiz.missed.map((m) => <li key={m.id} className="rounded-lg border-l-4 border-rose-400 bg-slate-950 p-3 text-sm"><span className="font-mono font-semibold">{m.prompt}</span> → {m.answer}<br /><span className="text-cyan-100">{m.hook}</span></li>)}</ul>}
        <button type="button" className={primary} onClick={() => startQuiz(quiz.kind)}>{t("again")}</button>
      </div>}

      {tab === "order" && order && (() => {
        const seq = review.sequences[order.index];
        const allRight = order.placed.every((p, i) => p === seq.steps[i]);
        return <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-400">{t("sequenceOf", { n: order.index + 1, total: review.sequences.length })}</span>
            <span className="flex gap-2">{review.sequences.map((s, i) => <button key={s.id} type="button" aria-pressed={i === order.index} aria-label={`${i + 1}. ${t(`sequences.${s.id}` as "sequences.method")}`} onClick={() => startOrder(i)} className={i === order.index ? primary : secondary}>{i + 1}</button>)}</span>
          </div>
          <p className="text-sm text-cyan-100">{t("orderAsk")}</p>
          <h2 className="text-2xl font-semibold">{t(`sequences.${seq.id}` as "sequences.method")}</h2>
          <ol className="space-y-2">{seq.steps.map((step, i) => {
            const placed = order.placed[i];
            const state = !order.checked ? "border-dashed border-slate-600" : placed === step ? "border-emerald-400 bg-emerald-950" : "border-rose-400 bg-rose-950";
            return <li key={step} className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 font-mono text-sm ${state}`}>
              <span className="text-slate-400">{i + 1}</span><span>{placed ?? "…"}</span>
              {order.checked && placed !== step && <span className="ml-auto text-xs text-slate-300">{step}</span>}
            </li>;
          })}</ol>
          <div className="flex flex-wrap gap-2">{order.remaining.map((step, i) => <button key={step} type="button" disabled={order.checked} className={`${secondary} font-mono text-sm`} onClick={() => setOrder({ ...order, placed: [...order.placed, step], remaining: order.remaining.filter((_, j) => j !== i) })}>{step}</button>)}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} disabled={!order.placed.length || order.checked} onClick={() => setOrder({ ...order, placed: order.placed.slice(0, -1), remaining: [...order.remaining, order.placed[order.placed.length - 1]] })}>{t("undo")}</button>
            <button type="button" className={primary} disabled={order.placed.length !== seq.steps.length || order.checked} onClick={() => { setOrder({ ...order, checked: true }); score(allRight); }}>{t("check")}</button>
            <button type="button" className={secondary} onClick={() => startOrder(order.index)}>{t("reshuffle")}</button>
            {order.checked && order.index < review.sequences.length - 1 && <button type="button" className={primary} onClick={() => startOrder(order.index + 1)}>{t("nextSequence")}</button>}
          </div>
          {order.checked && <p role="status" className={`font-semibold ${allRight ? "text-emerald-300" : "text-rose-200"}`}>{allRight ? t("orderOk") : t("orderBad")}</p>}
        </>;
      })()}
    </section>
  </div>;
}
