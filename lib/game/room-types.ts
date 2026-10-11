import type { GamePhase, IncidentChoice, RoomPlayer } from "@/lib/game/types";
import type { Contributions, RoleId } from "@/lib/game/cooperative";

export type CooperativePlayer = RoomPlayer & { seat: number; role: RoleId; contributions: Contributions };
export type IncidentOutcome = { incidentId: string; result: "resolved" | "unresolved" | "timeout" | "uptime"; score: number; uptime: number; mistakes: number; hints: number };

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
  players: CooperativePlayer[];
  departedPlayers: CooperativePlayer[];
  incidentIndex: number;
  incidentId: string;
  stepIndex: number;
  startsAt: number | null;
  endsAt: number | null;
  roundSeconds: number;
  score: number;
  streak: number;
  bestStreak: number;
  hintPenalties: number;
  hintsUsed: number;
  hintUsed: boolean;
  evidenceDiscoveries: string[];
  evidenceAssignments: { playerId: string; itemIds: string[] }[];
  evidenceContinueAt: number | null;
  evidenceContinued: boolean;
  usefulActions: { playerId: string; actionId: string; useful: boolean }[];
  outcomes: IncidentOutcome[];
  incidentStartScore: number;
  incidentStartHints: number;
  incidentMistakes: number;
  uptime: number;
  selectedActions: RoomAction[];
  result: IncidentOutcome["result"] | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

export type RoomSnapshot = {
  room: SharedRoom & { uptimeScore: number; streakMultiplier: number };
  viewerId: string;
  serverNow: number;
  incident: { title: string; ticket: string; objective: string; debrief: string[]; count: number; objectives: string[]; reviewTopics: string[]; sources: StudySource[] };
  role: { name: string; responsibility: string; actionId: string; action: string };
  debrief: { teamOutcome: "resolved" | "unresolved"; uptimeScore: number; objectives: string[]; reviewTopics: string[]; sources: StudySource[] } | null;
  evidenceGate: {
    items: { id: string; label: string; discovered: boolean; owners: { playerId: string; nickname: string; connected: boolean; discovered: boolean }[] }[];
    canAnswer: boolean;
    canAdvance: boolean;
    continueAvailableAt: number | null;
    continued: boolean;
    outstandingAnswers: string[];
  };
  step: {
    title: string;
    prompt: string;
    evidence?: string;
    hint: string | null;
    choices: Pick<IncidentChoice, "id" | "label">[];
  } | null;
};

export type StudySource = { path: string; href: string; title: string; sections: string[] };

export type StoredRoom = Omit<SharedRoom, "players" | "selectedActions"> & {
  players: (CooperativePlayer & { tokenHash: string; lastSeenAt: number })[];
  answerOrders: string[][];
  selectedActions: Omit<RoomAction, "explanation">[];
};

export interface RoomStore {
  assertActive(): Promise<void>;
  read(code: string): Promise<string | null>;
  create(code: string, value: string, ttlSeconds: number): Promise<boolean>;
  compareAndSwap(code: string, previous: string, next: string, ttlSeconds: number): Promise<boolean>;
}
