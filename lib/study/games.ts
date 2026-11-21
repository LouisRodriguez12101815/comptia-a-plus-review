import catalog from "@/content/study-games.json";
import { flashcards } from "@/lib/content";
import { saaDomainFromTask, type SaaDomainId } from "@/lib/saa-tags";
import type { StoredSchedule } from "@/lib/study/schedule";
import { resolvedPairs } from "@/lib/study/records";
import type { Flashcard } from "@/lib/types";

export const GAME_IDS = [
  "sorter",
  "ladder",
  "odd",
  "builder",
  "keyword",
  "pillars",
  "concentration",
  "lightning",
  "daily",
] as const;

export type GameId = (typeof GAME_IDS)[number];

export const PILLARS = [
  "Operational excellence",
  "Security",
  "Reliability",
  "Performance efficiency",
  "Cost optimization",
  "Sustainability",
] as const;

export const PRINCIPLES = [
  "Prefer a managed service that still meets the requirement",
  "Choose the lower cost among designs that meet the requirement",
  "Replicate so the recovery point stays current",
] as const;

const ORIGINAL_PAIRS = [
  "pair-sg-nacl",
  "pair-rds-failover-read",
  "pair-cloudfront-global-accelerator",
  "pair-kinesis-firehose",
  "pair-rto-rpo",
  "pair-kms-cloudhsm",
  "pair-aurora-global-replica",
  "pair-vpn-direct-connect",
] as const;

type Tagged = {
  id: string;
  taskId: string;
  docsUrl: string;
  explanation: string;
  cardId: string;
  prompt: string;
  services?: string[];
  questionIds?: string[];
  choices?: string[];
  answer?: number | boolean;
  order?: string[];
};

type Step = {
  id: string;
  prompt: string;
  choices: { key: string; label: string }[];
  answerKey: string;
  explanation: string;
  cardId: string;
  taskId: string;
  docsUrl: string;
};

export type Tile = { key: string; pairId: string; label: string; text: string };

export type GameRound = {
  game: GameId;
  boardId: string;
  steps: Step[];
  index: number;
  phase: "ask" | "feedback" | "done";
  misses: string[];
  feedback: string;
  selected: number;
  order: string[][];
  focus: number;
  flipped: number[];
  matched: number[];
  tiles: Tile[];
  columns: number;
};

function activeCards(): Flashcard[] {
  return flashcards.filter((card) => !card.retired && card.taskId && card.examCodes?.includes("saa-c03"));
}

function seededOrder(count: number, seed: string): number[] {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) state = (state * 33 + seed.charCodeAt(i)) >>> 0;
  const order = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swap = state % (i + 1);
    [order[i], order[swap]] = [order[swap], order[i]];
  }
  return order;
}

function choiceSteps(items: Tagged[], labels: string[]): Step[] {
  return items.map((item) => ({
    id: item.id,
    prompt: item.prompt,
    choices: labels.map((label, index) => ({ key: String(index + 1), label })),
    answerKey: String(Number(item.answer) + 1),
    explanation: item.explanation,
    cardId: item.cardId,
    taskId: item.taskId,
    docsUrl: item.docsUrl,
  }));
}

function sorterSteps(seed: string): Step[] {
  const cards = activeCards().slice().sort((a, b) => a.id.localeCompare(b.id));
  const start = seededOrder(cards.length, seed)[0] ?? 0;
  const picked: Flashcard[] = [];
  for (let i = 0; i < cards.length && picked.length < 4; i += 1) {
    const card = cards[(start + i) % cards.length];
    if (card && !picked.some((item) => item.taskId === card.taskId)) picked.push(card);
  }
  const tasks = picked.map((card) => card.taskId as string);
  return picked.map((card) => ({
    id: `sorter-${card.id}`,
    prompt: card.front,
    choices: tasks.map((task, index) => ({ key: String(index + 1), label: task })),
    answerKey: String(tasks.indexOf(card.taskId as string) + 1),
    explanation: card.back,
    cardId: card.id,
    taskId: card.taskId as string,
    docsUrl: card.docsUrl ?? "",
  }));
}

