import { createDiagnosticsGet } from "@/lib/learner/diagnostics-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createDiagnosticsGet();
