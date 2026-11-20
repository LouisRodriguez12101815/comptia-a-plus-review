"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import { SAA_TASK_IDS } from "@/lib/saa-tags";
import { displayBox, isDue, type ReviewGrade } from "@/lib/study/schedule";
import { clozeForCard, termMatches } from "@/lib/study/memory";
import { resolvedPairs } from "@/lib/study/records";
import type { Flashcard, StudyFocus } from "@/lib/types";

const DUE_MODE = "due";
const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];
const modes = ["flip", "type", "cloze", "match"] as const;
type MemoryMode = (typeof modes)[number];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function seededOrder(count: number, seed: string): number[] {
  const indexes = Array.from({ length: count }, (_, index) => index);
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}

function isMode(value: string | undefined): value is MemoryMode {
  return modes.some((mode) => mode === value);
}

function isTask(value: string | undefined): value is (typeof SAA_TASK_IDS)[number] {
  return SAA_TASK_IDS.some((task) => task === value);
}

export function FlashcardDeck({
  initialTopic,
  initialExam,
  initialTask,
  initialMode,
}: {
  initialTopic: string;
  initialExam?: string;
  initialTask?: string;
  initialMode?: string;
}) {
  const t = useTranslations("flashcardDeck");
  const [focus, setFocus] = useStudyFocus();
  const [topicFocus, setTopicFocus] = useState<StudyFocus | null>(initialTopic === "n10-ch9" ? "n10-009" : null);
  const activeFocus = topicFocus ?? focus;
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const [topicId, setTopicId] = useState(initialTopic);
  const [taskId, setTaskId] = useState(isTask(initialTask) ? initialTask : "all");
  const [mode, setMode] = useState<MemoryMode>(isMode(initialMode) ? initialMode : "flip");
  const [reverse, setReverse] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<"match" | "miss" | null>(null);
  const [matchPick, setMatchPick] = useState<number | null>(null);

  useEffect(() => {
    if (initialExam === "saa-c03" || initialExam === "clf-c02") setFocus(initialExam);
  }, [initialExam, setFocus]);

  const taskFilter = activeFocus === "saa-c03" && taskId !== "all" ? taskId : null;
  const deck = useMemo(() => {
    const cards = getFlashcards(topicId === DUE_MODE ? "all" : topicId, activeFocus);
    return taskFilter ? cards.filter((card) => card.taskId === taskFilter) : cards;
  }, [topicId, activeFocus, taskFilter]);
  const dueCards = useMemo(
    () => getFlashcards("all", activeFocus).filter((item) => isDue(progress.schedules[item.id]) && (!taskFilter || item.taskId === taskFilter)),
    [activeFocus, progress.schedules, taskFilter],
  );
  const topicOptions = getTopics(activeFocus);
  const cards = useMemo(() => {
    const byId = new Map(deck.map((card) => [card.id, card]));
    const ordered = order.map((id) => byId.get(id)).filter((card): card is Flashcard => Boolean(card));
    if (topicId === DUE_MODE) return ordered;
    const orderedIds = new Set(ordered.map((card) => card.id));
    return [...ordered, ...deck.filter((card) => !orderedIds.has(card.id))];
  }, [deck, order, topicId]);
  const pairs = useMemo(
    () => (activeFocus === "saa-c03" ? resolvedPairs("saa-c03", taskFilter) : []),
    [activeFocus, taskFilter],
  );
  const currentIndex = cards.length ? index % cards.length : 0;
  const card = cards[currentIndex];
  const pair = pairs.length ? pairs[index % pairs.length] : undefined;
  const knownCount = cards.filter((item) => progress.knownCards[item.id]).length;
  const drillId = activeFocus === "saa-c03"
    ? "aws-saa-service-compare"
    : activeFocus === "clf-c02"
      ? "aws-clf-service-compare"
      : null;

  function resetDeck() {
    setOrder([]);
    setIndex(0);
    setFlipped(false);
    setDraft("");
    setChecked(null);
    setMatchPick(null);
  }

  function changeFocus(nextFocus: StudyFocus) {
    setTopicFocus(null);
    setFocus(nextFocus);
    setTopicId("all");
    setTaskId("all");
    resetDeck();
  }

  function advance(cardId: string) {
    setFlipped(false);
    setDraft("");
    setChecked(null);
    setMatchPick(null);
    if (topicId === DUE_MODE && mode !== "match") {
      setOrder((prev) => prev.filter((id) => id !== cardId));
    } else {
      setIndex((value) => value + 1);
    }
  }

  function grade(id: string, gradeValue: ReviewGrade) {
    rateCard(id, gradeValue);
    advance(id);
  }

  const gradeButtons = (id: string) => (
    <div className="flex flex-wrap gap-2">
      {grades.map((gradeValue) => (
        <button
          key={gradeValue}
          type="button"
          onClick={() => grade(id, gradeValue)}
          className={
            gradeValue === "good" || gradeValue === "easy"
              ? "min-h-11 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400"
              : "min-h-11 rounded-full border border-slate-600 px-4 py-2 text-sm hover:border-orange-400"
          }
        >
          {t(`grades.${gradeValue}`)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <ExamFocusPicker focus={activeFocus} onChange={changeFocus} />
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("modesLabel")}>
        {modes.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mode === item}
            onClick={() => {
              setMode(item);
              resetDeck();
            }}
            className={
              mode === item
                ? "min-h-11 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950"
                : "min-h-11 rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100"
            }
          >
            {t(`modes.${item}`)}
          </button>
        ))}
        {drillId && (
          <Link href={`/practice-games/drills/${drillId}`} className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-teal-200">
            {t("pickService")}
          </Link>
        )}
        {activeFocus === "saa-c03" && (
          <Link href="/flashcards/cheat-sheet" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-teal-200">
            {t("cheatSheet")}
          </Link>
        )}
      </div>

      {mode === "flip" && (
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={reverse}
            onChange={(event) => {
              setReverse(event.target.checked);
              setFlipped(false);
            }}
          />
          {t("reverse")}
        </label>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {mode !== "match" && (
          <select
            aria-label={t("chooseDeck")}
            value={topicId}
            onChange={(event) => {
              const next = event.target.value;
              setTopicId(next);
              resetDeck();
              if (next === DUE_MODE) setOrder(dueCards.map((item) => item.id));
            }}
            className="min-h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
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
        )}
        {activeFocus === "saa-c03" && (
          <select
            aria-label={t("taskLabel")}
            value={taskId}
            onChange={(event) => {
              setTaskId(event.target.value);
              resetDeck();
            }}
            className="min-h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="all">{t("allTasks")}</option>
            {SAA_TASK_IDS.map((task) => (
              <option key={task} value={task}>{task}</option>
            ))}
          </select>
        )}
        {mode !== "match" && (
          <button
            type="button"
            onClick={() => {
              setOrder(topicId === DUE_MODE ? shuffle(cards.map((item) => item.id)) : shuffle(deck).map((item) => item.id));
              setIndex(0);
              setFlipped(false);
            }}
            disabled={deck.length === 0}
            className="min-h-11 rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-teal-400 disabled:opacity-40"
          >
            {t("shuffle")}
          </button>
        )}
      </div>

      {mode === "match" ? (
        !pair ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-400">{t("noPairs")}</p>
        ) : (
          <MatchPair
            key={`${pair.id}-${index}`}
            pair={pair}
            pick={matchPick}
            onPick={setMatchPick}
            gradeButtons={gradeButtons(pair.id)}
          />
        )
      ) : !card ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-400">
          {topicId === DUE_MODE ? t("nothingDue") : t("noCards")}
        </p>
      ) : mode === "flip" ? (
        <>
          <p className="text-sm text-slate-400">
            {topicId === DUE_MODE
              ? t("cardStatusDue", { current: currentIndex + 1, total: cards.length, known: knownCount })
              : t("cardStatus", { current: currentIndex + 1, total: cards.length, known: knownCount })}
            {" · "}
            {t("displayBox", { box: displayBox(progress.schedules[card.id]) })}
          </p>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="min-h-56 w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left shadow-lg shadow-black/30"
          >
            {card.weak && (
              <span className="mb-3 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">{t("weakArea")}</span>
            )}
            <p className="text-xs uppercase tracking-wide text-teal-300">{(reverse ? !flipped : flipped) ? t("answerSide") : t("promptSide")}</p>
            <p className="mt-3 text-xl leading-relaxed text-white">{(reverse ? !flipped : flipped) ? card.back : card.front}</p>
            <p className="mt-8 text-sm text-slate-500">{flipped ? t("rateHint") : t("flipHint")}</p>
          </button>
          {flipped ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">{t("ratePrompt")}</p>
              {gradeButtons(card.id)}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("flipToRate")}</p>
          )}
          {card.docsUrl && (
            <a href={card.docsUrl} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline">{t("docs")}</a>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value - 1 + cards.length) % cards.length);
              }}
              className="min-h-11 rounded-full border border-slate-600 px-4 py-2 text-sm"
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
      ) : (
        <TypedCard
          card={card}
          mode={mode}
          draft={draft}
          checked={checked}
          status={t("cardStatus", { current: currentIndex + 1, total: cards.length, known: knownCount })}
          onDraft={(value) => {
            setDraft(value);
            setChecked(null);
          }}
          onCheck={() => setChecked(termMatches(draft, mode === "type" ? card : { front: clozeForCard(card).answer }) ? "match" : "miss")}
          gradeButtons={gradeButtons(card.id)}
        />
      )}
    </div>
  );
}