function lightningSteps(): Step[] {
  return (catalog.lightning as Tagged[]).map((item) => ({
    id: item.id,
    prompt: item.prompt,
    choices: [
      { key: "t", label: "True" },
      { key: "f", label: "False" },
    ],
    answerKey: item.answer === true ? "t" : "f",
    explanation: item.explanation,
    cardId: item.cardId,
    taskId: item.taskId,
    docsUrl: item.docsUrl,
  }));
}

export function twoSidedPairs() {
  return resolvedPairs("saa-c03").filter((pair) => pair.sides.length === 2);
}

export function concentrationPairs(boardId: string) {
  const pairs = twoSidedPairs();
  const selected = boardId === "all"
    ? pairs.filter((pair) => (ORIGINAL_PAIRS as readonly string[]).includes(pair.id))
    : pairs.filter((pair) => saaDomainFromTask(pair.taskId) === boardId);
  return selected.slice(0, 8);
}

function tilesFor(boardId: string): { tiles: Tile[]; columns: number } {
  const pairs = concentrationPairs(boardId);
  const faces = pairs.flatMap((pair) => pair.sides.map((side, index) => ({
    pairId: pair.id,
    label: side.label,
    text: index === 0 ? pair.difference ?? side.pickWhen : side.pickWhen,
  })));
  const columns = faces.length >= 16 ? 4 : faces.length >= 6 ? 3 : 2;
  const tiles = seededOrder(faces.length, boardId).map((index, position) => ({
    key: String.fromCharCode(97 + position),
    pairId: faces[index].pairId,
    label: faces[index].label,
    text: faces[index].text,
  }));
  return { tiles, columns };
}

function dailySteps(weakDomain: SaaDomainId | null, seed: string): Step[] {
  const cards = activeCards().slice().sort((a, b) => a.id.localeCompare(b.id));
  const order = seededOrder(cards.length, seed).map((index) => cards[index]);
  const weak = weakDomain ? order.filter((card) => saaDomainFromTask(card.taskId as string) === weakDomain) : [];
  const rest = order.filter((card) => !weak.includes(card));
  const picked = [...weak.slice(0, 6), ...rest].slice(0, 10);
  const tasks = ["1.1", "2.2", "3.4", "4.2"];
  return picked.map((card) => {
    const choices = tasks.includes(card.taskId as string) ? tasks : [card.taskId as string, ...tasks.filter((task) => task !== card.taskId)].slice(0, 4);
    return {
      id: `daily-${card.id}`,
      prompt: card.front,
      choices: choices.map((task, index) => ({ key: String(index + 1), label: task })),
      answerKey: String(choices.indexOf(card.taskId as string) + 1),
      explanation: card.back,
      cardId: card.id,
      taskId: card.taskId as string,
      docsUrl: card.docsUrl ?? "",
    };
  });
}

function blank(game: GameId, boardId: string): GameRound {
  return {
    game,
    boardId,
    steps: [],
    index: 0,
    phase: "ask",
    misses: [],
    feedback: "",
    selected: 0,
    order: [],
    focus: 0,
    flipped: [],
    matched: [],
    tiles: [],
    columns: 2,
  };
}

