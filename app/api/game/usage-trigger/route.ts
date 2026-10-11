import { RoomError } from "@/lib/game/room-service";
import { syncInfrastructure } from "@/lib/game/room-store";
import { handleUsageTrigger } from "@/lib/game/usage-webhook";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    await handleUsageTrigger(request, syncInfrastructure());
    return Response.json({ received: true }, { headers });
  } catch (error) {
    const known = error instanceof RoomError;
    return Response.json({ error: known ? error.message : "Usage guard unavailable; retry callback." }, { status: known ? error.status : 503, headers });
  }
}
