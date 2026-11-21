export type SectionBody = {
  error?: string;
  reason?: { call?: string; code?: number | null; status?: number | null };
};

export type SectionResult =
  | { signedOut: true }
  | { ok: true }
  | { ok: false; key: "forbidden" | "rateLimited" | "paused" }
  | { ok: false; key: "unavailable"; call: string; code: number | null };

/** One section of the report page. A failure here does not describe the other section. */
export function sectionResult(status: number, data: SectionBody): SectionResult {
  if (status === 401 || data.error === "signed_out") return { signedOut: true };
  if (status === 200) return { ok: true };
  if (status === 403 || data.error === "forbidden") return { ok: false, key: "forbidden" };
  if (status === 429 || data.error === "rate_limited") return { ok: false, key: "rateLimited" };
  if (status === 423 || data.error === "paused") return { ok: false, key: "paused" };
  return { ok: false, key: "unavailable", call: data.reason?.call ?? "request", code: data.reason?.code ?? null };
}
