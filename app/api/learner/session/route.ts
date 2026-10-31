import { json, needConfig, sessionOf } from "@/lib/learner/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const c = needConfig();
  if ("response" in c) return json({ configured: false });
  const s = sessionOf(request, c.config);
  return json({ configured: true, signedIn: !!s, last4: s?.last4 ?? null });
}
