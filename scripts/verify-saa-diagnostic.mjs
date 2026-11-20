import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { SAA_DIAGNOSTIC_IDS } from '../lib/saa-diagnostic.mjs';

const args = process.argv.slice(2);
const value = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const origin = value('--url', 'http://127.0.0.1:3012');
const browserPath = value('--browser', existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const questions = JSON.parse(readFileSync(new URL('../content/questions.json', import.meta.url)));
const reviewed = questions.filter((q) => SAA_DIAGNOSTIC_IDS.includes(q.id));
const browser = await chromium.launch({ headless: true, ...(browserPath ? { executablePath: browserPath } : {}), args: ['--no-sandbox'] });
try {
  for (const locale of ['en', 'es', 'fr', 'pt']) {
    const m = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url)));
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${origin}${prefix}/aws-saa`, { waitUntil:'networkidle' });
    const link = page.locator('a[href*="/test?diagnostic=saa"]');
    assert.ok(await link.count(), `${locale}: SAA workspace link`);
    await page.goto(`${origin}${prefix}/test?diagnostic=saa`, { waitUntil:'networkidle' });
    await page.getByRole('heading', { name:m.examTest.saaDiagnosticTitle, exact:true }).waitFor();
    assert.ok((await page.locator('body').innerText()).includes(m.examTest.saaDiagnosticLimit.replace('{count}', '25').replace('{missing}', '40').replace('{minutes}', '50')));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${locale}: mobile overflow`);
    const start = page.getByRole('button', { name:m.examTest.startTest.replace('{count}', '25'), exact:true });
    await start.focus(); await page.keyboard.press('Enter');
    await page.getByRole('timer').waitFor();
    assert.match(await page.getByRole('timer').innerText(), /^49:|^50:00$/);
    await page.getByRole('button', {name:m.examTest.endTest, exact:true}).click();
    await page.getByRole('button', {name:m.examTest.scoreAll, exact:true}).click();
    await page.getByRole('heading', {name:m.examTest.saaTaskResults, exact:true}).waitFor();
    assert.ok((await page.locator('body').innerText()).includes(m.examTest.saaNoQuestions));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${locale}: results overflow`);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`✓ ${locale}: workspace link, shortfall, mobile setup/results and 50-minute timer`);
  }

  const context = await browser.newContext({ viewport:{width:1280,height:900} });
  const page = await context.newPage();
  await page.goto(`${origin}/test?diagnostic=saa`, { waitUntil:'networkidle' });
  await page.getByRole('link', { name:'Open the full 65-question practice test' }).click();
  await page.getByRole('button', { name:'Start 65-question test', exact:true }).waitFor();
  await page.goto(`${origin}/test?diagnostic=saa`, { waitUntil:'networkidle' });
  await page.getByRole('button', { name:'Start 25-question test', exact:true }).click();
  const seen = new Set(); let single = false;
  for (let index = 0; index < 25; index++) {
    const headings = await page.locator('h2').allTextContents();
    const question = reviewed.find((q) => headings.includes(q.prompt));
    assert.ok(question, `question ${index + 1} must belong to the reviewed pool`);
    assert.ok(!seen.has(question.id), `duplicate ${question.id}`); seen.add(question.id);
    let selected = [];
    if (!single && typeof question.answer === 'number') { selected = [question.answer]; single = true; }
    if (question.id === 'q-saa-bank-002') selected = [question.answer[0]];
    if (question.id === 'q-saa-costbatch-008') selected = question.answer;
    for (const choice of selected) await page.getByRole('button', {name:question.choices[choice], exact:true}).click();
    await page.getByRole('button', {name:index === 24 ? 'Review before finishing' : 'Next / skip', exact:true}).first().click();
  }
  assert.equal(seen.size, 25);
  await page.getByRole('button', {name:'Score all', exact:true}).click();
  await page.getByRole('heading', {name:'Results by task'}).waitFor();
  const body = await page.locator('body').innerText();
  assert.match(body, /2\/25/);
  assert.ok(body.includes('Practice results are descriptive'));
  assert.ok(body.includes('No questions for this task were selected.'));
  assert.ok(body.includes('No different source-reviewed question is mapped to this exact decision'));
  const taskText = await page.locator('section[aria-labelledby="saa-tasks-heading"]').innerText();
  const counts = [...taskText.matchAll(/(\d+) correct of (\d+) attempted; (\d+) unanswered\./g)].map((m) => m.slice(1).map(Number));
  assert.equal(counts.length, 14);
  assert.deepEqual(counts.reduce((s, row) => s.map((n, i) => n + row[i]), [0, 0, 0]), [2, 3, 22]);
  for (const q of reviewed) {
    assert.ok(body.includes(q.prompt), `review missing ${q.id}`);
    for (const choice of q.choices) assert.ok(body.includes(`Option: ${choice} —`), `option explanation missing ${q.id}`);
  }
  assert.ok(await page.locator('a[href^="/notes/"][href*="#"]').count(), 'reviewed task lesson anchors');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('comptia-a-plus-review-progress-v1')));
  assert.equal(saved.mockAttempts[0].correct, 2); assert.equal(saved.mockAttempts[0].total, 25);
  assert.equal(saved.mockAttempts[0].questionIds.length, 25); assert.equal(saved.mockAttempts[0].full, false);
  assert.equal(saved.mockAttempts[0].missedIds.length, 23);
  await page.getByRole('button', {name:'Repeat the same diagnostic', exact:true}).click();
  await page.getByRole('button', {name:'End test', exact:true}).click();
  await page.getByRole('button', {name:'Score all', exact:true}).click();
  await page.getByRole('heading', {name:'Results by task'}).waitFor();
  assert.ok((await page.locator('body').innerText()).includes('Previously shown in available saved history.'));
  console.log('✓ full 25-question session: unique IDs, shuffled single and multiple scoring, partial and unanswered responses, all option explanations, links and saved history');
  await context.close();
} finally { await browser.close(); }
