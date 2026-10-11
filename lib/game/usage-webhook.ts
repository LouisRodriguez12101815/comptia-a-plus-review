import twilio from "twilio";
import { RoomError } from "@/lib/game/room-service";
import { utcDay } from "@/lib/game/room-store";
import type { DailyUsageGuard } from "@/lib/game/room-store";

export async function handleUsageTrigger(request: Request, config: {
  accountSid: string; authToken: string; webhookUrl: string; triggerSid: string;
  guard: Pick<DailyUsageGuard, "pause">;
}, now = Date.now()) {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new RoomError(415, "Expected a Twilio usage callback.");
  const raw = await request.text();
  if (raw.length > 8192) throw new RoomError(413, "Callback too large.");
  const fields = new URLSearchParams(raw);
  if (new Set(fields.keys()).size !== [...fields.keys()].length) throw new RoomError(400, "Duplicate callback fields.");
  const params = Object.fromEntries(fields);
  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!twilio.validateRequest(config.authToken, signature, config.webhookUrl, params)
    || params.AccountSid !== config.accountSid || params.UsageTriggerSid !== config.triggerSid) {
    throw new RoomError(403, "Invalid usage callback.");
  }
  const amount = Number(params.CurrentValue);
  const firedAt = Date.parse(params.DateFired);
  if (!params.CurrentValue?.trim() || !Number.isFinite(amount) || !Number.isFinite(firedAt)
    || firedAt > now + 60_000 || params.TriggerBy !== "price" || params.UsageCategory !== "totalprice") {
    throw new RoomError(400, "Invalid daily price callback.");
  }
  // Signed old callbacks are acknowledged without latching the wrong day's state.
  if (amount >= 5 && now - firedAt < 2 * 86400_000) await config.guard.pause(utcDay(firedAt), amount);
}
