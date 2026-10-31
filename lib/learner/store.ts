import type { Progress } from "@/lib/progress";
import { parseProgress } from "@/lib/progress";

/** Twilio Sync Map items hold at most 16 KiB; progress is stored as string chunks. */
export const CHUNK = 12_000;
export const MAX_CHUNKS = 40;

export interface LearnerMap {
  list(): Promise<{ key: string; data: unknown }[]>;
  set(key: string, data: object): Promise<void>;
  remove(key: string): Promise<void>;
  removeAll(): Promise<void>;
}

export function splitChunks(raw: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < raw.length; i += CHUNK) out.push(raw.slice(i, i + CHUNK));
  return out.length ? out : [""];
}

export async function loadRemote(map: LearnerMap): Promise<Progress | null> {
  const items = await map.list();
  const chunks = items.filter((i) => /^progress-\d+$/.test(i.key)).sort((a, b) => Number(a.key.slice(9)) - Number(b.key.slice(9)));
  if (!chunks.length) return null;
  const raw = chunks.map((c) => String((c.data as { s?: string }).s ?? "")).join("");
  return parseProgress(raw).progress;
}

export async function saveRemote(map: LearnerMap, progress: Progress): Promise<void> {
  const chunks = splitChunks(JSON.stringify(progress));
  if (chunks.length > MAX_CHUNKS) throw new Error("too_large");
  const existing = (await map.list()).filter((i) => /^progress-\d+$/.test(i.key)).map((i) => i.key);
  for (let i = 0; i < chunks.length; i++) await map.set(`progress-${i}`, { s: chunks[i] });
  for (const key of existing) if (Number(key.slice(9)) >= chunks.length) await map.remove(key);
}
