/** Primary browser test: real rendered UI, real Next API routes and real cookies.
 * --mock-sync replaces ONLY the external provider HTTP transport; never intercepts game API routes.
 * Without --mock-sync, run against a configured dedicated test deployment/service.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { multiplayerIncidents } from '../lib/game/cooperative.ts';
const args = process.argv.slice(2);
const option = (key, fallback) => { const i = args.indexOf(key); return i < 0 ? fallback : args[i + 1]; };
const mock = args.includes('--mock-sync');
const origin = new URL(option('--url', 'http://127.0.0.1:3025'));
if (origin.username || origin.password || !['http:', 'https:'].includes(origin.protocol)) throw new Error('Invalid test URL');
if (!['127.0.0.1', 'localhost'].includes(origin.hostname) && origin.protocol !== 'https:') throw new Error('Use HTTPS for a configured deployment');
if (mock && !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('Mock transport must use a local build');
const { chromium } = await import(option('--playwright', 'playwright'));
await mkdir('work', { recursive: true });
const fixtureFile = resolve('work/mock-sync.json');
let server;
if (mock) {
  await writeFile(fixtureFile, '{}');
  server = spawn(process.execPath, ['--require', './tests/fixtures/mock-sync.cjs', './node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', origin.port], {
    env: { ...process.env, OUTAGE_OPS_MOCK_SYNC_FILE: fixtureFile,
      TWILIO_ACCOUNT_SID: 'AC' + '1'.repeat(32), TWILIO_API_KEY_SID: 'SK' + '2'.repeat(32),
      TWILIO_API_KEY_SECRET: 'synthetic-test-secret', TWILIO_AUTH_TOKEN: 'synthetic-test-auth',
      TWILIO_SYNC_SERVICE_SID: 'IS' + '3'.repeat(32), TWILIO_DAILY_USAGE_TRIGGER_SID: 'UT' + '4'.repeat(32),
      TWILIO_USAGE_WEBHOOK_URL: new URL('/api/game/usage-trigger', origin).href }, stdio: 'ignore',
  });
}
const browser = await chromium.launch({ ...(!['127.0.0.1', 'localhost'].includes(origin.hostname) && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}), headless: true, ...(option('--browser') ? { executablePath: option('--browser') } : {}), args: ['--no-sandbox'] });
const contexts = [], operations = [], checks = [];
let phase = 'startup';
const opNames = new Set(['join', 'token', 'ready', 'start', 'evidence', 'continue-evidence', 'actions', 'advance', 'next', 'leave', 'hint', 'role-action']);
const reasonNames = new Set(['configuration_missing', 'configuration_invalid', 'authentication_rejected', 'permission_denied', 'service_not_found', 'account_mismatch', 'rate_limited', 'provider_unavailable', 'network_failure', 'unexpected_failure', 'version_mismatch']);
async function snapshot(page, code) {
  const response = await page.request.get(new URL(`/api/game/rooms/${code}`, origin).href);
  assert.equal(response.status(), 200); return response.json();
}
async function pair() {
  const pages = [];
  let code;
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext({ viewport: i ? { width: 390, height: 844 } : { width: 1366, height: 900 } });
    contexts.push(context);
    const page = await context.newPage();
    page.on('response', async (response) => {
      const path = new URL(response.url()).pathname;
      if (!path.startsWith('/api/game/rooms')) return;
      const suffix = path.split('/').at(-1);
      const operation = path === '/api/game/rooms' ? 'create' : opNames.has(suffix) ? suffix : 'get';
      const id = response.headers()['x-outage-ops-request-id'];
      let reason;
      if (response.status() >= 400) { try { const r = (await response.json()).diagnostic?.reason; if (reasonNames.has(r)) reason = r; } catch {} }
      operations.push({ operation, status: response.status(), ...(id && /^[a-f0-9-]{36}$/i.test(id) ? { requestId: id } : {}), ...(reason ? { reason } : {}) });
    });
    if (mock) {
      // External realtime transport only. REST routes still go to the production server.
      await page.route(/https:\/\/[^/]*twilio\.com\//, (route) => route.abort());
      await page.routeWebSocket(/wss:\/\/[^/]*twilio\.com\//, (ws) => ws.close());
    }
    await page.goto(new URL('/game', origin).href);
    await page.getByRole('button', { name: i ? 'Join a room' : 'Create a room', exact: true }).click();
    if (i) await page.getByLabel('Room code', { exact: true }).fill(code);
    await page.getByLabel('Call sign').fill(i ? 'Phone' : 'Laptop');
    await page.getByRole('button', { name: i ? 'Join room' : 'Create room', exact: true }).click();
    await page.getByRole('heading', { name: 'Response lobby' }).waitFor();
    if (!i) code = (await page.getByLabel('Room code', { exact: true }).textContent()).trim();
    pages.push(page);
  }
  const [a, b] = pages, av = await snapshot(a, code), bv = await snapshot(b, code);
  assert.notEqual(av.viewerId, bv.viewerId); assert.equal(av.viewerId, av.room.hostPlayerId); assert.notEqual(bv.viewerId, bv.room.hostPlayerId);
  for (const page of pages) await page.getByRole('button', { name: 'Mark ready', exact: true }).click();
  await a.getByRole('button', { name: 'Start mission', exact: true }).click();
  await Promise.all(pages.map((page) => page.locator('[data-evidence-id]').first().waitFor()));
  return { a, b, pages, code, av, bv };
}
async function editRoom(code, change) {
  assert.ok(mock, 'Stored-state fault injection is only available in explicitly mocked tests');
  const state = JSON.parse(await readFile(fixtureFile, 'utf8')), document = state[`outage-ops-room-${code}`];
  change(document.data); document.revision = String(Number(document.revision) + 1); document.data.version += 1;
  await writeFile(fixtureFile + '.next', JSON.stringify(state));
  await rename(fixtureFile + '.next', fixtureFile);
}
try {
  // Wait through HTTP, without changing the application routes.
  await browser.newContext().then(async (context) => {
    contexts.push(context);
    for (let n = 0; n < 100; n++) {
      try { if ((await context.request.get(new URL('/api/game/version', origin).href, { timeout: 1000 })).ok()) return; } catch {}
      await new Promise((done) => setTimeout(done, 200));
    }
    throw new Error('Application did not become ready');
  });
  phase = 'guided_recovery';
  const guidedContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); contexts.push(guidedContext);
  const guided = await guidedContext.newPage(); await guided.goto(new URL('/game', origin).href);
  await guided.getByRole('button', { name: 'Begin training', exact: true }).click();
  await guided.getByRole('figure').waitFor();
  await guided.locator('[data-answer-id="router"]').click();
  assert.equal(await guided.getByRole('button', { name: 'Continue →', exact: true }).count(), 0, 'Wrong guided decisions must be recoverable before progression');
  await guided.getByRole('button', { name: 'Try again', exact: true }).click();
  for (const round of multiplayerIncidents[0].steps) {
    await guided.locator(`[data-answer-id="${round.correctAnswerId}"]`).click();
    await guided.getByText('What we learned:', { exact: true }).waitFor();
    await guided.getByRole('button', { name: 'Continue →', exact: true }).click();
  }
  await guided.getByRole('heading', { name: 'Ticket closed. The site is back.', exact: true }).waitFor();
  await guided.getByRole('heading', { name: 'Incident reconstruction', exact: true }).waitFor();
  await guided.getByText('Review: Rebooting shared equipment', { exact: false }).waitFor();
  checks.push('Guided Demo phone walkthrough: diagram, wrong decision, retry, consequence and learning feedback, five decisions, mistake-based debrief and transfer question.');
  await guidedContext.close();
  phase = 'campaign';
  const f = await pair();
  for (let incidentIndex = 0; incidentIndex < multiplayerIncidents.length; incidentIndex++) {
    const incident = multiplayerIncidents[incidentIndex];
    for (let stepIndex = 0; stepIndex < incident.steps.length; stepIndex++) {
      const views = await Promise.all(f.pages.map((p) => snapshot(p, f.code)));
      for (let i = 0; i < 2; i++) {
        const view = views[i], page = f.pages[i];
        assert.equal(view.viewerId, i ? f.bv.viewerId : f.av.viewerId);
        const saved = view.room.evidenceAssignments.find((a) => a.playerId === view.viewerId);
        assert.deepEqual(saved.itemIds, view.step.assignedEvidence.map((c) => c.id));
        assert.equal(view.step.assignedEvidence.length, 1);
        assert.equal(view.room.players.find((p) => p.id === view.viewerId).evidenceStatus.assigned, 1);
        assert.equal(view.networkDiagram.annotations.length, 0);
        await page.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
        await page.getByText('Evidence shared', { exact: true }).waitFor();
        assert.equal((await snapshot(page, f.code)).networkDiagram.annotations.length, 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Diagram must fit phone viewport');
      }
      assert.notEqual(views[0].step.assignedEvidence[0].id, views[1].step.assignedEvidence[0].id);
      const indices = { incidentIndex, stepIndex }, correct = incident.steps[stepIndex].correctAnswerId;
      for (const page of f.pages) {
        const shared = await snapshot(page, f.code);
        assert.equal(shared.sharedFindings.length, 2);
        const panel = page.getByRole('region', { name: 'Shared findings', exact: true });
        await panel.getByText(shared.sharedFindings[0].text, { exact: false }).waitFor();
        await panel.getByText(shared.sharedFindings[1].text, { exact: false }).waitFor();
      }
      if (incidentIndex === 0 && stepIndex === 0) {
        phase = 'wrong_decision_recovery';
        await f.a.locator('[data-answer-id="router"]').click();
        await f.a.getByText('Not the best next move', { exact: true }).waitFor();
        assert.equal(await f.a.locator(`[data-answer-id="${correct}"]`).isEnabled(), true);
        const wrongView = await snapshot(f.a, f.code);
        const repeated = await f.a.request.post(new URL(`/api/game/rooms/${f.code}/actions`, origin).href, { data: { ...indices, answerId: 'router' } });
        assert.equal(repeated.status(), 409);
        assert.equal((await snapshot(f.a, f.code)).room.uptime, wrongView.room.uptime);
      }
      for (const page of f.pages) {
        await page.locator(`[data-answer-id="${correct}"]`).click();
        await page.getByText('Consequence / next test:', { exact: true }).waitFor();
        await page.getByText('What we learned:', { exact: true }).waitFor();
      }
      if (incidentIndex === 0 && stepIndex === 0) {
        await f.a.getByRole('button', { name: 'Publish justified role finding (+20)', exact: true }).click();
        await f.b.getByRole('region', { name: 'Shared findings' }).getByText('Laptop published a justified finding:', { exact: false }).waitFor();
        const recovered = await snapshot(f.a, f.code);
        assert.equal(recovered.room.players.find((p) => p.id === recovered.viewerId).contributions.answers, 100);
        assert.equal(recovered.room.players.find((p) => p.id === recovered.viewerId).contributions.actions, 20);
      }
      const before = await snapshot(f.a, f.code);
      const duplicate = await f.a.request.post(new URL(`/api/game/rooms/${f.code}/actions`, origin).href, { data: { ...indices, answerId: correct } });
      assert.equal(duplicate.status(), 409);
      await f.a.getByRole('button', { name: 'Continue mission', exact: true }).click();
      await f.a.getByRole('heading', { name: stepIndex === incident.steps.length - 1 ? incidentIndex === multiplayerIncidents.length - 1 ? 'Final team debrief' : 'Incident debrief' : incident.steps[stepIndex + 1].title, exact: true }).waitFor();
      const after = await snapshot(f.a, f.code);
      assert.ok(after.room.score > before.room.score);
      if (stepIndex === incident.steps.length - 1) {
        assert.equal(after.learningDebrief.length, (incidentIndex + 1) * 5);
        assert.ok(after.learningDebrief[0].decisions.some((d) => !d.correct));
        await f.a.getByText('Misconception to review:', { exact: false }).first().waitFor();
      }
      if (stepIndex < incident.steps.length - 1) await f.b.getByRole('heading', { name: incident.steps[stepIndex + 1].title, exact: true }).waitFor();
    }
    if (incidentIndex + 1 < multiplayerIncidents.length) {
      await f.a.getByRole('button', { name: 'Next incident · Rotate roles', exact: true }).click();
      await Promise.all(f.pages.map((p) => p.getByRole('heading', { name: multiplayerIncidents[incidentIndex + 1].steps[0].title, exact: true }).waitFor()));
    }
  }
  checks.push('Both isolated players shared discoveries, recovered from an incorrect decision, published a justified role finding, submitted and advanced through all ten questions and both incidents via real routes; duplicate answers rejected; diagrams fit phone width and expose only owned discoveries.');
  for (const page of f.pages) await page.context().close();
  // Real timeout with an undiscovered host card. Fault-injected empty/invalid cards only in mock mode.
  for (const fault of mock ? ['invalid-host-assignment', 'undiscovered-host-card'] : ['undiscovered-host-card']) {
    const g = await pair();
    phase = 'timeout_before_expiry';
    const button = g.a.getByRole('button', { name: 'Continue with current evidence', exact: true });
    assert.equal(await button.isEnabled(), false);
    const early = await g.a.request.post(new URL(`/api/game/rooms/${g.code}/continue-evidence`, origin).href, { data: { stepIndex: 0, incidentIndex: 0 } });
    assert.equal(early.status(), 409);
    if (fault === 'invalid-host-assignment') {
      phase = 'timeout_empty_assignment';
      await editRoom(g.code, (room) => { room.evidenceAssignments.find((a) => a.playerId === g.av.viewerId).itemIds = ['stale:missing']; });
      await g.a.getByText('Complete · 0/0.', { exact: false }).waitFor();
      assert.equal((await snapshot(g.a, g.code)).step.assignedEvidence.length, 0);
    }
    phase = 'timeout_override';
    const overrideResponse = g.a.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/continue-evidence'));
    await button.click({ timeout: 25_000 });
    assert.equal((await overrideResponse).status(), 200);
    await g.a.waitForFunction(() => !document.querySelector('[data-answer-id]').disabled, undefined, { timeout: 1000 });
    assert.equal(await g.a.locator('[data-answer-id]').first().isEnabled(), true, 'Override response must immediately unlock answers');
    const view = await snapshot(g.a, g.code);
    assert.equal(view.evidenceGate.canAnswer, true); assert.equal(view.evidenceGate.continued, true);
    assert.ok(view.room.players.every((p) => p.contributions.evidence === 0));
    await g.a.locator(`[data-answer-id="${multiplayerIncidents[0].steps[0].correctAnswerId}"]`).click();
    await g.a.getByRole('button', { name: 'Continue mission', exact: true }).click();
    await g.a.getByRole('heading', { name: multiplayerIncidents[0].steps[1].title, exact: true }).waitFor();
    const after = await snapshot(g.a, g.code);
    assert.equal(after.room.stepIndex, 1); assert.equal(after.evidenceGate.continued, false);
    assert.equal(after.room.players.find((p) => p.id === g.bv.viewerId).score, 0);
    checks.push(`${fault}: visible server timeout, real override response, immediate submission and advancement, no fabricated discovery points.`);
    for (const page of g.pages) await page.context().close();
  }
  if (mock) {
    phase = 'shared_evidence';
    const h = await pair();
    await editRoom(h.code, (room) => {
      const item = room.evidenceAssignments.find((a) => a.playerId === h.av.viewerId).itemIds[0];
      room.evidenceAssignments.forEach((a) => { a.itemIds = [item]; });
    });
    const hostItem = (await snapshot(h.a, h.code)).step.assignedEvidence[0].id;
    await h.b.locator(`[data-evidence-id="${hostItem}"]`).waitFor();
    await h.a.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
    await h.b.getByText('Evidence shared', { exact: true }).waitFor();
    const shared = await snapshot(h.b, h.code);
    assert.equal(shared.evidenceGate.canAnswer, true);
    assert.equal(shared.room.players.find((p) => p.id === h.bv.viewerId).contributions.evidence, 0);
    for (const page of h.pages) await page.locator(`[data-answer-id="${multiplayerIncidents[0].steps[0].correctAnswerId}"]`).click();
    await h.a.getByRole('button', { name: 'Continue mission', exact: true }).click();
    await h.a.getByRole('heading', { name: multiplayerIncidents[0].steps[1].title, exact: true }).waitFor();
    phase = 'disconnected_reconnect';
    await h.b.context().setOffline(true);
    await editRoom(h.code, (room) => { room.players.find((p) => p.id === h.bv.viewerId).lastSeenAt = Date.now() - 31_000; });
    await h.a.getByRole('button', { name: 'Discover assigned evidence', exact: true }).click();
    await h.a.waitForFunction(() => !document.querySelector('[data-answer-id]').disabled);
    const disconnected = await snapshot(h.a, h.code);
    assert.equal(disconnected.room.players.find((p) => p.id === h.bv.viewerId).evidenceStatus.state, 'disconnected');
    await h.b.context().setOffline(false); await h.b.reload();
    await h.b.getByRole('button', { name: 'Join a room', exact: true }).click();
    await h.b.getByRole('button', { name: 'Resume previous room', exact: true }).click();
    await h.b.getByText('Phone (you)', { exact: true }).waitFor();
    const reconnected = await snapshot(h.b, h.code);
    assert.equal(reconnected.viewerId, h.bv.viewerId); assert.equal(reconnected.room.players.length, 2);
    assert.equal(reconnected.evidenceGate.canAnswer, false, 'Reconnected undiscovered evidence becomes required again');
    checks.push('Mocked shared ownership: one discovery satisfies both without automatic contribution; disconnected owner stops blocking, reconnect preserves cookie identity and restores its requirement through real routes.');
    for (const page of h.pages) await page.context().close();
  }
  assert.ok(['create', 'join', 'token', 'get', 'evidence', 'continue-evidence', 'actions', 'advance'].every((op) => operations.some((r) => r.operation === op && r.status < 400)));
  await writeFile('work/e2e-summary.json', JSON.stringify({ result: 'PASS', mode: mock ? 'MOCKED external Sync HTTP; REAL application routes' : 'Configured Sync service; REAL application routes', checks, operations }, null, 2));
  console.log(JSON.stringify({ result: 'PASS', mode: mock ? 'mocked Sync transport / real routes' : 'configured Sync / real routes', checks }, null, 2));
} catch {
  await writeFile('work/e2e-summary.json', JSON.stringify({ result: 'FAIL', checks, operations }, null, 2));
  console.error(JSON.stringify({ operation: 'browser_test', status: 0, reason: phase + '_failed' }));
  process.exitCode = 1;
} finally {
  for (const context of contexts) await context.close(); await browser.close(); server?.kill('SIGTERM');
}
