export type TwilioFailure = { status: number | null; code: number | null };

function inRange(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

/** Status and Twilio code only. The provider message is never returned. */
export function twilioFailure(error: unknown): TwilioFailure {
  const value = error as {
    status?: unknown;
    code?: unknown;
    diagnostic?: { providerStatus?: unknown; providerCode?: unknown };
  } | null;
  return {
    status: inRange(value?.status, 100, 599) ?? inRange(value?.diagnostic?.providerStatus, 100, 599),
    code: inRange(value?.code, 1000, 99999) ?? inRange(value?.diagnostic?.providerCode, 1000, 99999),
  };
}

export const NEEDS_STRONGER_KEY = "needs Auth Token or Main key";

/** A Standard API key is rejected with 70004 when it reads the Account resource. */
export const STANDARD_KEY_ACCOUNT = "Standard API key cannot read the account record; not an error";
export const STANDARD_KEY_ACCOUNT_CODE = 70004;

/** Account, usage, and trigger routes live under /Accounts. A Standard key is rejected there. */
export function needsStrongerKey(failure: TwilioFailure): boolean {
  if (failure.status === 401 || failure.status === 403) return true;
  return failure.code === 20003 || failure.code === 20403;
}
