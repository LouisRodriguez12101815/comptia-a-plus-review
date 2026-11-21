import { json, limits, sameOrigin } from "@/lib/learner/api";
import { cookieValue, learnerId, readSession, SESSION_COOKIE, type Session } from "@/lib/learner/session";
import type { LearnerConfig } from "@/lib/learner/twilio";

/** Signed-in allowlisted owner, same origin, rate limited. No learner data in the refusal. */
export function authorizeOwner(request: Request, config: LearnerConfig, now = Date.now()): { session: Session } | { response: Response } {
  if (!sameOrigin(request)) return { response: json({ error: "forbidden" }, 403) };
  const session = readSession(cookieValue(request.headers.get("cookie"), SESSION_COOKIE), config.secret, now);
  if (!session) return { response: json({ error: "signed_out" }, 401) };
  if (!config.allowed.some((phone) => learnerId(phone, config.secret) === session.id)) {
    return { response: json({ error: "forbidden" }, 403) };
  }
  if (!limits.ownerReadPerLearner(session.id, now)) return { response: json({ error: "rate_limited" }, 429) };
  return { session };
}
