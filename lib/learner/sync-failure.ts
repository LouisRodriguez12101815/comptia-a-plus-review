import { RoomError } from "@/lib/game/room-service";
import { json } from "@/lib/learner/api";

/** A Sync revision race is retryable. Other failures stay unavailable. */
export function syncFailureResponse(error: unknown): Response {
  if (error instanceof RoomError && error.status === 423) return json({ error: "paused" }, 423);
  if (error instanceof Error && error.message === "too_large") return json({ error: "too_large" }, 413);
  const status = (error as { status?: number }).status;
  if ((error instanceof Error && error.message === "progress_conflict") || status === 409 || status === 412) {
    console.error("learner/sync conflict");
    return json({ error: "retry" }, 409);
  }
  console.error("learner/sync failed", status ?? "unknown");
  return json({ error: "unavailable" }, 502);
}
