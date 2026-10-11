import { createHash, randomBytes, randomInt } from "node:crypto";
import type { GuidedIncident } from "@/lib/game/types";
import type { RoomSnapshot, RoomStore, StoredRoom } from "@/lib/game/room-types";
import { emptyContributions, evidenceItemsFor, legacyDhcpIncident, HINT_PENALTY, learningFor, roleFor, roles } from "@/lib/game/cooperative";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_LIFETIME = 30 * 60 * 1000;
const CONNECTION_WINDOW = 30_000;
const HEARTBEAT_INTERVAL = 10_000;
export const EVIDENCE_WAIT = 15_000;

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
  private readonly incidents: GuidedIncident[];
  private readonly now: () => number;
  private readonly code: () => string;

  constructor(store: RoomStore, incident: GuidedIncident | GuidedIncident[], options: { now?: () => number; code?: () => string } = {}) {
    this.store = store;
    this.incidents = Array.isArray(incident) ? incident : [incident];
    this.now = options.now ?? Date.now;
    this.code = options.code ?? (() => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""));
  }

  private player(nickname: string, token: string, now: number, seat = 0) {
    return { id: randomBytes(16).toString("hex"), nickname, tokenHash: hashToken(token), ready: false, connected: true, score: 0, lastSeenAt: now, seat, role: roleFor(seat, 0).id, contributions: emptyContributions() };
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
        hostPlayerId: player.id, players: [player], departedPlayers: [], incidentIndex: 0, incidentId: this.incidents[0].id,
        stepIndex: 0, startsAt: null, endsAt: null, roundSeconds: 120,
        score: 0, uptime: 100, selectedActions: [], result: null,
        streak: 0, bestStreak: 0, hintPenalties: 0, hintsUsed: 0, hintUsed: false,
        evidenceDiscoveries: [], evidenceAssignments: [], evidenceContinueAt: null, evidenceContinued: false,
        usefulActions: [], outcomes: [], incidentStartScore: 0, incidentStartHints: 0, incidentMistakes: 0,
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
    // Upgrade existing rooms without discarding their scores, tokens, or answer flow.
    room.streak ??= 0; room.bestStreak ??= 0; room.hintPenalties ??= 0;
    room.hintsUsed ??= 0; room.hintUsed ??= false; room.usefulActions ??= [];
    room.outcomes ??= []; room.incidentStartScore ??= room.score; room.incidentStartHints ??= 0;
    room.departedPlayers ??= [];
    room.incidentMistakes ??= room.selectedActions.filter((a) => !a.correct).length;
    room.evidenceDiscoveries ??= room.selectedActions.length ? room.players.map((p) => p.id) : [];
    room.players.forEach((p, index) => {
      p.seat ??= index; p.role ??= roleFor(p.seat, room.incidentIndex).id;
      p.contributions ??= { ...emptyContributions(), answers: p.score };
    });
    if (!room.evidenceAssignments) this.prepareEvidence(room, Math.max(room.updatedAt, room.startsAt ?? 0));
    room.evidenceContinued ??= false;
    room.evidenceContinueAt ??= room.status === "playing" ? Math.max(room.updatedAt, room.startsAt ?? 0) + EVIDENCE_WAIT : null;
    if (room.status === "results" && room.result && !room.outcomes.length) {
      room.outcomes.push({ incidentId: room.incidentId, result: room.result, score: room.score,
        uptime: room.uptime, mistakes: room.incidentMistakes, hints: room.hintsUsed });
    }
    return { raw, room };
  }

  private incident(room: StoredRoom) {
    if (room.incidentId === legacyDhcpIncident.id) return legacyDhcpIncident;
    return this.incidents.find((i) => i.id === room.incidentId) ?? this.incidents[room.incidentIndex] ?? this.incidents[0];
  }

  private prepareEvidence(room: StoredRoom, openedAt: number) {
    const items = evidenceItemsFor(this.incident(room), room.stepIndex);
    room.evidenceAssignments = room.players.map((p) => ({ playerId: p.id,
      itemIds: room.players.length === 1 || !items.length ? items.map((i) => i.id) : [items[p.seat % items.length].id] }));
    room.evidenceContinueAt = openedAt + EVIDENCE_WAIT;
    room.evidenceContinued = false;
  }

  private evidenceGate(room: StoredRoom, viewerId: string, now: number): RoomSnapshot["evidenceGate"] {
    const items = evidenceItemsFor(this.incident(room), room.stepIndex).map((item) => {
      const assigned = room.evidenceAssignments.filter((a) => a.itemIds.includes(item.id));
      return { id: item.id, label: item.label,
        discovered: assigned.some((a) => room.evidenceDiscoveries.includes(a.playerId)),
        owners: assigned.flatMap((a) => {
          const p = room.players.find((p) => p.id === a.playerId);
          return p ? [{ playerId: p.id, nickname: p.nickname, connected: now - p.lastSeenAt < CONNECTION_WINDOW,
            discovered: room.evidenceDiscoveries.includes(p.id) }] : [];
        }) };
    });
    const decisions = room.selectedActions.filter((a) => a.stepIndex === room.stepIndex);
    const outstanding = room.players.filter((p) => now - p.lastSeenAt < CONNECTION_WINDOW && !decisions.some((a) => a.playerId === p.id));
    const active = room.status === "playing" && room.phase !== "briefing";
    return { items, canAnswer: active && room.evidenceDiscoveries.includes(viewerId) && (room.evidenceContinued || items.every((i) => i.discovered)),
      canAdvance: active && decisions.some((a) => a.playerId === room.hostPlayerId) && (room.evidenceContinued || outstanding.length === 0),
      continueAvailableAt: room.evidenceContinueAt, continued: room.evidenceContinued,
      outstandingAnswers: outstanding.map((p) => p.nickname) };
  }

  private finish(room: StoredRoom, result: NonNullable<StoredRoom["result"]>) {
    room.status = "results"; room.phase = "debrief"; room.result = result;
    if (room.outcomes.length <= room.incidentIndex) {
      if (result === "resolved") {
        for (const member of [...room.players, ...room.departedPlayers]) {
          if (room.selectedActions.some((a) => a.playerId === member.id && a.correct)) {
            member.contributions.resolution += 25; member.score += 25;
          }
        }
      }
      room.outcomes.push({ incidentId: room.incidentId, result, score: room.score - room.incidentStartScore,
        uptime: room.uptime, mistakes: room.incidentMistakes,
        hints: room.hintsUsed - room.incidentStartHints });
    }
  }

  private normalizeTime(room: StoredRoom, now: number) {
    if (room.status !== "playing") return;
    if (room.endsAt !== null && now >= room.endsAt) {
      this.finish(room, "timeout");
    } else if (room.startsAt !== null && now >= room.startsAt) {
      room.phase = this.incident(room).steps[room.stepIndex].phase;
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
      const seat = Array.from({ length: 8 }, (_, index) => index).find((index) => !room.players.some((p) => p.seat === index))!;
      const player = this.player(nickname, token, now, seat);
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
      if (room.status !== "lobby") {
        room.departedPlayers.push({ id: player.id, nickname: player.nickname, score: player.score,
          seat: player.seat, role: player.role, contributions: player.contributions, ready: false, connected: false, isHost: false });
      }
      room.players = room.players.filter((member) => member.id !== player.id);
      if (room.players.length === 1 && room.status === "playing") {
        room.evidenceAssignments = [{ playerId: room.players[0].id, itemIds: evidenceItemsFor(this.incident(room), room.stepIndex).map((i) => i.id) }];
      }
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
      this.beginIncident(room, now);
      return player.id;
    });
  }

  private beginIncident(room: StoredRoom, now: number) {
      room.status = "playing"; room.phase = "briefing"; room.result = null;
      room.stepIndex = 0; room.incidentId = this.incidents[room.incidentIndex].id;
      room.startsAt = now + 5000; room.endsAt = room.startsAt + room.roundSeconds * 1000;
      room.selectedActions = []; room.evidenceDiscoveries = []; room.usefulActions = []; room.hintUsed = false;
      this.prepareEvidence(room, room.startsAt);
      room.incidentStartScore = room.score; room.incidentStartHints = room.hintsUsed;
      room.incidentMistakes = 0;
      room.players.forEach((p) => { p.role = roleFor(p.seat, room.incidentIndex).id; });
      room.answerOrders = this.incident(room).steps.map((step) => {
        const ids = step.choices.map((choice) => choice.id);
        for (let index = ids.length - 1; index > 0; index -= 1) {
          const swap = randomInt(index + 1);
          [ids[index], ids[swap]] = [ids[swap], ids[index]];
        }
        return ids;
      });
  }

  private activeStep(room: StoredRoom, stepIndex: unknown, incidentIndex: unknown) {
    if (room.status !== "playing" || room.phase === "briefing") throw new RoomError(409, "Wait for the active question.");
    if (stepIndex !== room.stepIndex || incidentIndex !== room.incidentIndex) throw new RoomError(409, "This question has changed. Refresh the room.");
  }

  async nextIncident(code: string, token: string | null, incidentIndex: unknown) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (player.id !== room.hostPlayerId) throw new RoomError(403, "Only the host can start the next incident.");
      if (room.status !== "results" || room.incidentIndex !== incidentIndex || room.incidentIndex + 1 >= this.incidents.length) {
        throw new RoomError(409, "There is no next incident ready to start.");
      }
      if (room.result === "timeout" || room.result === "uptime") throw new RoomError(409, "This response session has ended.");
      room.incidentIndex += 1; player.lastSeenAt = now; this.beginIncident(room, now);
      return player.id;
    });
  }

  async discover(code: string, token: string | null, stepIndex: unknown, incidentIndex: unknown = 0) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token); this.activeStep(room, stepIndex, incidentIndex);
      if (!room.evidenceDiscoveries.includes(player.id)) {
        room.evidenceDiscoveries.push(player.id); player.contributions.evidence += 10; player.score += 10;
      }
      player.lastSeenAt = now;
      return player.id;
    });
  }

  async hint(code: string, token: string | null, stepIndex: unknown, incidentIndex: unknown = 0) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token); this.activeStep(room, stepIndex, incidentIndex);
      if (!room.hintUsed) {
        room.hintUsed = true; room.hintsUsed += 1; room.hintPenalties += HINT_PENALTY; room.score -= HINT_PENALTY;
      }
      player.lastSeenAt = now; return player.id;
    });
  }

  async continueEvidence(code: string, token: string | null, stepIndex: unknown, incidentIndex: unknown = 0) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token); this.activeStep(room, stepIndex, incidentIndex);
      if (player.id !== room.hostPlayerId) throw new RoomError(403, "Only the host can continue with current evidence.");
      if (!room.evidenceDiscoveries.includes(player.id)) throw new RoomError(409, "Discover your evidence before continuing.");
      if (room.evidenceContinueAt === null || now < room.evidenceContinueAt) throw new RoomError(409, "Wait for the visible evidence timeout before continuing.");
      room.evidenceContinued = true; player.lastSeenAt = now;
      return player.id;
    });
  }

  async usefulAction(code: string, token: string | null, stepIndex: unknown, actionId: unknown, incidentIndex: unknown = 0) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token); this.activeStep(room, stepIndex, incidentIndex);
      const role = roles.find((r) => r.id === player.role)!;
      if (actionId !== role.actionId && actionId !== "restart-shared-equipment") throw new RoomError(400, "Choose an action assigned to your role.");
      if (!room.evidenceDiscoveries.includes(player.id)) throw new RoomError(409, "Discover your evidence before acting.");
      if (room.usefulActions.some((a) => a.playerId === player.id)) throw new RoomError(409, "Your role action is already recorded for this question.");
      const useful = actionId === role.actionId;
      room.usefulActions.push({ playerId: player.id, actionId: actionId as string, useful });
      if (useful) { player.contributions.actions += 20; player.score += 20; }
      else this.penalize(room, now);
      player.lastSeenAt = now; return player.id;
    });
  }

  private penalize(room: StoredRoom, now: number) {
    room.incidentMistakes += 1;
    room.uptime = Math.max(0, room.uptime - 5); room.streak = 0;
    if (room.endsAt !== null) room.endsAt -= 5000;
    if (room.uptime === 0) this.finish(room, "uptime");
    else this.normalizeTime(room, now);
  }

  async answer(code: string, token: string | null, stepIndex: unknown, answerId: unknown, incidentIndex: unknown = 0) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      this.activeStep(room, stepIndex, incidentIndex);
      if (!room.evidenceDiscoveries.includes(player.id)) throw new RoomError(409, "Discover your evidence before answering.");
      if (!this.evidenceGate(room, player.id, now).canAnswer) throw new RoomError(409, "Required evidence is still outstanding. Discover and share it, or ask the host to continue after the evidence timeout.");
      const step = this.incident(room).steps[room.stepIndex];
      const choice = step.choices.find((answer) => answer.id === answerId);
      if (!choice) throw new RoomError(400, "Choose one of this question's answers.");
      if (room.selectedActions.some((action) => action.stepIndex === room.stepIndex && action.playerId === player.id)) {
        throw new RoomError(409, "You already answered this question.");
      }
      const correct = choice.id === step.correctAnswerId;
      room.selectedActions.push({ playerId: player.id, stepIndex: room.stepIndex, answerId: choice.id, correct, submittedAt: now });
      player.lastSeenAt = now;
      if (correct) { player.score += 100; player.contributions.answers += 100; }
      else this.penalize(room, now);
      return player.id;
    });
  }

  async advance(code: string, token: string | null, stepIndex: unknown, incidentIndex: unknown = 0) {
    return this.update(code, (room, now) => {
      const player = this.authenticate(room, token);
      if (player.id !== room.hostPlayerId) throw new RoomError(403, "Only the host can continue the mission.");
      this.activeStep(room, stepIndex, incidentIndex);
      player.lastSeenAt = now;
      if (!this.evidenceGate(room, player.id, now).canAdvance) throw new RoomError(409, "The host must answer. Wait for connected responders, or continue with current evidence after the timeout.");
      const decisions = room.selectedActions.filter((a) => a.stepIndex === room.stepIndex);
      const clean = decisions.length > 0 && decisions.every((a) => a.correct) && room.usefulActions.every((a) => a.useful);
      room.streak = clean ? room.streak + 1 : 0; room.bestStreak = Math.max(room.bestStreak, room.streak);
      room.score += clean ? 100 * Math.min(3, room.streak) : decisions.some((a) => a.correct) ? 50 : 0;
      room.stepIndex += 1;
      if (room.stepIndex === this.incident(room).steps.length) {
        const resolved = this.incident(room).steps.every((_, index) => room.selectedActions.some((a) => a.stepIndex === index && a.correct));
        this.finish(room, resolved ? "resolved" : "unresolved");
      } else {
        room.phase = this.incident(room).steps[room.stepIndex].phase;
        room.evidenceDiscoveries = []; room.usefulActions = []; room.hintUsed = false;
        this.prepareEvidence(room, now);
      }
      return player.id;
    });
  }

  private snapshot(stored: StoredRoom, viewerId: string, now: number): RoomSnapshot {
    const { answerOrders, players, selectedActions, ...room } = stored;
    const incident = this.incident(stored);
    const current = incident.steps[room.stepIndex];
    const viewer = players.find((p) => p.id === viewerId);
    const role = roles.find((r) => r.id === viewer?.role) ?? roles[0];
    const learning = learningFor(incident);
    return {
      room: { ...room, uptimeScore: room.uptime * 10, streakMultiplier: Math.max(1, Math.min(3, room.streak)),
        selectedActions: selectedActions.map((action) => ({ ...action, explanation: incident.steps[action.stepIndex].choices.find((choice) => choice.id === action.answerId)!.explanation })),
        players: players.map((player) => ({ id: player.id, nickname: player.nickname, ready: player.ready, score: player.score, seat: player.seat, role: player.role, contributions: player.contributions, connected: now - player.lastSeenAt < CONNECTION_WINDOW, isHost: player.id === room.hostPlayerId })) },
      viewerId, serverNow: now,
      evidenceGate: this.evidenceGate(stored, viewerId, now),
      incident: { title: incident.title, ticket: incident.ticket, objective: incident.objective, debrief: incident.debrief, count: this.incidents.length, ...learning },
      role: { name: role.name, responsibility: role.responsibility, actionId: role.actionId, action: role.action },
      debrief: room.status === "results" ? {
        teamOutcome: room.outcomes.every((o) => o.result === "resolved") ? "resolved" : "unresolved", uptimeScore: room.uptime * 10,
        objectives: [...new Set(this.incidents.slice(0, room.incidentIndex + 1).flatMap((i) => learningFor(i).objectives))],
        reviewTopics: [...new Set(room.outcomes.flatMap((o) => o.mistakes || o.hints || o.result !== "resolved" ? learningFor(this.incidents.find((i) => i.id === o.incidentId) ?? incident).reviewTopics : []))],
        sources: [...new Map(room.outcomes.flatMap((o) => learningFor(o.incidentId === legacyDhcpIncident.id ? legacyDhcpIncident : this.incidents.find((i) => i.id === o.incidentId) ?? incident).sources).map((s) => [s.href, s])).values()],
      } : null,
      step: room.status === "playing" && current ? {
        title: current.title, prompt: current.prompt,
        evidence: viewer && room.evidenceDiscoveries.includes(viewerId) ? evidenceItemsFor(incident, room.stepIndex).filter((i) => room.evidenceAssignments.find((a) => a.playerId === viewerId)?.itemIds.includes(i.id)).map((i) => i.text).join("\n") : undefined,
        hint: room.hintUsed ? current.hint : null,
        choices: (answerOrders[room.stepIndex] ?? []).map((id) => {
          const choice = current.choices.find((answer) => answer.id === id)!;
          return { id: choice.id, label: choice.label };
        }),
      } : null,
    };
  }
}
