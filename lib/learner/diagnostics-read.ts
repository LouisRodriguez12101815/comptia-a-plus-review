import twilio from "twilio";
import { publicDiagnostics, type UsageRow } from "@/lib/learner/diagnostics";
import type { LearnerConfig } from "@/lib/learner/twilio";

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

/** GET-only account, Sync service, and usage read. The return value has no full SID and no secret. */
export async function readPublicDiagnostics(config: LearnerConfig, now = Date.now()) {
  const client = readOnlyTwilio(config);
  const account = await client.api.v2010.accounts(config.accountSid).fetch();
  const ownerAccountSid = String(account.ownerAccountSid ?? "");
  let parentFriendlyName: string | null = null;
  if (ownerAccountSid && ownerAccountSid !== config.accountSid) {
    try {
      const parent = await client.api.v2010.accounts(ownerAccountSid).fetch();
      parentFriendlyName = typeof parent.friendlyName === "string" ? parent.friendlyName : null;
    } catch {
      parentFriendlyName = null;
    }
  }
  const service = await client.sync.v1.services(config.syncServiceSid).fetch();
  const records = await client.usage.records.list({
    startDate: new Date(now - 30 * 86_400_000),
    endDate: new Date(now),
    includeSubaccounts: false,
    pageSize: 100,
  });
  const usage: UsageRow[] = records.map((row) => ({
    category: String(row.category ?? ""),
    count: String(row.count ?? ""),
    usage: String(row.usage ?? ""),
    price: String(row.price ?? ""),
  }));
  return publicDiagnostics({
    accountFriendlyName: String(account.friendlyName ?? ""),
    accountSid: config.accountSid,
    ownerAccountSid,
    parentFriendlyName,
    syncServiceFriendlyName: String(service.friendlyName ?? ""),
    records: usage,
    now,
  });
}
