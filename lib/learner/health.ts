import { saaMistakeLog } from "@/lib/saa-mistake-log";
import type { Progress } from "@/lib/progress";
import { normalizePhone } from "@/lib/learner/session";
import { attachArchives } from "@/lib/learner/archive.mjs";
import { loadRemote, type ProgressMap } from "@/lib/learner/store";
import { NEEDS_STRONGER_KEY, needsStrongerKey, STANDARD_KEY_ACCOUNT, STANDARD_KEY_ACCOUNT_CODE, twilioFailure, type TwilioFailure } from "@/lib/learner/twilio-error";
import { DEFAULT_STUDY_FOCUS } from "@/lib/exams";

export type HealthStep = {
  name: string;
  ok: boolean;
  code: number | null;
  status: number | null;
  hint: string;
};

export type HealthRow = {
  name: string;
  ok: boolean;
  code: number | null;
  status: number | null;
  hint: string;
  friendlyName?: string | null;
  sidLast4?: string | null;
  itemCount?: number;
  dateUpdated?: string | null;
  quizAttempts?: number;
  mockAttempts?: number;
  memoryMisses?: number;
  mistakeRows?: number;
  steps?: HealthStep[];
};

export type HealthClient = {
  fetchAccount: () => Promise<{ friendlyName: string }>;
  fetchSyncService: () => Promise<{ friendlyName: string }>;
  listLearner: (mapName: string) => Promise<{ key: string; data: unknown; dateUpdated: string | null }[]>;
  fetchVerify: () => Promise<{ friendlyName: string }>;
  listUsage: () => Promise<void>;
  fetchTrigger: (sid: string) => Promise<void>;
  probe: (at: number) => Promise<HealthStep[]>;
};

const REQUIRED_SIDS: Record<string, RegExp> = {
  TWILIO_ACCOUNT_SID: /^AC[0-9a-f]{32}$/i,
  TWILIO_API_KEY_SID: /^SK[0-9a-f]{32}$/i,
  TWILIO_SYNC_SERVICE_SID: /^IS[0-9a-f]{32}$/i,
  TWILIO_VERIFY_SERVICE_SID: /^VA[0-9a-f]{32}$/i,
};

export function inspectLearnerEnv(env: Record<string, string | undefined>) {
  const missing: string[] = [];
  const malformed: string[] = [];
  for (const [name, pattern] of Object.entries(REQUIRED_SIDS)) {
    const value = env[name]?.trim() ?? "";
    if (!value) missing.push(name);
    else if (!pattern.test(value)) malformed.push(name);
  }
  if (!(env.TWILIO_API_KEY_SECRET ?? "").trim()) missing.push("TWILIO_API_KEY_SECRET");
  const session = env.LEARNER_SESSION_SECRET ?? "";
  if (!session) missing.push("LEARNER_SESSION_SECRET");
  else if (session.length < 32) malformed.push("LEARNER_SESSION_SECRET");
  const phones = (env.LEARNER_ALLOWED_PHONES ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!phones.length) missing.push("LEARNER_ALLOWED_PHONES");
  else if (phones.some((value) => !normalizePhone(value))) malformed.push("LEARNER_ALLOWED_PHONES");
  const optional: [string, (value: string) => boolean][] = [
    ["TWILIO_DAILY_USAGE_TRIGGER_SID", (value) => /^UT[0-9a-f]{32}$/i.test(value)],
    ["TWILIO_USAGE_WEBHOOK_URL", (value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } }],
    ["LEARNER_PRIMARY_PHONE", (value) => normalizePhone(value) !== null],
  ];
  for (const [name, valid] of optional) {
    const value = env[name]?.trim() ?? "";
    if (value && !valid(value)) malformed.push(name);
  }
  const parts = [
    missing.length ? `Missing: ${missing.join(", ")}.` : "",
    malformed.length ? `Malformed: ${malformed.join(", ")}.` : "",
  ].filter(Boolean);
  return {
    ok: missing.length === 0 && malformed.length === 0,
    missing,
    malformed,
    hint: parts.join(" ") || "Every required variable is set and well-formed.",
  };
}

