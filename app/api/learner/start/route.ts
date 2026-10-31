import { RoomError } from "@/lib/game/room-service";
import { ipOf, isAllowedPhone, json, limits, needConfig, sameOrigin } from "@/lib/learner/api";
import { learnerId, normalizePhone } from "@/lib/learner/session";
import { twilioLearner } from "@/lib/learner/twilio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const c = needConfig();
  if ("response" in c) return c.response;
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!limits.codePerIp(ipOf(request))) return json({ error: "rate_limited" }, 429);
  let body: { phone?: unknown };
  try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const phone = normalizePhone(body.phone);
  if (!phone) return json({ error: "bad_phone" }, 400);
  if (!limits.codePerPhone(learnerId(phone, c.config.secret))) return json({ error: "rate_limited" }, 429);
  // Same reply for numbers that are not allowed, so nothing is texted (no cost) and nothing is revealed.
  if (!isAllowedPhone(c.config, phone)) { console.info("learner/start: number not on allow list, nothing sent"); return json({ ok: true }); }
  try {
    const t = twilioLearner(c.config);
    await t.guard.assertActive(); // stop texting when the daily spend latch has tripped
    await t.sendCode(phone);
    console.info("learner/start: verification created");
    return json({ ok: true });
  } catch (e) {
    if (e instanceof RoomError && e.status === 423) return json({ error: "paused" }, 423);
    console.error("learner/start failed", (e as { status?: number })?.status ?? "unknown");
    return json({ error: "unavailable" }, 502);
  }
}
