import type { Progress } from "@/lib/progress";
import { parseProgress } from "@/lib/progress";
import { isDeepStrictEqual } from "node:util";
import { mergeProgress } from "@/lib/learner/merge";
import { isStudyFocus } from "@/lib/exams";
import { CHUNK, MAX_CHUNKS, decodeSnapshot, makeSnapshot, progressHead, PROGRESS_HEAD, snapshotKeys } from "./progress-snapshot.mjs";
export { CHUNK, MAX_CHUNKS, splitChunks } from "./progress-snapshot.mjs";

const MAX_ATTEMPTS = 5;

function validLegacyFields(raw: string): boolean {
  const value = JSON.parse(raw) as Record<string, unknown>;
  if (value.studyFocus !== undefined && !isStudyFocus(value.studyFocus)) return false;
  if (value.schedules === undefined) return true;
  if (!value.schedules || typeof value.schedules !== "object" || Array.isArray(value.schedules)) return false;
  return Object.values(value.schedules).every((entry: unknown) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const s = entry as Record<string, unknown>;
    const date = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v));
    const nonnegative = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
    const count = (v: unknown) => nonnegative(v) && Number.isInteger(v);
    return date(s.due) && (s.last_review === undefined || date(s.last_review))
      && [s.stability, s.difficulty, s.elapsed_days, s.scheduled_days].every(nonnegative)
      && [s.reps, s.lapses].every(count) && (s.learning_steps === undefined || count(s.learning_steps))
      && Number.isInteger(s.state) && (s.state as number) >= 0 && (s.state as number) <= 3;
  });
}

export interface LearnerMap {
  list(): Promise<{ key: string; data: unknown }[]>;
  set(key: string, data: object): Promise<void>;
  remove(key: string): Promise<void>;
  removeAll(): Promise<void>;
}

export type RevisionedItem = { data: unknown; revision: string };

/** Atomic item creation / conditional replacement, implemented by Twilio Sync. */
export interface ProgressMap extends LearnerMap {
  get(key: string): Promise<RevisionedItem | null>;
  create(key: string, data: object): Promise<void>;
  replace(key: string, data: object, revision: string): Promise<boolean>;
}

async function readSnapshot(map: ProgressMap) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const item = await map.get(PROGRESS_HEAD);
    if (!item) {
      // Existing chunks remain read-only after migration. A concurrent first
      // publisher wins the head create; the losing writer re-reads that head.
      const items = await map.list();
      if (await map.get(PROGRESS_HEAD)) continue;
      const chunks = items.filter((i) => /^progress-\d+$/.test(i.key)).sort((a, b) => Number(a.key.slice(9)) - Number(b.key.slice(9)));
      if (!chunks.length) return { progress: null, item: null, head: null };
      if (chunks.length > MAX_CHUNKS || chunks.some((chunk, index) => {
        const data = chunk.data as { s?: unknown } | null;
        return chunk.key !== `progress-${index}` || !data || typeof data !== "object" || Array.isArray(data)
          || typeof data.s !== "string" || !data.s.length || data.s.length > CHUNK;
      })) throw new Error("invalid_legacy_progress");
      const raw = chunks.map((chunk) => (chunk.data as { s: string }).s).join("");
      const parsed = parseProgress(raw);
      // Never turn unreadable/repaired legacy data into the first authoritative
      // manifest. Leave every original byte intact for explicit recovery.
      if (parsed.problems.length || !validLegacyFields(raw)) throw new Error("invalid_legacy_progress");
      return { progress: parsed.progress, item: null, head: null };
    }
    const head = progressHead(item.data);
    const chunks = await Promise.all(snapshotKeys(head).map((key) => map.get(key)));
    let raw;
    try {
      raw = decodeSnapshot(head, chunks.map((chunk) => chunk?.data));
    } catch (error) {
      // A publisher may retire the old generation while a reader fetches it.
      // Retry only if the head actually advanced; a damaged current head fails closed.
      if ((await map.get(PROGRESS_HEAD))?.revision !== item.revision) continue;
      throw error;
    }
    const parsed = parseProgress(raw);
    if (parsed.problems.includes("unreadable")) throw new Error("invalid_progress_snapshot");
    return { progress: parsed.progress, item, head };
  }
  throw new Error("progress_conflict");
}

export async function loadRemote(map: ProgressMap): Promise<Progress | null> {
  return (await readSnapshot(map)).progress;
}

async function discard(map: ProgressMap, keys: string[]) {
  // Cleanup is not part of the commit. Failed cleanup can leave unreferenced
  // chunks, but must never turn a successful commit into an apparent failure.
  await Promise.allSettled(keys.map((key) => map.remove(key)));
}

/** Merge and commit as one retryable operation; never publish a partially written generation. */
export async function saveRemote(map: ProgressMap, local: Progress): Promise<Progress> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const previous = await readSnapshot(map);
    const merged = previous.progress ? mergeProgress(local, previous.progress) : local;
    const raw = JSON.stringify(merged);
    if (previous.head && isDeepStrictEqual(merged, previous.progress)) return merged;
    const { head, chunks } = makeSnapshot(raw);
    const keys = snapshotKeys(head), written: string[] = [];
    try {
      for (let i = 0; i < keys.length; i++) {
        await map.create(keys[i], { s: chunks[i] });
        written.push(keys[i]);
      }
    } catch (error) {
      await discard(map, written);
      throw error;
    }
    let committed;
    if (previous.item) {
      // On an ambiguous provider error the head may already reference this
      // generation: leave its chunks intact and let a later request reconcile.
      committed = await map.replace(PROGRESS_HEAD, head, previous.item.revision);
    } else {
      try { await map.create(PROGRESS_HEAD, head); committed = true; }
      catch (error) {
        if ((error as { status?: number })?.status !== 409) throw error;
        committed = false;
      }
    }
    if (!committed) { await discard(map, written); continue; }
    if (previous.head) await discard(map, snapshotKeys(previous.head));
    return merged;
  }
  throw new Error("progress_conflict");
}
