import { RoomError } from "@/lib/game/room-service";
import { json, limits, needConfig, sameOrigin, sessionOf } from "@/lib/learner/api";
import { mergeProgress } from "@/lib/learner/merge";
import { loadRemote, saveRemote } from "@/lib/learner/store";
import { twilioLearner } from "@/lib/learner/twilio";
import { parseProgress } from "@/lib/progress";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 400_000;

/** Merge this device's progress into the learner's saved copy and return the combined result. */
export async function POST(request: Request) {
  const c = needConfig();
  if ("response" in c) return c.response;
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const session = sessionOf(request, c.config);
  if (!session) return json({ error: "signed_out" }, 401);
  if (!limits.savePerLearner(session.id)) return json({ error: "rate_limited" }, 429);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "too_large" }, 413);
  let local;
  try { local = parseProgress(text).progress; } catch { return json({ error: "bad_request" }, 400); }
  try {
    const t = twilioLearner(c.config);
    await t.guard.assertActive();
    const map = t.mapFor(session.id);
    const remote = await loadRemote(map);
    const merged = remote ? mergeProgress(local, remote) : local;
    await saveRemote(map, merged);
    return json({ ok: true, progress: merged, savedAt: Date.now() });
  } catch (e) {
    if (e instanceof RoomError && e.status === 423) return json({ error: "paused" }, 423);
    if ((e as Error)?.message === "too_large") return json({ error: "too_large" }, 413);
    console.error("learner/sync failed", (e as { status?: number })?.status ?? "unknown");
    return json({ error: "unavailable" }, 502);
  }
}
