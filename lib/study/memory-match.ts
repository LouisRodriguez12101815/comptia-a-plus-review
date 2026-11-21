import { SAA_TASK_IDS, saaDomainFromTask, type SaaDomainId } from "@/lib/saa-tags";
import { serviceFacts, type FactTier, type ServiceFact } from "@/lib/study/service-facts";

export const MATCH_MISS_CAP = 200;
export const OUT_OF_SCOPE_NOTE = "newer than the SAA-C03 exam guide; not tested";

export type MatchField = "definition" | "acronym" | "class" | "cost";

export type MemoryMatchPair = {
  id: string;
  left: string;
  right: string;
  field: MatchField;
  task: string;
  domain: SaaDomainId;
  tier: FactTier;
  docsUrl: string;
};

export type MatchSelection = {
  domain: "" | SaaDomainId;
  task: string;
  tier: "core" | "all";
  field: "" | MatchField;
};

export type MemoryMiss = {
  id: string;
  at: number;
  task: string;
  prompt: string;
  times: number;
};

const TASKS = new Set<string>(SAA_TASK_IDS);

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cardKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function domainFor(task: string): SaaDomainId | undefined {
  if (!TASKS.has(task)) return undefined;
  return saaDomainFromTask(task);
}

function addPair(pairs: MemoryMatchPair[], pair: Omit<MemoryMatchPair, "domain"> & { task: string }) {
  const domain = domainFor(pair.task);
  if (!domain) return;
  pairs.push({ ...pair, domain });
}

function costRight(fact: ServiceFact): string {
  const dimension = fact.cost?.dimension || "n/a";
  if (fact.cost?.anchor) return `${fact.cost.anchor.amount} · ${dimension}`;
  return `${fact.cost?.band ?? "n/a"} · ${dimension}`;
}

/** Pairs the memory match can deal. Out-of-scope classes stay out unless asked for. */
export function memoryMatchPairs(facts: ServiceFact[] = serviceFacts, options: { includeOutOfScope?: boolean } = {}): MemoryMatchPair[] {
  const pairs: MemoryMatchPair[] = [];
  for (const fact of facts) {
    addPair(pairs, {
      id: `${fact.id}-definition`,
      left: fact.name,
      right: fact.definition,
      field: "definition",
      task: fact.tasks[0],
      tier: fact.tier,
      docsUrl: fact.docsUrl,
    });
    if (fact.acronym && fact.expansion) {
      addPair(pairs, {
        id: `${fact.id}-acronym`,
        left: fact.acronym,
        right: fact.expansion,
        field: "acronym",
        task: fact.tasks[0],
        tier: fact.tier,
        docsUrl: fact.docsUrl,
      });
    }
    for (const entry of fact.classes ?? []) {
      if (!options.includeOutOfScope && entry.inScope === false) continue;
      addPair(pairs, {
        id: `${fact.id}-class-${slug(entry.name)}`,
        left: entry.name,
        right: entry.purpose,
        field: "class",
        task: entry.task,
        tier: fact.tier,
        docsUrl: entry.docsUrl,
      });
    }
    if (fact.cost) {
      addPair(pairs, {
        id: fact.cost.anchor ? `${fact.id}-cost-anchor` : `${fact.id}-cost-band`,
        left: fact.name,
        right: costRight(fact),
        field: "cost",
        task: fact.tasks[0],
        tier: fact.tier,
        docsUrl: fact.cost.docsUrl,
      });
    }
  }
  return pairs;
}

export function filterMatchPairs(pairs: MemoryMatchPair[], selection: MatchSelection): MemoryMatchPair[] {
  return pairs.filter((pair) => {
    if (selection.tier === "core" && pair.tier !== "core") return false;
    if (selection.domain && pair.domain !== selection.domain) return false;
    if (selection.task && pair.task !== selection.task) return false;
    if (selection.field && pair.field !== selection.field) return false;
    return true;
  });
}

/** 6, 7, or 8 when the pool can fill a round. Smaller pools use every remaining pair. */
export function matchRoundSize(count: number, seed = 0): number {
  if (count <= 0) return 0;
  if (count < 6) return count;
  const span = Math.min(8, count) - 6;
  const bump = span === 0 ? 0 : Math.abs(seed) % (span + 1);
  return 6 + bump;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  const random = mulberry32(seed || 1);
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

/**
 * One round of unique pairs. A left label or a right label is not repeated,
 * so two cards never share an answer. Collisions wait for a later round.
 */
export function takeMatchRound(pool: MemoryMatchPair[], seed: number): { round: MemoryMatchPair[]; rest: MemoryMatchPair[] } {
  const size = matchRoundSize(pool.length, seed);
  const round: MemoryMatchPair[] = [];
  const rest: MemoryMatchPair[] = [];
  const seen = new Set<string>();
  const lefts = new Set<string>();
  const rights = new Set<string>();
  for (const pair of seededShuffle(pool, seed)) {
    const id = pair.id;
    const left = cardKey(pair.left);
    const right = cardKey(pair.right);
    if (seen.has(id) || round.length >= size || lefts.has(left) || rights.has(right)) {
      rest.push(pair);
      continue;
    }
    seen.add(id);
    lefts.add(left);
    rights.add(right);
    round.push(pair);
  }
  return { round, rest };
}

export function rememberMatchMiss(existing: MemoryMiss[] = [], miss: { id: string; task: string; prompt: string }, at: number): MemoryMiss[] {
  const previous = existing.find((item) => item.id === miss.id);
  const next = previous
    ? existing.map((item) => item.id === miss.id ? { ...item, ...miss, at, times: item.times + 1 } : item)
    : [{ ...miss, at, times: 1 }, ...existing];
  return next.sort((a, b) => b.at - a.at || a.id.localeCompare(b.id)).slice(0, MATCH_MISS_CAP);
}

/** Local misses stay ahead of remote-only misses. A shared id keeps the higher count and the later time. */
export function mergeMatchMisses(local: MemoryMiss[] = [], remote: MemoryMiss[] = []): MemoryMiss[] {
  const byId = new Map<string, MemoryMiss>();
  for (const miss of [...local, ...remote]) {
    const previous = byId.get(miss.id);
    if (!previous) {
      byId.set(miss.id, miss);
      continue;
    }
    byId.set(miss.id, {
      id: miss.id,
      task: previous.task || miss.task,
      prompt: previous.prompt || miss.prompt,
      times: Math.max(previous.times, miss.times),
      at: Math.max(previous.at, miss.at),
    });
  }
  const localIds = local.map((miss) => miss.id);
  const remoteIds = remote.map((miss) => miss.id);
  const order = [...localIds, ...remoteIds.filter((id) => !localIds.includes(id))];
  return order.map((id) => byId.get(id)!).slice(0, MATCH_MISS_CAP);
}

/** One sitting per miss, repeated `times` so the mistake log counts each miss. */
export function sittingsFromMemoryMisses(misses: MemoryMiss[] | undefined = []) {
  return misses.flatMap((miss) => {
    const count = Math.max(1, miss.times);
    return Array.from({ length: count }, (_, index) => ({
      exam: "saa-c03" as const,
      at: miss.at - (count - 1 - index),
      topicId: "saa-game:match",
      questionIds: [miss.id],
      missedIds: [miss.id],
      objectiveByQuestion: { [miss.id]: miss.task },
      mode: "drill" as const,
    }));
  });
}

export function questionsFromMemoryMisses(misses: MemoryMiss[] | undefined = []) {
  return misses.map((miss) => ({
    id: miss.id,
    prompt: miss.prompt,
    objectiveIds: { "saa-c03": [miss.task] },
  }));
}
