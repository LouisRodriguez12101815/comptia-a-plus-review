import { roomRequest } from "@/lib/game/room-api";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  return roomRequest(request, "token", (await context.params).code);
}
export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  return roomRequest(request, "token", (await context.params).code);
}
