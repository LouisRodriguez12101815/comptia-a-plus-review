import { createRateLimiter } from "@/lib/report/issue";
import { cookieValue, learnerId, readSession, SESSION_COOKIE, type Session } from "@/lib/learner/session";
import { learnerConfig, type LearnerConfig } from "@/lib/learner/twilio";

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export const ipOf = (request: Request) => (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
export const isSecure = (request: Request) => (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")) === "https";

/** Same-origin writes only. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return origin === `${proto}://${host}`;
}

// Per-instance limits, like /api/report. The daily spend latch and Twilio Verify's own limits back these up.
export const limits = {
  codePerIp: createRateLimiter(5, 10 * 60_000),
  codePerPhone: createRateLimiter(3, 10 * 60_000),
  checkPerIp: createRateLimiter(10, 10 * 60_000),
  savePerLearner: createRateLimiter(30, 60_000),
};

export function needConfig(): { config: LearnerConfig } | { response: Response } {
  const config = learnerConfig();
  return config ? { config } : { response: json({ configured: false }, 503) };
}

export function sessionOf(request: Request, config: LearnerConfig): Session | null {
  const session = readSession(cookieValue(request.headers.get("cookie"), SESSION_COOKIE), config.secret);
  // Removing a number from the allow list ends its sessions immediately.
  return session && config.allowed.some((phone) => learnerId(phone, config.secret) === session.id) ? session : null;
}

/** Owner-only: only numbers in LEARNER_ALLOWED_PHONES may receive codes or sign in. */
export const isAllowedPhone = (config: LearnerConfig, phone: string) => config.allowed.includes(phone);
