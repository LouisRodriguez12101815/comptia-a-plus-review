"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { reportContent } from "@/app/components/ReportIssue";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getFlashcards, getTopics } from "@/lib/content";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  rateCard,
  subscribeProgress,
} from "@/lib/progress";
import { isDue, type ReviewGrade } from "@/lib/study/schedule";

const DUE_MODE = "due";
const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];
import type { Flashcard, StudyFocus } from "@/lib/types";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardDeck({ initialTopic }: { initialTopic: string }) {
  const t = useTranslations("flashcardDeck");
  const [focus, setFocus] = useStudyFocus();
  // A linked Chapter 9 review must not become empty under a saved Core 1 focus.
  const [topicFocus, setTopicFocus] = useState<StudyFocus | null>(initialTopic === "n10-ch9" ? "n10-009" : null);
  const activeFocus = topicFocus ?? focus;
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const [topicId, setTopicId] = useState(initialTopic);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<string[]>([]);

  const deck = useMemo(
    () => getFlashcards(topicId === DUE_MODE ? "all" : topicId, activeFocus),
    [topicId, activeFocus],
  );
  const dueCards = useMemo(
    () => getFlashcards("all", activeFocus).filter((item) => isDue(progress.schedules[item.id])),
    [activeFocus, progress.schedules],
  );
  const topicOptions = getTopics(activeFocus);
  const cards = useMemo(() => {
    const byId = new Map(deck.map((card) => [card.id, card]));
    const ordered = order
      .map((id) => byId.get(id))
      .filter((card): card is Flashcard => Boolean(card));
    if (topicId === DUE_MODE) return ordered;
    const orderedIds = new Set(ordered.map((card) => card.id));
    return [...ordered, ...deck.filter((card) => !orderedIds.has(card.id))];
  }, [deck, order, topicId]);
  const currentIndex = cards.length ? index % cards.length : 0;
  const card = cards[currentIndex];
  const knownCount = cards.filter((item) => progress.knownCards[item.id]).length;

  function resetDeck() {
    setOrder([]);
    setIndex(0);
    setFlipped(false);
  }

  function changeFocus(nextFocus: StudyFocus) {
    setTopicFocus(null);
    setFocus(nextFocus);
    setTopicId("all");
    resetDeck();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <ExamFocusPicker focus={activeFocus} onChange={changeFocus} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          aria-label={t("chooseDeck")}
          value={topicId}
          onChange={(event) => {
            const next = event.target.value;
            setTopicId(next);
            resetDeck();
            if (next === DUE_MODE) setOrder(dueCards.map((item) => item.id));
          }}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
        >
          <option value="all">{t("allFocused")}</option>
          <option value="weak">{t("weakOnly")}</option>
          <option value={DUE_MODE}>{t("dueForReview", { count: dueCards.length })}</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.chapter}: {topic.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setOrder(
              topicId === DUE_MODE
                ? shuffle(cards.map((item) => item.id))
                : shuffle(deck).map((item) => item.id),
            );
            setIndex(0);
            setFlipped(false);
          }}
          disabled={deck.length === 0}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-teal-400 disabled:opacity-40"
        >
          {t("shuffle")}
        </button>
      </div>

      {!card ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-400">
          {topicId === DUE_MODE ? t("nothingDue") : t("noCards")}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            {topicId === DUE_MODE
              ? t("cardStatusDue", { current: currentIndex + 1, total: cards.length, known: knownCount })
              : t("cardStatus", { current: currentIndex + 1, total: cards.length, known: knownCount })}
          </p>

          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="min-h-56 w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left shadow-lg shadow-black/30"
          >
            {card.weak && (
              <span className="mb-3 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                {t("weakArea")}
              </span>
            )}
            <p className="text-xs uppercase tracking-wide text-teal-300">
              {flipped ? t("answerSide") : t("promptSide")}
            </p>
            <p className="mt-3 text-xl leading-relaxed text-white">
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-8 text-sm text-slate-500">
              {flipped ? t("rateHint") : t("flipHint")}
            </p>
          </button>

          {flipped ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">{t("ratePrompt")}</p>
              <div className="flex flex-wrap gap-2">
                {grades.map((grade) => {
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => {
                        rateCard(card.id, grade);
                        setFlipped(false);
                        if (topicId === DUE_MODE) {
                          setOrder((prev) => prev.filter((id) => id !== card.id));
                        } else {
                          setIndex((value) => (value + 1) % cards.length);
                        }
                      }}
                      className={
                        grade === "good" || grade === "easy"
                          ? "rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400"
                          : "rounded-full border border-slate-600 px-4 py-2 text-sm hover:border-orange-400"
                      }
                    >
                      {t(`grades.${grade}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("flipToRate")}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value - 1 + cards.length) % cards.length);
              }}
              className="rounded-full border border-slate-600 px-4 py-2 text-sm"
            >
              {t("previous")}
            </button>
            <button
              type="button"
              onClick={() => reportContent(`Flashcard ${card.id}: ${card.front} / ${card.back}`, "Factual error")}
              className="min-h-11 px-2 text-xs text-slate-400 underline decoration-dotted underline-offset-4 hover:text-amber-200"
            >
              {t("disputeCard")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
