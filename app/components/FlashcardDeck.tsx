"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getFlashcards, getTopics } from "@/lib/content";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  markCard,
  subscribeProgress,
} from "@/lib/progress";
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
  const [focus, setFocus] = useStudyFocus();
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const [topicId, setTopicId] = useState(initialTopic);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<string[]>([]);

  const deck = useMemo(() => getFlashcards(topicId, focus), [topicId, focus]);
  const topicOptions = getTopics(focus);
  const cards = useMemo(() => {
    const byId = new Map(deck.map((card) => [card.id, card]));
    const ordered = order
      .map((id) => byId.get(id))
      .filter((card): card is Flashcard => Boolean(card));
    const orderedIds = new Set(ordered.map((card) => card.id));
    return [...ordered, ...deck.filter((card) => !orderedIds.has(card.id))];
  }, [deck, order]);
  const currentIndex = cards.length ? index % cards.length : 0;
  const card = cards[currentIndex];
  const knownCount = cards.filter((item) => progress.knownCards[item.id]).length;

  function resetDeck() {
    setOrder([]);
    setIndex(0);
    setFlipped(false);
  }

  function changeFocus(nextFocus: StudyFocus) {
    setFocus(nextFocus);
    setTopicId("all");
    resetDeck();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <ExamFocusPicker focus={focus} onChange={changeFocus} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={topicId}
          onChange={(event) => {
            setTopicId(event.target.value);
            resetDeck();
          }}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
        >
          <option value="all">All focused cards</option>
          <option value="weak">Weak areas only</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.chapter}: {topic.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setOrder(shuffle(deck).map((item) => item.id));
            setIndex(0);
            setFlipped(false);
          }}
          disabled={deck.length === 0}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-teal-400 disabled:opacity-40"
        >
          Shuffle
        </button>
      </div>

      {!card ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-400">
          No cards are tagged for this combination yet. Choose All focused cards or switch exam focus.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            Card {currentIndex + 1} of {cards.length} · Marked known on this device: {knownCount}
          </p>

          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="min-h-56 w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left shadow-lg shadow-black/30"
          >
            {card.weak && (
              <span className="mb-3 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                Weak area
              </span>
            )}
            <p className="text-xs uppercase tracking-wide text-teal-300">
              {flipped ? "Answer" : "Prompt"}
            </p>
            <p className="mt-3 text-xl leading-relaxed text-white">
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-8 text-sm text-slate-500">Tap to flip</p>
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                markCard(card.id, false);
                setFlipped(false);
                setIndex((value) => (value + 1) % cards.length);
              }}
              className="rounded-full border border-slate-600 px-4 py-2 text-sm hover:border-orange-400"
            >
              Still learning
            </button>
            <button
              type="button"
              onClick={() => {
                markCard(card.id, true);
                setFlipped(false);
                setIndex((value) => (value + 1) % cards.length);
              }}
              className="rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400"
            >
              I know this
            </button>
            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value - 1 + cards.length) % cards.length);
              }}
              className="rounded-full border border-slate-600 px-4 py-2 text-sm"
            >
              Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}