export function startGame(game: GameId, seed = "saa", weakDomain: SaaDomainId | null = null, boardId = "all"): GameRound {
  const round = blank(game, game === "concentration" ? boardId : game);
  if (game === "sorter") round.steps = sorterSteps(seed);
  if (game === "odd") round.steps = choiceSteps(catalog.odd as Tagged[], []);
  if (game === "builder") round.steps = choiceSteps(catalog.builder as Tagged[], []);
  if (game === "keyword") round.steps = choiceSteps(catalog.keywords as Tagged[], [...PRINCIPLES]);
  if (game === "pillars") round.steps = choiceSteps(catalog.pillars as Tagged[], [...PILLARS]);
  if (game === "lightning") round.steps = lightningSteps();
  if (game === "daily") round.steps = dailySteps(weakDomain, seed);
  if (game === "odd" || game === "builder") {
    const source = (game === "odd" ? catalog.odd : catalog.builder) as Tagged[];
    round.steps = source.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      choices: (item.choices ?? []).map((label, index) => ({ key: String(index + 1), label })),
      answerKey: String(Number(item.answer) + 1),
      explanation: item.explanation,
      cardId: item.cardId,
      taskId: item.taskId,
      docsUrl: item.docsUrl,
    }));
  }
  if (game === "ladder") {
    round.order = (catalog.ladders as Tagged[]).map((item) => [...(item.order ?? [])].reverse());
    round.steps = (catalog.ladders as Tagged[]).map((item) => ({
      id: item.id,
      prompt: item.prompt,
      choices: [],
      answerKey: "Enter",
      explanation: item.explanation,
      cardId: item.cardId,
      taskId: item.taskId,
      docsUrl: item.docsUrl,
    }));
  }
  if (game === "concentration") {
    const board = tilesFor(boardId);
    round.tiles = board.tiles;
    round.columns = board.columns;
    round.boardId = boardId;
    if (board.tiles.length === 0) round.phase = "done";
  }
  return round;
}

function advance(round: GameRound, correct: boolean, cardId: string, explanation: string): GameRound {
  const misses = correct || round.misses.includes(cardId) ? round.misses : [...round.misses, cardId];
  return { ...round, phase: "feedback", feedback: explanation, misses };
}

function moveSelection(round: GameRound, key: string): GameRound | undefined {
  const order = round.order[round.index] ?? [];
  if (key === "ArrowDown") return { ...round, selected: Math.min(order.length - 1, round.selected + 1) };
  if (key === "ArrowUp") return { ...round, selected: Math.max(0, round.selected - 1) };
  if (key === "u" && round.selected > 0) {
    const next = order.slice();
    [next[round.selected - 1], next[round.selected]] = [next[round.selected], next[round.selected - 1]];
    const orders = round.order.slice();
    orders[round.index] = next;
    return { ...round, order: orders, selected: round.selected - 1 };
  }
  return undefined;
}

function moveFocus(round: GameRound, key: string): number | undefined {
  const columns = round.columns;
  const count = round.tiles.length;
  const row = Math.floor(round.focus / columns);
  const col = round.focus % columns;
  if (key === "ArrowRight" && col + 1 < columns && round.focus + 1 < count) return round.focus + 1;
  if (key === "ArrowLeft" && col > 0) return round.focus - 1;
  if (key === "ArrowDown" && round.focus + columns < count) return round.focus + columns;
  if (key === "ArrowUp" && row > 0) return round.focus - columns;
  return undefined;
}

export function applyKey(round: GameRound, key: string): GameRound {
  if (round.phase === "done") return round;
  if (round.phase === "feedback") {
    if (key !== "Enter") return round;
    if (round.game === "concentration") return { ...round, phase: "ask", flipped: [], feedback: "" };
    const index = round.index + 1;
    if (index >= round.steps.length) return { ...round, phase: "done", index };
    return { ...round, phase: "ask", index, feedback: "", selected: 0 };
  }
  if (round.game === "ladder") {
    const moved = moveSelection(round, key);
    if (moved) return moved;
    if (key !== "Enter") return round;
    const target = (catalog.ladders as Tagged[])[round.index]?.order ?? [];
    const current = round.order[round.index] ?? [];
    const correct = current.join("\n") === target.join("\n");
    return advance(round, correct, round.steps[round.index].cardId, round.steps[round.index].explanation);
  }
  if (round.game === "concentration") {
    const focus = moveFocus(round, key);
    if (focus !== undefined) return { ...round, focus };
    if (key !== "Enter") return round;
    if (round.matched.includes(round.focus) || round.flipped.includes(round.focus)) return round;
    const flipped = [...round.flipped, round.focus];
    if (flipped.length < 2) return { ...round, flipped };
    const [first, second] = flipped;
    const same = round.tiles[first].pairId === round.tiles[second].pairId;
    if (same) {
      const matched = [...round.matched, first, second];
      const done = matched.length === round.tiles.length;
      return { ...round, flipped: [], matched, phase: done ? "done" : "ask" };
    }
    const pair = twoSidedPairs().find((item) => item.id === round.tiles[first].pairId);
    const cardId = cardForPair(pair?.taskId ?? "", pair?.services ?? []);
    return {
      ...round,
      flipped,
      phase: "feedback",
      feedback: pair?.difference ?? "Those two do not match.",
      misses: cardId && !round.misses.includes(cardId) ? [...round.misses, cardId] : round.misses,
    };
  }
  const step = round.steps[round.index];
  if (!step) return round;
  const choice = step.choices.find((item) => item.key === key);
  if (!choice) return round;
  return advance(round, key === step.answerKey, step.cardId, step.explanation);
}