function TypedCard({
  card,
  mode,
  draft,
  checked,
  status,
  onDraft,
  onCheck,
  gradeButtons,
}: {
  card: Flashcard;
  mode: "type" | "cloze";
  draft: string;
  checked: "match" | "miss" | null;
  status: string;
  onDraft: (value: string) => void;
  onCheck: () => void;
  gradeButtons: ReactNode;
}) {
  const t = useTranslations("flashcardDeck");
  const cloze = clozeForCard(card);
  const prompt = mode === "type" ? card.back : cloze.prompt;
  const answer = mode === "type" ? card.front : cloze.answer;
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onCheck();
      }}
    >
      <p className="text-sm text-slate-400">{status}</p>
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <p className="text-xs uppercase tracking-wide text-teal-300">{mode === "type" ? t("typeLabel") : t("clozeLabel")}</p>
        <p className="mt-3 whitespace-pre-wrap text-xl leading-relaxed text-white">{prompt}</p>
      </div>
      <label className="block text-sm text-slate-300">
        {mode === "type" ? t("typeLabel") : t("clozeLabel")}
        <input
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          autoComplete="off"
        />
      </label>
      <button type="submit" className="min-h-11 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950">
        {t("check")}
      </button>
      {checked && (
        <div className="space-y-3">
          <p className={checked === "match" ? "text-teal-200" : "text-amber-200"}>
            {checked === "match" ? t("typeMatch") : t("typeMiss")}
          </p>
          <p className="text-white">{t("expectedTerm", { term: answer })}</p>
          {card.docsUrl && <a href={card.docsUrl} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline">{t("docs")}</a>}
          <p className="text-sm text-slate-400">{t("ratePrompt")}</p>
          {gradeButtons}
        </div>
      )}
    </form>
  );
}

