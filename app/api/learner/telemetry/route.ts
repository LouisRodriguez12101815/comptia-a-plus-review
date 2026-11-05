import { RoomError } from "@/lib/game/room-service";
import { appendTelemetry, parseStudyEvent } from "@/lib/learner/telemetry";
import { json, limits, needConfig, sameOrigin, sessionOf } from "@/lib/learner/api";
import { twilioLearner } from "@/lib/learner/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 8_000;

export async function POST(request: Request) {
  const c = needConfig();
  if ("response" in c) return c.response;
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const session = sessionOf(request, c.config);
  if (!session) return json({ error: "signed_out" }, 401);
  if (!limits.studyEventPerLearner(session.id)) return json({ error: "rate_limited" }, 429);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "too_large" }, 413);
  let event;
  try { event = parseStudyEvent(JSON.parse(text)); } catch { return json({ error: "bad_request" }, 400); }
  try {
    const t = twilioLearner(c.config);
    await t.guard.assertActive();
    await appendTelemetry(t.mapFor(session.id), event);
    console.info("study_event", JSON.stringify(event));
    return json({ ok: true });
  } catch (e) {
    if (e instanceof RoomError && e.status === 423) return json({ error: "paused" }, 423);
    if ((e as Error)?.message === "too_large") return json({ error: "too_large" }, 413);
    console.error("learner/telemetry failed", (e as { status?: number })?.status ?? "unknown");
    return json({ error: "unavailable" }, 502);
  }
}
