/** Built-server navigation checks. Supports the same --url / --browser options as verify-a11y.mjs. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { platform } from 'node:os';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const origin = option('--url', 'http://127.0.0.1:3100');
const browserPath = option('--browser', undefined);
if (browserPath) assert.ok(existsSync(browserPath), `Browser not found: ${browserPath}`);
console.log(`Navigation checks: ${platform()}, browser ${browserPath ?? 'Playwright-managed Chromium'}`);
const browser = await chromium.launch(browserPath ? { executablePath: browserPath } : {});
const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const evidence = read('docs/saa-c03-evidence-map.json');
const errors = [];
let checks = 0;
const progressKey = 'comptia-a-plus-review-progress-v1';
const seed = {
  studyFocus: 'saa-c03', knownCards: { 'fc-saa-ec2-placement': true }, unknownCards: {},
  quizAttempts: [{ topicId: 'aws-saa-secure-architectures', correct: 0, total: 1,
    questionIds: ['q-aws-review-saa-c03-1-1'], missedIds: ['q-aws-review-saa-c03-1-1'], at: 1794787200000 }],
  mockAttempts: [], schedules: {},
};

async function visit(page, path) {
  const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
  // A fragment change within the current lesson is a same-document navigation.
  if (response) assert.equal(response.status(), 200, path);
  else assert.equal(page.url(), origin + path, `Unexpected same-document destination: ${path}`);
  checks += 1;
}

try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    context.setDefaultTimeout(15000);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of ['/', '/methodology', '/assessment-workflow', '/certifications', '/aws-saa']) {
      await visit(page, route);
      assert.ok(await page.locator('header select').isVisible(), `Language hidden at ${width}: ${route}`);
      assert.ok(await page.locator('header a[href="/certifications"]').first().isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}: ${route}`);
    }
    {
      const triggerId = await page.getByRole('button', { name: width < 1024 ? 'Open navigation' : 'AWS SAA', exact: true }).getAttribute('aria-controls');
      const trigger = page.locator(`button[aria-controls="${triggerId}"]`);
      await trigger.focus(); await page.keyboard.press('Enter');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
      await page.keyboard.press('Escape');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.ok(await trigger.evaluate((element) => element === document.activeElement));
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  context.setDefaultTimeout(15000);
  await context.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, { key: progressKey, value: seed });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await visit(page, '/');
  const story = page.locator('[data-story-state]');
  const initialState = await story.getAttribute('data-story-state');
  assert.equal(await story.getAttribute('data-motion-paused'), 'true');
  await page.waitForTimeout(8500);
  assert.equal(await story.getAttribute('data-story-state'), initialState);
  await page.getByRole('button', { name: 'Next story state' }).focus();
  await page.keyboard.press('Enter');
  assert.notEqual(await story.getAttribute('data-story-state'), initialState);
  await page.locator('main a[href="/methodology"]').click();
  await page.waitForURL(origin + '/methodology');
  await page.locator('main a[href="/assessment-workflow"]').click();
  await page.waitForURL(origin + '/assessment-workflow');
  await page.locator('main a[href="/certifications"]').click();
  await page.waitForURL(origin + '/certifications');
  await page.locator('main a[href="/aws-saa"]').click();
  await page.waitForURL(origin + '/aws-saa');
  assert.equal(await page.locator('[data-saa-task]').count(), 14);
  assert.equal(await page.locator('#curriculum [data-saa-lesson]').count(), 14);
  assert.equal(await page.locator('#topics a[href^="/notes/"]').count(), 10);
  assert.equal(await page.locator('#shared-resources a[href^="/notes/"]').count(), 5);
  console.log('Passed journey, responsive layout, keyboard menus and retained chapter browsing.');
  for (const row of evidence.repositoryTeaching.tasks) {
    await visit(page, row.repositoryTeaching.href);
    const section = page.locator(`section[id="${row.repositoryTeaching.sectionId}"]`);
    assert.equal(await section.locator('h2').innerText(), row.repositoryTeaching.heading);
    assert.ok((await section.innerText()).includes(row.repositoryTeaching.evidenceExcerpt));
    assert.ok((await section.innerText()).includes(row.repositoryTeaching.workedDecisionExcerpt));
  }
  console.log('Passed all 14 reviewed teaching anchors.');
  await visit(page, '/notes/aws-saa-secure-architectures');
  const visualHref = '/aws-saa/visuals#visual-aws-saa-iam-policy-evaluation';
  await page.locator(`nav[aria-label="Study this chapter"] a[href="${visualHref}"]`).click();
  await page.waitForURL(origin + visualHref);
  await page.waitForFunction(() => [...document.querySelectorAll('iframe')].some((frame) => frame.src.endsWith('/visuals/aws-saa-iam-policy-evaluation.html')));
  await visit(page, '/aws-saa');
  await page.getByRole('link', { name: 'Certifications', exact: true }).click();
  await page.waitForURL(origin + '/certifications');
  await visit(page, '/notes/aws-foundation-identity-security');
  assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).studyFocus, progressKey), 'saa-c03');

  for (const locale of ['fr', 'es', 'pt', 'en']) {
    await page.locator('header select').selectOption(locale);
    const path = `${locale === 'en' ? '' : '/' + locale}/notes/aws-foundation-identity-security`;
    await page.waitForURL(origin + path);
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    for (const route of ['/', '/methodology', '/assessment-workflow', '/certifications', '/aws-saa']) {
      await visit(page, `${locale === 'en' ? '' : '/' + locale}${route}`);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
    }
    await visit(page, `${locale === 'en' ? '' : '/' + locale}/notes/aws-foundation-identity-security`);
  }
  await visit(page, '/test?exam=saa-c03&session=short#navigation-check');
  console.log('Passed localized direct routes; checking locale query and fragment preservation.');
  await page.locator('header select').selectOption('fr');
  await page.waitForURL(origin + '/fr/test?exam=saa-c03&session=short#navigation-check');
  await visit(page, '/fr/quiz?topic=aws-saa-storage#navigation-check');
  await page.locator('header select').selectOption('en');
  await page.waitForURL(origin + '/quiz?topic=aws-saa-storage#navigation-check');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), progressKey);
  assert.deepEqual(saved, seed, 'Browsing and language selection must preserve saved history/cards and the selected SAA focus');
  assert.deepEqual(errors, [], 'Unexpected browser errors');
  await context.close();
  console.log(`Passed: ${checks} route loads, 14 teaching anchors, journey, keyboard menus, locale context, shared focus, reduced motion and seeded progress preservation.`);
} finally {
  await browser.close();
}
