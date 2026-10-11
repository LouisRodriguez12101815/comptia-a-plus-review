import { BUILD_COMMIT, ROOM_PROTOCOL_VERSION } from "@/lib/game/version";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ buildCommit: BUILD_COMMIT, protocolVersion: ROOM_PROTOCOL_VERSION },
    { headers: { "Cache-Control": "no-store" } });
}
