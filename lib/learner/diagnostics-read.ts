import twilio from "twilio";
import { publicDiagnostics, type DiagnosticSection, type PublicDiagnostics, type UsageRow } from "@/lib/learner/diagnostics";
import type { LearnerConfig } from "@/lib/learner/twilio";
import { NEEDS_STRONGER_KEY, needsStrongerKey, twilioFailure } from "@/lib/learner/twilio-error";

/** Twilio client that rejects every non-GET before it reaches the network. */
export function readOnlyTwilio(config: LearnerConfig) {
  const client = twilio(config.keySid, config.keySecret, {
    accountSid: config.accountSid, logLevel: "silent", autoRetry: false, timeout: 15000,
  });
  if (typeof client.request !== "function") throw new Error("read_only");
  const request = client.request.bind(client);
  client.request = (opts: { method?: string }) => {
    if (String(opts.method ?? "").toUpperCase() !== "GET") throw new Error("read_only");
    return request(opts as Parameters<typeof request>[0]);
  };
  return client;
}

function section(call: DiagnosticSection["call"], error?: unknown): DiagnosticSection {
  if (!error) return { call, ok: true, code: null, status: null, hint: "Fetched." };
  const failure = twilioFailure(error);
  const skipped = (call === "account" || call === "parent" || call === "usage") && needsStrongerKey(failure);
  return {
    call, ok: false, skipped, code: failure.code, status: failure.status,
    hint: skipped ? NEEDS_STRONGER_KEY : "The request failed.",
  };
}

/** GET-only account, Sync service, and usage read. The return value has no full SID and no secret. */
export async function readPublicDiagnostics(config: LearnerConfig, now = Date.now(), client = readOnlyTwilio(config)): Promise<PublicDiagnostics> {
  const sections: DiagnosticSection[] = [];
  let accountFriendlyName = "";
  let ownerAccountSid = config.accountSid;
  let parentFriendlyName: string | null = null;
  try {
    const account = await client.api.v2010.accounts(config.accountSid).fetch();
    accountFriendlyName = String(account.friendlyName ?? "");
    ownerAccountSid = String(account.ownerAccountSid ?? config.accountSid);
    sections.push(section("account"));
  } catch (error) {
    sections.push(section("account", error));
  }
  if (ownerAccountSid && ownerAccountSid !== config.accountSid) {
    try {
      const parent = await client.api.v2010.accounts(ownerAccountSid).fetch();
      parentFriendlyName = typeof parent.friendlyName === "string" ? parent.friendlyName : null;
      sections.push(section("parent"));
    } catch (error) {
      sections.push(section("parent", error));
    }
  }
  let syncServiceFriendlyName = "";
  try {
    const service = await client.sync.v1.services(config.syncServiceSid).fetch();
    syncServiceFriendlyName = String(service.friendlyName ?? "");
    sections.push(section("sync"));
  } catch (error) {
    sections.push(section("sync", error));
  }
  let records: UsageRow[] = [];
  try {
    const listed = await client.usage.records.list({
      startDate: new Date(now - 30 * 86_400_000),
      endDate: new Date(now),
      includeSubaccounts: false,
      pageSize: 100,
    });
    records = listed.map((row) => ({
      category: String(row.category ?? ""),
      count: String(row.count ?? ""),
      usage: String(row.usage ?? ""),
      price: String(row.price ?? ""),
    }));
    sections.push(section("usage"));
  } catch (error) {
    sections.push(section("usage", error));
  }
  return {
    ...publicDiagnostics({
      accountFriendlyName,
      accountSid: config.accountSid,
      ownerAccountSid,
      parentFriendlyName,
      syncServiceFriendlyName,
      records,
      now,
    }),
    sections,
  };
}
