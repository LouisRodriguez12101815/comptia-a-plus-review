/** Copy-paste diagnostics. Names, codes, and statuses only. No secrets, SIDs, or phone numbers. */

const SID = /\b(?:AC|SK|IS|VA|UT|SM|MG|CA|PN)[0-9a-f]{32}\b/gi;
const PHONE = /(?:\+\d{10,15}|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b|\b\d{10,15}\b)/g;
const SECRET = /\b(?:secret|token|password|bearer|api[_-]?key)[\w.+/=-]*/gi;

export function scrubSecrets(text: string): string {
  return text.replace(SID, "[redacted]").replace(PHONE, "[redacted]").replace(SECRET, "[redacted]");
}

export type DetailBlock = {
  section: "Study report" | "Diagnostics" | "Connection check";
  error: string;
  call: string;
  code: number | null;
  status: number | null;
};

export type DetailSource = {
  section: DetailBlock["section"];
  status: number;
  error?: string;
  reason?: { call?: string; code?: number | null; status?: number | null };
  checks?: { name: string; ok: boolean; code: number | null; status: number | null }[];
  sections?: { call: string; ok: boolean; code: number | null; status: number | null }[];
};

function block(row: DetailBlock): string {
  return [
    row.section,
    `error: ${row.error || "none"}`,
    `call: ${row.call || "none"}`,
    `twilio: ${row.code ?? "none"}`,
    `http: ${row.status ?? "none"}`,
  ].join("\n");
}

function fromRows(
  section: DetailBlock["section"],
  status: number,
  rows: { call: string; ok: boolean; code: number | null; status: number | null }[],
): string {
  const failed = rows.filter((row) => !row.ok);
  const chosen = failed.length ? failed : [{ call: "none", ok: true, code: null, status }];
  return chosen.map((row) => block({
    section,
    error: row.ok ? "none" : "failed",
    call: row.call,
    code: row.code,
    status: row.ok ? status : row.status ?? (status === 200 ? null : status),
  })).join("\n\n");
}

/** One section of the activity report, ready for the clipboard or a GitHub issue. */
export function formatSectionDetails(source: DetailSource): string {
  if (source.checks) {
    return scrubSecrets(fromRows(source.section, source.status, source.checks.map((check) => ({
      call: check.name, ok: check.ok, code: check.code, status: check.status,
    }))));
  }
  if (source.sections) {
    return scrubSecrets(fromRows(source.section, source.status, source.sections.map((section) => ({
      call: section.call, ok: section.ok, code: section.code, status: section.status,
    }))));
  }
  return scrubSecrets(block({
    section: source.section,
    error: source.error || (source.status === 200 ? "none" : "unavailable"),
    call: source.reason?.call || "request",
    code: source.reason?.code ?? null,
    status: source.reason?.status ?? source.status,
  }));
}
