import { RoomError } from "@/lib/game/room-service";
import { json, needConfig } from "@/lib/learner/api";
import { readPublicDiagnostics } from "@/lib/learner/diagnostics-read";
import { authorizeOwner } from "@/lib/learner/owner-access";
import { twilioLearner, type LearnerConfig } from "@/lib/learner/twilio";
import { twilioFailure } from "@/lib/learner/twilio-error";
import type { PublicDiagnostics } from "@/lib/learner/diagnostics";

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
      const body = await read(c.config, at);
      for (const section of body.sections ?? []) {
        if (!section.ok) console.error("learner/diagnostics", section.call, section.code ?? "none");
      }
      return json(body);
    } catch (error) {
      if (error instanceof RoomError && error.status === 423) return json({ error: "paused" }, 423);
      const failure = twilioFailure(error);
      console.error("learner/diagnostics", "account", failure.code ?? "none");
      return json({ error: "unavailable", reason: { call: "account", code: failure.code, status: failure.status } }, 502);
    }
  };
}
