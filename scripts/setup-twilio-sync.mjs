#!/usr/bin/env node
import twilio from "twilio";
import { pathToFileURL } from "node:url";

const HELP = `Usage: node scripts/setup-twilio-sync.mjs [--dry-run | --apply] [--webhook-url HTTPS_URL]

Default: dry-run (no network calls; credentials not required).
Apply reads TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from the process environment.
Webhook URL: --webhook-url or TWILIO_USAGE_WEBHOOK_URL.
Optional reuse: TWILIO_SYNC_SERVICE_SID and TWILIO_DAILY_USAGE_TRIGGER_SID.

Creates exactly these resources when reuse SIDs are absent:
1. One Sync Service, friendly name "Outage Ops", with ACL enforcement enabled.
2. One account-wide Usage Trigger: totalprice, price, 5, daily, POST to the webhook.

API keys must be created separately in Console and their secret saved directly to
Vercel. Room Documents, read permissions, and daily pause Documents are created by
the application at runtime. This script writes no files and prints no credentials.
Retain the printed non-secret resource SIDs for reuse on subsequent runs.
`;

function configuration(args, env) {
  let apply = false, explicitMode = false;
  let webhookUrl = env.TWILIO_USAGE_WEBHOOK_URL;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--apply" || arg === "--dry-run") {
      if (explicitMode) throw new Error("Choose one mode: --dry-run or --apply.");
      explicitMode = true; apply = arg === "--apply";
    } else if (arg === "--webhook-url") {
      webhookUrl = args[++i];
    } else throw new Error("Unknown option. Use --help.");
  }
  let url;
  try { url = new URL(webhookUrl); } catch { throw new Error("Set a valid TWILIO_USAGE_WEBHOOK_URL or pass --webhook-url."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/api/game/usage-trigger") {
    throw new Error("Webhook must be an HTTPS /api/game/usage-trigger URL with no credentials, query, or fragment.");
  }
  // Preserve the exact configured URL: webhook signature verification depends on it.
  for (const [name, prefix] of [["TWILIO_SYNC_SERVICE_SID", "IS"], ["TWILIO_DAILY_USAGE_TRIGGER_SID", "UT"]]) {
    if (env[name] && !new RegExp(`^${prefix}[0-9a-fA-F]{32}$`).test(env[name])) throw new Error(`Invalid ${name}.`);
  }
  if (apply && (!/^AC[0-9a-fA-F]{32}$/.test(env.TWILIO_ACCOUNT_SID ?? "") || !env.TWILIO_AUTH_TOKEN?.trim())) {
    throw new Error("Apply requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your local environment.");
  }
  return { apply, webhookUrl, serviceSid: env.TWILIO_SYNC_SERVICE_SID, triggerSid: env.TWILIO_DAILY_USAGE_TRIGGER_SID };
}

export async function runSetup(args = process.argv.slice(2), env = process.env, {
  clientFactory = twilio, log = (line) => console.log(line), error = (line) => console.error(line),
} = {}) {
  let config;
  try { config = configuration(args, env); }
  catch (failure) { error(failure.message); return 1; }
  if (config.help) { log(HELP); return 0; }
  log(config.apply ? "APPLY: provisioning Twilio resources." : "DRY RUN: no requests will be sent to Twilio.");
  log(`${config.serviceSid ? "Reuse and validate" : "Create"} one Sync Service: Outage Ops, AclEnabled=true.`);
  log(`${config.triggerSid ? "Reuse and validate" : "Create"} one daily Usage Trigger: UsageCategory=totalprice, TriggerBy=price, TriggerValue=5, Recurring=daily, CallbackMethod=POST.`);
  log("Callback URL is read from the supplied configuration and is not printed.");
  if (!config.apply) return 0;

  try {
    // Explicitly suppress SDK debug logging even if TWILIO_LOG_LEVEL is set.
    const client = clientFactory(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, { logLevel: "silent", autoRetry: false, timeout: 15_000 });
    let service;
    if (config.serviceSid) {
      service = await client.sync.v1.services(config.serviceSid).fetch();
    } else {
      service = await client.sync.v1.services.create({ friendlyName: "Outage Ops", aclEnabled: true });
    }
    if (!/^IS[0-9a-fA-F]{32}$/.test(service.sid) || service.accountSid !== env.TWILIO_ACCOUNT_SID || !service.aclEnabled) {
      throw new Error("Resource verification failed");
    }
    log(`TWILIO_SYNC_SERVICE_SID=${service.sid}`);
    const triggers = client.api.v2010.accounts(env.TWILIO_ACCOUNT_SID).usage.triggers;
    const expected = { usageCategory: "totalprice", triggerBy: "price", triggerValue: "5", recurring: "daily", callbackMethod: "POST", callbackUrl: config.webhookUrl };
    const trigger = config.triggerSid ? await triggers(config.triggerSid).fetch()
      : await triggers.create({ ...expected, friendlyName: "Outage Ops daily $5 pause" });
    if (!/^UT[0-9a-fA-F]{32}$/.test(trigger.sid) || trigger.accountSid !== env.TWILIO_ACCOUNT_SID
      || Object.entries(expected).some(([key, value]) => key === "triggerValue" ? Number(trigger[key]) !== Number(value) : trigger[key] !== value)) {
      throw new Error("Resource verification failed");
    }
    log(`TWILIO_DAILY_USAGE_TRIGGER_SID=${trigger.sid}`);
    log("Setup verified. Add these non-secret resource SIDs to Vercel along with the other required variables, then redeploy.");
    log("Future applies without reuse SIDs create another pair. Preserve both SIDs before retrying.");
    return 0;
  } catch (failure) {
    // Never log SDK errors, messages, response bodies, requests, stacks, or headers.
    const status = Number.isInteger(failure?.status) ? ` HTTP ${failure.status}.` : "";
    error(`Twilio setup failed.${status} Check account permissions, ACL and trigger settings in Console. Any resources already reported may still exist; inspect Console before retrying. No rollback was attempted.`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await runSetup();
