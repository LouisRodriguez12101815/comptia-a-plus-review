import assert from "node:assert/strict";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};

const origin = option("--url", "http://127.0.0.1:3000");
const progressKey = "comptia-a-plus-review-progress-v1";
const questionId = "q-n10c10-03";
const progress = {
  studyFocus: "n10-009",
  knownCards: {},
  unknownCards: {},
  quizAttempts: [{
    topicId: "n10-ch10",
    correct: 0,
    total: 1,
    questionIds: [questionId],
    missedIds: [questionId],
    at: Date.now(),
  }, {
    topicId: "n10-dhcp-ipam-time",
    correct: 0,
    total: 1,
    questionIds: ["q-n10dhcp-05"],
    missedIds: ["q-n10dhcp-05"],
    at: Date.now() + 1,
  }],
  mockAttempts: [],
  schedules: {},
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

try {
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: progressKey, value: progress });

  const page = await context.newPage();
  await page.goto(`${origin}/weak-areas`, { waitUntil: "networkidle" });

  const card = page.locator(`[data-remediation-card="${questionId}"]`);
  await card.waitFor();

  const clusterCard = page.locator('[data-remediation-card="q-n10dhcp-05"]');
  await clusterCard.waitFor();
  await page.locator('[data-cluster-summary] [data-cluster-id="dhcp-lifecycle"]').waitFor();
  assert.ok(await clusterCard.locator("[data-remediation-clue]").count() === 1);
  assert.ok(await clusterCard.locator("[data-remediation-rule]").count() === 1);
  const retryHref = await clusterCard.locator("[data-remediation-retry]").getAttribute("href");
  assert.match(retryHref, /questions=/);
  assert.equal(retryHref.includes("q-n10dhcp-05"), false);

  assert.match(await card.textContent(), /static default route/i);
  assert.ok(await card.locator("[data-remediation-video]").count() > 0);
  assert.ok(await card.locator("[data-remediation-visual]").count() > 0);
  assert.ok(await card.locator("[data-remediation-notes]").count() === 1);
  assert.ok(await card.locator("[data-remediation-retry]").count() === 1);

  const before = await page.evaluate((key) => window.localStorage.getItem(key), progressKey);
  await page.reload({ waitUntil: "networkidle" });
  const after = await page.evaluate((key) => window.localStorage.getItem(key), progressKey);
  assert.equal(after, before, "Viewing Weak Areas must not record a new attempt");

  console.log("Weak Areas remediation regression: PASS");
} finally {
  await context.close();
  await browser.close();
}
