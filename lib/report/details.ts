/** Copy-paste diagnostics for a public GitHub issue. Section, error, call, Twilio code, HTTP status, SID last 4, counts, and dates. No account names, full SIDs, secrets, or phone numbers. */

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

type FactRow = {
  call: string;
  ok: boolean;
  code: number | null;
  status: number | null;
  sidLast4?: string | null;
  itemCount?: number;
  dateUpdated?: string | null;
  quizAttempts?: number;
  mockAttempts?: number;
  memoryMisses?: number;
  mistakeRows?: number;
};

type CheckFact = {
  name: string;
  ok: boolean;
  code: number | null;
  status: number | null;
  sidLast4?: string | null;
  itemCount?: number;
  dateUpdated?: string | null;
  quizAttempts?: number;
  mockAttempts?: number;
  memoryMisses?: number;
  mistakeRows?: number;
};

type UsageFact = { category: string; count: string; usage: string; price: string };

export type DetailSource = {
  section: DetailBlock["section"];
  status: number;
  error?: string;
  reason?: { call?: string; code?: number | null; status?: number | null };
  checks?: CheckFact[];
  sections?: FactRow[];
  sidLast4?: string | null;
  usageStart?: string;
  usageEnd?: string;
  usage?: UsageFact[];
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

function last4(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^(?:AC|SK|IS|VA|UT|SM|MG|CA|PN)[0-9a-f]{32}$/i.test(trimmed)) return trimmed.slice(-4);
  if (/^[0-9a-f]{4}$/i.test(trimmed)) return trimmed;
  return null;
}

function iso(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) ? value : null;
}

function metric(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) return value.trim();
  return null;
}

function facts(row: FactRow): string[] {
  const lines: string[] = [];
  const sid = last4(row.sidLast4);
  if (sid) lines.push(`sid: ${sid}`);
  const counts: [string, unknown][] = [
    ["items", row.itemCount],
    ["quizzes", row.quizAttempts],
    ["mocks", row.mockAttempts],
    ["memory misses", row.memoryMisses],
    ["mistake rows", row.mistakeRows],
  ];
  for (const [label, value] of counts) {
    const count = metric(value);
    if (count) lines.push(`${label}: ${count}`);
  }
  const updated = iso(row.dateUpdated);
  if (updated) lines.push(`updated: ${updated}`);
  return lines;
}

function fromRows(section: DetailBlock["section"], status: number, rows: FactRow[]): string {
  const interesting = rows.filter((row) => !row.ok || facts(row).length > 0);
  const chosen = interesting.length ? interesting : [{ call: "none", ok: true, code: null, status: null }];
  return chosen.map((row) => {
    const head = block({
      section,
      error: row.ok ? "none" : "failed",
      call: row.call,
      code: row.code,
      status: row.ok ? status : row.status ?? (status === 200 ? null : status),
    });
    const more = facts(row);
    return more.length ? `${head}\n${more.join("\n")}` : head;
  }).join("\n\n");
}

function trailer(source: DetailSource): string {
  const lines: string[] = [];
  const sid = last4(source.sidLast4);
  if (sid) lines.push(`sid: ${sid}`);
  const start = iso(source.usageStart);
  const end = iso(source.usageEnd);
  if (start) lines.push(`usage start: ${start}`);
  if (end) lines.push(`usage end: ${end}`);
  for (const row of source.usage ?? []) {
    const count = metric(row.count);
    const usage = metric(row.usage);
    const price = metric(row.price);
    if (!count && !usage && !price) continue;
    const label = /^[a-z0-9][a-z0-9._-]{0,40}$/i.test(row.category) ? row.category : "usage";
    lines.push(`${label}: count ${count ?? "none"}, usage ${usage ?? "none"}, price ${price ?? "none"}`);
  }
  return lines.join("\n");
}

/** One section of the activity report, ready for the clipboard or a GitHub issue. */
export function formatSectionDetails(source: DetailSource): string {
  const body = source.checks
    ? fromRows(source.section, source.status, source.checks.map((check) => ({
      call: check.name, ok: check.ok, code: check.code, status: check.status,
      sidLast4: check.sidLast4, itemCount: check.itemCount, dateUpdated: check.dateUpdated,
      quizAttempts: check.quizAttempts, mockAttempts: check.mockAttempts,
      memoryMisses: check.memoryMisses, mistakeRows: check.mistakeRows,
    })))
    : source.sections
      ? fromRows(source.section, source.status, source.sections)
      : block({
        section: source.section,
        error: source.error || (source.status === 200 ? "none" : "unavailable"),
        call: source.reason?.call || "request",
        code: source.reason?.code ?? null,
        status: source.reason?.status ?? source.status,
      });
  const extra = trailer(source);
  return scrubSecrets(extra ? `${body}\n${extra}` : body);
}
