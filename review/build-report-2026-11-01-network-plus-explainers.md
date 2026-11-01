# Build report: Network+ readiness Phase 1a and read-only history exporter (2026-11-01)

Branch `network-plus-readiness-phase1a`, base `ade49de` from GitHub. Read `review/README-for-agent.md` first and followed all six supplied references. Scope: assessment and exporter only; no question, explanation, UI, objective status or deployment changes. Delivery is a commit on this branch followed by a push attempt; the final delivery message identifies the resulting commit or fallback patch.

## Added

- `review/network-plus-readiness-2026-11-01.md`: all 25 objective mappings, comparison with the supplied October 17 coverage report and October 30 gap audit, and the current chapter/question/visual inventory. The matrix now marks 25/25 covered versus 6/25 historically; broad topic mappings and incomplete sub-bullet review prevent treating this as complete exam teaching or learner readiness.
- A 48-question post-answer explanation audit, weighted toward the supplied high-weight troubleshooting gaps and editorial weak flags. Mean 3.10/10 (149/480); 38/48 score at or below 4. All five dimension scores, reasons, exact question IDs and worst explanation excerpts are recorded. This is a deliberate sample, not a bank-wide defect rate.
- Six proposed in-site explainers, ordered by a documented expected-confusion proxy times domain weight, with per-item effort and existing visual reuse. These are planning estimates, not personal repeat-miss rankings. Actual rankings and per-domain readiness verdicts remain pending the de-identified export; Phase 2/3 topic approval remains required.
- `scripts/export-primary-history.mjs`: read-only Twilio Sync access to exactly one selected primary learner map, followed by a private local export to `data/primary-history.json`. Uses the application's HMAC naming rule, including the `learner:` input prefix and 40-hex-character digest truncation. Does not enumerate other maps, sign in, send SMS, sync, repair, create, update or delete remote records.
- `tests/export-primary-history.test.mjs`: ten synthetic tests using fake Sync, including selection, chunk integrity, documented progress/history adapters, field stripping, grading consistency, legacy omissions, timed-out unvisited questions, duplicate/conflicting evidence, file preservation and suppressed provider errors. No actual learner data or credentials were used.
- `.gitignore`: explicit `/data/` and `.env.local` entries. `package.json`: exporter tests added to the existing `test:learner` command so `npm test` includes them. No dependencies added.

## Verified

All checks below ran in the cloud checkout of this branch using Node v24.19.0 and the existing installed dependencies. No real learner read was attempted.

- `npm run lint`: PASS, exit 0; 0 errors and 4 existing warnings (three image optimizations and one hook-dependency warning). No new warnings.
- `npm run typecheck`: PASS, exit 0; `next typegen` generated route types and `tsc --noEmit` completed without errors.
- `npm run check:content`: PASS, exit 0; 0 errors and 90 existing advisory warnings. The checker validates internal consistency and stored assertions, not fresh external truth.
- `npm test`: PASS, exit 0; 275 Node tests and 16 Python tests, independent subnet fixtures pass, 41 visual fact blocks checked with 0 problems. The 19-test learner suite contains 9 existing tests plus 10 exporter tests.
- `npm run report:objectives`: PASS; existing coverage implementation reused. Current Network+ tag inventory: 41 topics, 1,117 eligible questions, 518 flashcards; timed exam pool contains 1,112 distinct mapped questions. Objective/domain totals overlap and must not be summed.
- Report arithmetic checked independently from its score table: 48 unique sampled IDs, 149/480 total, 38 scores at or below 4. All referenced visualization files exist after merging `track-visuals.json` with the separate chapter 9/10/11 lists.
- `node --check scripts/export-primary-history.mjs` and `node scripts/export-primary-history.mjs --help`: PASS; help requires neither credentials nor network.
- `git check-ignore data/primary-history.json .env.local`: both private paths ignored. `git diff --check`: PASS. Changes to `app/`, `content/`, `lib/`, `public/` and `vercel.json` against the branch base: none.

## Not verified

- Real Twilio access or production payload compatibility: the owner runs the exporter locally. No credentials were configured, no learner history was read, and no phone number, learner name or profile identifier was placed in reports or commits. Test values are synthetic fixtures only.
- The learner-accounts report describes `profile`, `progress`, `schedules-*`, `history`, `run:*`; checked-in `lib/learner/store.ts` instead uses `progress-*` string chunks. The exporter supports validated current chunks, a single progress item containing the same progress schema, and explicit per-question history arrays or `events` arrays. Historical payload encodings are compatibility adapters, not observed production schemas. Unknown history containers and competing progress formats fail safely; no guessing of a newer source.
- Flashcard-to-question FSRS linkage: not available in current code. Progress-derived rows use `fsrsState: null`; explicit per-question history events may retain a validated numeric state 0–3. Separate flashcard schedule items are not guessed into question states. Profile, unrelated run payloads and all extra event fields are discarded.
- Complete lifetime history: existing storage caps are 40 quizzes/30 mocks; the supplied report records 100 history events/30 runs. Legacy/incomplete sittings, unvisited mock questions and aggregate/unknown/non-Network+ events are omitted and counted. Removed or unknown questions cannot be mapped. Ambiguous objectives remain null. Sitting-derived timestamps are completion times, not individual response times.
- Learner readiness and personal repeated misses: pending `data/primary-history.json`. The export also intentionally omits wrong-choice details, so it cannot establish a learner's usual wrong option.
- Fresh official-source retrieval: supplied audit identifies objectives v4.0, while the later ledger identifies v6.0. External source hosts are outside current outbound policy; both historical sources and the unresolved version difference are documented. No claim of fresh PDF verification or complete closure of the 88 historical keyword gaps.
- Browser/mobile/axe/reduced-motion checks and an application build: no UI or application rendering changes. No preview, production or other Vercel command was run; Git deployment remains disabled in unchanged `vercel.json`. No merge or PR was created.

## Notes

Run locally on Node 22.6+ from the repository root:

```sh
node scripts/export-primary-history.mjs --help
node scripts/export-primary-history.mjs
```

Credentials are read only from git-ignored `.env.local`, using existing names `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_SYNC_SERVICE_SID`, `LEARNER_SESSION_SECRET`, `LEARNER_ALLOWED_PHONES`. The secret must match the site's existing session secret. With one allowlisted number, that is the primary selection; with multiple numbers, the additional local-only `LEARNER_PRIMARY_PHONE` selector is required and must be allowlisted. No Verify SID is needed because there is no sign-in or SMS call. Never send these values in chat or commit the file.

The SDK is explicitly silent and follows all item pages without a total-item truncation limit. Only the chosen map is listed. Output contains exactly `questionId`, `objective`, `correct`, `timestamp`, `fsrsState`, with bank-allowlisted question IDs and validated values. Provider errors, headers, credentials, map IDs, names and profile data are never printed. The new export file is owner-readable/writable only and uses exclusive creation; move an existing export aside yourself before rerunning. No usable evidence means no export is written.

Next: the owner supplies the de-identified export; Phase 1b validates completeness and calculates evidence-backed results before the final topic list is approved. All explanations and in-site animations remain unchanged until then.
