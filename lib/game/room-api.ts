import { cantReachWebsiteIncident } from "@/lib/game/incidents";
import { RoomError, RoomService } from "@/lib/game/room-service";
import twilio from "twilio";
import { roomDocumentName, syncInfrastructure } from "@/lib/game/room-store";

type Operation = "create" | "join" | "get" | "ready" | "start" | "answer" | "advance" | "leave" | "token";
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
  try {
    const code = codeInput.trim().toUpperCase();
    const token = sessionToken(request, code);
    const payload = operation === "get" ? {} : await body(request);
    const infrastructure = infrastructureFactory();
    const rooms = new RoomService(infrastructure.store, cantReachWebsiteIncident);
    if (operation === "create" || operation === "join") {
      const result = operation === "create" ? await rooms.create(payload.nickname) : await rooms.join(code, payload.nickname, token);
      const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
      headers.set("Set-Cookie", `${cookieName(result.snapshot.room.code)}=${result.token}; HttpOnly; SameSite=Lax; Path=/api/game/rooms/${result.snapshot.room.code}; Max-Age=1800${secure}`);
      return Response.json(result.snapshot, { status: operation === "create" ? 201 : 200, headers });
    }
    if (operation === "token") {
      const snapshot = await rooms.get(code, token);
      // Sync grants alone grant service access; ACL must be enabled before issuing one.
      const service = await infrastructure.service.fetch();
      if (!service.aclEnabled) throw new RoomError(503, "Multiplayer service requires read-only Sync ACL configuration.");
      await infrastructure.guard.assertActive();
      await infrastructure.service.documents(roomDocumentName(code)).documentPermissions(snapshot.viewerId).update({ read: true, write: false, manage: false });
      const ttl = Math.max(1, Math.min(300, Math.floor((snapshot.room.expiresAt - Date.now()) / 1000)));
      const access = new twilio.jwt.AccessToken(infrastructure.accountSid, infrastructure.keySid, infrastructure.keySecret, { identity: snapshot.viewerId, ttl });
      access.addGrant(new twilio.jwt.AccessToken.SyncGrant({ serviceSid: infrastructure.serviceSid }));
      return Response.json({ token: access.toJwt(), document: roomDocumentName(code), renewable: snapshot.room.expiresAt - Date.now() > 300_000 }, { headers });
    }
    if (operation === "leave") {
      const previous = await rooms.get(code, token);
      await rooms.leave(code, token);
      await infrastructure.guard.assertActive();
      await infrastructure.service.documents(roomDocumentName(code)).documentPermissions(previous.viewerId).update({ read: false, write: false, manage: false });
      headers.set("Set-Cookie", `${cookieName(code)}=; HttpOnly; SameSite=Lax; Path=/api/game/rooms/${code}; Max-Age=0`);
      return Response.json({ left: true }, { headers });
    }
    const snapshot = operation === "get" ? await rooms.get(code, token)
      : operation === "ready" ? await rooms.ready(code, token, payload.ready)
      : operation === "start" ? await rooms.start(code, token)
      : operation === "answer" ? await rooms.answer(code, token, payload.stepIndex, payload.answerId)
      : await rooms.advance(code, token, payload.stepIndex);
    return Response.json(snapshot, { headers });
  } catch (error) {
    const known = error instanceof RoomError;
    return Response.json({ error: known ? error.message : "Room storage is unavailable. Please try again shortly." }, { status: known ? error.status : 503, headers });
  }
}