function MatchPair({
  pair,
  pick,
  onPick,
  gradeButtons,
}: {
  pair: ReturnType<typeof resolvedPairs>[number];
  pick: number | null;
  onPick: (index: number) => void;
  gradeButtons: ReactNode;
}) {
  const t = useTranslations("flashcardDeck");
  const order = seededOrder(pair.sides.length, pair.id);
  const asked = order[0];
  const side = pair.sides[asked];
  const pickedSide = pick === null ? undefined : pair.sides[pick];
  return (
    <div className="space-y-4">
      {pair.difference && <p className="text-slate-300">{pair.difference}</p>}
      <p className="text-xs uppercase tracking-wide text-teal-300">{t("matchWhich")}</p>
      <p className="text-xl text-white">{side.pickWhen}</p>
      <div className="flex flex-col gap-2">
        {order.map((sideIndex) => (
          <button
            key={pair.sides[sideIndex].label}
            type="button"
            onClick={() => onPick(sideIndex)}
            className="min-h-11 rounded-xl border border-slate-600 px-4 py-2 text-left text-slate-100 hover:border-teal-400"
          >
            {pair.sides[sideIndex].label}
          </button>
        ))}
      </div>
      {pickedSide && (
        <div className="space-y-3">
          <p className={pick === asked ? "text-teal-200" : "text-amber-200"}>
            {pick === asked ? t("matchCorrect") : t("matchMiss")}
          </p>
          <p className="text-white">{t("expectedTerm", { term: side.label })}</p>
          <a href={pair.docsUrl} className="inline-flex min-h-11 items-center text-sm text-teal-200 underline">{t("docs")}</a>
          <p className="text-sm text-slate-400">{t("ratePrompt")}</p>
          {gradeButtons}
        </div>
      )}
    </div>
  );
}
