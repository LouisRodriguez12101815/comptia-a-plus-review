import twilio from "twilio";
import { DailyUsageGuard, type SyncDocuments } from "@/lib/game/room-store";
import { syncCall } from "@/lib/game/provider-errors";
import type { LearnerMap } from "@/lib/learner/store";

const status = (e: unknown) => (e as { status?: number })?.status;

export type LearnerConfig = {
  accountSid: string; keySid: string; keySecret: string; syncServiceSid: string; verifyServiceSid: string; secret: string;
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
  return c;
}

export function twilioLearner(config: LearnerConfig) {
  const client = twilio(config.keySid, config.keySecret, { accountSid: config.accountSid, logLevel: "error", timeout: 5000 });
  const sync = client.sync.v1.services(config.syncServiceSid);
  const documents: SyncDocuments = {
    fetch: (name) => syncCall("documents.fetch", () => sync.documents(name).fetch(), [404]),
    create: (name, data, ttl) => syncCall("documents.create", () => sync.documents.create({ uniqueName: name, data, ttl }), [409]),
    update: (name, data, revision, ttl) => syncCall("documents.update", () => sync.documents(name).update({ data, ifMatch: revision, ttl }), [409, 412]),
  };
  const guard = new DailyUsageGuard(documents);
  const verify = client.verify.v2.services(config.verifyServiceSid);

  const mapName = (id: string) => `learner-${id}`;
  const mapFor = (id: string): LearnerMap => {
    const name = mapName(id);
    const map = () => sync.syncMaps(name);
    return {
      async list() {
        try {
          const items = await syncCall("documents.fetch", () => map().syncMapItems.list({ limit: 100 }), [404]);
          return items.map((i) => ({ key: i.key, data: i.data }));
        } catch (e) { if (status(e) === 404) return []; throw e; }
      },
      async set(key, data) {
        try { await syncCall("documents.update", () => map().syncMapItems(key).update({ data }), [404]); }
        catch (e) {
          if (status(e) !== 404) throw e;
          try { await syncCall("documents.create", () => sync.syncMaps.create({ uniqueName: name }), [409]); }
          catch (e2) { if (status(e2) !== 409) throw e2; }
          await syncCall("documents.create", () => map().syncMapItems.create({ key, data }));
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
