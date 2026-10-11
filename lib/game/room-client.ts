import type { RoomSnapshot } from "@/lib/game/room-types";

const operations = new Set(["join", "token", "evidence", "actions", "ready", "start", "advance", "hint", "role-action", "next", "continue-evidence", "leave"]);
const reasons = new Set(["configuration_missing", "configuration_invalid", "authentication_rejected", "permission_denied", "service_not_found", "account_mismatch", "rate_limited", "provider_unavailable", "network_failure", "unexpected_failure"]);
export class RoomApiError extends Error {
  status: number;
  operation: string;
  reason?: string;
  httpStatus?: number;
  constructor(status: number, message: string, operation = "state", reason?: string) { super(message); this.status = status; this.operation = operation; this.reason = reason; }
}

/** Validate the authenticated viewer and their actionable evidence, never guess a player ID. */
export function validateRoomSnapshot(value: RoomSnapshot): RoomSnapshot {
  if (!value?.room || !Array.isArray(value.room.players) || !value.room.players.some((player) => player.id === value.viewerId) || !Number.isFinite(value.serverNow)) {
    throw new RoomApiError(502, "Room membership could not be verified. Refreshing shared state; reconnect if this continues.", "state", "invalid_snapshot");
  }
  if (value.storageAvailable === false) throw new RoomApiError(503, "The room API reports storage unavailable. Retrying shared state.", "state", "storage_unavailable");
  if (value.room.status === "playing" && value.room.phase !== "briefing") {
    const self = value.room.players.find((player) => player.id === value.viewerId)!;
    const items = value.step?.assignedEvidence;
    const assignment = value.room.evidenceAssignments?.find((entry) => entry.playerId === value.viewerId);
    if (!Array.isArray(items) || items.some((item) => typeof item?.id !== "string" || !item.id.trim() || typeof item.label !== "string" || !item.label.trim() || typeof item.discovered !== "boolean") ||
      new Set(items.map((item) => item.id)).size !== items.length || items.length !== self.evidenceStatus?.assigned ||
      (assignment ? !Array.isArray(assignment.itemIds) || assignment.itemIds.length !== items.length || assignment.itemIds.some((id) => !items.some((item) => item.id === id)) : items.length !== 0)) {
      throw new RoomApiError(502, "Your evidence assignment is unavailable. Refreshing shared state; the host timeout remains available to teammates.", "state", "evidence_unavailable");
    }
  }
  return value;
}

/** Logs only fixed operation/event names, numeric status and a validated request ID. */
export function createRoomClient({ fetchImpl = fetch, log = (event: object) => console.info("outage_ops_client_request", event) } = {}) {
  return async function roomApi<T = RoomSnapshot>(path: string, payload?: object, signal?: AbortSignal): Promise<T> {
    const suffix = path.split("/").at(-1) ?? "";
    const operation = path === "" ? "create" : operations.has(suffix) ? suffix : "state";
    const method = payload ? "POST" : "GET";
    if (operation !== "state") log({ operation, method, event: "started" });
    let status = 0, requestId: string | undefined;
    try {
      const response = await fetchImpl(`/api/game/rooms${path}`, { method, credentials: "same-origin", cache: "no-store", headers: payload ? { "Content-Type": "application/json" } : undefined, body: payload ? JSON.stringify(payload) : undefined, signal: signal ?? AbortSignal.timeout(7000) });
      status = response.status;
      const id = response.headers.get("X-Outage-Ops-Request-Id");
      if (id && /^[a-f0-9-]{36}$/i.test(id)) requestId = id;
      let data;
      try { data = await response.json(); } catch { throw new RoomApiError(status, "The room API returned an unreadable response. Retrying may help.", operation, "invalid_response"); }
      if (!response.ok) throw new RoomApiError(status, typeof data?.error === "string" ? data.error : "Could not update the room.", operation, reasons.has(data?.diagnostic?.reason) ? data.diagnostic.reason : "request_rejected");
      if (operation === "token" && (typeof data?.token !== "string" || !data.token || typeof data.document !== "string" || !data.document || typeof data.viewerId !== "string" || typeof data.renewable !== "boolean")) throw new RoomApiError(502, "The Sync token response is incomplete. Shared room polling will continue.", operation, "invalid_response");
      if (!["token", "leave"].includes(operation)) validateRoomSnapshot(data);
      if (operation !== "state") log({ operation, method, event: "succeeded", status, requestId });
      return data;
    } catch (cause) {
      const failure = cause instanceof RoomApiError ? cause : new RoomApiError(0, "The room request could not reach the server. Retrying may help.", operation, "network_failure");
      if (status) failure.httpStatus = status;
      log({ operation, method, event: "failed", status, requestId, reason: failure.reason });
      throw failure;
    }
  };
}

/** One GET at a time, at least two seconds between starts, including Sync/deadline events. */
export function createRoomReconciler(refresh: () => Promise<void>, interval: () => number, { now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout, lastRequestAt = -Infinity } = {}) {
  let stopped = false, running = false, requested = false, lastStart = lastRequestAt;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function queue(delay: number) {
    if (stopped) return;
    if (timer) cancel(timer);
    timer = schedule(() => void run(), Math.max(delay, lastStart + 2000 - now(), 0));
  }
  async function run() {
    if (stopped || running) return;
    running = true; requested = false; lastStart = now();
    try { await refresh(); }
    finally { running = false; if (!stopped) queue(requested ? 0 : interval()); }
  }
  return {
    request() { if (stopped) return; if (running) requested = true; else queue(0); },
    stop() { stopped = true; if (timer) cancel(timer); },
  };
}
