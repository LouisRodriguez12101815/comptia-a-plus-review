import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import en from '../messages/en.json' with { type: 'json' };
import es from '../messages/es.json' with { type: 'json' };
import fr from '../messages/fr.json' with { type: 'json' };
import pt from '../messages/pt.json' with { type: 'json' };
import { buildCoverage } from './objective-coverage.mjs';
import { buildInsightsFromCoverage } from '../lib/objective-coverage.mjs';

const option = (key, fallback) => {
  const index = process.argv.indexOf(key);
  return index < 0 ? fallback : process.argv[index + 1];
};
const origin = option('--url', 'http://127.0.0.1:3010');
const browserPath = option('--browser', undefined);
const locales = { en, es, fr, pt };
const coverage = buildCoverage();
const summary = buildInsightsFromCoverage(coverage);
const expected = {
  total: summary.exams.reduce((n, exam) => n + exam.total, 0),
  covered: summary.exams.reduce((n, exam) => n + exam.covered, 0),
  partial: summary.exams.reduce((n, exam) => n + exam.partial, 0),
  missing: summary.exams.reduce((n, exam) => n + exam.missing, 0),
  empty: summary.exams.filter((exam) => exam.total === 0).length,
};
const browser = await chromium.launch(browserPath ? { executablePath: browserPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
try {
  for (const [locale, messages] of Object.entries(locales)) {
    const prefix = locale === 'en' ? '' : `/${locale}`;
    for (const [route, heading] of [['/capstone', messages.capstonePage.title], ['/methodology', messages.methodologyPage.title], ['/insights', messages.insightsPage.title], ['/', undefined]]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(`${origin}${prefix}${route}`, { waitUntil: 'networkidle' });
      assert.ok(response?.ok(), `${prefix}${route} HTTP ${response?.status()}`);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      if (heading) await page.getByRole('heading', { name: heading, level: 1 }).waitFor();
      if (route === '/capstone') {
        await page.getByRole('table', { name: messages.coverageSnapshot.caption }).waitFor();
        await page.getByRole('link', { name: messages.capstonePage.insightsLink }).waitFor();
        await page.getByRole('link', { name: messages.capstonePage.coverageLink }).waitFor();
        const body = (await page.locator('body').innerText()).replace(/\s/gu, '');
        for (const key of ['total', 'covered', 'partial', 'missing', 'empty']) assert.ok(body.includes(new Intl.NumberFormat(locale).format(expected[key]).replace(/\s/gu, '')), `${locale}: displayed ${key} matches shared objective calculation`);
        for (const path of ['/insights', '/coverage', '/certifications']) assert.ok(await page.locator(`a[href="${prefix}${path}"]`).count(), `${locale}: capstone links to ${path}`);
        for (const path of ['/game', '/practice-games/subnet-architect', '/labs', '/networking/videos', '/performance', '/weak-areas']) assert.ok(await page.locator(`a[href="${prefix}${path}"]`).count(), `${locale}: capstone links to existing example ${path}`);
      }
      if (route === '/insights') {
        for (const key of ['catalogLink', 'studyExampleLink', 'practiceLink', 'reviewLink']) await page.getByRole('link', { name: messages.insightsPage[key] }).waitFor();
        for (const exam of summary.exams.filter((item) => item.total === 0)) {
          const row = page.getByRole('table', { name: messages.insightsPage.resourcesTableCaption }).getByRole('row').filter({ hasText: exam.code }).first();
          await row.getByText(messages.insightsPage.noObjectiveEstimate).waitFor();
        }
        const ccna = page.getByRole('table', { name: messages.insightsPage.resourcesTableCaption }).getByRole('row').filter({ hasText: '200-301' }).first();
        await ccna.getByText(messages.insightsPage.noMatrix).waitFor();
      }
      if (route === '/') {
        await page.getByRole('navigation', { name: messages.homeStory.graderPath }).getByRole('link', { name: messages.homeStory.graderInsights }).waitFor();
        await page.getByRole('navigation', { name: messages.homeStory.graderPath }).getByRole('link', { name: messages.homeStory.graderPractice }).waitFor();
      }
      assert.deepEqual(errors, [], `${prefix}${route} runtime errors`);
      console.log(`✓ ${prefix}${route || '/'} localized route and primary links`);
      await page.close();
    }
  }

  const journey = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await journey.goto(`${origin}/`, { waitUntil: 'networkidle' });
  const first = journey.getByRole('navigation', { name: en.homeStory.graderPath }).getByRole('link', { name: en.homeStory.graderInsights });
  await first.focus();
  await journey.keyboard.press('Enter');
  await journey.getByRole('heading', { name: en.insightsPage.title, level: 1 }).waitFor();
  await journey.getByRole('link', { name: en.insightsPage.studyExampleLink }).click();
  await journey.getByRole('heading', { name: en.awsDomainExperience.title, level: 1 }).waitFor();
  await journey.goto(`${origin}/insights`, { waitUntil: 'networkidle' });
  await journey.getByRole('link', { name: en.insightsPage.practiceLink }).click();
  await journey.waitForURL('**/aws-clf/assessment');
  await journey.goto(`${origin}/insights`, { waitUntil: 'networkidle' });
  await journey.getByRole('link', { name: en.insightsPage.reviewLink }).click();
  await journey.waitForURL('**/weak-areas');
  await journey.close();
  console.log('✓ keyboard and browser grader path: home → Insights → study, practice, and review');

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const response = await page.goto(`${origin}/fr/capstone`, { waitUntil: 'networkidle' });
  assert.ok(response?.ok());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'mobile capstone should not overflow');
  const sitemap = await fetch(`${origin}/sitemap.xml`);
  assert.ok(sitemap.ok, `sitemap HTTP ${sitemap.status}`);
  const xml = await sitemap.text();
  const paths = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/gu)].map(([, url]) => new URL(url).pathname));
  for (const path of ['/capstone', '/es/capstone', '/fr/capstone', '/pt/capstone']) assert.ok(paths.has(path), `sitemap missing ${path}`);
  console.log('✓ mobile layout and localized sitemap entries');
} finally {
  await browser.close();
}
