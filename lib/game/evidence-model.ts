export type EvidenceItem = { id: string; label: string; text: string };
export const CONNECTION_WINDOW = 30_000;
type Member = { id: string; nickname: string; seat: number; lastSeenAt: number };

/** One projection for stored assignments, rendered cards, counts and the answer gate. */
export function evidenceModel(catalog: EvidenceItem[], players: Member[], assignments: unknown, discoveries: unknown, now: number) {
  const items = catalog.filter((i) => i.id?.trim() && i.label?.trim() && i.text?.trim());
  const valid = new Set(items.map((i) => i.id));
  const rows = Array.isArray(assignments) ? assignments : [];
  const normalized = players.map((p) => ({ playerId: p.id, itemIds: [...new Set<string>(rows
    .filter((a) => a?.playerId === p.id).flatMap((a) => Array.isArray(a.itemIds) ? a.itemIds : [])
    .filter((id) => typeof id === "string" && valid.has(id)))] }));
  const discoveredIds = [...new Set<string>((Array.isArray(discoveries) ? discoveries : []).filter((id) => typeof id === "string" && valid.has(id)))];
  const found = new Set(discoveredIds);
  const forPlayer = (id: string) => items.filter((i) => normalized.find((a) => a.playerId === id)?.itemIds.includes(i.id));
  const complete = (id: string) => forPlayer(id).every((i) => found.has(i.id));
  const coverage = items.map((item) => {
    const owners = players.filter((p) => normalized.find((a) => a.playerId === p.id)?.itemIds.includes(item.id))
      .map((p) => ({ playerId: p.id, nickname: p.nickname, connected: now - p.lastSeenAt < CONNECTION_WINDOW, discovered: found.has(item.id) }));
    return { id: item.id, label: item.label, required: owners.some((o) => o.connected), discovered: found.has(item.id), owners };
  });
  return { assignments: normalized, discoveredIds, forPlayer, complete, coverage };
}

/** Freeze this deterministic distribution in shared state when a question opens. */
export function assignEvidence(items: EvidenceItem[], players: Member[]) {
  const ordered = [...players].sort((a, b) => a.seat - b.seat || a.id.localeCompare(b.id));
  return ordered.map((p, index) => {
    const itemIds = items.filter((_, i) => i % ordered.length === index).map((i) => i.id);
    return { playerId: p.id, itemIds: itemIds.length || !items.length ? itemIds : [items[index % items.length].id] };
  });
}
