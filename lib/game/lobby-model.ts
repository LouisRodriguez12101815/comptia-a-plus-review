import { CONNECTION_WINDOW } from "@/lib/game/evidence-model";

type Member = { id: string; nickname: string; ready: boolean; lastSeenAt: number };

/** One server-time projection for both rendered start controls and start validation. */
export function lobbyStartModel(players: Member[], hostId: string, now: number) {
  const connected = players.filter((p) => now - p.lastSeenAt < CONNECTION_WINDOW);
  const excluded = players.filter((p) => now - p.lastSeenAt >= CONNECTION_WINDOW);
  const unready = connected.filter((p) => !p.ready);
  const ready = connected.some((p) => p.id === hostId) && unready.length === 0;
  return {
    canStart: ready && excluded.length === 0,
    canContinue: ready && excluded.length > 0,
    excluded: excluded.map((p) => ({ id: p.id, nickname: p.nickname })),
    unready: unready.map((p) => ({ id: p.id, nickname: p.nickname })),
    absenceSeconds: CONNECTION_WINDOW / 1000,
  };
}
