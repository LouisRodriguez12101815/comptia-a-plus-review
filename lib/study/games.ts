import objectives from "@/content/objectives.json";
import serviceFacts from "@/content/saa-service-facts.json";
import catalog from "@/content/study-games.json";
import { flashcards } from "@/lib/content";
import { saaDomainFromTask, type SaaDomainId } from "@/lib/saa-tags";
import { GAME_IDS, type GameId } from "@/lib/study/game-ids";
import type { StoredSchedule } from "@/lib/study/schedule";
import { resolvedPairs } from "@/lib/study/records";
import type { Flashcard } from "@/lib/types";

export { GAME_IDS, type GameId };

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
  "Keep access inside the permissions that were granted",
  "Keep serving through the failure the stem names",
  "Remove the bottleneck the stem names",
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
  choiceWhy?: string[];
  answer?: number | boolean;
  order?: string[];
  rungWhy?: string[];
  correction?: string;
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
  questionIds?: string[];
};

export type RoundEntry = {
  id: string;
  prompt: string;
  yours: string;
  correct: string;
  explanation: string;
  docsUrl: string;
  ok: boolean;
  taskId: string;
  questionIds: string[];
};

const saaDomains = objectives.exams.find((exam) => exam.code === "saa-c03")?.domains ?? [];
const taskTitles = new Map(saaDomains.flatMap((domain) => domain.objectives.map((objective) => [objective.id, objective.title] as const)));

/** Official task id plus its title, so a choice is never a bare number like "1.3". */
export function taskChoiceLabel(taskId: string): string {
  const title = taskTitles.get(taskId);
  return title ? `${taskId} · ${title}` : taskId;
}

function domainLabel(taskId: string): string {
  const domain = saaDomains.find((item) => item.id === `${taskId[0]}.0`);
  return domain ? `${domain.id} ${domain.title}` : taskId;
}

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
  /** Choice highlighted before Check answer. Keyboard keys still grade immediately. */
  pending: string;
  log: RoundEntry[];
  score: number;
  /** The item the round will return to after Back. */
  liveIndex: number;
  livePhase: "ask" | "feedback";
  /** Back is showing an earlier result and must not grade it again. */
  readonly: boolean;
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

function shownExplanation(item: Tagged, labels: string[] = []): string {
  const reasons = (item.choiceWhy ?? []).map((why, index) => {
    const label = labels[index] ?? item.choices?.[index];
    return label && why ? `${label}: ${why}` : why;
  }).filter((line) => line.length > 0);
  const rungs = item.rungWhy ?? [];
  const correction = item.answer === false && item.correction && !item.explanation.includes(item.correction) ? item.correction : "";
  return [item.explanation, correction, ...reasons, ...rungs].filter((line, index, all) => line.length > 0 && all.indexOf(line) === index).join(" ");
}

function choiceSteps(items: Tagged[], labels: string[]): Step[] {
  return items.map((item) => {
    const source = labels.length > 0 ? labels : item.choices ?? [];
    return withChoices({
      id: item.id,
      prompt: item.prompt,
      labels: source,
      correct: source[Number(item.answer)] ?? "",
      explanation: shownExplanation(item, source),
      cardId: item.cardId,
      taskId: item.taskId,
      docsUrl: item.docsUrl,
      questionIds: item.questionIds ?? [],
    });
  });
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
  return picked.map((card) => withChoices({
    id: `sorter-${card.id}`,
    prompt: card.front,
    labels: tasks.map((task) => taskChoiceLabel(task)),
    correct: taskChoiceLabel(card.taskId as string),
    explanation: `${domainLabel(card.taskId as string)}. ${card.back}`,
    cardId: card.id,
    taskId: card.taskId as string,
    docsUrl: card.docsUrl ?? "",
  }));
}

