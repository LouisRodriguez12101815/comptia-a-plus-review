import type { GamePhase, IncidentChoice, RoomPlayer } from "@/lib/game/types";

export type RoomAction = {
  playerId: string;
  stepIndex: number;
  answerId: string;
  correct: boolean;
  explanation: string;
  submittedAt: number;
};

export type SharedRoom = {
  code: string;
  version: number;
  status: "lobby" | "playing" | "results";
  phase: "lobby" | GamePhase;
  hostPlayerId: string;
  players: RoomPlayer[];
  incidentIndex: number;
  incidentId: string;
  stepIndex: number;
  startsAt: number | null;
  endsAt: number | null;
  roundSeconds: number;
  score: number;
  uptime: number;
  selectedActions: RoomAction[];
  result: "resolved" | "timeout" | "uptime" | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

export type RoomSnapshot = {
  room: SharedRoom;
  viewerId: string;
  serverNow: number;
  incident: { title: string; ticket: string; objective: string; debrief: string[] };
  step: {
    title: string;
    prompt: string;
    evidence?: string;
    choices: Pick<IncidentChoice, "id" | "label">[];
  } | null;
};

export type StoredRoom = Omit<SharedRoom, "players" | "selectedActions"> & {
  players: (RoomPlayer & { tokenHash: string; lastSeenAt: number })[];
  answerOrders: string[][];
  selectedActions: Omit<RoomAction, "explanation">[];
};

export interface RoomStore {
  assertActive(): Promise<void>;
  read(code: string): Promise<string | null>;
  create(code: string, value: string, ttlSeconds: number): Promise<boolean>;
  compareAndSwap(code: string, previous: string, next: string, ttlSeconds: number): Promise<boolean>;
}
