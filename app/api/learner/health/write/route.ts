import { createHealthWrite } from "@/lib/learner/health-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createHealthWrite();