export function progressCounts(progress: Progress | null) {
  const attempts = [...(progress?.quizAttempts ?? []), ...(progress?.mockAttempts ?? [])];
  return {
    quizAttempts: progress?.quizAttempts.length ?? 0,
    mockAttempts: progress?.mockAttempts.length ?? 0,
    memoryMisses: progress?.memoryGames?.misses?.length ?? 0,
    mistakeRows: saaMistakeLog(attempts).length,
  };
}

function row(name: string, ok: boolean, failure: TwilioFailure | null, hint: string, extra: Partial<HealthRow> = {}, log = true): HealthRow {
  const result: HealthRow = { name, ok, code: failure?.code ?? null, status: failure?.status ?? null, hint, ...extra };
  if (!ok && log) console.error("learner/health", name, result.code ?? "none");
  return result;
}

function skipped(name: string): HealthRow {
  return row(name, false, null, "Skipped until config is valid.");
}

function denied(name: string, failure: TwilioFailure, extra: Partial<HealthRow> = {}): HealthRow {
  return row(name, false, failure, needsStrongerKey(failure) ? NEEDS_STRONGER_KEY : "The request failed.", extra);
}

function newest(items: { dateUpdated: string | null }[]): string | null {
  let best: number | null = null;
  let iso: string | null = null;
  for (const item of items) {
    if (!item.dateUpdated) continue;
    const time = Date.parse(item.dateUpdated);
    if (!Number.isFinite(time)) continue;
    if (best === null || time > best) {
      best = time;
      iso = new Date(time).toISOString();
    }
  }
  return iso;
}

async function readCounts(items: { key: string; data: unknown }[]) {
  const map: ProgressMap = {
    async get(key) {
      const found = items.find((item) => item.key === key);
      return found ? { data: found.data, revision: "health" } : null;
    },
    async list() { return items.map((item) => ({ key: item.key, data: item.data })); },
    async set() { throw new Error("read_only"); },
    async remove() { throw new Error("read_only"); },
    async removeAll() { throw new Error("read_only"); },
    async create() { throw new Error("read_only"); },
    async replace() { return false; },
  };
  const loaded = await loadRemote(map);
  const combined = attachArchives(loaded ?? { quizAttempts: [], mockAttempts: [] }, items);
  const progress = {
    studyFocus: loaded?.studyFocus ?? DEFAULT_STUDY_FOCUS,
    knownCards: loaded?.knownCards ?? {},
    unknownCards: loaded?.unknownCards ?? {},
    schedules: loaded?.schedules ?? {},
    quizAttempts: combined.quizAttempts ?? [],
    mockAttempts: combined.mockAttempts ?? [],
    ...(loaded?.memoryGames ? { memoryGames: loaded.memoryGames } : {}),
    ...(loaded?.firstSeen ? { firstSeen: loaded.firstSeen } : {}),
    ...(loaded?.drillPractice ? { drillPractice: loaded.drillPractice } : {}),
    ...(loaded?.clfAssessmentSnapshots ? { clfAssessmentSnapshots: loaded.clfAssessmentSnapshots } : {}),
  };
  return progressCounts(progress);
}

