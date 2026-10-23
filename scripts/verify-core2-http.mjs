/** Verify deployed/local Core 2 routing without changing user data. */
import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'http://127.0.0.1:3113';
const paths = ['/core2/review-tools', '/fr/core2/review-tools', '/es/core2/review-tools', '/pt/core2/review-tools', '/notes/core2-assessment-os', '/quiz?topic=core2-assessment-os', '/flashcards?topic=core2-assessment-os', '/practice-games/drills/c2-assessment-os'];
for (const path of paths) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' });
  assert.equal(response.status, 200, `${path}: expected 200, received ${response.status} ${response.headers.get('location') ?? ''}`);
  const html = await response.text();
  assert.ok(html.includes('<html'), path);
  if (path.startsWith('/quiz?')) assert.ok(html.includes('href="/notes/core2-assessment-os"'), 'Quiz must link back to available notes');
}
const prefixed = await fetch(new URL('/en/core2/review-tools?check=preserved', origin), { redirect: 'manual' });
assert.equal(prefixed.status, 307);
const target = new URL(prefixed.headers.get('location'), origin);
assert.equal(target.pathname, '/core2/review-tools');
assert.equal(target.searchParams.get('check'), 'preserved');
assert.equal((await fetch(target, { redirect: 'manual' })).status, 200, 'English redirect must terminate');
console.log(`PASS: ${paths.length} routes plus a terminating English redirect with query preservation.`);
