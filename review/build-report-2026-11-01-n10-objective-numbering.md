# Build report: Network+ objective numbering (2026-11-01)

Branch `fix/n10-objective-numbering`, base `1781721` (merged Phase 1a on origin/main). Read review/README-for-agent.md and feature-rollout-standard.md first. No learner data or Vercel operations.

## Added / corrected

The base already maps **3.3 disaster recovery, 3.4 IPv4/IPv6 services, 3.5 access/management** correctly. Do not rotate these IDs again: that would reintroduce the historical bug. Aligned titles to the outline: 3.3 now includes “(DR)” and 3.4 includes “Given a scenario”. 3.5 was already correct.

Corrected only the stale “Objective 3.4” prefix in `q-n10access-management-01/02/03/04` to **3.5**. These labels are explanation text; all question IDs, prompts, choices, answer indices and structured objective tags stay unchanged. The corresponding topic titles, section anchors and dedicated DR/DNS/DHCP labels were inspected and already correct. Shared A+/AWS objective references are distinct exams and were not renumbered. Historical gap/coverage reports stay historical; the readiness report has a follow-up annotation rather than rewritten scores/quotations.

Added a semantic regression test for the three objective titles, topic associations, section prefixes and dedicated-topic question labels. No progress/FSRS schema or migration changes: the active objective associations did not change.

## Before / after question counts

Counts use the actual Network+ timed-test pool (`buildExamPool`), not broad unfiltered topic totals. In addition to these counts, each objective's full ordered question-ID list was asserted identical before and after. Objective totals overlap; they are not additive.

| Objective | Before | After |
| --- | ---: | ---: |
| 1.1 | 43 | 43 |
| 1.2 | 93 | 93 |
| 1.3 | 31 | 31 |
| 1.4 | 127 | 127 |
| 1.5 | 110 | 110 |
| 1.6 | 53 | 53 |
| 1.7 | 65 | 65 |
| 1.8 | 113 | 113 |
| 2.1 | 75 | 75 |
| 2.2 | 40 | 40 |
| 2.3 | 61 | 61 |
| 2.4 | 33 | 33 |
| 3.1 | 44 | 44 |
| 3.2 | 77 | 77 |
| 3.3 | 34 | 34 |
| 3.4 | 147 | 147 |
| 3.5 | 33 | 33 |
| 4.1 | 54 | 54 |
| 4.2 | 44 | 44 |
| 4.3 | 65 | 65 |
| 5.1 | 48 | 48 |
| 5.2 | 72 | 72 |
| 5.3 | 95 | 95 |
| 5.4 | 52 | 52 |
| 5.5 | 64 | 64 |

Distinct mapped Network+ questions: **1112 → 1112**. No questions lost, added or reassigned. Report generation before/after confirms only the two titles changed.

## Verified

- `npm run lint`: PASS, exit 0; 0 errors, 4 existing warnings.
- `npm run typecheck`: PASS, exit 0; route type generation and TypeScript complete.
- `npm run check:content`: PASS, exit 0; 0 errors, 90 existing advisory warnings.
- `npm test`: PASS, exit 0; 276 Node tests, 16 Python tests; independent subnet fixtures pass; 41 visual fact blocks, 0 problems.
- `npm run report:objectives`, question-ID set/order comparisons, and `git diff --check`: PASS.

## Sources / limitations

Mapping follows the user-specified official outline and `review/n10-009-gap-audit-2026-10-30.md`; existing `review/n10-009-evidence-ledger.md` identifies the later N10-009 V9 document v6.0. Direct [official PDF](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652?download=1) retrieval failed; the older official Japan PDF URL now redirects to a landing page. No claim of fresh complete PDF review. Only the requested bounded numbering/title semantics were changed; no technical protocol claim or exam weight changed.

No new UI, routes, dependencies or build-size impact. No rendered-page or deployment checks were performed for this metadata/prefix-only change. No merge or Vercel deploy. PR B should follow this branch because it rewrites the SSH explanation also labelled here.
