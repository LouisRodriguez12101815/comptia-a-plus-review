import assert from "node:assert/strict";
import test from "node:test";
import { runSetup } from "../scripts/setup-twilio-sync.mjs";

// Synthetic fixtures only; no real credentials or account resources.
const accountSid = "AC" + "0".repeat(32);
const serviceSid = "IS" + "1".repeat(32);
const triggerSid = "UT" + "2".repeat(32);
const webhookUrl = "https://example.invalid/api/game/usage-trigger";
const env = { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: "synthetic-auth-token", TWILIO_USAGE_WEBHOOK_URL: webhookUrl };

function fixture() {
  const output = [], calls = [];
  const service = { sid: serviceSid, accountSid, aclEnabled: true };
  const trigger = { sid: triggerSid, accountSid, usageCategory: "totalprice", triggerBy: "price", triggerValue: "5.000000", recurring: "daily", callbackMethod: "POST", callbackUrl: webhookUrl };
  const services = (sid) => ({ fetch: async () => { calls.push(["fetch service", sid]); return service; } });
  services.create = async (options) => { calls.push(["create service", options]); return service; };
  const triggers = (sid) => ({ fetch: async () => { calls.push(["fetch trigger", sid]); return trigger; } });
  triggers.create = async (options) => { calls.push(["create trigger", options]); return trigger; };
  const options = {
    log: (line) => output.push(line), error: (line) => output.push(line),
    clientFactory: (account, token, settings) => {
      assert.equal(account, accountSid);
      assert.equal(token, env.TWILIO_AUTH_TOKEN);
      assert.equal(settings.logLevel, "silent");
      assert.equal(settings.autoRetry, false);
      return { sync: { v1: { services } }, api: { v2010: { accounts: (sid) => { assert.equal(sid, accountSid); return { usage: { triggers } }; } } } };
    },
  };
  return { output, calls, options, services, triggers, service, trigger };
}

test("default and explicit dry-run make no requests and require no credentials", async () => {
  for (const args of [[], ["--dry-run"]]) {
    const f = fixture();
    f.options.clientFactory = () => assert.fail("Dry-run instantiated a Twilio client");
    assert.equal(await runSetup(args, { TWILIO_USAGE_WEBHOOK_URL: webhookUrl }, f.options), 0);
    assert.equal(f.calls.length, 0);
    assert.match(f.output.join("\n"), /DRY RUN/);
    assert.match(f.output.join("\n"), /Create one Sync Service/);
    assert.match(f.output.join("\n"), /Create one daily Usage Trigger/);
  }
});

test("apply creates exactly one ACL-enabled service and one daily $5 trigger, without leaking credentials", async () => {
  const f = fixture();
  assert.equal(await runSetup(["--apply"], env, f.options), 0);
  assert.deepEqual(f.calls.map(([kind]) => kind), ["create service", "create trigger"]);
  assert.deepEqual(f.calls[0][1], { friendlyName: "Outage Ops", aclEnabled: true });
  assert.deepEqual(f.calls[1][1], { usageCategory: "totalprice", triggerBy: "price", triggerValue: "5", recurring: "daily", callbackMethod: "POST", callbackUrl: webhookUrl, friendlyName: "Outage Ops daily $5 pause" });
  const output = f.output.join("\n");
  assert.ok(output.includes(`TWILIO_SYNC_SERVICE_SID=${serviceSid}`));
  assert.ok(output.includes(`TWILIO_DAILY_USAGE_TRIGGER_SID=${triggerSid}`));
  assert.ok(!output.includes(env.TWILIO_AUTH_TOKEN));
  assert.ok(!output.includes(accountSid));
});

test("reuse verifies existing resources and never updates or creates them", async () => {
  const f = fixture();
  assert.equal(await runSetup(["--apply"], { ...env, TWILIO_SYNC_SERVICE_SID: serviceSid, TWILIO_DAILY_USAGE_TRIGGER_SID: triggerSid }, f.options), 0);
  assert.deepEqual(f.calls.map(([kind]) => kind), ["fetch service", "fetch trigger"]);
});

test("invalid configuration is rejected before any request", async () => {
  for (const [args, values] of [
    [["--apply"], { TWILIO_USAGE_WEBHOOK_URL: webhookUrl }],
    [["--dry-run", "--apply"], env],
    [["--unknown"], env],
    [[], { ...env, TWILIO_USAGE_WEBHOOK_URL: "http://example.invalid/api/game/usage-trigger" }],
    [[], { ...env, TWILIO_USAGE_WEBHOOK_URL: "https://user:password@example.invalid/api/game/usage-trigger" }],
    [[], { ...env, TWILIO_USAGE_WEBHOOK_URL: webhookUrl + "?token=hidden" }],
  ]) {
    const f = fixture();
    f.options.clientFactory = () => assert.fail("Invalid configuration made a request");
    assert.equal(await runSetup(args, values, f.options), 1);
  }
});

test("disabled ACL and mismatched trigger settings fail verification", async () => {
  const acl = fixture(); acl.service.aclEnabled = false;
  assert.equal(await runSetup(["--apply"], env, acl.options), 1);
  assert.equal(acl.calls.length, 1);
  const trigger = fixture(); trigger.trigger.triggerValue = "10";
  assert.equal(await runSetup(["--apply"], env, trigger.options), 1);
  assert.ok(!trigger.output.join("\n").includes("Setup verified"));
});

test("partial failure reports prior service SID but redacts provider errors and never retries creates", async () => {
  const f = fixture();
  f.triggers.create = async () => { throw Object.assign(new Error(env.TWILIO_AUTH_TOKEN + webhookUrl), { status: 403, request: { authorization: env.TWILIO_AUTH_TOKEN } }); };
  assert.equal(await runSetup(["--apply"], env, f.options), 1);
  const output = f.output.join("\n");
  assert.match(output, /HTTP 403/);
  assert.ok(output.includes(serviceSid));
  assert.ok(!output.includes(env.TWILIO_AUTH_TOKEN));
  assert.ok(!output.includes(webhookUrl));
  assert.match(output, /inspect Console before retrying/);
});
