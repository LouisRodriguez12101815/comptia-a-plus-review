"use client";

import { useEffect, useMemo, useState } from "react";
import { getFlashcards, topics } from "@/lib/content";
import { loadProgress, markCard } from "@/lib/progress";
import type { Flashcard } from "@/lib/types";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardDeck({ initialTopic }: { initialTopic: string }) {
  const [topicId, setTopicId] = useState(initialTopic);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [known, setKnown] = useState<Record<string, boolean>>({});

  const deck = useMemo(() => getFlashcards(topicId), [topicId]);

  useEffect(() => {
    setOrder(deck.map((card) => card.id));
    setIndex(0);
    setFlipped(false);
    setKnown(loadProgress().knownCards);
  }, [deck]);

  const cards = order
    .map((id) => deck.find((item) => item.id === id))
    .filter((item): item is Flashcard => Boolean(item));
  const card = cards[index];
  const knownCount = cards.filter((item) => known[item.id]).length;

  if (!card) {
    return <p className="text-slate-400">No cards in this deck.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
        >
          <option value="all">All cards</option>
          <option value="weak">Weak areas only</option>
          {topics.map((topic) => (
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
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-teal-400"
        >
          Shuffle
        </button>
      </div>

      <p className="text-sm text-slate-400">
        Card {index + 1} of {cards.length} · Marked known on this device: {knownCount}
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
            const next = markCard(card.id, false);
            setKnown(next.knownCards);
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
            const next = markCard(card.id, true);
            setKnown(next.knownCards);
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
    </div>
  );
}
