import { createHash, randomBytes, randomInt } from "node:crypto";
import type { GuidedIncident } from "@/lib/game/types";
import type { RoomSnapshot, RoomStore, StoredRoom } from "@/lib/game/room-types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_LIFETIME = 30 * 60 * 1000;
const CONNECTION_WINDOW = 30_000;
const HEARTBEAT_INTERVAL = 10_000;

export class RoomError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)) {
    throw new RoomError(400, "Enter a valid six-character room code.");
  }
  return code;
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") throw new RoomError(400, "Enter a call sign.");
  const name = value.trim().normalize("NFKC");
  if (name.length < 2 || name.length > 16 || /[\p{Cc}\p{Cf}]/u.test(name)) {
    throw new RoomError(400, "Call signs must contain 2–16 visible characters.");
  }
  return name;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export class RoomService {
  private readonly store: RoomStore;
  private readonly incident: GuidedIncident;
  private readonly now: () => number;
  private readonly code: () => string;

  constructor(store: RoomStore, incident: GuidedIncident, options: { now?: () => number; code?: () => string } = {}) {
    this.store = store;
    this.incident = incident;
    this.now = options.now ?? Date.now;
    this.code = options.code ?? (() => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""));
  }

  private player(nickname: string, token: string, now: number) {
    return { id: randomBytes(16).toString("hex"), nickname, tokenHash: hashToken(token), ready: false, connected: true, score: 0, lastSeenAt: now };
  }

  async create(nicknameInput: unknown): Promise<{ snapshot: RoomSnapshot; token: string }> {
    await this.store.assertActive();
    const nickname = normalizeName(nicknameInput);
    const now = this.now();
    const token = randomBytes(32).toString("hex");
    const player = this.player(nickname, token, now);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const room: StoredRoom = {
        code: normalizeCode(this.code()), version: 1, status: "lobby", phase: "lobby",
        hostPlayerId: player.id, players: [player], incidentIndex: 0, incidentId: this.incident.id,
        stepIndex: 0, startsAt: null, endsAt: null, roundSeconds: 120,
        score: 0, uptime: 100, selectedActions: [], result: null,
        createdAt: now, updatedAt: now, expiresAt: now + ROOM_LIFETIME, answerOrders: [],
      };
      if (await this.store.create(room.code, JSON.stringify(room), ROOM_LIFETIME / 1000)) {
        return { snapshot: this.snapshot(room, player.id, now), token };
      }
    }
    throw new RoomError(503, "Could not reserve a room code. Please try again.");
  }

  private async read(code: string, now: number) {
    const raw = await this.store.read(code);
    if (!raw) throw new RoomError(404, "Room not found or expired. Check the code or create a new room.");
    const room = JSON.parse(raw) as StoredRoom;
    if (room.expiresAt <= now) throw new RoomError(410, "This room has expired. Create a new room.");
    return { raw, room };
  }

  private normalizeTime(room: StoredRoom, now: number) {
    if (room.status !== "playing") return;
    if (room.endsAt !== null && now >= room.endsAt) {
      room.status = "results";
      room.phase = "debrief";
      room.result = "timeout";
    } else if (room.startsAt !== null && now >= room.startsAt) {
      room.phase = this.incident.steps[room.stepIndex].phase;
    }
  }

  private authenticate(room: StoredRoom, token: string | null) {
    const player = token ? room.players.find((candidate) => candidate.tokenHash === hashToken(token)) : undefined;
    if (!player) throw new RoomError(401, "Join this room before using its controls.");
    return player;
  }

  private async update(codeInput: string, change: (room: StoredRoom, now: number) => string): Promise<RoomSnapshot> {
    await this.store.assertActive();
    const code = normalizeCode(codeInput);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const now = this.now();
      const { raw, room } = await this.read(code, now);
      this.normalizeTime(room, now);
      const viewerId = change(room, now);
      if (JSON.stringify(room) === raw) return this.snapshot(room, viewerId, now);
      room.version += 1;
      room.updatedAt = now;
      const ttl = Math.max(1, Math.ceil((room.expiresAt - now) / 1000));
      if (await this.store.compareAndSwap(code, raw, JSON.stringify(room), ttl)) {
        return this.snapshot(room, viewerId, now);
      }
    }
    throw new RoomError(409, "The room changed at the same time. Please retry.");
  }

  async join(code: string, nicknameInput: unknown, existingToken: string | null = null) {
    await this.store.assertActive();
    const nickname = normalizeName(nicknameInput);
    const token = existingToken ?? randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const snapshot = await this.update(code, (room, now) => {
      const existing = room.players.find((player) => player.tokenHash === tokenHash);
      if (existing) {
        existing.lastSeenAt = now;
        return existing.id;
      }
      if (room.status !== "lobby") throw new RoomError(409, "This mission has started. Join a new room instead.");
      if (room.players.length >= 8) throw new RoomError(409, "This room is full (8 players).");
      if (room.players.some((player) => player.nickname.toLowerCase() === nickname.toLowerCase())) {
        throw new RoomError(409, "That call sign is already in use. Choose another.");
      }
      const player = this.player(nickname, token, now);
      room.players.push(player);
      return player.id;
    });
    return { snapshot, token };
  }

  async get(code: string, token: string | null) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (now - player.lastSeenAt >= HEARTBEAT_INTERVAL) player.lastSeenAt = now;
      return player.id;
    });
  }

  async leave(code: string, token: string | null) {
    return this.update(code, (room) => {
      const player = this.authenticate(room, token);
      room.players = room.players.filter((member) => member.id !== player.id);
      if (room.hostPlayerId === player.id) room.hostPlayerId = room.players[0]?.id ?? "";
      if (!room.players.length) room.expiresAt = this.now();
      return player.id;
    });
  }

  async ready(code: string, token: string | null, ready: unknown) {
    if (typeof ready !== "boolean") throw new RoomError(400, "Ready must be true or false.");
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (room.status !== "lobby") throw new RoomError(409, "Readiness can only change in the lobby.");
      player.ready = ready;
      player.lastSeenAt = now;
      return player.id;
    });
  }

  async start(code: string, token: string | null) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (player.id !== room.hostPlayerId) throw new RoomError(403, "Only the host can start the mission.");
      if (room.status !== "lobby") throw new RoomError(409, "This mission has already started.");
      if (!room.players.length || !room.players.every((member) => member.ready)) {
        throw new RoomError(409, "Every player must be ready before starting.");
      }
      player.lastSeenAt = now;
      room.status = "playing";
      room.phase = "briefing";
      room.startsAt = now + 5000;
      room.endsAt = room.startsAt + room.roundSeconds * 1000;
      room.answerOrders = this.incident.steps.map((step) => {
        const ids = step.choices.map((choice) => choice.id);
        for (let index = ids.length - 1; index > 0; index -= 1) {
          const swap = randomInt(index + 1);
          [ids[index], ids[swap]] = [ids[swap], ids[index]];
        }
        return ids;
      });
      return player.id;
    });
  }

  async answer(code: string, token: string | null, stepIndex: unknown, answerId: unknown) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (room.status !== "playing" || room.phase === "briefing") throw new RoomError(409, "Wait for the active question.");
      if (stepIndex !== room.stepIndex) throw new RoomError(409, "This question has changed. Refresh the room.");
      const step = this.incident.steps[room.stepIndex];
      const choice = step.choices.find((answer) => answer.id === answerId);
      if (!choice) throw new RoomError(400, "Choose one of this question's answers.");
      if (room.selectedActions.some((action) => action.stepIndex === room.stepIndex && action.playerId === player.id)) {
        throw new RoomError(409, "You already answered this question.");
      }
      const correct = choice.id === step.correctAnswerId;
      room.selectedActions.push({ playerId: player.id, stepIndex: room.stepIndex, answerId: choice.id, correct, submittedAt: now });
      player.lastSeenAt = now;
      if (correct) { player.score += 100; room.score += 100; }
      else room.uptime = Math.max(0, room.uptime - 5);
      if (room.uptime === 0) { room.status = "results"; room.phase = "debrief"; room.result = "uptime"; }
      return player.id;
    });
  }

  async advance(code: string, token: string | null, stepIndex: unknown) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (player.id !== room.hostPlayerId) throw new RoomError(403, "Only the host can continue the mission.");
      if (room.status !== "playing" || room.phase === "briefing" || stepIndex !== room.stepIndex) {
        throw new RoomError(409, "This question is not ready to advance.");
      }
      player.lastSeenAt = now;
      const connected = room.players.filter((member) => now - member.lastSeenAt < CONNECTION_WINDOW);
      if (!connected.every((member) => room.selectedActions.some((action) => action.stepIndex === room.stepIndex && action.playerId === member.id))) {
        throw new RoomError(409, "Wait for every connected player to answer.");
      }
      room.stepIndex += 1;
      if (room.stepIndex === this.incident.steps.length) {
        room.status = "results"; room.phase = "debrief"; room.result = "resolved";
      } else room.phase = this.incident.steps[room.stepIndex].phase;
      return player.id;
    });
  }

  private snapshot(stored: StoredRoom, viewerId: string, now: number): RoomSnapshot {
    const { answerOrders, players, selectedActions, ...room } = stored;
    const current = this.incident.steps[room.stepIndex];
    return {
      room: { ...room,
        selectedActions: selectedActions.map((action) => ({ ...action, explanation: this.incident.steps[action.stepIndex].choices.find((choice) => choice.id === action.answerId)!.explanation })),
        players: players.map((player) => ({ id: player.id, nickname: player.nickname, ready: player.ready, score: player.score, connected: now - player.lastSeenAt < CONNECTION_WINDOW, isHost: player.id === room.hostPlayerId })) },
      viewerId, serverNow: now,
      incident: { title: this.incident.title, ticket: this.incident.ticket, objective: this.incident.objective, debrief: this.incident.debrief },
      step: room.status === "playing" && current ? {
        title: current.title, prompt: current.prompt, evidence: current.evidence,
        choices: (answerOrders[room.stepIndex] ?? []).map((id) => {
          const choice = current.choices.find((answer) => answer.id === id)!;
          return { id: choice.id, label: choice.label };
        }),
      } : null,
    };
  }
}