export async function runLearnerHealth(input: {
  env: Record<string, string | undefined>;
  write: boolean;
  now: number;
  sessionOk: boolean;
  learnerMap: string;
  client: HealthClient | null;
}): Promise<HealthRow[]> {
  const inspected = inspectLearnerEnv(input.env);
  const configRow = row("config", inspected.ok, null, inspected.hint);
  if (!inspected.ok || !input.client) {
    const names = ["account", "sync service", "sync read", ...(input.write ? ["sync write"] : []), "verify service", "usage records", "usage trigger", "session"];
    return [configRow, ...names.map(skipped)];
  }
  const client = input.client;
  const checks: HealthRow[] = [configRow];
  const sidLast4 = (input.env.TWILIO_ACCOUNT_SID ?? "").slice(-4);

  try {
    const account = await client.fetchAccount();
    checks.push(row("account", true, null, "Fetched the account.", { friendlyName: account.friendlyName, sidLast4 }));
  } catch (error) {
    const failure = twilioFailure(error);
    if (failure.code === STANDARD_KEY_ACCOUNT_CODE) checks.push(row("account", true, failure, STANDARD_KEY_ACCOUNT, { friendlyName: null, sidLast4 }));
    else checks.push(denied("account", failure, { friendlyName: null, sidLast4 }));
  }

  try {
    const service = await client.fetchSyncService();
    checks.push(row("sync service", true, null, "Fetched the Sync service.", { friendlyName: service.friendlyName }));
  } catch (error) {
    checks.push(row("sync service", false, twilioFailure(error), "The Sync service request failed."));
  }

  if (!input.learnerMap.startsWith("learner-") || input.learnerMap.includes("health-probe")) {
    checks.push(row("sync read", false, null, "The learner map request failed."));
  } else try {
    const items = await client.listLearner(input.learnerMap);
    let counts;
    try {
      counts = await readCounts(items);
    } catch {
      checks.push(row("sync read", false, null, "The learner map could not be read as progress.", { itemCount: items.length, dateUpdated: newest(items) }));
      counts = null;
    }
    if (counts) {
      checks.push(row("sync read", true, null, items.length ? "Read the learner map." : "No learner map yet.", {
        itemCount: items.length,
        dateUpdated: newest(items),
        ...counts,
      }));
    }
  } catch (error) {
    const failure = twilioFailure(error);
    if (failure.status === 404) {
      checks.push(row("sync read", true, null, "No learner map yet.", {
        itemCount: 0, dateUpdated: null, quizAttempts: 0, mockAttempts: 0, memoryMisses: 0, mistakeRows: 0,
      }));
    } else {
      checks.push(row("sync read", false, failure, "The learner map request failed."));
    }
  }

  if (input.write) {
    try {
      const steps = await client.probe(input.now);
      const failed = steps.find((step) => !step.ok);
      for (const step of steps) {
        if (!step.ok) console.error("learner/health", "sync write", step.code ?? "none");
      }
      checks.push(row("sync write", !failed, failed ? { code: failed.code, status: failed.status } : null, failed ? "The probe did not finish." : "Wrote, read, and deleted the probe.", { steps }, false));
    } catch (error) {
      checks.push(row("sync write", false, twilioFailure(error), "The probe did not finish."));
    }
  }

  try {
    const verify = await client.fetchVerify();
    checks.push(row("verify service", true, null, "Fetched the Verify service. No code was sent.", { friendlyName: verify.friendlyName }));
  } catch (error) {
    checks.push(row("verify service", false, twilioFailure(error), "The Verify service request failed. No code was sent."));
  }

  try {
    await client.listUsage();
    checks.push(row("usage records", true, null, "Listed one page of usage records."));
  } catch (error) {
    checks.push(denied("usage records", twilioFailure(error)));
  }

  const trigger = input.env.TWILIO_DAILY_USAGE_TRIGGER_SID?.trim() ?? "";
  if (!trigger) checks.push(row("usage trigger", true, null, "Optional. TWILIO_DAILY_USAGE_TRIGGER_SID is not set."));
  else if (!/^UT[0-9a-f]{32}$/i.test(trigger)) checks.push(row("usage trigger", false, null, "TWILIO_DAILY_USAGE_TRIGGER_SID is malformed."));
  else {
    try {
      await client.fetchTrigger(trigger);
      checks.push(row("usage trigger", true, null, "Fetched the usage trigger."));
    } catch (error) {
      checks.push(denied("usage trigger", twilioFailure(error)));
    }
  }

  checks.push(row("session", input.sessionOk, null, input.sessionOk
    ? "The session cookie matches the session secret and an allowlisted number."
    : "The session cookie does not match this server."));
  return checks;
}
