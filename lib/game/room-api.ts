import { multiplayerIncidents } from "@/lib/game/cooperative";
import { RoomError, RoomService } from "@/lib/game/room-service";
import twilio from "twilio";
import { roomDocumentName, syncInfrastructure } from "@/lib/game/room-store";
import { providerFailure, syncCall } from "@/lib/game/provider-errors";
import { randomUUID } from "node:crypto";

type Operation = "create" | "join" | "get" | "ready" | "start" | "answer" | "advance" | "leave" | "token" | "discover" | "hint" | "role-action" | "next" | "continue-evidence";
const cookieName = (code: string) => `outage_ops_${code}`;

function sessionToken(request: Request, code: string): string | null {
  const prefix = cookieName(code) + "=";
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function body(request: Request): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  // Next's production request URL can use an internal hostname. Host preserves the
  // externally requested authority; never accept an arbitrary forwarded-host value.
  const url = new URL(request.url);
  const expectedOrigin = `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (origin && origin !== expectedOrigin) throw new RoomError(403, "Use the room controls on this site.");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new RoomError(415, "Send a JSON request.");
  }
  const text = await request.text();
  if (text.length > 4096) throw new RoomError(413, "This request is too large.");
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object");
    return value;
  } catch { throw new RoomError(400, "Send a valid JSON object."); }
}

export async function roomRequest(request: Request, operation: Operation, codeInput = "", infrastructureFactory = syncInfrastructure): Promise<Response> {
  const headers = new Headers({ "Cache-Control": "no-store, private", Vary: "Cookie" });
  const requestId = randomUUID();
  headers.set("X-Outage-Ops-Request-Id", requestId);
  if (operation !== "get") console.info("outage_ops_room_request", { requestId, operation, event: "started" });
  const respond = (value: unknown, status = 200) => {
    if (operation !== "get") console.info("outage_ops_room_request", { requestId, operation, event: status < 400 ? "succeeded" : "failed", httpStatus: status });
    return Response.json(value, { status, headers });
  };
  try {
    const code = codeInput.trim().toUpperCase();
    const token = sessionToken(request, code);
    if (operation === "token" && request.method === "GET" && request.headers.get("sec-fetch-site") === "cross-site") throw new RoomError(403, "Use the room controls on this site.");
    const payload = operation === "get" || (operation === "token" && request.method === "GET") ? {} : await body(request);
    const infrastructure = infrastructureFactory();
    const rooms = new RoomService(infrastructure.store, multiplayerIncidents);
    if (operation === "create" || operation === "join") {
      const result = operation === "create" ? await rooms.create(payload.nickname) : await rooms.join(code, payload.nickname, token);
      if (operation === "create" && typeof infrastructure.verifyService === "function") console.info("outage_ops_room_storage_verified", { requestId, requiredVariableCount: 7, accountMatches: true, apiKeyServiceRead: true, apiKeyDocumentCreate: true });
      const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
      headers.set("Set-Cookie", `${cookieName(result.snapshot.room.code)}=${result.token}; HttpOnly; SameSite=Lax; Path=/api/game/rooms/${result.snapshot.room.code}; Max-Age=1800${secure}`);
      return respond({ ...result.snapshot, storageAvailable: true }, operation === "create" ? 201 : 200);
    }
    if (operation === "token") {
      const snapshot = await rooms.get(code, token);
      // Sync grants alone grant service access; ACL must be enabled before issuing one.
      const service = typeof infrastructure.verifyService === "function" ? await infrastructure.verifyService() : await syncCall("service.fetch", () => infrastructure.service.fetch());
      if (!service.aclEnabled) throw new RoomError(503, "Multiplayer service requires read-only Sync ACL configuration.", { reason: "configuration_invalid", stage: "service.fetch" });
      await infrastructure.guard.assertActive();
      await syncCall("permissions.update", () => infrastructure.service.documents(roomDocumentName(code)).documentPermissions(snapshot.viewerId).update({ read: true, write: false, manage: false }));
      console.info("outage_ops_room_token_permissions_verified", { requestId, aclEnabled: true, apiKeyPermissionWrite: true });
      const ttl = Math.max(1, Math.min(300, Math.floor((snapshot.room.expiresAt - Date.now()) / 1000)));
      const access = new twilio.jwt.AccessToken(infrastructure.accountSid, infrastructure.keySid, infrastructure.keySecret, { identity: snapshot.viewerId, ttl });
      access.addGrant(new twilio.jwt.AccessToken.SyncGrant({ serviceSid: infrastructure.serviceSid }));
      return respond({ token: access.toJwt(), document: roomDocumentName(code), viewerId: snapshot.viewerId, renewable: snapshot.room.expiresAt - Date.now() > 300_000 });
    }
    if (operation === "leave") {
      const previous = await rooms.get(code, token);
      await rooms.leave(code, token);
      await infrastructure.guard.assertActive();
      await syncCall("permissions.update", () => infrastructure.service.documents(roomDocumentName(code)).documentPermissions(previous.viewerId).update({ read: false, write: false, manage: false }));
      headers.set("Set-Cookie", `${cookieName(code)}=; HttpOnly; SameSite=Lax; Path=/api/game/rooms/${code}; Max-Age=0`);
      return respond({ left: true });
    }
    const snapshot = operation === "get" ? await rooms.get(code, token)
      : operation === "ready" ? await rooms.ready(code, token, payload.ready)
      : operation === "start" ? await rooms.start(code, token)
      : operation === "answer" ? await rooms.answer(code, token, payload.stepIndex, payload.answerId, payload.incidentIndex)
      : operation === "discover" ? await rooms.discover(code, token, payload.stepIndex, payload.incidentIndex, payload.itemId)
      : operation === "continue-evidence" ? await rooms.continueEvidence(code, token, payload.stepIndex, payload.incidentIndex)
      : operation === "hint" ? await rooms.hint(code, token, payload.stepIndex, payload.incidentIndex)
      : operation === "role-action" ? await rooms.usefulAction(code, token, payload.stepIndex, payload.actionId, payload.incidentIndex)
      : operation === "next" ? await rooms.nextIncident(code, token, payload.incidentIndex)
      : await rooms.advance(code, token, payload.stepIndex, payload.incidentIndex);
    return respond({ ...snapshot, storageAvailable: true });
  } catch (error) {
    const failure = providerFailure(error, "room.request");
    if (failure.status >= 500) console.error("outage_ops_room_failure", { requestId, operation, httpStatus: failure.status, ...(failure.diagnostic ?? { reason: "unexpected_failure", stage: "room.request" }) });
    return respond({ error: failure.message, ...(failure.diagnostic ? { diagnostic: failure.diagnostic, requestId } : {}) }, failure.status);
  }
}
