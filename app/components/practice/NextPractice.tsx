"use client";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { nextHopMission } from "@/lib/practice/mission-catalog";
import { emptyMission, missionSummary, restoreMission } from "@/lib/practice/mission";
import { getMissionSnapshot, getMissionServerSnapshot, subscribeMission } from "@/lib/practice/mission-store";
import { getChallenge } from "@/lib/practice/catalog";
import { restoreSession, summarize } from "@/lib/practice/session";
const relevant = new Set(["local-subnet", "local-arp", "local-frame", "route-subnet", "route-arp-gateway", "route-first-frame"]);
const legacyKey = "practice-game:follow-packet:v1";
function legacySnapshot() { try { return localStorage.getItem(legacyKey); } catch { return null; } }
function subscribeLegacy(listener: () => void) { const onStorage = () => listener(); window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage); }
export function NextPractice() {
  const raw = useSyncExternalStore(subscribeMission,getMissionSnapshot,getMissionServerSnapshot);
  const legacy = useSyncExternalStore(subscribeLegacy,legacySnapshot,getMissionServerSnapshot);
  const record = useMemo(() => restoreMission(raw,nextHopMission) ?? emptyMission(nextHopMission),[raw]);
  const summary = missionSummary(record,nextHopMission);
  const challenge = getChallenge("follow-packet")!;
  const old = restoreSession(legacy,challenge);
  const missed = old ? summarize(old,challenge).rows.filter((r) => relevant.has(r.round.id) && (r.misconceptions.length || r.hintUsed)) : [];
  return <section aria-label="Next practice recommendation" className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
    <h2 className="text-xl font-semibold">What should I practice next?</h2>
    <p className="font-semibold text-cyan-100">Topic mission: Next-hop troubleshooting</p>
    <p className="text-sm text-slate-300">{summary.recommendation?.mistakes.length ? `Your mission mistakes or hints suggest: ${summary.recommendation.label}.` : missed.length ? `Packet practice recorded difficulty with ${missed.map((r) => r.round.title).join(", ")}. Review the next-hop notes, then test the principle in a new fault scenario.` : summary.achievements.length === 3 ? "All three independent applications are recorded. Try the lab to check the principle outside these questions." : "Practice a diagnostic test, interpret the next hop, and verify a repair. Completion and independent application are tracked separately."}</p>
    <p className="text-xs text-slate-300">Network+ N10-009 · Routing/addressing/troubleshooting · Solo · 3 objectives. First focused mission; recommendations cover this topic only.</p>
    <Link href="/practice-games/next-hop-mission" className="inline-block rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{raw ? "Continue next-hop mission" : "Start next-hop mission"}</Link>
    <Link href="/notes/n10-ch9#mac-arp" className="ml-4 inline-block py-2 text-cyan-200 underline">Review next-hop notes</Link>
  </section>;
}
