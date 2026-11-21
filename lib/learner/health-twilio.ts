import twilio from "twilio";
import type { HealthClient, HealthStep } from "@/lib/learner/health";
import type { LearnerConfig } from "@/lib/learner/twilio";
import { twilioFailure } from "@/lib/learner/twilio-error";

export const HEALTH_PROBE_MAP = "learner-health-probe";
const PROBE_KEY = "probe";

type SyncItem = { key: string; data: unknown; dateUpdated?: Date | string | null };
type SyncPage = { instances: SyncItem[]; nextPageUrl?: string };
type SyncItems = {
  (key: string): { fetch: () => Promise<{ data: unknown }>; remove: () => Promise<unknown> };
  page: (args: { pageSize: number }) => Promise<SyncPage>;
  getPage: (url: string) => Promise<SyncPage>;
  create: (args: { key: string; data: object }) => Promise<unknown>;
};
type SyncMap = { syncMapItems: SyncItems; remove: () => Promise<unknown> };
type SyncMaps = {
  (name: string): SyncMap;
  create: (args: { uniqueName: string }) => Promise<unknown>;
};
type SyncService = { syncMaps: SyncMaps };

function step(name: string, error: unknown, hint: string): HealthStep {
  const failure = twilioFailure(error);
  return { name, ok: false, code: failure.code, status: failure.status, hint };
}

function okStep(name: string, hint: string): HealthStep {
  return { name, ok: true, code: null, status: null, hint };
}

async function listItems(service: SyncService, mapName: string) {
  if (mapName === HEALTH_PROBE_MAP) throw new Error("wrong_map");
  const collection = service.syncMaps(mapName).syncMapItems;
  let page: Awaited<ReturnType<typeof collection.page>>;
  try {
    page = await collection.page({ pageSize: 100 });
  } catch (error) {
    throw error;
  }
  const items = page.instances.map((item: SyncItem) => ({
    key: item.key,
    data: item.data,
    dateUpdated: item.dateUpdated ? new Date(item.dateUpdated).toISOString() : null,
  }));
  while (page.nextPageUrl) {
    const next = page.nextPageUrl;
    page = await collection.getPage(next);
    items.push(...page.instances.map((item: SyncItem) => ({
      key: item.key,
      data: item.data,
      dateUpdated: item.dateUpdated ? new Date(item.dateUpdated).toISOString() : null,
    })));
  }
  return items;
}

export async function probeHealthMap(service: SyncService, at: number): Promise<HealthStep[]> {
  const maps = service.syncMaps;
  const steps: HealthStep[] = [];
  try {
    try { await maps.create({ uniqueName: HEALTH_PROBE_MAP }); }
    catch (error) { if (twilioFailure(error).status !== 409) throw error; }
    await maps(HEALTH_PROBE_MAP).syncMapItems.create({ key: PROBE_KEY, data: { probe: true, at } });
    steps.push(okStep("write", "Wrote the probe item."));
  } catch (error) {
    steps.push(step("write", error, "The probe write failed."));
  }
  try {
    const item = await maps(HEALTH_PROBE_MAP).syncMapItems(PROBE_KEY).fetch();
    const data = item.data as { probe?: unknown; at?: unknown } | null;
    if (!data || data.probe !== true || data.at !== at) throw Object.assign(new Error("probe"), { status: 502 });
    steps.push(okStep("read", "Read the probe item back."));
  } catch (error) {
    steps.push(step("read", error, "The probe read failed."));
  }
  try {
    try { await maps(HEALTH_PROBE_MAP).syncMapItems(PROBE_KEY).remove(); }
    catch (error) { if (twilioFailure(error).status !== 404) throw error; }
    try { await maps(HEALTH_PROBE_MAP).remove(); }
    catch (error) { if (twilioFailure(error).status !== 404) throw error; }
    steps.push(okStep("delete", "Deleted the probe item and map."));
  } catch (error) {
    steps.push(step("delete", error, "The probe delete failed."));
  }
  return steps;
}

export function healthClient(config: LearnerConfig): HealthClient {
  const client = twilio(config.keySid, config.keySecret, { accountSid: config.accountSid, logLevel: "error", timeout: 15000 });
  const service = client.sync.v1.services(config.syncServiceSid);
  return {
    async fetchAccount() {
      const account = await client.api.v2010.accounts(config.accountSid).fetch();
      return { friendlyName: String(account.friendlyName ?? "") };
    },
    async fetchSyncService() {
      const found = await service.fetch();
      return { friendlyName: String(found.friendlyName ?? "") };
    },
    listLearner(mapName) { return listItems(service, mapName); },
    async fetchVerify() {
      const found = await client.verify.v2.services(config.verifyServiceSid).fetch();
      return { friendlyName: String(found.friendlyName ?? "") };
    },
    async listUsage() {
      await client.usage.records.list({ pageSize: 20 });
    },
    async fetchTrigger(sid) {
      await client.api.v2010.accounts(config.accountSid).usage.triggers(sid).fetch();
    },
    probe(at) { return probeHealthMap(service, at); },
  };
}
