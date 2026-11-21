"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { questions } from "@/lib/content";
import { getProgressSnapshot, getServerProgressSnapshot, rateCard, recordMemoryBest, recordMemoryStreak, subscribeProgress } from "@/lib/progress";
import { saaDomainSummary } from "@/lib/saa-study-loop";
import type { SaaDomainId } from "@/lib/saa-tags";
import { applyKey, concentrationPairs, GAME_IDS, localDay, nextStreak, startGame, type GameId, type GameRound } from "@/lib/study/games";

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
  const [startedAt] = useState(() => Date.now());
  const [graded, setGraded] = useState<string[]>([]);

  useEffect(() => {
    const fresh = round.misses.filter((id) => !graded.includes(id));
    if (fresh.length === 0) return;
    for (const id of fresh) rateCard(id, "again");
    setGraded((current) => [...current, ...fresh]);
  }, [round.misses, graded]);

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
    const onKey = (event: KeyboardEvent) => {
      const key = event.key === "Enter" ? "Enter" : event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (!["Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "u", "t", "f", "1", "2", "3", "4", "5", "6"].includes(key)) return;
      event.preventDefault();
      setRound((current) => applyKey(current, key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const step = round.steps[round.index];
  const best = progress.memoryGames?.bestMs[round.boardId];
  const boards = ["all", "D1", "D2", "D3", "D4"] as const;

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
      {round.phase === "done" ? (
        <p className="rounded-2xl border border-teal-700 bg-slate-900 p-5 text-white">{t("done", { misses: round.misses.length })}</p>
      ) : game === "concentration" ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${round.columns}, minmax(0, 1fr))` }}>
          {round.tiles.map((tile, index) => {
            const open = round.matched.includes(index) || round.flipped.includes(index);
            return (
              <button key={tile.key} type="button" onClick={() => setRound((current) => applyKey({ ...current, focus: index }, "Enter"))} className={`min-h-24 rounded-2xl border p-3 text-left text-sm ${round.focus === index ? "border-teal-400" : "border-slate-700"} ${open ? "bg-slate-800 text-white" : "bg-slate-950 text-slate-500"}`}>
                {open ? tile.label : t("faceDown")}
              </button>
            );
          })}
        </div>
      ) : game === "ladder" ? (
        <div className="space-y-3">
          <p className="text-white">{step?.prompt}</p>
          <ol className="space-y-2">
            {(round.order[round.index] ?? []).map((label, index) => (
              <li key={label}>
                <button type="button" onClick={() => setRound((current) => ({ ...current, selected: index }))} className={`min-h-11 w-full rounded-xl border px-4 text-left ${round.selected === index ? "border-teal-400 text-white" : "border-slate-700 text-slate-200"}`}>
                  {index + 1}. {label}
                </button>
              </li>
            ))}
          </ol>
          <p className="text-sm text-slate-400">{t("ladderKeys")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg text-white">{step?.prompt}</p>
          <div className="grid gap-2">
            {step?.choices.map((choice) => (
              <button key={choice.key} type="button" onClick={() => setRound((current) => applyKey(current, choice.key))} className="min-h-11 rounded-xl border border-slate-700 px-4 text-left text-slate-100 hover:border-teal-400">
                {choice.key}. {choice.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {round.phase === "feedback" ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-slate-100">{round.feedback}</p>
          <p className="mt-2 text-sm text-slate-400">{t("continue")}</p>
        </div>
      ) : null}
    </div>
  );
}
