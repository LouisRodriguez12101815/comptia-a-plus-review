import twilio from "twilio";
import { RoomError } from "@/lib/game/room-service";
import type { RoomStore } from "@/lib/game/room-types";

export const PAUSED_MESSAGE = "Multiplayer paused for today. Guided Demo is still available.";
export const roomDocumentName = (code: string) => `outage-ops-room-${code}`;
const dailyDocumentName = (date: string) => `outage-ops-usage-${date}`;
export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);
const statusOf = (error: unknown) => (error as { status?: number })?.status;

type Document = { data: unknown; revision: string };
export interface SyncDocuments {
  fetch(name: string): Promise<Document>;
  create(name: string, data: object, ttl: number): Promise<unknown>;
  update(name: string, data: object, revision: string, ttl: number): Promise<unknown>;
}

/** Never cache pause decisions between requests: every Vercel instance observes the same document. */
export class DailyUsageGuard {
  private documents: SyncDocuments;
  private now: () => number;
  constructor(documents: SyncDocuments, now: () => number = Date.now) { this.documents = documents; this.now = now; }

  async assertActive() {
    try {
      const document = await this.documents.fetch(dailyDocumentName(utcDay(this.now())));
      if ((document.data as { MULTIPLAYER_PAUSED?: boolean }).MULTIPLAYER_PAUSED) {
        throw new RoomError(423, PAUSED_MESSAGE);
      }
    } catch (error) {
      if (statusOf(error) !== 404) throw error; // Provider failures fail closed.
    }
  }

  async pause(date: string, amount: number) {
    // Immutable, idempotent per-day latch. Delayed callbacks cannot pause the next day.
    const ttl = Math.max(3600, Math.ceil((Date.parse(`${date}T00:00:00Z`) + 2 * 86400_000 - this.now()) / 1000));
    try {
      await this.documents.create(dailyDocumentName(date), {
        MULTIPLAYER_PAUSED: true, date, amount, pausedAt: this.now(),
      }, ttl);
    } catch (error) { if (statusOf(error) !== 409) throw error; }
  }
}

export class TwilioRoomStore implements RoomStore {
  private revisions = new Map<string, { raw: string; revision: string }>();
  private documents: SyncDocuments;
  private guard: DailyUsageGuard;
  constructor(documents: SyncDocuments, guard: DailyUsageGuard) { this.documents = documents; this.guard = guard; }
  assertActive() { return this.guard.assertActive(); }

  async read(code: string) {
    try {
      const document = await this.documents.fetch(roomDocumentName(code));
      const raw = JSON.stringify(document.data);
      this.revisions.set(code, { raw, revision: document.revision });
      return raw;
    } catch (error) { if (statusOf(error) === 404) return null; throw error; }
  }

  private data(value: string) {
    if (Buffer.byteLength(value, "utf8") > 16 * 1024) throw new RoomError(413, "Room state is too large.");
    return JSON.parse(value) as object;
  }

  async create(code: string, value: string, ttl: number) {
    await this.guard.assertActive();
    try { await this.documents.create(roomDocumentName(code), this.data(value), ttl); return true; }
    catch (error) { if (statusOf(error) === 409) return false; throw error; }
  }

  async compareAndSwap(code: string, previous: string, next: string, ttl: number) {
    await this.guard.assertActive();
    const cached = this.revisions.get(code);
    if (!cached || cached.raw !== previous) return false;
    try { await this.documents.update(roomDocumentName(code), this.data(next), cached.revision, ttl); return true; }
    catch (error) { if ([409, 412].includes(statusOf(error) ?? 0)) return false; throw error; }
  }
}

export function syncInfrastructure() {
  const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_API_KEY_SID: keySid,
    TWILIO_API_KEY_SECRET: keySecret, TWILIO_SYNC_SERVICE_SID: serviceSid,
    TWILIO_AUTH_TOKEN: authToken, TWILIO_USAGE_WEBHOOK_URL: webhookUrl,
    TWILIO_DAILY_USAGE_TRIGGER_SID: triggerSid } = process.env;
  if (!accountSid || !keySid || !keySecret || !serviceSid || !authToken || !webhookUrl || !triggerSid) {
    throw new RoomError(503, "Multiplayer service not configured. Guided Demo is available.");
  }
  const client = twilio(keySid, keySecret, { accountSid });
  const service = client.sync.v1.services(serviceSid);
  const documents: SyncDocuments = {
    fetch: (name) => service.documents(name).fetch(),
    create: (name, data, ttl) => service.documents.create({ uniqueName: name, data, ttl }),
    update: (name, data, revision, ttl) => service.documents(name).update({ data, ifMatch: revision, ttl }),
  };
  const guard = new DailyUsageGuard(documents);
  return { client, service, documents, guard, store: new TwilioRoomStore(documents, guard),
    accountSid, keySid, keySecret, serviceSid, authToken, webhookUrl, triggerSid };
}
