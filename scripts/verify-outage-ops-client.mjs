/** Optional real-browser regression; run against a local production build. Twilio transport is mocked. */
import assert from 'node:assert/strict';
import { RoomService } from '../lib/game/room-service.ts';
import { multiplayerIncidents } from '../lib/game/cooperative.ts';
import { roomRequest } from '../lib/game/room-api.ts';
const args = process.argv.slice(2);
const option = (key, fallback) => { const index = args.indexOf(key); return index < 0 ? fallback : args[index + 1]; };
const origin = new URL(option('--url', 'http://127.0.0.1:3023'));
if (!['localhost', '127.0.0.1'].includes(origin.hostname) || origin.username || origin.password) throw new Error('Use a local build for this fixture test.');
const { chromium } = await import(option('--playwright', 'playwright'));
let data;
const store = { assertActive: async () => {}, read: async () => data, create: async (code, value) => { data = value; return true; }, compareAndSwap: async (code, previous, next) => { if (data !== previous) return false; data = next; return true; } };
// HTTP operations generate random codes; fixed room service creation is used only by the create bridge.
const rooms = new RoomService(store, multiplayerIncidents, { code: () => 'ABC234' });
const browser = await chromium.launch({ ...(option('--browser') ? { executablePath: option('--browser') } : {}), headless: true, args: ['--no-sandbox'] });
const contexts = [], requests = [], clientEvents = [];
let failEvidence = true, hideAssignment = true;
try {
  const pages = [];
  for (let seat = 0; seat < 2; seat++) {
    const context = await browser.newContext(); contexts.push(context);
    const page = await context.newPage(); let cookie = '';
    await page.clock.install();
    page.on('console', (message) => { if (message.text().startsWith('outage_ops_client_request')) clientEvents.push(message.text()); });
    await page.route('**/api/game/rooms{,/**}', async (route) => {
      const req = route.request(), parts = new URL(req.url()).pathname.split('/'), action = parts[5];
      const operation = parts.length === 4 ? 'create' : ({ actions: 'answer', evidence: 'discover' })[action] ?? action ?? 'get';
      requests.push({ seat, operation });
      if (operation === 'token') { await route.fulfill({ status: 503, json: { error: 'Room storage is unavailable.', diagnostic: { reason: 'permission_denied' } } }); return; }
      if (seat === 1 && operation === 'discover' && failEvidence) { failEvidence = false; await route.fulfill({ status: 503, json: { error: 'Room storage is unavailable.' } }); return; }
      let response;
      if (operation === 'create') {
        const result = await rooms.create(JSON.parse(req.postData()).nickname);
        cookie = `outage_ops_ABC234=${result.token}`;
        response = Response.json({ ...result.snapshot, storageAvailable: true }, { status: 201 });
      } else {
        response = await roomRequest(new Request(req.url(), { method: req.method(), headers: { ...req.headers(), Cookie: cookie }, body: req.method() === 'GET' ? undefined : req.postData() }), operation, 'ABC234', () => ({ store }));
        const setCookie = response.headers.get('set-cookie'); if (setCookie) cookie = setCookie.split(';')[0];
      }
      let body = await response.json();
      if (seat === 1 && operation === 'get' && body.room?.phase !== 'briefing' && body.room?.status === 'playing' && hideAssignment) {
        hideAssignment = false; body = structuredClone(body); body.step.assignedEvidence = [];
      }
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), json: body });
    });
    await page.goto(new URL('/game', origin).href);
    await page.getByRole('button', { name: seat ? 'Join a room' : 'Create a room', exact: true }).click();
    if (seat) await page.getByLabel('Room code', { exact: true }).fill('ABC234');
    await page.getByLabel('Call sign', { exact: true }).fill(seat ? 'Player B' : 'Player A');
    await page.getByRole('button', { name: seat ? 'Join room' : 'Create room', exact: true }).click();
    await page.getByText('Token request: HTTP 503.', { exact: false }).waitFor();
    assert.match(await page.locator('[data-room-connection-status]').textContent(), /Room storage: responding/);
    assert.ok(requests.some((entry) => entry.seat === seat && entry.operation === 'token'));
    pages.push(page);
  }
  const [a, b] = pages;
  for (const page of pages) await page.getByRole('button', { name: 'Mark ready', exact: true }).click();
  await a.clock.fastForward(2000);
  await a.waitForFunction(() => [...document.querySelectorAll('button')].some((button) => button.textContent === 'Start mission' && !button.disabled));
  await a.getByRole('button', { name: 'Start mission', exact: true }).click();
  const room = JSON.parse(data); room.startsAt = Date.now() - 1;
  // Reproduce Player B's stale assignment and receipt from an older room.
  room.evidenceAssignments[1].itemIds = ['old-question:missing-item']; room.evidenceDiscoveries.push(room.players[1].id);
  room.players[1].contributions.evidence = 10; room.players[1].score = 10; data = JSON.stringify(room);
  for (const page of pages) await page.clock.fastForward(2000);
  await b.getByText('Your evidence assignment is unavailable.', { exact: false }).waitFor();
  await b.clock.fastForward(2000);
  for (const page of pages) await page.locator('[data-evidence-id]').waitFor();
  const bId = await b.locator('[data-evidence-id]').getAttribute('data-evidence-id');
  assert.ok(bId && bId !== 'old-question:missing-item');
  assert.notEqual(bId, await a.locator('[data-evidence-id]').getAttribute('data-evidence-id'));
  await a.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
  assert.equal(await a.locator('[data-answer-id]').first().isEnabled(), false);
  await b.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
  await b.getByRole('alert').filter({ hasText: 'Evidence discovery failed (HTTP 503)' }).waitFor();
  await b.clock.fastForward(2000);
  await b.waitForFunction(() => ![...document.querySelectorAll('[role="alert"]')].some((node) => node.textContent.includes('Evidence discovery failed')));
  await b.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
  await b.getByRole('button', { name: 'Review assigned evidence', exact: true }).waitFor();
  await a.clock.fastForward(2000);
  await a.waitForFunction(() => !document.querySelector('[data-answer-id]').disabled);
  const correct = multiplayerIncidents[0].steps[0].correctAnswerId;
  for (const page of pages) await page.locator(`[data-answer-id="${correct}"]`).click();
  await a.clock.fastForward(2000);
  await a.waitForFunction(() => [...document.querySelectorAll('button')].some((button) => button.textContent === 'Continue mission' && !button.disabled));
  await a.getByRole('button', { name: 'Continue mission', exact: true }).click();
  await a.getByRole('heading', { name: multiplayerIncidents[0].steps[1].title, exact: true }).waitFor();
  const result = JSON.parse(data);
  assert.equal(result.score, 100); assert.equal(result.players[1].contributions.evidence, 10); assert.equal(result.players[1].contributions.answers, 100);
  assert.ok(clientEvents.some((entry) => entry.includes('evidence') && entry.includes('succeeded')));
  assert.ok(requests.filter((entry) => entry.operation === 'discover').length >= 3);
  const oldTokenCount = requests.filter((entry) => entry.seat === 1 && entry.operation === 'token').length;
  await b.reload();
  await b.getByRole('button', { name: 'Join a room', exact: true }).click();
  await b.getByRole('button', { name: 'Resume previous room', exact: true }).click();
  await b.getByText('Player B (you)', { exact: true }).waitFor();
  await b.getByText('Token request: HTTP 503.', { exact: false }).waitFor();
  assert.ok(requests.filter((entry) => entry.seat === 1 && entry.operation === 'token').length > oldTokenCount);
  assert.equal(JSON.parse(data).players.length, 2);
  assert.equal(JSON.parse(data).players[1].contributions.answers, 100);
  await a.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
  const disconnected = JSON.parse(data); disconnected.players[1].lastSeenAt = Date.now() - 31000; data = JSON.stringify(disconnected);
  await a.clock.fastForward(2000);
  await a.waitForFunction(() => !document.querySelector('[data-answer-id]').disabled);
  assert.match(await a.getByRole('list', { name: 'Players', exact: true }).textContent(), /Disconnected \(does not block answers\)/);
  console.log('PASS: create/join request token; failed token remains visible without blocking actions; unavailable evidence refreshes; Player B repaired evidence is actionable; evidence POST failure recovers; both answer and host advances without duplicate points; reconnect preserves Player B identity; disconnected evidence owner does not block. Two Chromium contexts, shared fixture, mocked Twilio.');
} finally { for (const context of contexts) await context.close(); await browser.close(); }
