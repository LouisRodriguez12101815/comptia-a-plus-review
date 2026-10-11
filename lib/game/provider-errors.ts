import { RoomError } from "@/lib/game/room-service";

export type FailureDiagnostic = {
  reason: "configuration_missing" | "configuration_invalid" | "authentication_rejected" | "permission_denied" | "service_not_found" | "account_mismatch" | "rate_limited" | "provider_unavailable" | "network_failure" | "unexpected_failure";
  stage: "configuration" | "service.fetch" | "documents.fetch" | "documents.create" | "documents.update" | "permissions.update" | "room.request";
  providerStatus?: number;
  providerCode?: number;
  variables?: string[];
};

export function providerFailure(error: unknown, stage: FailureDiagnostic["stage"]): RoomError {
  if (error instanceof RoomError) return error;
  const value = error as { status?: unknown; code?: unknown } | null;
  const status = typeof value?.status === "number" && Number.isInteger(value.status) && value.status >= 100 && value.status <= 599 ? value.status : undefined;
  const code = typeof value?.code === "number" && Number.isInteger(value.code) && value.code >= 1000 && value.code <= 99999 ? value.code : undefined;
  let reason: FailureDiagnostic["reason"] = "unexpected_failure";
  let message = "Room storage is unavailable. Please try again shortly.";
  if (status === 401 || code === 20003) {
    reason = "authentication_rejected"; message = "Multiplayer storage authentication was rejected. The deployment administrator must verify the API key and account configuration.";
  } else if (status === 403) {
    reason = "permission_denied"; message = "Multiplayer storage access was denied. The deployment administrator must verify the API key's Sync permissions.";
  } else if (status === 404 && stage === "service.fetch") {
    reason = "service_not_found"; message = "The configured multiplayer Sync Service was not found or is inaccessible to this account/API key.";
  } else if (status === 429) {
    reason = "rate_limited"; message = "Multiplayer storage is rate limited. Please retry shortly.";
  } else if (status !== undefined && status >= 500) {
    reason = "provider_unavailable"; message = "The multiplayer storage provider is unavailable. Please retry shortly.";
  } else if (typeof value?.code === "string" && ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(value.code)) {
    reason = "network_failure"; message = "The deployment could not connect to multiplayer storage. Please retry shortly.";
  }
  // Never retain provider messages, URLs, response bodies, headers, or stack traces.
  return new RoomError(503, message, { reason, stage, providerStatus: status, providerCode: code });
}

export async function syncCall<T>(stage: FailureDiagnostic["stage"], action: () => Promise<T>, expected: number[] = []): Promise<T> {
  try { return await action(); }
  catch (error) {
    if (expected.includes((error as { status?: number })?.status ?? 0)) throw error;
    throw providerFailure(error, stage);
  }
}
