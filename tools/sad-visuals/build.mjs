/**
 * Builds each architecture-document visual into one self-contained page:
 *   tools/sad-visuals/sources/<slug>/{SAD.md, diagrams.js, facts.json, meta.json}
 *   -> public/visuals/<meta.out>
 *
 *   node tools/sad-visuals/build.mjs           write the pages
 *   node tools/sad-visuals/build.mjs --check   exit 1 if a page is missing or out of date
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const here = new URL('./', import.meta.url);
const read = (base, p) => readFileSync(new URL(p, base), 'utf8');
const safeJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export function buildAll() {
  const shell = read(here, 'shell.html');
  const css = read(here, 'engine.css');
  const engine = read(here, 'engine.js');
  const slugs = readdirSync(new URL('sources/', here), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  return slugs.map((slug) => {
    const dir = new URL(`sources/${slug}/`, here);
    const meta = JSON.parse(read(dir, 'meta.json'));
    const facts = JSON.parse(read(dir, 'facts.json'));
    const html = shell
      .replace('__TITLE__', () => meta.title)
      .replace('__CSS__', () => css)
      .replace('__FACTS__', () => safeJson(facts))
      .replace('__MD__', () => safeJson(read(dir, 'SAD.md')))
      .replace('__BACK__', () => safeJson(meta.back ?? null))
      .replace('__ENGINE__', () => engine)
      .replace('__DIAGRAMS__', () => read(dir, 'diagrams.js'));
    return { slug, out: `public/visuals/${meta.out}`, html };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const page of buildAll()) {
    const target = new URL(page.out, root);
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (check) {
      if (current !== page.html) { console.error(`✗ ${page.out} is missing or out of date. Run: node tools/sad-visuals/build.mjs`); stale++; }
      else console.log(`✓ ${page.out}`);
    } else {
      writeFileSync(target, page.html);
      console.log(`wrote ${page.out} (${Math.round(page.html.length / 1024)} KB)`);
    }
  }
  if (stale) process.exitCode = 1;
}