function lightningSteps(): Step[] {
  return (catalog.lightning as Tagged[]).map((item) => ({
    id: item.id,
    prompt: item.prompt,
    choices: seededOrder(2, item.id).map((index) => (index === 0 ? { key: "t", label: "True" } : { key: "f", label: "False" })),
    answerKey: item.answer === true ? "t" : "f",
    explanation: shownExplanation(item),
    cardId: item.cardId,
    taskId: item.taskId,
    docsUrl: item.docsUrl,
    questionIds: item.questionIds ?? [],
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

function cardForTask(taskId: string): string {
  return activeCards().find((card) => card.taskId === taskId)?.id ?? "";
}

function withChoices(step: Omit<Step, "choices" | "answerKey"> & { labels: string[]; correct: string }): Step {
  const { labels: source, correct, ...rest } = step;
  const order = seededOrder(source.length, step.id);
  const labels = order.map((index) => source[index]);
  return {
    ...rest,
    choices: labels.map((label, index) => ({ key: String(index + 1), label })),
    answerKey: String(order.indexOf(source.indexOf(correct)) + 1),
  };
}

function recallSteps(): Step[] {
  const cards = activeCards().slice().sort((a, b) => a.id.localeCompare(b.id));
  return cards.slice(0, 40).map((card) => {
    const distractors = cards.filter((other) => other.id !== card.id).slice(0, 3).map((other) => other.front);
    return withChoices({
      id: `recall-${card.id}`,
      prompt: card.back,
      labels: [card.front, ...distractors],
      correct: card.front,
      explanation: `${domainLabel(card.taskId as string)}. ${card.back}`,
      cardId: card.id,
      taskId: card.taskId as string,
      docsUrl: card.docsUrl ?? "",
    });
  });
}

function serviceFactSteps(): Step[] {
  const records = (serviceFacts.records as { id: string; name: string; definition: string; tasks: string[]; docsUrl: string; tier: string }[])
    .filter((record) => record.tier === "core" && record.tasks[0]);
  return records.slice(0, 40).map((record) => {
    const names = records.map((item) => item.name).filter((name) => name !== record.name);
    const distractors = seededOrder(names.length, record.id).slice(0, 3).map((index) => names[index]);
    const taskId = record.tasks[0];
    return withChoices({
      id: `fact-${record.id}`,
      prompt: record.definition,
      labels: [record.name, ...distractors],
      correct: record.name,
      explanation: `${domainLabel(taskId)}. ${record.definition}`,
      cardId: cardForTask(taskId),
      taskId,
      docsUrl: record.docsUrl,
    });
  });
}

function preferWeak(steps: Step[], weakDomain: SaaDomainId | null, seed: string): Step[] {
  const weak = weakDomain ? steps.filter((step) => saaDomainFromTask(step.taskId) === weakDomain) : [];
  const rest = steps.filter((step) => !weak.includes(step));
  return [
    ...seededOrder(weak.length, `${seed}-w`).map((index) => weak[index]),
    ...seededOrder(rest.length, `${seed}-r`).map((index) => rest[index]),
  ];
}

function interleave(groups: Step[][]): Step[] {
  const max = Math.max(0, ...groups.map((group) => group.length));
  const steps: Step[] = [];
  for (let index = 0; index < max; index += 1) {
    for (const group of groups) if (group[index]) steps.push(group[index]);
  }
  return steps;
}

function dailySteps(weakDomain: SaaDomainId | null, seed: string): Step[] {
  const families = [
    preferWeak(recallSteps(), weakDomain, `${seed}-recall`),
    preferWeak(choiceSteps(catalog.keywords as Tagged[], [...PRINCIPLES]).map((step) => ({ ...step, id: `keyword-${step.id}` })), weakDomain, `${seed}-keyword`),
    preferWeak(choiceSteps(catalog.odd as Tagged[], []).map((step) => ({ ...step, id: `odd-${step.id}` })), weakDomain, `${seed}-odd`),
    preferWeak(lightningSteps().map((step) => ({ ...step, id: `lightning-${step.id}` })), weakDomain, `${seed}-lightning`),
    preferWeak(serviceFactSteps(), weakDomain, `${seed}-fact`),
  ];
  return interleave(families).slice(0, 10);
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
    pending: "",
    log: [],
    score: 0,
    liveIndex: 0,
    livePhase: "ask",
    readonly: false,
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
  if (game === "ladder") {
    round.order = (catalog.ladders as Tagged[]).map((item) => [...(item.order ?? [])].reverse());
    round.steps = (catalog.ladders as Tagged[]).map((item) => ({
      id: item.id,
      prompt: item.prompt,
      choices: [],
      answerKey: "Enter",
      explanation: shownExplanation(item),
      cardId: item.cardId,
      taskId: item.taskId,
      docsUrl: item.docsUrl,
      questionIds: item.questionIds ?? [],
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

function choiceLabel(step: Step | undefined, key: string): string {
  return step?.choices.find((choice) => choice.key === key)?.label ?? key;
}

function remember(round: GameRound, entry: RoundEntry): GameRound {
  const log = [...round.log.filter((item) => item.id !== entry.id), entry];
  return { ...round, log, score: log.filter((item) => item.ok).length };
}

function advance(round: GameRound, correct: boolean, cardId: string, entry: RoundEntry): GameRound {
  const misses = !cardId || correct || round.misses.includes(cardId) ? round.misses : [...round.misses, cardId];
  const logged = remember(round, entry);
  return {
    ...logged,
    phase: "feedback",
    livePhase: "feedback",
    feedback: entry.explanation,
    misses,
    pending: "",
    readonly: false,
  };
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

function stepEntry(step: Step, yours: string, ok: boolean, correct = ""): RoundEntry {
  return {
    id: step.id,
    prompt: step.prompt,
    yours,
    correct: correct || choiceLabel(step, step.answerKey),
    explanation: step.explanation,
    docsUrl: step.docsUrl,
    ok,
    taskId: step.taskId,
    questionIds: step.questionIds ?? [],
  };
}

function forward(round: GameRound): GameRound {
  if (round.readonly) {
    const next = round.index + 1;
    const limit = round.game === "concentration" ? round.log.length : round.liveIndex;
    if (next < limit) {
      const entry = round.log[next];
      if (!entry) return round;
      return { ...round, index: next, phase: "feedback", readonly: true, feedback: entry.explanation };
    }
    const current = round.steps[round.liveIndex];
    const entry = round.log.find((item) => item.id === current?.id);
    return {
      ...round,
      readonly: false,
      index: round.liveIndex,
      phase: round.livePhase,
      feedback: round.livePhase === "feedback" ? (entry?.explanation ?? round.feedback) : "",
    };
  }
  if (round.phase !== "feedback") return round;
  if (round.game === "concentration") return { ...round, phase: "ask", livePhase: "ask", flipped: [], feedback: "" };
  const index = round.liveIndex + 1;
  if (index >= round.steps.length) return { ...round, phase: "done", index, liveIndex: index, livePhase: "ask", pending: "" };
  return { ...round, phase: "ask", livePhase: "ask", index, liveIndex: index, feedback: "", selected: 0, pending: "", readonly: false };
}

function concentrationTarget(round: GameRound): number | undefined {
  const open = round.tiles.map((tile, index) => ({ index, pairId: tile.pairId })).filter((tile) => !round.matched.includes(tile.index) && !round.flipped.includes(tile.index));
  const wanted = round.flipped.length === 1 ? round.tiles[round.flipped[0]]?.pairId : undefined;
  const first = wanted
    ? open.find((tile) => tile.pairId === wanted)
    : open.find((tile) => open.some((other) => other.pairId === tile.pairId && other.index !== tile.index));
  return first?.index;
}

export function applyKey(round: GameRound, key: string): GameRound {
  if (round.phase === "done") return round;
  if (round.readonly) return key === "Enter" ? forward(round) : round;
  if (round.phase === "feedback") return key === "Enter" ? forward(round) : round;
  if (round.game === "ladder") {
    const moved = moveSelection(round, key);
    if (moved) return moved;
    if (key !== "Enter") return round;
    const step = round.steps[round.index];
    if (!step) return round;
    const target = (catalog.ladders as Tagged[]).find((item) => item.id === step.id)?.order ?? [];
    const current = round.order[round.index] ?? [];
    const correct = current.join("\n") === target.join("\n");
    return advance(round, correct, step.cardId, stepEntry(step, current.join(" → "), correct, target.join(" → ")));
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
    const pair = twoSidedPairs().find((item) => item.id === round.tiles[first].pairId);
    const cardId = cardForPair(pair?.taskId ?? "", pair?.services ?? []) ?? "";
    const entry: RoundEntry = {
      id: pair?.id ?? `${first}-${second}`,
      prompt: `${round.tiles[first].label} / ${round.tiles[second].label}`,
      yours: `${round.tiles[first].label} + ${round.tiles[second].label}`,
      correct: pair?.sides.map((side) => side.label).join(" + ") ?? "",
      explanation: pair?.difference ?? (same ? "Those two match." : "Those two do not match."),
      docsUrl: pair?.docsUrl ?? "",
      ok: same,
      taskId: pair?.taskId ?? "",
      questionIds: [],
    };
    if (same) {
      const matched = [...round.matched, first, second];
      const logged = remember(round, entry);
      const done = matched.length === round.tiles.length;
      return { ...logged, flipped: [], matched, phase: done ? "done" : "ask", livePhase: "ask" };
    }
    return advance({ ...round, flipped }, false, cardId, entry);
  }
  const step = round.steps[round.index];
  if (!step) return round;
  const choice = step.choices.find((item) => item.key === key);
  if (!choice) return round;
  return advance(round, key === step.answerKey, step.cardId, stepEntry(step, choice.label, key === step.answerKey));
}

/** Highlight a choice. Check answer grades it; a number key still grades immediately. */
export function choose(round: GameRound, key: string): GameRound {
  if (round.phase !== "ask" || round.readonly) return round;
  if (round.game === "ladder" || round.game === "concentration") return round;
  const step = round.steps[round.index];
  if (!step?.choices.some((choice) => choice.key === key)) return round;
  return { ...round, pending: key };
}

/** Grade the highlighted choice, the ladder order, or the focused concentration tile. */
export function checkAnswer(round: GameRound): GameRound {
  if (round.phase !== "ask" || round.readonly) return round;
  if (round.game === "ladder" || round.game === "concentration") return applyKey(round, "Enter");
  if (!round.pending) return round;
  const key = round.pending;
  return applyKey({ ...round, pending: "" }, key);
}

/** Move to the next item, or walk forward through results opened with Back. */
export function pressNext(round: GameRound): GameRound {
  if (round.phase === "done") return round;
  if (round.readonly || round.phase === "feedback") return forward(round);
  return round;
}

/** Show the previous item's result without grading it again. */
export function pressBack(round: GameRound): GameRound {
  if (round.phase === "done" || round.log.length === 0) return round;
  const target = round.readonly
    ? round.index - 1
    : round.phase === "feedback"
      ? round.log.length - 2
      : round.log.length - 1;
  if (target < 0) return round;
  const entry = round.log[target];
  if (!entry) return round;
  return { ...round, index: target, phase: "feedback", readonly: true, feedback: entry.explanation };
}

export function missedQuestionIds(round: GameRound): string[] {
  return [...new Set(round.log.filter((entry) => !entry.ok).flatMap((entry) => entry.questionIds))];
}

/** A new round containing only the items missed in this one. */
export function retryMissed(round: GameRound): GameRound {
  const missed = new Set(round.misses);
  const next = blank(round.game, round.boardId);
  if (round.game === "concentration") {
    const pairs = twoSidedPairs();
    next.tiles = round.tiles.filter((tile) => {
      const pair = pairs.find((item) => item.id === tile.pairId);
      const cardId = cardForPair(pair?.taskId ?? "", pair?.services ?? []);
      return Boolean(cardId && missed.has(cardId));
    });
    next.columns = round.columns;
    if (next.tiles.length === 0) next.phase = "done";
    return next;
  }
  next.steps = round.steps.filter((step) => missed.has(step.cardId));
  next.order = round.order.filter((_, index) => missed.has(round.steps[index]?.cardId ?? ""));
  if (next.steps.length === 0) next.phase = "done";
  return next;
}

/** Finish by choosing, checking, and pressing Next. No keyboard events. */
export function finishWithButtons(round: GameRound): GameRound {
  let current = round;
  for (let guard = 0; guard < 800 && current.phase !== "done"; guard += 1) {
    if (current.readonly || current.phase === "feedback") {
      current = pressNext(current);
      continue;
    }
    if (current.game === "concentration") {
      const target = concentrationTarget(current);
      current = checkAnswer(target === undefined || target === current.focus ? current : { ...current, focus: target });
      continue;
    }
    if (current.game === "ladder") {
      const key = answerKey(current);
      current = key === "Enter" ? checkAnswer(current) : applyKey(current, key);
      continue;
    }
    const step = current.steps[current.index];
    current = checkAnswer(choose(current, step?.answerKey ?? ""));
  }
  return current;
}

export function answerKey(round: GameRound): string {
  if (round.readonly || round.phase === "feedback") return "Enter";
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
