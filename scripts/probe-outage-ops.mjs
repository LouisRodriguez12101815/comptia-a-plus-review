#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const reasons = new Set(["configuration_missing", "configuration_invalid", "authentication_rejected", "permission_denied", "service_not_found", "account_mismatch", "rate_limited", "provider_unavailable", "network_failure", "unexpected_failure"]);
const stages = new Set(["configuration", "service.fetch", "documents.fetch", "documents.create", "documents.update", "permissions.update", "room.request"]);
const variableNames = new Set(["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_SYNC_SERVICE_SID", "TWILIO_AUTH_TOKEN", "TWILIO_USAGE_WEBHOOK_URL", "TWILIO_DAILY_USAGE_TRIGGER_SID"]);

/** Probe public APIs using temporary membership cookies in memory, never credentials. */
export async function probeRooms(url, { fetchImpl = fetch, report = console.log } = {}) {
  const base = new URL(url);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Use a deployment origin without credentials, query, or path.');
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Use HTTPS for a deployed site.');
  const cookies = ['', ''];
  async function call(method, suffix, payload, player = 0) {
    const path = '/api/game/rooms' + suffix;
    let response;
    try { response = await fetchImpl(new URL(path, base), { method, redirect: 'error', signal: AbortSignal.timeout(10000), headers: { ...(payload ? { 'Content-Type': 'application/json' } : {}), ...(cookies[player] ? { Cookie: cookies[player] } : {}) }, body: payload ? JSON.stringify(payload) : undefined }); }
    catch { report({ method, endpoint: path.replace(/\/rooms\/[^/]+/, '/rooms/{code}'), status: null, reason: 'network_or_proxy_failure' }); return null; }
    let value = {};
    try { const parsed = await response.json(); if (parsed && typeof parsed === 'object') value = parsed; } catch { /* HTML protection pages are never printed. */ }
    const diagnostic = value.diagnostic ?? {};
    const sanitized = { method, endpoint: path.replace(/\/rooms\/[^/]+/, '/rooms/{code}'), status: response.status };
    if (reasons.has(diagnostic.reason)) sanitized.reason = diagnostic.reason;
    if (stages.has(diagnostic.stage)) sanitized.stage = diagnostic.stage;
    if (Number.isInteger(diagnostic.providerStatus) && diagnostic.providerStatus >= 100 && diagnostic.providerStatus <= 599) sanitized.providerStatus = diagnostic.providerStatus;
    if (Number.isInteger(diagnostic.providerCode) && diagnostic.providerCode >= 1000 && diagnostic.providerCode <= 99999) sanitized.providerCode = diagnostic.providerCode;
    if (Array.isArray(diagnostic.variables)) sanitized.variables = diagnostic.variables.filter((name) => variableNames.has(name));
    const id = response.headers.get('X-Outage-Ops-Request-Id');
    if (id && /^[a-f0-9-]{36}$/i.test(id)) sanitized.requestId = id;
    if (response.status === 405) sanitized.reason = 'method_not_supported';
    report(sanitized);
    if (!response.ok) return null;
    const cookie = response.headers.get('set-cookie');
    if (cookie) cookies[player] = cookie.split(';')[0];
    return value;
  }
  const created = await call('POST', '', { nickname: 'Probe A' });
  const code = created?.room?.code;
  // Never join somebody else's room when creation failed. Invalid code is intentional.
  const validCode = typeof code === 'string' && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code);
  const path = '/' + (validCode ? code : 'INVALID');
  const joined = await call('POST', path + '/join', { nickname: 'Probe B' }, 1);
  const state = await call('GET', path);
  await call('GET', path + '/token');
  await call('POST', path + '/token', {});
  await call('POST', path + '/evidence', { incidentIndex: state?.room?.incidentIndex ?? 0, stepIndex: state?.room?.stepIndex ?? 0 });
  report({ sharedRoomCreated: !!(validCode && joined), evidenceNote: 'Lobby discovery should return 409; use the device checklist for active-incident discovery. No membership cookies or Sync tokens are printed.' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--url') { console.error('Usage: node scripts/probe-outage-ops.mjs --url https://YOUR_DEPLOYMENT'); process.exitCode = 1; }
  else { try { await probeRooms(args[1], { report: (value) => console.log(JSON.stringify(value)) }); } catch { console.error('Probe could not run. Use a valid deployment origin; no credentials are required.'); process.exitCode = 1; } }
}
