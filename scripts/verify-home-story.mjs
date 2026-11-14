import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// Browser regression for visitor controls and timing, independent of learning data.
// CHROMIUM_PATH=/usr/bin/chromium node scripts/verify-home-story.mjs [origin] [captures]
const origin = process.argv[2] ?? "http://127.0.0.1:3000";
const out = process.argv[3] ?? "work/story-review";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errors = [];
const states = ["problem", "transformation", "evidence", "solution"];
try {
  // Virtual time exercises full intervals without making this regression slow/flaky.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const epoch = new Date("2026-11-13T12:00:00Z");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.clock.runFor(200);
  const story = page.locator("[data-story-state]");
  await story.locator('button[aria-pressed="false"]:enabled').waitFor();
  const state = () => story.getAttribute("data-story-state");
  const advance = ms => page.clock.fastForward(ms);
  const outside = async () => { await page.locator("header select").focus(); await page.mouse.move(0, 0); };
  assert.equal(await state(), "problem");
  await advance(7500);
  assert.equal(await state(), "problem", "no early cycling");
  await advance(600);
  assert.equal(await state(), "transformation", "8 second interval advances");
  await advance(8001);
  assert.equal(await state(), "evidence");
  await advance(8001);
  assert.equal(await state(), "solution", "journey reaches a distinct closing solution");
  await advance(7500);
  assert.equal(await state(), "solution", "closing solution gets its own reading interval");
  await advance(600);
  assert.equal(await state(), "problem", "four states wrap only after the solution");
  assert.equal(await story.locator('[aria-live="polite"]').textContent(), "", "automatic changes do not interrupt screen readers");

  const controls = story.locator('[role="group"]').last();
  const buttons = controls.locator("button");
  await buttons.nth(1).focus();
  await page.keyboard.press("Enter");
  assert.equal(await state(), "transformation", "native keyboard next");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await state(), "problem", "arrow navigation");
  assert.ok(await story.locator('[aria-live="polite"]').textContent(), "manual changes are announced");
  await advance(24000);
  assert.equal(await state(), "problem", "focus inside suspends cycling");
  await story.locator('a[href="/methodology"]').focus();
  await advance(16000);
  assert.equal(await state(), "problem", "moving focus within story keeps it paused");
  await outside();
  await advance(7900);
  assert.equal(await state(), "problem", "leaving focus starts a fresh interval");
  await advance(200);
  assert.equal(await state(), "transformation");

  await story.hover({ force: true });
  await advance(24000);
  assert.equal(await state(), "transformation", "hover suspends cycling");
  await page.mouse.move(0, 0);
  await advance(8100);
  assert.equal(await state(), "evidence", "leaving hover resumes cycling");
  const pause = story.locator("button[aria-pressed]");
  await pause.focus();
  await page.keyboard.press("Enter");
  assert.equal(await pause.getAttribute("aria-pressed"), "true");
  await outside();
  await advance(24000);
  assert.equal(await state(), "evidence", "explicit pause persists after leaving");
  await pause.focus();
  await page.keyboard.press("Enter");
  await advance(12000);
  assert.equal(await state(), "evidence", "resume still respects current keyboard focus");
  await outside();
  await advance(8100);
  assert.equal(await state(), "solution");
  await advance(8100);
  assert.equal(await state(), "problem");

  // Simulate browser visibility events explicitly; no claim of physical tab testing.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await advance(24000);
  assert.equal(await state(), "problem", "hidden document suspends cycling");
  assert.equal(await story.getAttribute("data-motion-paused"), "true");
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await advance(7900);
  assert.equal(await state(), "problem");
  await advance(200);
  assert.equal(await state(), "transformation", "visibility restoration starts a full interval");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.clock.runFor(200);
  assert.equal(await state(), "problem");
  await advance(32000);
  assert.equal(await state(), "problem", "reduced motion retains complete first state");
  assert.ok(await pause.isDisabled());
  await buttons.nth(1).focus();
  await page.keyboard.press("Enter");
  assert.equal(await state(), "transformation", "manual navigation remains available in reduced motion");
  console.log("PASS: four-state journey and closing interval, 8-second cycle, wrap, previous/next, arrow keys, focus/hover/user pause, simulated visibility, reduced motion, screen-reader announcements");
  await context.close();

  // Check real layout and interactions on desktop and emulated touch devices.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 800 }]) {
    const mobile = viewport.width < 700;
    const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    p.on("pageerror", error => errors.push(error.message));
    for (const locale of ["", "/fr", "/es", "/pt"]) {
      await p.goto(origin + (locale || "/"), { waitUntil: "domcontentloaded" });
      const hero = p.locator("[data-story-state]");
      const navigation = hero.locator("nav a");
      const visual = hero.locator('button[aria-describedby="story-visual-detail"]');
      const ctrl = hero.locator('[role="group"]').last().locator("button");
      for (const expected of states) {
        await p.locator(`[data-story-state="${expected}"]`).waitFor();
        assert.equal(await hero.getAttribute("data-story-state"), expected);
        assert.equal(await hero.locator("h1").getAttribute("aria-label"), await hero.locator("h1").textContent(), "screen readers receive the complete headline");
        assert.equal(await p.locator('[data-experience="gaplift"]').count(), 1);
        assert.ok(await p.locator('header [data-brand="GapLift"]').isVisible());
        if (!mobile) {
          const ratio = await hero.evaluate(el => el.getBoundingClientRect().height / innerHeight);
          assert.ok(ratio >= .65 && ratio <= .8, `story height is approximately 70% of desktop viewport: ${ratio}`);
        }
        const bounds = await hero.locator("h1, h1 + p, nav a, button, #story-visual-detail").evaluateAll(elements => elements.map(el => {
          const rect = el.getBoundingClientRect();
          return { label: el.textContent || el.getAttribute("aria-label"), top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: innerWidth, height: innerHeight, scroll: scrollY };
        }));
        for (const b of bounds) {
          assert.ok(b.top >= 0 && b.bottom <= b.height && b.left >= 0 && b.right <= b.width && b.scroll === 0, `${locale || "en"} ${viewport.width} ${expected}: above-fold ${b.label}: ${JSON.stringify(b)}`);
        }
        assert.equal(await navigation.count(), 2, "fixed destinations visible in every state");
        assert.equal(await navigation.nth(0).getAttribute("href"), locale + "/methodology");
        assert.equal(await navigation.nth(1).getAttribute("href"), locale + "/certifications");
        if (mobile) await visual.tap();
        else { await visual.focus(); }
        await hero.locator('#story-visual-detail[data-detail-open="true"]').waitFor({ timeout: 5000 }).catch(error => { throw new Error(`${viewport.width} ${locale || "en"} ${expected}: detail did not open`, { cause: error }); });
        assert.equal(await hero.locator("#story-visual-detail").getAttribute("data-detail-open"), "true", "keyboard/touch reveal detail");
        assert.ok(await hero.locator("nav a, button, #story-visual-detail").evaluateAll(elements => elements.every(el => el.getBoundingClientRect().bottom <= innerHeight && scrollY === 0)), "revealed detail keeps links and controls above the fold");
        const toggle = hero.locator('button[aria-controls="story-visual-detail"]');
        await toggle.focus();
        await p.waitForTimeout(50);
        if (await toggle.getAttribute("aria-expanded") === "true") {
          if (mobile) await toggle.tap(); else await toggle.click();
        }
        await hero.locator('#story-visual-detail[data-detail-open="false"]').waitFor({ state: "attached" });
        if (mobile) await toggle.tap(); else await toggle.click();
        await hero.locator('#story-visual-detail[data-detail-open="true"]').waitFor();
        assert.ok(await hero.locator("nav a, button").evaluateAll(elements => elements.every(el => el.getBoundingClientRect().bottom <= innerHeight && scrollY === 0)), "disclosure keeps controls above the fold");
        if (locale === "" && viewport.width !== 1280) await p.screenshot({ path: `${out}/${viewport.width}-${expected}.png` });
        if (mobile) await ctrl.nth(1).tap();
        else await ctrl.nth(1).click();
      }
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no page overflow");
    }
    await p.goto(origin, { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    assert.deepEqual(results.violations.filter(v => ["critical", "serious"].includes(v.impact)).map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
    console.log(`PASS: ${viewport.width}x${viewport.height}, all states/locales above fold, ${mobile ? "touch" : "keyboard"} details, accessibility`);
    await ctx.close();
  }
  const motionContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const motionPage = await motionContext.newPage();
  motionPage.on("pageerror", error => errors.push(error.message));
  await motionPage.goto(origin, { waitUntil: "domcontentloaded" });
  const motionHero = motionPage.locator("[data-story-state]");
  await motionHero.locator('button[aria-pressed="false"]:enabled').waitFor();
  const nextControl = motionHero.locator('[role="group"]').last().locator("button").nth(1);
  await nextControl.click();
  await motionPage.locator('[data-story-state="transformation"]').waitFor();
  await motionPage.waitForTimeout(120);
  const earlyReveal = await motionHero.locator("h1").evaluate(h => {
    const letters = [...h.querySelectorAll("[data-letter]")];
    return { visible: letters.filter(el => Number(getComputedStyle(el).opacity) > .9).length, count: letters.length, sentence: Number(getComputedStyle(h.nextElementSibling).opacity) };
  });
  assert.ok(earlyReveal.visible > 0 && earlyReveal.visible < earlyReveal.count, "headline reveals letter by letter");
  assert.ok(earlyReveal.sentence < .1, "supporting sentence follows the headline");
  await motionPage.waitForFunction(() => [...document.querySelectorAll('h1 [data-letter]')].every(el => Number(getComputedStyle(el).opacity) === 1) && Number(getComputedStyle(document.querySelector('h1 + p')).opacity) === 1);
  await motionHero.locator('[role="group"]').last().locator("button").nth(0).click();
  await motionPage.locator('[data-story-state="problem"]').waitFor();
  for (const expected of states) {
    assert.equal(await motionHero.getAttribute("data-story-state"), expected);
    await motionPage.mouse.click(4, 4);
    await motionPage.waitForTimeout(1300);
    const svg = motionHero.locator("svg");
    const firstFrame = await svg.screenshot();
    await motionPage.waitForTimeout(450);
    assert.notDeepEqual(await svg.screenshot(), firstFrame, expected + " has visible diagram movement");
    const visual = motionHero.locator('button[aria-describedby="story-visual-detail"]');
    await visual.hover();
    await motionHero.locator('#story-visual-detail[data-detail-open="true"]').waitFor();
    assert.equal(await motionHero.locator("#story-visual-detail").getAttribute("data-detail-open"), "true", "pointer reveals one detail");
    await motionPage.mouse.click(4, 4);
    await motionPage.screenshot({ path: `${out}/desktop-normal-${expected}.png`, fullPage: true });
    await motionHero.locator('[role="group"]').last().locator("button").nth(1).click();
  }
  await motionPage.setViewportSize({ width: 390, height: 844 });
  await motionPage.goto(origin + "/methodology", { waitUntil: "domcontentloaded" });
  assert.ok(await motionPage.locator('header [data-brand="GapLift"]').isVisible());
  assert.match(await motionPage.title(), /GapLift/);
  const gapliftColor = await motionPage.locator('[data-experience="gaplift"]').evaluate(el => getComputedStyle(el).getPropertyValue("--color-slate-950").trim());
  assert.equal(gapliftColor, "#171224");
  await motionPage.screenshot({ path: `${out}/methodology-mobile.png`, fullPage: true });
  const methodologyAxe = await new AxeBuilder({ page: motionPage }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  assert.deepEqual(methodologyAxe.violations.filter(v => ["critical", "serious"].includes(v.impact)).map(v => v.id), []);
  await motionPage.setViewportSize({ width: 1440, height: 900 });
  await motionPage.screenshot({ path: `${out}/methodology-desktop.png`, fullPage: true });
  const baseline = process.env.CERTIFICATION_THEME_BASELINE ? JSON.parse(await readFile(process.env.CERTIFICATION_THEME_BASELINE, "utf8")) : null;
  for (const path of ["/certifications", "/core1", "/networking"]) {
    await motionPage.goto(origin + path, { waitUntil: "domcontentloaded" });
    await motionPage.locator("h1").waitFor();
    assert.ok(await motionPage.locator('header [data-brand="Tech Certification Lab"]').isVisible());
    assert.equal(await motionPage.locator('[data-experience="gaplift"]').count(), 0, "study routes do not opt in to GapLift's theme");
    if (baseline) {
      const actual = await motionPage.evaluate(() => Object.fromEntries(['body','header','main','main h1','main a'].map(selector => {
        const style = getComputedStyle(document.querySelector(selector));
        return [selector, {color: style.color, background: style.backgroundColor, border: style.borderColor, font: style.fontFamily}];
      })));
      assert.deepEqual(actual, baseline[path], path + " preserves the study palette");
    }
  }
  await motionContext.close();
  console.log("PASS: GapLift identity, sequential headline/detail reveal, in-place disclosures, all-state motion, methodology theme, certification identity/palette");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
