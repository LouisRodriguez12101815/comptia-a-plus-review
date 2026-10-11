import { roomRequest } from "@/lib/game/room-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  return roomRequest(request, "get", (await context.params).code);
}
