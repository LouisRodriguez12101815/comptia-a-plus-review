import { isSecure, json, sameOrigin } from "@/lib/learner/api";
import { clearCookie } from "@/lib/learner/session";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie(isSecure(request)) });
}
