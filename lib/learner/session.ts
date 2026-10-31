import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "learner_session";
export const SESSION_DAYS = 30;

/** Opaque learner id: HMAC of the E.164 number, so the number itself is never stored. */
export function learnerId(phone: string, secret: string): string {
  return createHmac("sha256", secret).update(`learner:${phone}`).digest("hex").slice(0, 40);
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (body: string, secret: string) => createHmac("sha256", secret).update(`session:${body}`).digest("base64url");

export type Session = { id: string; last4: string; exp: number };

export function signSession(session: Session, secret: string): string {
  const body = b64(JSON.stringify(session));
  return `${body}.${sign(body, secret)}`;
}

export function readSession(token: string | undefined, secret: string, now = Date.now()): Session | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body, secret);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (typeof s.id !== "string" || !/^[0-9a-f]{40}$/.test(s.id) || typeof s.exp !== "number" || s.exp < now) return null;
    return { id: s.id, last4: String(s.last4 ?? "").slice(-4), exp: s.exp };
  } catch { return null; }
}

export function cookieValue(header: string | null, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
}
export const clearCookie = (secure: boolean) => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;

/** Accept US/Canada 10-digit numbers or full +E.164 numbers. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  return null;
}
