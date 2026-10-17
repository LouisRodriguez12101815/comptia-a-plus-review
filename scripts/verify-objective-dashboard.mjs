/** Local production walkthrough; run after npm run build and npm start.
 * npm run test:e2e:objectives -- --url http://127.0.0.1:3037 --browser /usr/bin/chromium
 * Uses viewport/touch emulation; does not claim physical-device testing.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { buildCoverage, renderReport } from './objective-coverage.mjs';
import { examCoverage, filterCoverage, rankGaps, summarizeCoverage } from '../lib/objective-coverage.mjs';

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
};
const origin = option('--url', 'http://127.0.0.1:3000');
const executablePath = option('--browser', undefined);
const output = 'work/dashboard';
await mkdir(output, { recursive: true });
const { objectives, rows } = buildCoverage();
const next = rankGaps(rows)[0];
const report = renderReport({ objectives, rows });
assert.ok(report.includes(`1. ${next.exam} ${next.id} (`));
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
let linksChecked = 0;
try {
  for (const width of [1280, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${origin}/coverage`, { waitUntil: 'networkidle' });
    assert.ok(response?.ok());
    const resultCount = page.getByTestId('result-count');
    const objectiveItems = page.locator('li[data-testid^="objective-"]');
    await objectiveItems.last().waitFor();
    assert.equal(await objectiveItems.count(), rows.length);
    const globalNext = await page.getByTestId('global-next').innerText();
    assert.ok(globalNext.includes(`${next.exam} / ${next.id}`));
    for (const exam of objectives.exams) {
      const summary = examCoverage(exam, rows);
      const text = await page.getByTestId(`summary-${exam.code}`).innerText();
      assert.ok(text.includes(`~${summary.weighted}%`));
      assert.ok(text.includes(`${summary.covered} covered · ${summary.partial} partial · ${summary.missing} missing`));
    }
    await page.screenshot({ path: `${output}/coverage-${width}-overview.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overview overflow at ${width}`);
    const domainOverview = page.getByTestId('domain-overview');
    await domainOverview.locator('summary').focus();
    await domainOverview.locator('summary').press('Enter');
    assert.ok(await domainOverview.getAttribute('open') !== null);
    for (const exam of objectives.exams) {
      for (const domain of exam.domains) {
        const counts = summarizeCoverage(rows.filter((row) => row.exam === exam.code && row.domain === domain.id));
        const text = await page.getByTestId(`domain-${exam.code}:${domain.id}`).innerText();
        assert.ok(text.includes(`${counts.total} objectives · domain weight ${domain.weight}%`));
        assert.ok(text.includes(`${counts.covered} covered · ${counts.partial} partial · ${counts.missing} missing`));
      }
    }
    await domainOverview.screenshot({ path: `${output}/coverage-${width}-domains.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `domain overview overflow at ${width}`);
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    assert.deepEqual(scan.violations.map((v) => ({ id: v.id, impact: v.impact })), []);

    await domainOverview.locator('summary').press('Enter');
    assert.equal(await domainOverview.getAttribute('open'), null);

    const exam = page.getByLabel('Exam', { exact: true });
    const status = page.getByLabel('Coverage status');
    const search = page.getByLabel('Search title or objective');
    // Keyboard: native select, Tab through status/search, then reset with Enter.
    await exam.focus();
    await exam.press('ArrowDown');
    assert.equal(await exam.inputValue(), objectives.exams[0].code);
    await exam.press('Tab');
    assert.ok(await status.evaluate((element) => element === document.activeElement));
    await status.selectOption('covered');
    await status.press('Tab');
    assert.ok(await search.evaluate((element) => element === document.activeElement));
    await search.fill('  220-1201\t 5.3   DiSpLaY  ');
    await page.waitForFunction(() => document.querySelectorAll('li[data-testid^="objective-"]').length === 1);
    assert.equal(await objectiveItems.count(), filterCoverage(rows, { exam: '220-1201', status: 'covered', search: '5.3 display' }).length);
    const display = rows.find((row) => row.key === '220-1201:5.3');
    const card = page.getByTestId(`objective-${display.key}`);
    for (const [label, value] of [['Notes sections', display.notes], ['Flashcards', display.cards], ['Quiz scenarios', display.quiz], ['Labs', display.labs]]) {
      assert.equal(await card.locator('dl > div').filter({ has: page.locator('dt', { hasText: label }) }).locator('dd').innerText(), String(value));
    }
    assert.equal(await card.getByRole('link').getAttribute('href'), '/notes/core1-display-troubleshooting');
    await page.screenshot({ path: `${output}/coverage-${width}-display.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}`);
    assert.equal(await page.getByTestId('global-next').innerText(), globalNext);

    await search.fill('not-a-real-objective-xyz');
    await page.getByRole('heading', { name: 'No objectives match' }).waitFor();
    assert.match(await resultCount.innerText(), /^0 of /);
    assert.equal(await page.getByTestId('global-next').innerText(), globalNext);
    await page.screenshot({ path: `${output}/coverage-${width}-empty.png`, fullPage: true });
    const reset = page.getByRole('button', { name: 'Reset filters' });
    await reset.focus();
    await reset.press('Enter');
    await page.waitForFunction((total) => document.querySelectorAll('li[data-testid^="objective-"]').length === total, rows.length);
    assert.equal(await search.inputValue(), '');
    assert.equal(await exam.inputValue(), 'all');
    assert.equal(await status.inputValue(), 'all');

    await search.fill('1.1');
    for (const code of objectives.exams.map((item) => item.code)) {
      await page.getByTestId(`objective-${code}:1.1`).waitFor();
    }
    await search.fill(' \t  ');
    await page.waitForFunction((total) => document.querySelectorAll('li[data-testid^="objective-"]').length === total, rows.length);
    const unmapped = rows.find((row) => row.topics.length === 0);
    assert.match(await page.getByTestId(`objective-${unmapped.key}`).innerText(), /No mapped topics yet/);

    // Exercise every exam/status combination against the shared pure filter.
    for (const code of ['all', ...objectives.exams.map((item) => item.code)]) {
      await exam.selectOption(code);
      for (const value of ['all', 'covered', 'partial', 'missing']) {
        await status.selectOption(value);
        const expected = filterCoverage(rows, { exam: code, status: value }).length;
        await page.waitForFunction((total) => document.querySelectorAll('li[data-testid^="objective-"]').length === total, expected);
        assert.equal(await objectiveItems.count(), expected);
        assert.equal(await page.getByTestId('global-next').innerText(), globalNext);
      }
    }
    await reset.click();
    if (width === 1280) {
      const hrefs = [...new Set(await page.locator('ul[aria-label="Matching objectives"] a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))))];
      for (const href of hrefs) {
        const linkResponse = await context.request.get(`${origin}${href}`);
        assert.equal(linkResponse.status(), 200, href);
        linksChecked++;
      }
    }
    await search.fill('220-1201 5.3');
    await page.getByTestId('objective-220-1201:5.3').getByRole('link').click();
    await page.waitForURL('**/notes/core1-display-troubleshooting');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.match(await page.locator('h1').innerText(), /display|projector/i);
    await page.getByRole('navigation', { name: 'Certification tracks' }).getByRole('link', { name: 'Coverage', exact: true }).click();
    await page.waitForURL('**/coverage');
    await page.getByRole('heading', { name: 'Exam objective coverage', exact: true }).waitFor();
    assert.equal(await page.locator('a[aria-current="page"]').count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width}px: combined filters, normalized search, empty/unmapped states, composite IDs, counts, CLI agreement, keyboard, topic navigation, domain counts/disclosure, no overflow, zero axe violations`);
  }
  console.log(`PASS ${linksChecked} unique mapped-topic URLs returned HTTP 200. Desktop and mobile viewport/touch emulation only.`);
} finally {
  await browser.close();
}
