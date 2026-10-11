// TEST ONLY: mock external Sync HTTP transport. Next routes, SDK, JWT and cookies are real.
/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload needs CommonJS. */
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const file = process.env.OUTAGE_OPS_MOCK_SYNC_FILE;
if (!file) throw new Error('Missing test fixture path');
const port = Number(process.env.OUTAGE_OPS_MOCK_SYNC_PORT || 3026);
const read = () => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (state) => { fs.writeFileSync(file + '.server', JSON.stringify(state)); fs.renameSync(file + '.server', file); };
http.createServer(async (req, res) => {
  const parts = new URL(req.url, 'http://localhost').pathname.split('/');
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  const form = new URLSearchParams(Buffer.concat(chunks).toString());
  const state = read(), id = decodeURIComponent(parts[5] || form.get('UniqueName') || '');
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const error = (status) => send(status, { code: status === 404 ? 20404 : 20409, message: 'Mock provider failure' });
  if (parts.length === 4) return send(200, { sid: process.env.TWILIO_SYNC_SERVICE_SID, account_sid: process.env.TWILIO_ACCOUNT_SID, acl_enabled: true });
  if (parts[4] !== 'Documents') return error(404);
  if (parts[6] === 'Permissions') return send(200, { identity: parts[7], read: true, write: false, manage: false });
  if (req.method === 'GET') return state[id] ? send(200, state[id]) : error(404);
  if (parts.length === 5) {
    if (state[id]) return error(409);
    state[id] = { sid: 'ET' + '5'.repeat(32), unique_name: id, data: JSON.parse(form.get('Data')), revision: '1' };
  } else {
    if (!state[id]) return error(404);
    if (state[id].revision !== req.headers['if-match']) return error(412);
    state[id] = { ...state[id], data: JSON.parse(form.get('Data')), revision: String(Number(state[id].revision) + 1) };
  }
  write(state); send(200, state[id]);
}).listen(port, '127.0.0.1');

const originalHttp = http.request, originalHttps = https.request;
function transport(original) {
  return function (options, ...args) {
    // With the configured proxy, the absolute provider URL is in path.
    const target = typeof options === 'object' ? options : new URL(options);
    const absolute = typeof target.path === 'string' && target.path.startsWith('https://sync.twilio.com/') ? new URL(target.path) : null;
    if ((target.hostname || target.host) === 'sync.twilio.com' || absolute) {
      const replacement = { ...target, hostname: '127.0.0.1', host: '127.0.0.1', port, protocol: 'http:', agent: http.globalAgent, path: absolute ? absolute.pathname : target.path, headers: { ...target.headers } };
      delete replacement.headers.Authorization; delete replacement.headers.authorization;
      delete replacement.auth;
      return originalHttp.call(http, replacement, ...args);
    }
    return original.call(this, options, ...args);
  };
}
http.request = transport(originalHttp); https.request = transport(originalHttps);
