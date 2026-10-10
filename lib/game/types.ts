export type GameMode = "multiplayer" | "guided";

export type GamePhase =
  | "briefing"
  | "investigate"
  | "interpret"
  | "diagnose"
  | "repair"
  | "verify"
  | "debrief";

export type IncidentChoice = {
  id: string;
  label: string;
};

export type IncidentStep = {
  phase: GamePhase;
  eyebrow: string;
  title: string;
  prompt: string;
  evidence?: string;
  choices: IncidentChoice[];
  correctChoiceId: string;
  hint: string;
  explanation: string;
};

export type GuidedIncident = {
  id: string;
  title: string;
  ticket: string;
  objective: string;
  steps: IncidentStep[];
  debrief: string[];
};

export type RoomSettings = {
  certification: "core1" | "core2" | "network" | "mixed";
  incidentCount: number;
  roundSeconds: number;
  maxPlayers: number;
};

export type RoomPlayer = {
  id: string;
  nickname: string;
  ready: boolean;
  connected: boolean;
  score: number;
  isHost?: boolean;
  isMentor?: boolean;
};

export type GameRoom = {
  code: string;
  mode: GameMode;
  status: "lobby" | "playing" | "results" | "closed";
  hostPlayerId: string;
  version: number;
  settings: RoomSettings;
  players: RoomPlayer[];
  createdAt: string;
  updatedAt: string;
};
