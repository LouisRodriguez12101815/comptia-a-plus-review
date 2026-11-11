import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const origin = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "/tmp/network-motion-preview";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  await page.goto(origin, { waitUntil: "networkidle" });
  const canvas = page.locator('canvas').first();
  await canvas.waitFor();
  await page.waitForFunction(() => document.querySelector("canvas")?.width > 0);
  const frame = () => canvas.evaluate(c => c.toDataURL());
  await page.screenshot({ path: out + "/desktop-initial.png" });
  const initial = await frame();
  await page.waitForTimeout(5000);
  assert.notEqual(await frame(), initial, "idle packets must move without pointer or scroll");
  await page.screenshot({ path: out + "/desktop-five-seconds.png" });
  for (const href of ["/networking", "/aws-clf", "/aws-saa", "/performance"]) {
    assert.ok(await page.locator('main a[href="' + href + '"]').count(), href + " remains available");
  }
  await page.evaluate(() => scrollTo(0, 780));
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => scrollY >= 700));
  await page.screenshot({ path: out + "/scrolled.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  const mobile = await frame();
  await page.waitForTimeout(1000);
  assert.notEqual(await frame(), mobile, "mobile retains active topology");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: out + "/mobile.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(300);
  const reduced = await frame();
  await page.waitForTimeout(1000);
  assert.equal(await frame(), reduced, "reduced motion keeps topology static");
  await page.screenshot({ path: out + "/reduced-motion.png" });
  await page.goto(origin + "/fr", { waitUntil: "networkidle" });
  assert.ok(await page.getByText("Révisez avec intention.", {exact:true}).count());
  assert.deepEqual(errors, []);
  console.log("Network environment regression: PASS (idle, desktop, mobile, reduced motion, localization)");
} finally { await browser.close(); }
