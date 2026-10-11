import { roomRequest } from "@/lib/game/room-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return roomRequest(request, "create");
}
