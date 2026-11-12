import twilio from "twilio";
import { DailyUsageGuard, type SyncDocuments } from "@/lib/game/room-store";
import { syncCall } from "@/lib/game/provider-errors";
import type { ProgressMap } from "@/lib/learner/store";
import { normalizePhone } from "@/lib/learner/session";

const status = (e: unknown) => (e as { status?: number })?.status;

/**
 * A deterministic Sync Map item may be created by another distributed request between
 * our missing-item update and create calls. In that one expected case, update the item
 * that won the race; all other provider errors remain failures.
 */
export async function createSyncMapItemIdempotently(
  create: () => Promise<unknown>,
  update: () => Promise<unknown>,
): Promise<void> {
  try { await create(); }
  catch (error) {
    if (status(error) !== 409) throw error;
    await update();
  }
}

export type LearnerConfig = {
  accountSid: string; keySid: string; keySecret: string; syncServiceSid: string; verifyServiceSid: string; secret: string; allowed: string[];
};

/** Returns null when sync is not fully configured; the panel then stays hidden. */
export function learnerConfig(env: Record<string, string | undefined> = process.env): LearnerConfig | null {
  const c = {
    accountSid: env.TWILIO_ACCOUNT_SID ?? "", keySid: env.TWILIO_API_KEY_SID ?? "", keySecret: env.TWILIO_API_KEY_SECRET ?? "",
    syncServiceSid: env.TWILIO_SYNC_SERVICE_SID ?? "", verifyServiceSid: env.TWILIO_VERIFY_SERVICE_SID ?? "", secret: env.LEARNER_SESSION_SECRET ?? "",
  };
  if (!/^AC[0-9a-f]{32}$/i.test(c.accountSid) || !/^SK[0-9a-f]{32}$/i.test(c.keySid) || !c.keySecret) return null;
  if (!/^IS[0-9a-f]{32}$/i.test(c.syncServiceSid) || !/^VA[0-9a-f]{32}$/i.test(c.verifyServiceSid)) return null;
  if (c.secret.length < 32) return null;
  // Owner-only: sync stays off unless at least one allowed phone number is listed.
  const allowed = (env.LEARNER_ALLOWED_PHONES ?? "").split(",").map((n) => normalizePhone(n.trim())).filter((n): n is string => !!n);
  if (!allowed.length) return null;
  return { ...c, allowed };
}

export function twilioLearner(config: LearnerConfig, client = twilio(config.keySid, config.keySecret, { accountSid: config.accountSid, logLevel: "error", timeout: 5000 })) {
  const sync = client.sync.v1.services(config.syncServiceSid);
  const documents: SyncDocuments = {
    fetch: (name) => syncCall("documents.fetch", () => sync.documents(name).fetch(), [404]),
    create: (name, data, ttl) => syncCall("documents.create", () => sync.documents.create({ uniqueName: name, data, ttl }), [409]),
    update: (name, data, revision, ttl) => syncCall("documents.update", () => sync.documents(name).update({ data, ifMatch: revision, ttl }), [409, 412]),
  };
  const guard = new DailyUsageGuard(documents);
  const verify = client.verify.v2.services(config.verifyServiceSid);

  const mapName = (id: string) => `learner-${id}`;
  const mapFor = (id: string): ProgressMap => {
    const name = mapName(id);
    const map = () => sync.syncMaps(name);
    return {
      async get(key) {
        try {
          const item = await syncCall("documents.fetch", () => map().syncMapItems(key).fetch(), [404]);
          return { data: item.data, revision: item.revision };
        } catch (e) { if (status(e) === 404) return null; throw e; }
      },
      async create(key, data) {
        try {
          await syncCall("documents.create", () => map().syncMapItems.create({ key, data }), [404, 409]);
          return;
        } catch (e) { if (status(e) !== 404) throw e; }
        try { await syncCall("documents.create", () => sync.syncMaps.create({ uniqueName: name }), [409]); }
        catch (e) { if (status(e) !== 409) throw e; }
        // Deliberately no update-on-conflict: immutable chunks and first head
        // publication must never overwrite the winner of a distributed race.
        await syncCall("documents.create", () => map().syncMapItems.create({ key, data }), [409]);
      },
      async replace(key, data, revision) {
        try {
          await syncCall("documents.update", () => map().syncMapItems(key).update({ data, ifMatch: revision }), [409, 412]);
          return true;
        } catch (e) { if ([409, 412].includes(status(e) ?? 0)) return false; throw e; }
      },
      async list() {
        const collection = map().syncMapItems;
        let page: Awaited<ReturnType<typeof collection.page>>;
        try {
          page = await syncCall("documents.fetch", () => collection.page({ pageSize: 100 }), [404]);
        } catch (e) { if (status(e) === 404) return []; throw e; }
        const items = page.instances.map((i) => ({ key: i.key, data: i.data }));
        // Orphan snapshots can outnumber retained telemetry. Read every page;
        // only an initially absent map is empty, never an interrupted listing.
        while (page.nextPageUrl) {
          const next = page.nextPageUrl;
          page = await syncCall("documents.fetch", () => collection.getPage(next));
          items.push(...page.instances.map((i) => ({ key: i.key, data: i.data })));
        }
        return items;
      },
      async set(key, data) {
        try { await syncCall("documents.update", () => map().syncMapItems(key).update({ data }), [404]); }
        catch (e) {
          if (status(e) !== 404) throw e;
          try { await syncCall("documents.create", () => sync.syncMaps.create({ uniqueName: name }), [409]); }
          catch (e2) { if (status(e2) !== 409) throw e2; }
          await createSyncMapItemIdempotently(
            () => syncCall("documents.create", () => map().syncMapItems.create({ key, data }), [409]),
            () => syncCall("documents.update", () => map().syncMapItems(key).update({ data }), [404]),
          );
        }
      },
      async remove(key) { try { await syncCall("documents.update", () => map().syncMapItems(key).remove(), [404]); } catch (e) { if (status(e) !== 404) throw e; } },
      async removeAll() { try { await syncCall("documents.update", () => map().remove(), [404]); } catch (e) { if (status(e) !== 404) throw e; } },
    };
  };

  return {
    guard,
    mapFor,
    sendCode: (to: string) => verify.verifications.create({ to, channel: "sms" }).then(() => undefined),
    checkCode: async (to: string, code: string) => (await verify.verificationChecks.create({ to, code })).status === "approved",
  };
}
export type TwilioLearner = ReturnType<typeof twilioLearner>;
