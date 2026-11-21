import type { Question } from "@/lib/types";
import { drillDecks } from "@/lib/practice/drills";
import { MISS_REASONS, rotatePracticeIds, type MissReason } from "@/lib/saa-test-skills";

/** Seven days. Mastered-this-week uses the timestamp of the second Sure day. */
export const MISTAKE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type MistakeStatus = "misconception" | "active" | "mastered";
export type MistakeKind = "misconception" | "wrong" | "lucky";
export type MistakeConfidence = "sure" | "unsure" | "guess" | "";

/**
 * One row per question that was ever missed or lucky-guessed.
 * Plain data so a later sync map can store the same object.
 */
export type MistakeRow = {
  id: string;
  prompt: string;
  task: string;
  domain: string;
  timesMissed: number;
  correctSinceLastMiss: number;
  lastResult: "correct" | "miss";
  lastConfidence: MistakeConfidence;
  missReason: MissReason | null;
  lastSeen: number;
  status: MistakeStatus;
  kind: MistakeKind;
  masteredAt: number | null;
};

export type MistakeSummary = {
  active: number;
  misconceptions: number;
  masteredThisWeek: number;
  weakestTasks: { task: string; count: number }[];
};

export type MistakeFilter = {
  domain?: string;
  task?: string;
  status?: MistakeStatus | "";
  reason?: MissReason | "";
};

type MistakeQuestion = Pick<Question, "id" | "prompt" | "objectiveIds">;

type Sitting = {
  exam?: string;
  at?: number;
  topicId?: string;
  questionIds?: string[];
  missedIds?: string[];
  luckyIds?: string[];
  sureIds?: string[];
  unsureIds?: string[];
  guessedIds?: string[];
  confidenceByQuestion?: Record<string, string>;
  missReasons?: Record<string, string>;
  objectiveByQuestion?: Record<string, string>;
  mode?: string;
};

type Draft = {
  timesMissed: number;
  correctSinceLastMiss: number;
  lastResult: "correct" | "miss";
  lastConfidence: MistakeConfidence;
  lastSeen: number;
  status: MistakeStatus;
  kind: MistakeKind;
  masteredAt: number | null;
  hadSureWrong: boolean;
  sureDays: string[];
  task: string;
  reasons: Map<MissReason, number>;
};

const STATUS_ORDER: Record<MistakeStatus, number> = { misconception: 0, active: 1, mastered: 2 };
const KIND_ORDER: Record<MistakeKind, number> = { misconception: 0, wrong: 1, lucky: 2 };

function utcDay(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}

