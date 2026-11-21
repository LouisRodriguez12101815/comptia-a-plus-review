import { json } from "@/lib/learner/api";
import { runLearnerHealth, type HealthClient } from "@/lib/learner/health";
import { healthClient } from "@/lib/learner/health-twilio";
import { authorizeOwner } from "@/lib/learner/owner-access";
import { learnerConfig } from "@/lib/learner/twilio";

type HealthDeps = {
  client?: HealthClient;
  now?: () => number;
};

export function createHealthGet(deps: HealthDeps = {}) {
  const now = deps.now ?? Date.now;
  return async function GET(request: Request) {
    const at = now();
    const config = learnerConfig();
    const write = new URL(request.url).searchParams.get("write") === "1";
    if (!config) {
      const checks = await runLearnerHealth({
        env: process.env, write, now: at, sessionOk: false, learnerMap: "learner-unconfigured", client: null,
      });
      return json({ checks }, 503);
    }
    const gate = authorizeOwner(request, config, at);
    if ("response" in gate) return gate.response;
    const checks = await runLearnerHealth({
      env: process.env,
      write,
      now: at,
      sessionOk: true,
      learnerMap: `learner-${gate.session.id}`,
      client: deps.client ?? healthClient(config),
    });
    return json({ checks });
  };
}
