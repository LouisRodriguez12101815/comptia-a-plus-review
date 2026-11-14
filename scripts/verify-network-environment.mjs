import assert from "node:assert/strict";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

// Local production server only. No accounts, model calls, or service credentials required.
// CHROMIUM_PATH=/usr/bin/chromium node scripts/verify-network-environment.mjs [origin] [screenshots]
const origin = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "work/homepage-review";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
const errors = [];
const writes = [];
const progressKey = "comptia-a-plus-review-progress-v1";
const savedProgress = JSON.stringify({ studyFocus: "n10-009", knownCards: { "review-smoke-marker": true }, unknownCards: {}, quizAttempts: [], mockAttempts: [], schedules: {} });
const recordVideo = process.env.RECORD_MOTION === "1" ? { dir: out, size: { width: 1440, height: 1000 } } : undefined;
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo });
const page = await context.newPage();
page.on("pageerror", error => errors.push(String(error)));
page.on("request", request => { if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method() + " " + request.url()); });
const visit = async (path) => {
  const response = await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), path + " renders successfully");
  await page.locator("h1").waitFor();
  console.log("route", path);
};
const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
const scan = async () => {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  assert.deepEqual(results.violations.filter(v => ["critical", "serious"].includes(v.impact)).map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], "no serious/critical accessibility violations");
  console.log("axe", new URL(page.url()).pathname, await page.evaluate(() => innerWidth), results.violations.map(v => v.id));
};
try {
  await visit("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: progressKey, value: savedProgress });
  await page.reload({ waitUntil: "domcontentloaded" });
  const canvas = page.locator("main canvas");
  await page.waitForFunction(() => document.querySelector("main canvas")?.width > 0);
  const frame = () => canvas.evaluate(c => c.toDataURL());
  const initial = await frame();
  await page.waitForTimeout(1200);
  assert.notEqual(await frame(), initial, "packets move without interaction");
  await noOverflow();
  await page.screenshot({ path: out + "/desktop.png", fullPage: true });
  await scan();

  const pause = page.locator("[data-story-state] button[aria-pressed]");
  await pause.click();
  assert.equal(await pause.getAttribute("aria-pressed"), "true");
  await page.waitForTimeout(100);
  const paused = await frame();
  await page.waitForTimeout(400);
  assert.equal(await frame(), paused, "pause stops canvas animation");
  await pause.click();
  // Resume respects focus/hover: it takes effect after the visitor leaves the story.
  await page.locator("header select").focus();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  assert.notEqual(await frame(), paused, "resume restores animation after interaction ends");

  const summary = page.locator("main summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  assert.ok(await page.locator("main details").evaluate(d => d.open), "review detail disclosure works from keyboard");
  await page.keyboard.press("Enter");

  const methodology = page.locator('main a[href="/methodology"]').first();
  await methodology.focus();
  assert.notEqual(await methodology.evaluate(el => getComputedStyle(el).outlineStyle), "none", "primary link has visible keyboard focus");
  await page.keyboard.press("Enter");
  await page.waitForURL(origin + "/methodology");
  await page.locator('a[href="/assessment-workflow"]').first().click();
  await page.waitForURL(origin + "/assessment-workflow");
  await page.locator("h1").waitFor();
  await visit("/");
  assert.equal(await page.locator("#tracks-heading").count(), 1, "old catalog anchor resolves");
  assert.equal(await page.locator('#game-heading[href="/game"]').count(), 1, "old game anchor retains access");
  await page.locator('main a[href="/certifications"]').first().click();
  await page.waitForURL(origin + "/certifications");
  for (const href of ["/core1", "/core2", "/networking", "/ccna", "/aws-clf", "/aws-saa", "/security-plus", "/azure-admin"]) {
    assert.ok(await page.locator('main a[href="' + href + '"]').isVisible(), href + " remains in catalog");
  }
  await scan();
  await page.locator('main a[href="/networking"]').click();
  await page.waitForURL(origin + "/networking");
  await page.locator("h1").waitFor();
  await visit("/notes/n10-l2-l3-switching");
  await visit("/aws-clf/assessment");
  await visit("/performance");
  assert.equal(await page.evaluate(key => localStorage.getItem(key), progressKey), savedProgress, "navigation preserves stored study focus and progress");

  await page.setViewportSize({ width: 320, height: 800 });
  await visit("/");
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/");
  await noOverflow();
  assert.ok(await page.locator('header a[href="/certifications"]').isVisible(), "mobile catalog is one click away");
  const mobile = await frame();
  await page.waitForTimeout(600);
  assert.notEqual(await frame(), mobile, "mobile motion remains visible");
  await page.screenshot({ path: out + "/mobile.png", fullPage: true });
  await scan();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  const reduced = await frame();
  await page.waitForTimeout(600);
  assert.equal(await frame(), reduced, "reduced motion retains a static field");
  assert.ok(await pause.isDisabled());
  assert.ok(await page.locator('main a[href="/methodology"]').first().isVisible());
  assert.ok(await page.locator('main a[href="/certifications"]').first().isVisible());
  await page.screenshot({ path: out + "/reduced-motion.png", fullPage: true });
  for (const locale of ["fr", "es", "pt", "en"]) {
    await page.locator("header select").selectOption(locale);
    const prefix = locale === "en" ? "" : "/" + locale;
    await page.waitForURL(origin + (prefix || "/"));
    await page.locator('html[lang="' + locale + '"]').waitFor();
    await page.setViewportSize({ width: 320, height: 800 });
    await noOverflow();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('main a[href="' + prefix + '/certifications"]').first().click();
    await page.waitForURL(origin + prefix + "/certifications");
    await page.locator('main a[href="' + prefix + '/networking"]').waitFor();
    await noOverflow();
    if (locale === "fr") await page.screenshot({ path: out + "/french-catalog.png", fullPage: true });
    await visit(prefix || "/");
  }
  assert.equal(await page.evaluate(key => localStorage.getItem(key), progressKey), savedProgress);
  assert.deepEqual(errors, [], "no browser runtime errors");
  assert.deepEqual(writes, [], "browsing adds no model calls, telemetry writes, or paid-service calls");
  console.log("PASS: homepage destinations, all catalog tracks, sample study routes, stored progress, keyboard disclosure/focus, desktop/mobile, animation/pause/reduced motion, four languages, accessibility");
} finally {
  await context.close();
  await browser.close();
}
