import assert from "node:assert/strict";
import { chromium } from "playwright";
import questions from "../content/questions.json" with { type: "json" };

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};

const origin = option("--url", "http://127.0.0.1:3000");
const progressKey = "comptia-a-plus-review-progress-v1";
const questionId = "q-n10c10-03";
const clusterQuestionId = "q-n10dhcp-05";
assert.ok(questions.some((question) => question.id === questionId), `${questionId} is missing from the imported question bank`);
assert.ok(questions.some((question) => question.id === clusterQuestionId), `${clusterQuestionId} is missing from the imported question bank`);
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
    questionIds: [clusterQuestionId],
    missedIds: [clusterQuestionId],
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
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.stack ?? error));
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(`${origin}/en/weak-areas`, { waitUntil: "networkidle" });

  assert.equal(new URL(page.url()).pathname, "/weak-areas", "Weak Areas did not resolve to the canonical English pathname");
  const storedProgress = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, progressKey);
  assert.deepEqual(storedProgress, progress, "Seeded progress is missing or was repaired before Weak Areas rendered");
  assert.equal(storedProgress.studyFocus, "n10-009");
  assert.ok(storedProgress.quizAttempts.some((attempt) => attempt.questionIds?.includes(questionId)));
  assert.ok(storedProgress.quizAttempts.some((attempt) => attempt.questionIds?.includes(clusterQuestionId)));

  const cardIds = await page.locator("[data-remediation-card]").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-remediation-card")),
  );
  const bodyText = await page.locator("body").innerText();
  const diagnostic = {
    url: page.url(),
    title: await page.title(),
    bodyText,
    cardIds,
    hasClusterSummary: await page.locator("[data-cluster-summary]").count() > 0,
    emptyStateVisible: bodyText.includes("No missed questions yet"),
    consoleErrors,
    pageErrors,
  };
  assert.ok(cardIds.includes(questionId), `Expected Weak Areas remediation card was not rendered: ${JSON.stringify(diagnostic)}`);

  const card = page.locator(`[data-remediation-card="${questionId}"]`);
  await card.waitFor();

  const clusterCard = page.locator(`[data-remediation-card="${clusterQuestionId}"]`);
  await clusterCard.waitFor();
  await page.locator('[data-cluster-summary] [data-cluster-id="dhcp-lifecycle"]').waitFor();
  assert.ok(await clusterCard.locator("[data-remediation-clue]").count() === 1);
  assert.ok(await clusterCard.locator("[data-remediation-rule]").count() === 1);
  const retryHref = await clusterCard.locator("[data-remediation-retry]").getAttribute("href");
  assert.match(retryHref, /questions=/);
  assert.equal(retryHref.includes(clusterQuestionId), false);

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
