import { isSecure, json, needConfig, sameOrigin, sessionOf } from "@/lib/learner/api";
import { clearCookie } from "@/lib/learner/session";
import { twilioLearner } from "@/lib/learner/twilio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Delete everything saved for this learner, then sign out. Works even when texting is paused. */
export async function POST(request: Request) {
  const c = needConfig();
  if ("response" in c) return c.response;
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const session = sessionOf(request, c.config);
  if (!session) return json({ error: "signed_out" }, 401);
  try {
    await twilioLearner(c.config).mapFor(session.id).removeAll();
    return json({ ok: true }, 200, { "Set-Cookie": clearCookie(isSecure(request)) });
  } catch (e) {
    console.error("learner/delete failed", (e as { status?: number })?.status ?? "unknown");
    return json({ error: "unavailable" }, 502);
  }
}
