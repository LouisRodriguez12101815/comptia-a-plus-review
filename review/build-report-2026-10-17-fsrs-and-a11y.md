# Build report: spaced repetition and accessibility scan (2026-10-17)

Branch `content/switching-tcpip-html` on the Mac (3 commits on top of 6538e7c, not yet pushed): 53cb804, 3e3728d, 9174e9b.

## Added
- Flashcards use FSRS spaced repetition (ts-fsrs 5.4.2, MIT). Flipping a card shows Again / Hard / Good / Easy; each rating schedules the next review. Good and Easy still count as known. New "Due for review (N)" deck runs a session of only the due cards; Shuffle stays inside it. Schedules live in the per-device progress record (`schedules`).
- `lib/study/schedule.ts` (pure scheduling), `tests/study-schedule.test.mjs` (6 tests).
- `scripts/verify-a11y.mjs` (`npm run test:a11y`): axe-core 4.14 (MPL-2.0 via @axe-core/playwright 4.14.0) over 12 main pages at 390 and 1280 px. Fails on serious or critical issues.
- Fix found by the scan: 21 visuals had a scrollable `.stage` container that keyboard users could not reach. Each is now focusable and labeled as a scrollable region. Commit 9174e9b.

## Verified
- Cloud build with Google Fonts stubbed (as before): `next build` passes. axe scan: all 12 pages pass at both widths.
- Browser flow: grade saved, due count drops after reload (57 to 56), due session opens, no console errors, no horizontal overflow at 390 px.
- check:content 0 errors; content, report, schedule, and practice test suites pass.

## Notes
- FSRS uses default parameters (no fuzz). Scheduling starts from scratch for every device, because progress is stored in localStorage. Cross-device sync would need an account or a shared store.
- The axe scan covers 12 pages, not every visual. Visuals outside these pages were only fixed for the `.stage` pattern.
- Cloud-only font stub in `app/layout.tsx` is not committed.
