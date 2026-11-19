import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildCoverage } from './objective-coverage.mjs';
import { buildInsightsFromCoverage } from '../lib/objective-coverage.mjs';
import en from '../messages/en.json' with { type: 'json' };
import es from '../messages/es.json' with { type: 'json' };
import fr from '../messages/fr.json' with { type: 'json' };
import pt from '../messages/pt.json' with { type: 'json' };
import questionsJson from '../content/questions.json' with { type: 'json' };
import flashcardsJson from '../content/flashcards.json' with { type: 'json' };

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const origin = option('--url', 'http://127.0.0.1:3000');
const browserPath = option('--browser', undefined);
const locales = { en, es, fr, pt };
const summary = buildInsightsFromCoverage(buildCoverage());
const numberFor = (locale) => new Intl.NumberFormat(locale);
const percentageFor = (locale) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
const browser = await chromium.launch(browserPath ? { executablePath: browserPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });

try {
  for (const [locale, messages] of Object.entries(locales)) {
    const path = locale === 'en' ? '/insights' : `/${locale}/insights`;
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    assert.ok(response?.ok(), `${path}: HTTP ${response?.status()}`);
    const html = await response.text();
    const firstQuestion = Array.isArray(questionsJson) ? questionsJson[0] : questionsJson.questions[0];
    const firstCard = Array.isArray(flashcardsJson) ? flashcardsJson[0] : flashcardsJson.cards[0];
    assert.ok(!html.includes(firstQuestion.prompt), `${locale}: raw question text must remain server-side`);
    assert.ok(!html.includes(firstCard.front), `${locale}: raw flashcard text must remain server-side`);
    await page.getByRole('heading', { name: messages.insightsPage.heading, level: 1 }).waitFor();
    await page.getByRole('heading', { name: messages.insightsPage.resourcesTitle }).waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), locale);

    const n10 = summary.exams.find((exam) => exam.code === 'n10-009');
    const resourceTable = page.getByRole('table').nth(1);
    const n10Row = resourceTable.locator('tbody').first().getByRole('row').filter({ hasText: n10.code }).first();
    const n10RowText = (await n10Row.innerText()).replace(/\s/gu, '');
    assert.ok(n10RowText.includes(numberFor(locale).format(n10.questions).replace(/\s/gu, '')), `${locale} question grouping formatting`);
    const ccnaRow = resourceTable.locator('tbody').first().getByRole('row').filter({ hasText: '200-301' });
    const ccnaText = await ccnaRow.innerText();
    assert.ok(ccnaText.includes(messages.insightsPage.noMatrix), `${locale}: CCNA must not imply an objective estimate`);
    assert.match(ccnaText, /\b25\b/u, `${locale}: CCNA shared lab count`);
    const pageText = (await page.locator('body').innerText()).replace(/\s/gu, '');
    assert.ok(pageText.includes(percentageFor(locale).format(summary.exams.find((exam) => exam.code === 'saa-c03').weighted / 100).replace(/\s/gu, '')), `${locale} percentage formatting`);

    const desktopInsightLink = page.getByRole('navigation', { name: messages.header.tracksLabel }).getByRole('link', { name: messages.header.insights, exact: true });
    await desktopInsightLink.waitFor();
    assert.deepEqual(errors, [], `${locale} browser errors`);
    console.log(`✓ ${path}: localized heading, labels, numbers, percentages, and desktop navigation`);
    await page.close();
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobileResponse = await mobile.goto(`${origin}/fr/insights`, { waitUntil: 'networkidle' });
  assert.ok(mobileResponse?.ok());
  await mobile.getByRole('button', { name: fr.header.mobileMenu }).click();
  await mobile.getByRole('navigation', { name: fr.header.mobileMenu }).getByRole('link', { name: fr.header.insights, exact: true }).waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'mobile layout should not overflow horizontally');
  console.log('✓ mobile navigation and layout');
  await mobile.close();

  const sitemap = await fetch(`${origin}/sitemap.xml`);
  assert.ok(sitemap.ok, `sitemap HTTP ${sitemap.status}`);
  const xml = await sitemap.text();
  const paths = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/gu)].map(([, url]) => new URL(url).pathname));
  for (const path of ['/insights', '/es/insights', '/fr/insights', '/pt/insights']) assert.ok(paths.has(path), `sitemap missing ${path}`);
  console.log('✓ sitemap includes all four localized Insights routes');
} finally {
  await browser.close();
}
