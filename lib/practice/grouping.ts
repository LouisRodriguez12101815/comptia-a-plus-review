/*
 * Layout helpers for the Practice Games page: which certification to open on,
 * how memory drills group under the exam's domains, and which drills to
 * suggest from weak objectives. Pure functions, no browser state.
 */
import type { DrillDeck } from "@/lib/practice/drills";
import type { StudyFocus } from "@/lib/types";

/** The certification filter value that matches a saved study focus, or "all". */
export function certificationForFocus(focus: StudyFocus): string {
  switch (focus) {
    case "220-1201": return "A+ Core 1";
    case "220-1202": return "A+ Core 2";
    case "n10-009": return "Network+";
    case "clf-c02": return "AWS Cloud Practitioner";
    case "saa-c03": return "AWS Solutions Architect – Associate";
    default: return "all";
  }
}

/**
 * Objective ids from a deck's objective text: "1.1, 1.2" or "3.1–3.8" or
 * "1.1–1.3, 5.4". A range stays inside one domain.
 */
export function parseObjectiveIds(text: string): string[] {
  const ids: string[] = [];
  for (const part of text.split(",").map((p) => p.trim()).filter(Boolean)) {
    const range = /^(\d+)\.(\d+)\s*[–-]\s*(?:(\d+)\.)?(\d+)$/.exec(part);
    if (range && (range[3] === undefined || range[3] === range[1])) {
      for (let n = Number(range[2]); n <= Number(range[4]); n += 1) ids.push(`${range[1]}.${n}`);
    } else if (/^\d+\.\d+$/.test(part)) {
      ids.push(part);
    }
  }
  return ids;
}

export type DrillGroup = { id: string; title: string; order: number; decks: DrillDeck[] };
export type DomainTitles = (exam: string, domainNumber: string) => string | undefined;

/** Drills per exam domain; a deck that spans domains goes in "mixed". */
export function groupDrills(decks: DrillDeck[], domainTitle: DomainTitles, labels: { mixed: string; other: string }, withCertification: boolean): DrillGroup[] {
  const groups = new Map<string, DrillGroup>();
  const preferred = ["A+ Core 1", "A+ Core 2", "Network+"];
  const certificationOrder = [...preferred, ...new Set(decks.map((d) => d.certification))].filter((c, i, all) => all.indexOf(c) === i);
  for (const deck of decks) {
    const majors = [...new Set(parseObjectiveIds(deck.objective).map((id) => id.split(".")[0]))];
    const major = majors.length === 1 ? majors[0] : undefined;
    const title = majors.length > 1 ? labels.mixed : major ? domainTitle(deck.exam, major) ?? labels.other : labels.other;
    const order = majors.length > 1 ? 90 : major && domainTitle(deck.exam, major) ? Number(major) : 99;
    const id = `${deck.certification}|${majors.length > 1 ? "mixed" : major ?? "other"}`;
    const group = groups.get(id) ?? { id, title: withCertification ? `${deck.certification} · ${title}` : title, order: certificationOrder.indexOf(deck.certification) * 100 + order, decks: [] };
    group.decks.push(deck);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => a.order - b.order);
}

/** Up to `limit` drills that cover the weak objectives, best match first. */
export function recommendDrills(decks: DrillDeck[], weakObjectiveIds: string[], limit = 3): { deck: DrillDeck; objectiveIds: string[] }[] {
  const weak = new Set(weakObjectiveIds);
  return decks
    .map((deck, position) => {
      const ids = parseObjectiveIds(deck.objective);
      return { deck, position, objectiveIds: ids.filter((id) => weak.has(id)), span: ids.length };
    })
    .filter((entry) => entry.objectiveIds.length > 0)
    // Most weak objectives covered first, then the narrower (more focused) deck.
    .sort((a, b) => b.objectiveIds.length - a.objectiveIds.length || a.span - b.span || a.position - b.position)
    .slice(0, limit)
    .map(({ deck, objectiveIds }) => ({ deck, objectiveIds }));
}
