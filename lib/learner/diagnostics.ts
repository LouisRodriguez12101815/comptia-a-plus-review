/** Public account line. Callers pass names and counts only; this function never receives a token. */

export type UsageRow = { category: string; count: string; usage: string; price: string };

export type PublicDiagnostics = {
  accountFriendlyName: string;
  accountSidLast4: string;
  subaccount: boolean;
  parentFriendlyName: string | null;
  syncServiceFriendlyName: string;
  accountMatchesCivicPath: boolean;
  parentMatchesCivicPath: boolean;
  usage: UsageRow[];
  usageStart: string;
  usageEnd: string;
};

const civicPath = (name: string) => /civic\s*path/i.test(name);

export function publicDiagnostics(input: {
  accountFriendlyName: string;
  accountSid: string;
  ownerAccountSid: string;
  parentFriendlyName: string | null;
  syncServiceFriendlyName: string;
  records: UsageRow[];
  now: number;
}): PublicDiagnostics {
  const subaccount = input.ownerAccountSid.length > 0 && input.ownerAccountSid !== input.accountSid;
  const parentFriendlyName = subaccount ? input.parentFriendlyName : null;
  return {
    accountFriendlyName: input.accountFriendlyName,
    accountSidLast4: input.accountSid.slice(-4),
    subaccount,
    parentFriendlyName,
    syncServiceFriendlyName: input.syncServiceFriendlyName,
    accountMatchesCivicPath: civicPath(input.accountFriendlyName),
    parentMatchesCivicPath: civicPath(parentFriendlyName ?? ""),
    usage: input.records
      .filter((row) => /sync|verify/i.test(row.category))
      .map((row) => ({ category: row.category, count: row.count, usage: row.usage, price: row.price })),
    usageStart: new Date(input.now - 30 * 86_400_000).toISOString(),
    usageEnd: new Date(input.now).toISOString(),
  };
}
