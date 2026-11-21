import { RoomError } from "@/lib/game/room-service";
import { json, needConfig } from "@/lib/learner/api";
import { readOnlyTwilio } from "@/lib/learner/diagnostics-read";
import { authorizeOwner } from "@/lib/learner/owner-access";
import { loadStudyContent, summarizeItems } from "@/lib/learner/owner-report";
import { twilioLearner, type LearnerConfig } from "@/lib/learner/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXAMS = new Set(["saa-c03", "clf-c02"]);

type ReportDeps = {
  readItems?: (mapName: string, config: LearnerConfig) => Promise<{ key: string; data?: unknown }[]>;
  loadContent?: () => Promise<Parameters<typeof summarizeItems>[1]>;
  assertActive?: (config: LearnerConfig) => Promise<void>;
  now?: () => number;
};

export function createReportGet(deps: ReportDeps = {}) {
  const readItems = deps.readItems ?? (async (mapName: string, config: LearnerConfig) => {
    const id = mapName.startsWith("learner-") ? mapName.slice("learner-".length) : "";
    return twilioLearner(config, readOnlyTwilio(config)).mapFor(id).list();
  });
  const loadContent = deps.loadContent ?? (() => loadStudyContent());
  const assertActive = deps.assertActive ?? (async (config: LearnerConfig) => { await twilioLearner(config).guard.assertActive(); });
  const now = deps.now ?? Date.now;

  return async function GET(request: Request) {
    const c = needConfig();
    if ("response" in c) return c.response;
    const at = now();
    const gate = authorizeOwner(request, c.config, at);
    if ("response" in gate) return gate.response;
    const url = new URL(request.url);
    const exam = url.searchParams.get("exam");
    const days = Number(url.searchParams.get("days"));
    if (!exam || !EXAMS.has(exam) || !Number.isInteger(days) || days < 7 || days > 365) return json({ error: "bad_request" }, 400);
    try {
      await assertActive(c.config);
      const items = await readItems(`learner-${gate.session.id}`, c.config);
      const content = await loadContent();
      return json(summarizeItems(items, content, { exam, days, asOf: at }));
    } catch (error) {
      if (error instanceof RoomError && error.status === 423) return json({ error: "paused" }, 423);
      console.error("learner/report failed", (error as { status?: number })?.status ?? "unknown");
      return json({ error: "unavailable" }, 502);
    }
  };
}

export const GET = createReportGet();
