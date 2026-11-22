"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions } from "@/lib/content";
import { getProgressSnapshot, getServerProgressSnapshot, rateCard, recordMemoryBest, recordMemoryStreak, recordQuiz, subscribeProgress } from "@/lib/progress";
import { saaDomainSummary } from "@/lib/saa-study-loop";
import type { SaaDomainId } from "@/lib/saa-tags";
import { applyKey, checkAnswer, choose, concentrationPairs, GAME_IDS, localDay, missedQuestionIds, nextStreak, pressBack, pressNext, retryMissed, startGame, type GameId, type GameRound } from "@/lib/study/games";

const domains = objectives.exams.find((exam) => exam.code === "saa-c03")?.domains.map((domain) => ({
  id: domain.id,
  title: domain.title,
})) ?? [];

function weakestDomain(attempts: { exam?: string }[]): SaaDomainId | null {
  const row = saaDomainSummary(attempts, questions, domains)[0];
  if (!row) return null;
  const domain = `D${row.id[0]}`;
  return domain === "D1" || domain === "D2" || domain === "D3" || domain === "D4" ? domain : null;
}

export function SaaGameHub() {
  const t = useTranslations("saaGames");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">{t("hubTitle")}</h1>
        <p className="mt-2 max-w-prose text-slate-400">{t("hubIntro")}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {GAME_IDS.map((id) => (
          <li key={id}>
            <Link href={`/aws-saa/games/${id}`} className="flex h-full min-h-11 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-teal-500">
              <span className="text-lg font-medium text-white">{t(`games.${id}.title`)}</span>
              <span className="mt-1 text-sm text-slate-400">{t(`games.${id}.blurb`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SaaMemoryGame({ game, board = "all" }: { game: GameId; board?: string }) {
  const t = useTranslations("saaGames");
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const weak = useMemo(
    () => weakestDomain([...progress.quizAttempts, ...progress.mockAttempts]),
    [progress],
  );
  const [round, setRound] = useState<GameRound>(() => startGame(game, "saa", weak, board));
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [missedOnly, setMissedOnly] = useState(false);
  const graded = useRef(new Set<string>());
  const loggedQuestions = useRef(new Set<string>());

  useEffect(() => {
    for (const id of round.misses) {
      if (graded.current.has(id)) continue;
      graded.current.add(id);
      rateCard(id, "again");
    }
  }, [round.misses]);

  useEffect(() => {
    if (round.phase !== "done") return;
    if (game === "concentration" && round.tiles.length > 0) recordMemoryBest(round.boardId, Date.now() - startedAt);
    if (game === "daily") {
      const today = localDay(new Date());
      const saved = progress.memoryGames;
      if (saved?.lastMixDay === today) return;
      recordMemoryStreak(today, nextStreak(saved?.lastMixDay, saved?.streak ?? 0, today));
    }
  }, [round.phase, round.boardId, round.tiles.length, game, startedAt, progress.memoryGames]);

  useEffect(() => {
    if (round.phase !== "done") return;
    const ids = missedQuestionIds(round).filter((id) => !loggedQuestions.current.has(id));
    if (ids.length === 0) return;
    for (const id of ids) loggedQuestions.current.add(id);
    recordQuiz({
      topicId: `saa-game:${game}`,
      exam: "saa-c03",
      correct: 0,
      total: ids.length,
      questionIds: ids,
      missedIds: ids,
      mode: "drill",
      startedAt,
    });
  }, [round, game, startedAt]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const key = event.key === "Enter" ? "Enter" : event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (!["Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "u", "t", "f", "1", "2", "3", "4", "5", "6"].includes(key)) return;
      if (key === "Enter" && target?.closest("button, a, input, textarea, select")) return;
      event.preventDefault();
      setRound((current) => applyKey(current, key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function restart(next: GameRound) {
    graded.current = new Set();
    loggedQuestions.current = new Set();
    setMissedOnly(false);
    setStartedAt(Date.now());
    setRound(next);
  }

  const reviewing = round.readonly ? round.log[round.index] : undefined;
  const step = reviewing
    ? round.steps.find((item) => item.id === reviewing.id) ?? round.steps[round.liveIndex]
    : round.steps[round.liveIndex];
  const best = progress.memoryGames?.bestMs[round.boardId];
  const boards = ["all", "D1", "D2", "D3", "D4"] as const;
  const total = game === "concentration" ? Math.max(1, round.tiles.length / 2) : Math.max(1, round.steps.length);
  const currentItem = game === "concentration"
    ? Math.min(total, round.matched.length / 2 + (round.phase === "done" ? 0 : 1))
    : Math.min(total, (round.readonly ? round.index : round.liveIndex) + 1);
  const lastItem = game === "concentration" ? round.matched.length + 2 >= round.tiles.length : round.liveIndex + 1 >= round.steps.length;
  const missedTasks = [...new Set(round.log.filter((entry) => !entry.ok && entry.taskId).map((entry) => entry.taskId))];
  const reviewHref = missedTasks.length === 1
    ? `/flashcards?exam=saa-c03&task=${missedTasks[0]}&topic=due`
    : "/flashcards?exam=saa-c03&topic=due";
  const summary = missedOnly ? round.log.filter((entry) => !entry.ok) : round.log;
  const primary = "min-h-11 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950";
  const secondary = "min-h-11 rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-100";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          <Link href="/aws-saa/games" className="hover:text-white">{t("hubTitle")}</Link>
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{t(`games.${game}.title`)}</h1>
        <p className="mt-2 max-w-prose text-slate-400">{t(`games.${game}.blurb`)}</p>
      </div>
      {game === "concentration" ? (
        <div className="flex flex-wrap gap-2">
          {boards.filter((item) => item === "all" || concentrationPairs(item).length > 0).map((item) => (
            <Link key={item} href={`/aws-saa/games/concentration?board=${item}`} className={item === board ? "inline-flex min-h-11 items-center rounded-full bg-teal-500 px-4 text-sm font-medium text-slate-950" : "inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-slate-100"}>
              {t("board", { board: item })}
            </Link>
          ))}
        </div>
      ) : null}
      {game === "daily" ? (
        <p className="text-sm text-slate-300">{t("streak", { count: progress.memoryGames?.streak ?? 0, domain: weak ?? t("even") })}</p>
      ) : null}
      {game === "concentration" && best !== undefined ? <p className="text-sm text-slate-300">{t("best", { seconds: Math.round(best / 100) / 10 })}</p> : null}
      {round.phase !== "done" ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">{t("progress", { current: currentItem, total, score: round.score })}</p>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(total, round.score)} aria-label={t("progress", { current: currentItem, total, score: round.score })} className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-teal-400" style={{ width: `${Math.min(100, (100 * round.score) / total)}%` }} />
          </div>
        </div>
      ) : null}
      {round.phase === "done" ? (
        <section className="space-y-4 rounded-2xl border border-teal-700 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold text-white">{t("summary")}</h2>
          <p className="text-slate-200">{t("done", { misses: round.misses.length })}</p>
          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={missedOnly} onChange={(event) => setMissedOnly(event.target.checked)} className="accent-teal-400" />
            {t("missedOnly")}
          </label>
          <ol className="space-y-3">
            {summary.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-700 p-3">
                <p className="font-medium text-white">{entry.prompt}</p>
                <p className={entry.ok ? "mt-1 text-sm text-emerald-200" : "mt-1 text-sm text-rose-200"}>{t("yourAnswer", { answer: entry.yours || "—" })}</p>
                <p className="text-sm text-teal-100">{t("correctAnswer", { answer: entry.correct || "—" })}</p>
                <p className="mt-1 text-sm text-slate-300">{entry.explanation}</p>
                {entry.docsUrl ? <a href={entry.docsUrl} className="mt-1 inline-flex min-h-11 items-center text-sm text-teal-200 underline">{t("docs")}</a> : null}
              </li>
            ))}
          </ol>
          <div className="sticky bottom-0 flex flex-wrap gap-2 bg-slate-900 py-2">
            <button type="button" className={primary} onClick={() => restart(startGame(game, String(Date.now()), weak, board))}>{t("playAgain")}</button>
            <button type="button" className={secondary} disabled={round.misses.length === 0} onClick={() => restart(retryMissed(round))}>{t("retryMissed")}</button>
            {missedTasks.length > 0 ? <Link href={reviewHref} className={`${secondary} inline-flex items-center`}>{t("reviewCards")}</Link> : null}
          </div>
        </section>
      ) : game === "concentration" ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${round.columns}, minmax(0, 1fr))` }}>
          {round.tiles.map((tile, index) => {
            const open = round.matched.includes(index) || round.flipped.includes(index);
            return (
              <button key={tile.key} type="button" disabled={round.readonly} onClick={() => setRound((current) => ({ ...current, focus: index }))} className={`min-h-24 rounded-2xl border p-3 text-left text-sm ${round.focus === index ? "border-teal-400" : "border-slate-700"} ${open ? "bg-slate-800 text-white" : "bg-slate-950 text-slate-500"}`}>
                {open ? tile.label : t("faceDown")}
              </button>
            );
          })}
        </div>
      ) : game === "ladder" ? (
        <div className="space-y-3">
          <p className="text-white">{reviewing?.prompt ?? step?.prompt}</p>
          {!round.readonly ? <ol className="space-y-2">
            {(round.order[round.liveIndex] ?? []).map((label, index) => (
              <li key={label}>
                <button type="button" onClick={() => setRound((current) => ({ ...current, selected: index }))} className={`min-h-11 w-full rounded-xl border px-4 text-left ${round.selected === index ? "border-teal-400 text-white" : "border-slate-700 text-slate-200"}`}>
                  {index + 1}. {label}
                </button>
              </li>
            ))}
          </ol> : null}
          <p className="text-sm text-slate-400">{t("ladderKeys")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg text-white">{reviewing?.prompt ?? step?.prompt}</p>
          {!round.readonly && round.phase === "ask" ? <div className="grid gap-2">
            {step?.choices.map((choice) => (
              <button key={choice.key} type="button" aria-pressed={round.pending === choice.key} onClick={() => setRound((current) => choose(current, choice.key))} className={`min-h-11 rounded-xl border px-4 text-left text-slate-100 ${round.pending === choice.key ? "border-teal-300 bg-teal-950/40" : "border-slate-700 hover:border-teal-400"}`}>
                {choice.key}. {choice.label}
              </button>
            ))}
          </div> : null}
        </div>
      )}
      {round.phase === "feedback" ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4" role="status">
          {reviewing ? <p className="text-sm text-slate-400">{t("yourAnswer", { answer: reviewing.yours || "—" })} · {t("correctAnswer", { answer: reviewing.correct || "—" })}</p> : null}
          <p className="text-slate-100">{round.feedback}</p>
        </div>
      ) : null}
      {round.phase !== "done" ? (
        <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t border-slate-800 bg-slate-950/95 py-3">
          <button type="button" className={secondary} disabled={round.log.length === 0 || (round.phase === "feedback" && !round.readonly && round.liveIndex === 0)} onClick={() => setRound((current) => pressBack(current))}>{t("back")}</button>
          {round.phase === "ask" && !round.readonly ? (
            <>
              {game === "ladder" ? <button type="button" className={secondary} onClick={() => setRound((current) => applyKey(current, "u"))}>{t("moveUp")}</button> : null}
              <button type="button" className={primary} disabled={game !== "ladder" && game !== "concentration" && !round.pending} onClick={() => setRound((current) => checkAnswer(current))}>{t("check")}</button>
            </>
          ) : (
            <button type="button" autoFocus className={primary} onClick={() => setRound((current) => pressNext(current))}>{lastItem && !round.readonly ? t("finish") : t("next")}</button>
          )}
        </div>
      ) : null}
    </div>
  );
}
