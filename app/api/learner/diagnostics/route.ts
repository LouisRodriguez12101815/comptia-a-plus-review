import { RoomError } from "@/lib/game/room-service";
import { json, needConfig } from "@/lib/learner/api";
import { readPublicDiagnostics } from "@/lib/learner/diagnostics-read";
import { authorizeOwner } from "@/lib/learner/owner-access";
import { twilioLearner, type LearnerConfig } from "@/lib/learner/twilio";
import type { PublicDiagnostics } from "@/lib/learner/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiagnosticsDeps = {
  read?: (config: LearnerConfig, now: number) => Promise<PublicDiagnostics>;
  assertActive?: (config: LearnerConfig) => Promise<void>;
  now?: () => number;
};

export function createDiagnosticsGet(deps: DiagnosticsDeps = {}) {
  const read = deps.read ?? readPublicDiagnostics;
  const assertActive = deps.assertActive ?? (async (config: LearnerConfig) => { await twilioLearner(config).guard.assertActive(); });
  const now = deps.now ?? Date.now;

  return async function GET(request: Request) {
    const c = needConfig();
    if ("response" in c) return c.response;
    const at = now();
    const gate = authorizeOwner(request, c.config, at);
    if ("response" in gate) return gate.response;
    try {
      await assertActive(c.config);
      return json(await read(c.config, at));
    } catch (error) {
      if (error instanceof RoomError && error.status === 423) return json({ error: "paused" }, 423);
      console.error("learner/diagnostics failed", (error as { status?: number })?.status ?? "unknown");
      return json({ error: "unavailable" }, 502);
    }
  };
}

export const GET = createDiagnosticsGet();
