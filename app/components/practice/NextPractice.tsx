"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("nextPractice");
  const raw = useSyncExternalStore(subscribeMission,getMissionSnapshot,getMissionServerSnapshot);
  const legacy = useSyncExternalStore(subscribeLegacy,legacySnapshot,getMissionServerSnapshot);
  const record = useMemo(() => restoreMission(raw,nextHopMission) ?? emptyMission(nextHopMission),[raw]);
  const summary = missionSummary(record,nextHopMission);
  const challenge = getChallenge("follow-packet")!;
  const old = restoreSession(legacy,challenge);
  const missed = old ? summarize(old,challenge).rows.filter((r) => relevant.has(r.round.id) && (r.misconceptions.length || r.hintUsed)) : [];
  return <section aria-label={t("aria")} className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-900 p-5">
    <h2 className="text-xl font-semibold">{t("heading")}</h2>
    <p className="font-semibold text-cyan-100">{t("topic")}</p>
    <p className="text-sm text-slate-300">{summary.recommendation?.mistakes.length ? t("suggestMistakes", { label: summary.recommendation.label }) : missed.length ? t("packetDifficulty", { titles: missed.map((r) => r.round.title).join(", ") }) : summary.achievements.length === 3 ? t("allApplications") : t("defaultRecommendation")}</p>
    <p className="text-xs text-slate-300">{t("meta")}</p>
    <Link href="/practice-games/next-hop-mission" className="inline-block rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{raw ? t("continueMission") : t("startMission")}</Link>
    <Link href="/notes/n10-ch9#mac-arp" className="ml-4 inline-block py-2 text-cyan-200 underline">{t("reviewNotes")}</Link>
  </section>;
}
