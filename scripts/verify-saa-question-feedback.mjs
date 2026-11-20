import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const origin = urlIndex >= 0 ? args[urlIndex + 1] : "http://localhost:3000";
const questions = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));
const ids = [
  { id: "q-saa-bank-001", correct: true, kind: "single" },
  { id: "q-saa-bank-001", correct: false, kind: "single" },
  { id: "q-saa-bank-002", correct: true, kind: "multiple" },
  { id: "q-saa-bank-002", correct: false, kind: "multiple" },
  { id: "q-saa-costbatch-001", correct: true, kind: "single" },
  { id: "q-saa-costbatch-001", correct: false, kind: "single" },
  { id: "q-saa-costbatch-008", correct: true, kind: "multiple" },
  { id: "q-saa-costbatch-008", correct: false, kind: "multiple" },
  { id: "q-saa-arch-31", correct: true, kind: "single" },
  { id: "q-saa-arch-31", correct: false, kind: "single" },
];
const progressKey = "comptia-a-plus-review-progress-v1";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync("/usr/bin/chromium") ? { executablePath: "/usr/bin/chromium" } : {}),
});

try {
  for (const run of ids) {
    const question = questions.find((item) => item.id === run.id);
    assert.ok(question, `Missing question ${run.id}`);
    const context = await browser.newContext();
    await context.addInitScript((key) => localStorage.removeItem(key), progressKey);
    const page = await context.newPage();
    await page.goto(`${origin}/quiz?questions=${run.id}&exam=saa-c03`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start quiz", exact: true }).click();
    await page.locator("[data-quiz-question]").waitFor();

    const correctIndexes = Array.isArray(question.answer) ? question.answer : [question.answer];
    const pickedIndexes = run.correct
      ? correctIndexes
      : run.kind === "single"
        ? [question.choices.findIndex((_, index) => !correctIndexes.includes(index))]
        : [correctIndexes[0]];
    for (const index of pickedIndexes) {
      await page.getByRole("button", { name: question.choices[index], exact: true }).click();
    }
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    const feedback = page.locator("[data-quiz-feedback]");
    await feedback.waitFor();
    const status = (await feedback.locator("p").first().textContent())?.trim();
    assert.equal(status, run.correct ? "Correct" : "Incorrect", `${run.id} ${run.kind}`);
    const feedbackText = (await feedback.textContent()) ?? "";
    for (let index = 0; index < question.choices.length; index += 1) {
      const expectedClass = correctIndexes.includes(index) ? "Correct" : "Incorrect";
      assert.ok(
        feedbackText.includes(`Option: ${question.choices[index]} — ${expectedClass}:`),
        `${run.id}: missing ${expectedClass} rationale for ${question.choices[index]}`,
      );
    }

    await page.getByRole("button", { name: "Finish", exact: true }).click();
    await page.getByText(run.correct ? "1/1" : "0/1", { exact: true }).waitFor();
    const attempts = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").quizAttempts ?? [], progressKey);
    assert.equal(attempts.length, 1, `${run.id}: completion was not saved`);
    assert.equal(attempts[0].correct, run.correct ? 1 : 0, `${run.id}: saved score mismatch`);
    await context.close();
  }
  console.log("SAA question feedback, scoring, and progress smoke test: PASS");
} finally {
  await browser.close();
}
