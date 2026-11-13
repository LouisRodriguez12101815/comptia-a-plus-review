import { json, needConfig, sameOrigin, sessionOf } from "@/lib/learner/api";
import { getLearnerActivity } from "@/lib/learner/activity.mjs";
import { twilioLearner } from "@/lib/learner/twilio";
import { RoomError } from "@/lib/game/room-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authenticated read only: identity is derived exclusively from the signed session. */
export async function GET(request: Request) {
  const c = needConfig();
  if ("response" in c) return c.response;
  if ((request.headers.has("origin") && !sameOrigin(request)) || request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "forbidden" }, 403);
  const session = sessionOf(request, c.config);
  if (!session) return json({ error: "signed_out" }, 401);
  if (new URL(request.url).search || request.body !== null) return json({ error: "bad_request" }, 400);
  try {
    await twilioLearner(c.config).guard.assertActive();
    return json(await getLearnerActivity(c.config, session.id));
  } catch (error) {
    if (error instanceof RoomError && error.status === 423) return json({ error: "paused" }, 423);
    // Provider failures and stored records never reach browser responses or logs.
    return json({ error: "unavailable" }, 502);
  }
}
