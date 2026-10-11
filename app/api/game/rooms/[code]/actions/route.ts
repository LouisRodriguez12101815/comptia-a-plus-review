import { roomRequest } from "@/lib/game/room-api";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  return roomRequest(request, "answer", (await context.params).code);
}
