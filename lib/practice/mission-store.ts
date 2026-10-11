"use client";
import { emptyMission, restoreMission, type MissionRecord } from "@/lib/practice/mission";
import { nextHopMission } from "@/lib/practice/mission-catalog";
export const missionStorageKey = `practice-mission:${nextHopMission.id}:v${nextHopMission.version}`;
const listeners = new Set<() => void>();
let fallback: string | null = null;
let unavailable = false;
const emit = () => listeners.forEach((listener) => listener());
export function getMissionSnapshot() {
  if (unavailable) return fallback;
  try { return localStorage.getItem(missionStorageKey); } catch { unavailable = true; return fallback; }
}
export const getMissionServerSnapshot = () => null;
export function subscribeMission(listener: () => void) {
  listeners.add(listener);
  const changed = (event: StorageEvent) => { if (event.key === missionStorageKey || event.key === null) { unavailable = false; fallback = null; emit(); } };
  window.addEventListener("storage", changed);
  return () => { listeners.delete(listener); window.removeEventListener("storage", changed); };
}
export function updateMission(update: (record: MissionRecord) => MissionRecord) {
  const current = restoreMission(getMissionSnapshot(), nextHopMission) ?? emptyMission(nextHopMission);
  const next = update(current);
  if (next === current) return;
  fallback = JSON.stringify(next);
  try { localStorage.setItem(missionStorageKey, fallback); unavailable = false; } catch { unavailable = true; }
  emit();
}
export function resetMission() {
  fallback = null;
  try { localStorage.removeItem(missionStorageKey); unavailable = false; } catch { unavailable = true; }
  emit();
}
export const missionStorageUnavailable = () => unavailable;
