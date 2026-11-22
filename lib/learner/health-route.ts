import { json } from "@/lib/learner/api";
import { runLearnerHealth, type HealthClient } from "@/lib/learner/health";
import { healthClient } from "@/lib/learner/health-twilio";
import { authorizeOwner } from "@/lib/learner/owner-access";
import { learnerConfig } from "@/lib/learner/twilio";

type HealthDeps = {
  client?: HealthClient;
  now?: () => number;
};

function healthResponse(deps: HealthDeps, request: Request, write: boolean) {
  const now = deps.now ?? Date.now;
  return async function respond() {
    const at = now();
    const config = learnerConfig();
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

/** Read-only. A query string cannot turn this into a Twilio write. */
export function createHealthGet(deps: HealthDeps = {}) {
  return async function GET(request: Request) {
    return healthResponse(deps, request, false)();
  };
}

/** Owner-only probe write. POST so a browser sends Origin and a GET cannot trigger it. */
export function createHealthWrite(deps: HealthDeps = {}) {
  return async function POST(request: Request) {
    return healthResponse(deps, request, true)();
  };
}
