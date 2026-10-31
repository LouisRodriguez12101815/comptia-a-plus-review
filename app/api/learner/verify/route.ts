import { ipOf, isSecure, json, limits, needConfig, sameOrigin } from "@/lib/learner/api";
import { learnerId, normalizePhone, SESSION_DAYS, sessionCookie, signSession } from "@/lib/learner/session";
import { twilioLearner } from "@/lib/learner/twilio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const c = needConfig();
  if ("response" in c) return c.response;
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!limits.checkPerIp(ipOf(request))) return json({ error: "rate_limited" }, 429);
  let body: { phone?: unknown; code?: unknown };
  try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const phone = normalizePhone(body.phone);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!phone || !/^\d{4,10}$/.test(code)) return json({ error: "bad_request" }, 400);
  try {
    const ok = await twilioLearner(c.config).checkCode(phone, code);
    if (!ok) return json({ error: "wrong_code" }, 401);
  } catch (e) {
    const s = (e as { status?: number })?.status;
    if (s === 404) return json({ error: "wrong_code" }, 401); // expired or already used
    console.error("learner/verify failed", s ?? "unknown");
    return json({ error: "unavailable" }, 502);
  }
  const last4 = phone.slice(-4);
  const token = signSession({ id: learnerId(phone, c.config.secret), last4, exp: Date.now() + SESSION_DAYS * 86400_000 }, c.config.secret);
  return json({ ok: true, last4 }, 200, { "Set-Cookie": sessionCookie(token, isSecure(request)) });
}
