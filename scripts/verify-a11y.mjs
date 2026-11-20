/**
 * Automated accessibility scan with axe-core (MPL-2.0) on the main pages.
 *
 *   npm run test:a11y -- --url http://127.0.0.1:3000
 *   npm run test:a11y -- --url https://your-preview.vercel.app --browser /path/to/chromium
 *
 * Fails on serious and critical violations. Minor and moderate issues are printed
 * so they can be fixed later. Run against a built server (npm run build && npm start).
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
};
const origin = option('--url', 'http://127.0.0.1:3000');
const browserPath = option('--browser', undefined);

const pages = [
  '/',
  '/es/',
  '/fr/',
  '/pt/',
  '/capstone',
  '/es/capstone',
  '/fr/capstone',
  '/pt/capstone',
  '/methodology',
  '/es/methodology',
  '/fr/methodology',
  '/pt/methodology',
  '/certifications',
  '/es/certifications',
  '/fr/certifications',
  '/pt/certifications',
  '/aws-clf',
  '/es/aws-clf',
  '/fr/aws-clf',
  '/pt/aws-clf',
  '/aws-clf/assessment',
  '/es/aws-clf/assessment',
  '/fr/aws-clf/assessment',
  '/pt/aws-clf/assessment',
  '/weak-areas',
  '/es/weak-areas',
  '/fr/weak-areas',
  '/pt/weak-areas',
  '/assessment-workflow',
  '/certifications',
  '/aws-saa',
  '/core1',
  '/networking',
  '/network-plus/ch9',
  '/notes/n10-l2-l3-switching',
  '/notes/n10-tcpip',
  '/notes/n10-html-http',
  '/flashcards',
  '/labs',
  '/labs/inter-vlan-l3-switch',
  '/practice-games',
  '/quiz',
  '/test',
  '/test?exam=220-1201',
  '/coverage',
  '/insights',
  '/es/insights',
  '/fr/insights',
  '/pt/insights',
  '/visuals/core1-ch1-motherboard-map.html',
  '/visuals/core1-ch3-connectors.html',
  '/visuals/core1-ch3-video-signals.html',
];

const browser = await chromium.launch(browserPath ? { executablePath: browserPath } : {});
let blocking = 0;
try {
  for (const path of pages) {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const response = await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
      if (!response || !response.ok()) {
        console.log(`✗ ${path} (${width}px): HTTP ${response?.status() ?? 'no response'}`);
        blocking += 1;
        await context.close();
        continue;
      }
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const minor = results.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical');
      const status = serious.length ? '✗' : '✓';
      console.log(`${status} ${path} (${width}px): ${serious.length} serious/critical, ${minor.length} other`);
      for (const v of results.violations) {
        const nodes = v.nodes.slice(0, 3).map((n) => `    - ${n.target.join(' ')}`).join('\n');
        console.log(`  [${v.impact}] ${v.id}: ${v.help}\n${nodes}`);
      }
      blocking += serious.length ? 1 : 0;
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (blocking) {
  console.error(`\n${blocking} page check(s) have serious or critical accessibility problems.`);
  process.exit(1);
}
console.log('\nAll pages pass the serious/critical accessibility check.');
