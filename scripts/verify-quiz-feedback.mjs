import assert from "node:assert/strict";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const i = args.indexOf("--url");
const origin = i >= 0 ? args[i + 1] : "http://localhost:3000";
const key = "comptia-a-plus-review-progress-v1";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

const attempts = (raw) =>
  raw ? JSON.parse(raw).quizAttempts ?? [] : [];

try {
  await context.addInitScript((k) => localStorage.removeItem(k), key);

  const page = await context.newPage();

  await page.goto(
    `${origin}/quiz?topic=n10-troubleshoot-method`,
    { waitUntil: "networkidle" }
  );

  await page.getByRole("button", {
    name: "Start quiz",
    exact: true,
  }).click();

  let completed = false;

  for (let step = 0; step < 15; step += 1) {
    const prompt =
      await page.locator("[data-quiz-question]").textContent();

    const choices =
      page.locator("[data-quiz-choices] button");

    assert.ok((await choices.count()) > 0);

    await choices.first().click();

    assert.equal(
      await page.locator("[data-quiz-feedback]").count(),
      0
    );

    await page.getByRole("button", {
      name: "Check answer",
      exact: true,
    }).click();

    const feedback =
      page.locator("[data-quiz-feedback]");

    await feedback.waitFor();

    const text = await feedback.textContent();
    const status =
      (await feedback.locator("p").first().textContent())?.trim();

    assert.ok(
      status === "Correct" || status === "Incorrect"
    );

    const inlineRemediation = page.locator("[data-inline-remediation]");
    assert.equal(await inlineRemediation.count(), status === "Incorrect" ? 1 : 0);
    if (status === "Incorrect") {
      await page.locator("[data-inline-remediation-toggle]").click();
      await inlineRemediation.locator("[data-inline-why-wrong], [data-inline-exam-clue], [data-inline-memory-rule], [data-inline-flashcards], [data-inline-notes]").first().waitFor();
    }

    assert.match(text ?? "", /Your answer:/);
    assert.match(text ?? "", /Correct:/);

    assert.equal(
      await page.locator("[data-quiz-question]").textContent(),
      prompt
    );

    const finish = page.getByRole("button", {
      name: "Finish",
      exact: true,
    });

    if (await finish.count()) {
      const before = attempts(
        await page.evaluate(
          (k) => localStorage.getItem(k),
          key
        )
      );

      await finish.click();

      await page.getByText("Score", {
        exact: true,
      }).waitFor();

      const after = attempts(
        await page.evaluate(
          (k) => localStorage.getItem(k),
          key
        )
      );

      assert.equal(after.length, before.length + 1);

      await page.getByRole("button", {
        name: "Another quiz",
        exact: true,
      }).click();

      const final = attempts(
        await page.evaluate(
          (k) => localStorage.getItem(k),
          key
        )
      );

      assert.equal(final.length, after.length);

      completed = true;
      break;
    }

    await page.getByRole("button", {
      name: "Next",
      exact: true,
    }).click();
  }

  assert.equal(completed, true);

  console.log("Quiz feedback regression: PASS");
} finally {
  await context.close();
  await browser.close();
}