export function answerKey(round: GameRound): string {
  if (round.phase === "feedback") return "Enter";
  if (round.phase === "done") return "";
  if (round.game === "ladder") {
    const target = (catalog.ladders as Tagged[])[round.index]?.order ?? [];
    const current = round.order[round.index] ?? [];
    const index = current.findIndex((item, position) => item !== target[position]);
    if (index < 0) return "Enter";
    const from = current.indexOf(target[index]);
    if (round.selected < from) return "ArrowDown";
    if (round.selected > from) return "ArrowUp";
    return "u";
  }
  if (round.game === "concentration") {
    const open = round.tiles.map((tile, index) => ({ index, pairId: tile.pairId })).filter((tile) => !round.matched.includes(tile.index) && !round.flipped.includes(tile.index));
    const wanted = round.flipped.length === 1 ? round.tiles[round.flipped[0]]?.pairId : undefined;
    const first = wanted
      ? open.find((tile) => tile.pairId === wanted)
      : open.find((tile) => open.some((other) => other.pairId === tile.pairId && other.index !== tile.index));
    const target = first?.index;
    if (target === undefined) return "Enter";
    if (round.focus === target) return "Enter";
    const columns = round.columns;
    if (Math.floor(target / columns) > Math.floor(round.focus / columns)) return "ArrowDown";
    if (Math.floor(target / columns) < Math.floor(round.focus / columns)) return "ArrowUp";
    return target > round.focus ? "ArrowRight" : "ArrowLeft";
  }
  return round.steps[round.index]?.answerKey ?? "";
}

export function cardForPair(taskId: string, services: string[], schedules: Record<string, StoredSchedule | undefined> = {}): string | undefined {
  const cards = activeCards().filter((card) => card.taskId === taskId);
  const shared = cards.filter((card) => (card.services ?? []).some((service) => services.includes(service)));
  const pool = shared.length > 0 ? shared : cards;
  const due = (card: Flashcard) => {
    const stored = schedules[card.id];
    if (!stored) return 0;
    const time = new Date(stored.due).getTime();
    return Number.isNaN(time) ? 0 : time;
  };
  return pool.slice().sort((a, b) => due(a) - due(b) || a.id.localeCompare(b.id))[0]?.id;
}

export function gameCatalogItems(): Tagged[] {
  return [...catalog.ladders, ...catalog.odd, ...catalog.builder, ...catalog.keywords, ...catalog.pillars, ...catalog.lightning] as Tagged[];
}

export function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function nextStreak(lastMixDay: string | undefined, streak: number, today: string): number {
  if (lastMixDay === today) return streak;
  const previous = new Date(`${today}T00:00:00`);
  previous.setDate(previous.getDate() - 1);
  if (lastMixDay === localDay(previous)) return streak + 1;
  return 1;
}

export function finishRound(round: GameRound): GameRound {
  let current = round;
  for (let guard = 0; guard < 400 && current.phase !== "done"; guard += 1) {
    current = applyKey(current, answerKey(current));
  }
  return current;
}