function daysApart(earlier: string, later: string): number {
  const start = Date.parse(`${earlier}T00:00:00Z`);
  const end = Date.parse(`${later}T00:00:00Z`);
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

export function shortPrompt(prompt: string, limit = 96): string {
  const text = prompt.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function confidenceFor(attempt: Sitting, id: string): MistakeConfidence {
  const direct = attempt.confidenceByQuestion?.[id];
  if (direct === "sure" || direct === "unsure" || direct === "guess") return direct;
  if (attempt.sureIds?.includes(id)) return "sure";
  if (attempt.unsureIds?.includes(id)) return "unsure";
  if (attempt.guessedIds?.includes(id)) return "guess";
  return "";
}

function taskFor(question: MistakeQuestion | undefined, attempt: Sitting, id: string): string {
  const tagged = question?.objectiveIds?.["saa-c03"]?.[0];
  if (tagged && /^\d\.\d$/.test(tagged)) return tagged;
  const recorded = attempt.objectiveByQuestion?.[id];
  return recorded && /^\d\.\d$/.test(recorded) ? recorded : "";
}

function domainFor(task: string): string {
  return /^\d\.\d$/.test(task) ? `${task[0]}.0` : "";
}

function blankDraft(at: number): Draft {
  return {
    timesMissed: 0,
    correctSinceLastMiss: 0,
    lastResult: "miss",
    lastConfidence: "",
    lastSeen: at,
    status: "active",
    kind: "wrong",
    masteredAt: null,
    hadSureWrong: false,
    sureDays: [],
    task: "",
    reasons: new Map(),
  };
}

function touch(draft: Draft, at: number, confidence: MistakeConfidence, result: "correct" | "miss") {
  draft.lastSeen = at;
  draft.lastConfidence = confidence;
  draft.lastResult = result;
}

function noteReason(draft: Draft, attempt: Sitting, id: string) {
  const reason = attempt.missReasons?.[id];
  if (!reason || !MISS_REASONS.includes(reason as MissReason)) return;
  const key = reason as MissReason;
  draft.reasons.set(key, (draft.reasons.get(key) ?? 0) + 1);
}

function commonReason(reasons: Map<MissReason, number>): MissReason | null {
  let best: MissReason | null = null;
  let bestCount = 0;
  for (const reason of MISS_REASONS) {
    const count = reasons.get(reason) ?? 0;
    if (count > bestCount) {
      best = reason;
      bestCount = count;
    }
  }
  return best;
}

function reopen(draft: Draft, sureWrong: boolean) {
  if (sureWrong) draft.hadSureWrong = true;
  draft.status = draft.hadSureWrong ? "misconception" : "active";
  draft.kind = draft.hadSureWrong ? "misconception" : "wrong";
  draft.masteredAt = null;
  draft.sureDays = [];
  draft.timesMissed += 1;
  draft.correctSinceLastMiss = 0;
}

function recordMiss(draft: Draft, at: number, confidence: MistakeConfidence) {
  reopen(draft, confidence === "sure");
  touch(draft, at, confidence, "miss");
}

function recordLucky(draft: Draft, at: number, confidence: MistakeConfidence) {
  draft.correctSinceLastMiss += 1;
  touch(draft, at, confidence, "correct");
  if (draft.status === "mastered") return;
  if (!draft.hadSureWrong && draft.timesMissed === 0) {
    draft.status = "active";
    draft.kind = "lucky";
  }
}

function recordSureProgress(draft: Draft, at: number, confidence: MistakeConfidence) {
  draft.correctSinceLastMiss += 1;
  touch(draft, at, confidence, "correct");
  if (confidence !== "sure" || draft.status === "mastered") return;
  const day = utcDay(at);
  if (!draft.sureDays.includes(day)) draft.sureDays.push(day);
  if (draft.sureDays.length < 2) return;
  const first = draft.sureDays[0];
  const last = draft.sureDays[draft.sureDays.length - 1];
  if (daysApart(first, last) < 1) return;
  draft.status = "mastered";
  draft.masteredAt = at;
  draft.sureDays = [];
}

function compareRows(a: MistakeRow, b: MistakeRow): number {
  return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    || b.timesMissed - a.timesMissed
    || a.id.localeCompare(b.id);
}

/**
 * Every SAA sitting, oldest first. A later Sure-correct stays on the row.
 * Mastered means two Sure-correct days at least one UTC day apart, after the last miss.
 * A later miss reopens the row. A sure-but-wrong, including one from before mastery, reopens as Misconception.
 */
export function saaMistakeLog(attempts: Sitting[], questions: MistakeQuestion[] = []): MistakeRow[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const drafts = new Map<string, Draft>();
  const ordered = attempts
    .map((attempt, index) => ({ attempt, index }))
    .sort((a, b) => (a.attempt.at ?? 0) - (b.attempt.at ?? 0) || a.index - b.index);

  for (const { attempt } of ordered) {
    if (attempt.exam !== "saa-c03") continue;
    if (attempt.topicId?.startsWith("exam-test:")) continue;
    const at = attempt.at ?? 0;
    const missed = new Set(attempt.missedIds ?? []);
    const lucky = new Set(attempt.luckyIds ?? []);
    const ids = [...new Set([...(attempt.questionIds ?? []), ...missed, ...lucky])];
    for (const id of ids) {
      const draft = drafts.get(id) ?? blankDraft(at);
      const question = byId.get(id);
      const task = taskFor(question, attempt, id);
      if (task) draft.task = task;
      const confidence = confidenceFor(attempt, id);
      const opened = drafts.has(id);
      if (missed.has(id)) {
        if (!opened) drafts.set(id, draft);
        noteReason(draft, attempt, id);
        recordMiss(draft, at, confidence);
        continue;
      }
      const guessed = lucky.has(id) || confidence === "unsure" || confidence === "guess";
      if (!opened && !guessed) continue;
      if (!opened) drafts.set(id, draft);
      if (guessed) recordLucky(draft, at, confidence);
      else recordSureProgress(draft, at, confidence);
    }
  }

  return [...drafts.entries()].map(([id, draft]) => {
    const question = byId.get(id);
    const task = draft.task;
    return {
      id,
      prompt: shortPrompt(question?.prompt || id),
      task,
      domain: domainFor(task),
      timesMissed: draft.timesMissed,
      correctSinceLastMiss: draft.correctSinceLastMiss,
      lastResult: draft.lastResult,
      lastConfidence: draft.lastConfidence,
      missReason: commonReason(draft.reasons),
      lastSeen: draft.lastSeen,
      status: draft.status,
      kind: draft.kind,
      masteredAt: draft.masteredAt,
    };
  }).sort(compareRows);
}

export function filterMistakeRows(rows: MistakeRow[], filter: MistakeFilter = {}): MistakeRow[] {
  return rows.filter((row) => {
    if (filter.domain && row.domain !== filter.domain) return false;
    if (filter.task && row.task !== filter.task) return false;
    if (filter.status && row.status !== filter.status) return false;
    if (filter.reason && row.missReason !== filter.reason) return false;
    return true;
  });
}

export function mistakeSummary(rows: MistakeRow[], now = Date.now()): MistakeSummary {
  const counts = new Map<string, number>();
  let active = 0;
  let misconceptions = 0;
  let masteredThisWeek = 0;
  for (const row of rows) {
    if (row.status === "active") active += 1;
    if (row.status === "misconception") misconceptions += 1;
    if (row.status === "mastered" && row.masteredAt !== null && now >= row.masteredAt && now - row.masteredAt <= MISTAKE_WEEK_MS) {
      masteredThisWeek += 1;
    }
    if (row.status !== "mastered" && row.task) counts.set(row.task, (counts.get(row.task) ?? 0) + 1);
  }
  const weakestTasks = [...counts.entries()]
    .map(([task, count]) => ({ task, count }))
    .sort((a, b) => b.count - a.count || a.task.localeCompare(b.task))
    .slice(0, 3);
  return { active, misconceptions, masteredThisWeek, weakestTasks };
}

/** Filtered rows that are still open. Misconceptions stay first. The rest follow shared-history rotation. */
export function mistakeRetestIds(rows: MistakeRow[], history: string[] = [], rng: () => number = Math.random): string[] {
  const open = rows.filter((row) => row.status !== "mastered");
  const lead = open.filter((row) => row.status === "misconception").map((row) => row.id);
  const rest = rotatePracticeIds(
    open.filter((row) => row.status === "active").map((row) => row.id),
    { history, rng },
  );
  return [...lead, ...rest];
}

export function mistakeCardHref(taskIds: string[]): string {
  const tasks = [...new Set(taskIds.filter((task) => /^\d\.\d$/.test(task)))].sort();
  if (tasks.length === 1) return `/flashcards?exam=saa-c03&task=${tasks[0]}&topic=due`;
  return "/flashcards?exam=saa-c03&topic=due";
}

export function mistakeDrillLinks(taskIds: string[]): { id: string; href: string; tasks: string[] }[] {
  const wanted = new Set(taskIds.filter((task) => /^\d\.\d$/.test(task)));
  const links: { id: string; href: string; tasks: string[] }[] = [];
  for (const deck of drillDecks) {
    if (deck.exam !== "saa-c03" || (!deck.id.startsWith("aws-saa-") && !deck.id.startsWith("hy-"))) continue;
    const tasks = [...new Set(deck.items.map((item) => item.objective).filter((task): task is string => Boolean(task && wanted.has(task))))].sort();
    if (tasks.length === 0) continue;
    links.push({ id: deck.id, href: `/practice-games/drills/${deck.id}`, tasks });
  }
  return links;
}
