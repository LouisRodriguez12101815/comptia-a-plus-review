/** Two-browser host-timeout regression against a local build; shared server-service fixture, mocked Sync. */
import assert from 'node:assert/strict';
import { RoomService, EVIDENCE_WAIT } from '../lib/game/room-service.ts';
import { evidenceItemsFor, multiplayerIncidents } from '../lib/game/cooperative.ts';
const args = process.argv.slice(2);
const option = (key, fallback) => { const index = args.indexOf(key); return index < 0 ? fallback : args[index + 1]; };
const origin = new URL(option('--url', 'http://127.0.0.1:3025'));
if (!['localhost', '127.0.0.1'].includes(origin.hostname) || origin.username || origin.password) throw new Error('Use a local build for this fixture test.');
const { chromium } = await import(option('--playwright', 'playwright'));
const browser = await chromium.launch({ ...(option('--browser') ? { executablePath: option('--browser') } : {}), headless: true, args: ['--no-sandbox'] });
try {
  for (const scenario of ['sl-complete-host-missing', 'sl-pending-host-missing', 'host-valid-undiscovered']) {
    let data, serverNow = Date.now();
    const store = { assertActive: async () => {}, read: async () => data, create: async (code, value) => { data = value; return true; }, compareAndSwap: async (code, previous, next) => { if (data !== previous) return false; data = next; return true; } };
    const original = multiplayerIncidents[0];
    const incident = { ...original, id: 'one-valid-dns-observation', steps: original.steps.map((step, index) => ({ ...step, evidence: evidenceItemsFor(original, index)[0].text })) };
    const rooms = new RoomService(store, [incident], { now: () => serverNow, code: () => 'ABC234' });
    const host = await rooms.create('Idj'), teammate = await rooms.join('ABC234', 'sl');
    for (const member of [host, teammate]) await rooms.ready('ABC234', member.token, true);
    await rooms.start('ABC234', host.token); serverNow += 5000;
    const broken = JSON.parse(data), validItem = broken.evidenceAssignments[1].itemIds[0];
    if (scenario !== 'host-valid-undiscovered') broken.evidenceAssignments[0].itemIds = ['missing:host-card'];
    data = JSON.stringify(broken);
    if (scenario === 'sl-complete-host-missing') await rooms.discover('ABC234', teammate.token, 0, 0, validItem);
    const contexts = [], pages = [], requests = [];
    try {
      for (const member of [host, teammate]) {
        const context = await browser.newContext(); contexts.push(context); const page = await context.newPage();
        await page.clock.install();
        await page.addInitScript(() => sessionStorage.setItem('outage-ops-room', 'ABC234'));
        await page.route('**/api/game/rooms/**', async (route) => {
          const request = route.request(), action = new URL(request.url()).pathname.split('/')[5] ?? 'get';
          const payload = request.method() === 'GET' ? {} : JSON.parse(request.postData());
          requests.push({ action, host: member === host });
          if (action === 'token') { await route.fulfill({ status: 503, json: { error: 'Sync unavailable in browser fixture.' } }); return; }
          try {
            const snapshot = action === 'get' ? await rooms.get('ABC234', member.token)
              : action === 'continue-evidence' ? await rooms.continueEvidence('ABC234', member.token, payload.stepIndex, payload.incidentIndex)
              : action === 'actions' ? await rooms.answer('ABC234', member.token, payload.stepIndex, payload.answerId, payload.incidentIndex)
              : action === 'advance' ? await rooms.advance('ABC234', member.token, payload.stepIndex, payload.incidentIndex)
              : await rooms.discover('ABC234', member.token, payload.stepIndex, payload.incidentIndex, payload.itemId);
            await route.fulfill({ status: 200, json: { ...snapshot, storageAvailable: true } });
          } catch (error) { await route.fulfill({ status: error.status ?? 503, json: { error: error.status ? error.message : 'Fixture request failed.' } }); }
        });
        await page.goto(new URL('/game', origin).href);
        await page.getByRole('button', { name: 'Join a room', exact: true }).click();
        await page.getByRole('button', { name: 'Resume previous room', exact: true }).click();
        await page.getByRole('heading', { name: incident.steps[0].title, exact: true }).waitFor();
        pages.push(page);
      }
      const [a, b] = pages;
      const fallback = a.getByRole('button', { name: 'Continue with current evidence', exact: true });
      assert.equal(await fallback.isDisabled(), true);
      assert.equal(await b.getByRole('button', { name: 'Continue with current evidence', exact: true }).count(), 0);
      if (scenario !== 'host-valid-undiscovered') {
        assert.equal(await a.locator('[data-evidence-id]').count(), 0);
        assert.match(await a.getByRole('list', { name: 'Players', exact: true }).textContent(), /Complete \(no assigned items\) · 0\/0/);
      } else assert.equal(await a.locator('[data-evidence-id]').isEnabled(), true);
      if (scenario === 'sl-complete-host-missing') {
        assert.match(await a.getByRole('list', { name: 'Players', exact: true }).textContent(), /complete · 1\/1/);
        await a.getByText('No outstanding evidence requirements.', { exact: true }).waitFor();
      } else {
        assert.equal(await a.locator('[data-answer-id]').first().isEnabled(), false);
        assert.match(await a.getByRole('region', { name: 'Evidence progress', exact: true }).textContent(), /Evidence 1: Outstanding —/);
      }
      serverNow += EVIDENCE_WAIT;
      await a.clock.fastForward(EVIDENCE_WAIT);
      await a.waitForFunction(() => !document.querySelector('[data-host-evidence-continue]').disabled);
      await fallback.click();
      await a.waitForFunction(() => !document.querySelector('[data-answer-id]').disabled);
      await a.getByText('No outstanding evidence requirements.', { exact: true }).waitFor();
      const correct = incident.steps[0].correctAnswerId;
      await a.locator(`[data-answer-id="${correct}"]`).click();
      await a.getByText('Correct diagnostic move', { exact: true }).waitFor();
      await a.getByRole('button', { name: 'Continue mission', exact: true }).click();
      await a.getByRole('heading', { name: incident.steps[1].title, exact: true }).waitFor();
      const result = JSON.parse(data);
      assert.equal(result.score, 100); assert.equal(result.players[0].contributions.evidence, 0); assert.equal(result.players[0].contributions.answers, 100);
      assert.equal(result.players[1].contributions.evidence, scenario === 'sl-complete-host-missing' ? 10 : 0);
      assert.ok(requests.some((request) => request.action === 'continue-evidence' && request.host));
      assert.ok(requests.some((request) => request.action === 'actions' && request.host));
      console.log(`PASS: ${scenario}: prominent host timeout control enabled, POST continue unlocked answers, host submitted and advanced once without discovery credit.`);
    } finally { for (const context of contexts) await context.close(); }
  }
} finally { await browser.close(); }
