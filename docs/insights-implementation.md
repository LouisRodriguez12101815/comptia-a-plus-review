# GapLift project insights milestone

**Reconciled branch/base:** `feat/insights` at `f99270696a314e645c47f9fb3a031090bed73b35` (`origin/main`). The prior Insights base was `c4c10061f2c3a4869097e2b6a4ff06dcac027ab6`; the original branch is preserved locally as `feat/insights-pre-main`.

**Recalculated:** 2026-11-19
**Brief handoff:** `gaplift-swot-revamp-brief.md` was not available in this task or checkout, so no SWOT example figures were used. A user-supplied SAA audit summary is recorded below as separate-worktree context; its 165-question count does not describe this checkout or production. This Insights work changes no certification content, question IDs, objective statuses, scoring, or learner data; the reconciled base includes changes already merged to `main`.

## What the route shows

`/[locale]/insights` is a server-rendered, high-level analytics view for `en`, `es`, `fr`, and `pt`. It presents exam/domain objective statuses and weighted estimates, mapped question/flashcard/lab counts, and partial objectives in the repository's existing gap order. It includes an accessible status bar with a table alternative, per-figure takeaways and methods, source paths, locale-formatted values, and explicit zero rows for tracks with no mapped objectives or resources. The server passes no question/card/lab records or learner history to a client component.

The `/coverage` route remains the detailed review tool: it filters individual objectives, searches titles, shows per-objective resource/topic associations, and links to mapped notes. `/insights` gives capstone reviewers a comparative overview and the data lineage behind it. They serve different tasks, so this milestone keeps both.

## Sources and calculations

- Objective IDs, statuses, topic mappings, and domain weights: `content/objectives.json`.
- Topic/exam associations: `content/topics.json` and `content/topics-network-plus.json`.
- Question, flashcard, and lab associations: `content/questions.json`, `content/flashcards.json`, and `content/labs.json`. The CCNA hub’s shared-lab count follows its existing rule in `lib/tracks.ts`.
- Shared implementation: `lib/objective-coverage.mjs` (`buildCoverageFromContent`, `examCoverage`, `rankGaps`, and `buildInsightsFromCoverage`). The report remains `scripts/objective-coverage.mjs`.
- Status totals count matrix rows exactly as labeled `covered`, `partial`, or `missing`.
- Weighted estimate: within each domain, `(covered + 0.5 × partial) ÷ objective count`; multiply that credit by the domain weight and sum domain contributions; round to the nearest whole percent. Empty domains contribute zero. This preserves the existing report rule and does not imply readiness.
- Exam-track resource counts use distinct resource IDs and explicit exam tags, falling back to the associated topic's exam tags. Domain counts additionally require an exam match and a topic association that overlaps the union of objective-mapped topics in that domain. Shared topics/resources may therefore appear in more than one domain. Counts measure associations, not complete instructional coverage. CCNA is listed separately because its track is not in the objective matrix: its current code gives it 0 tagged questions, 0 tagged flashcards, and access to the 25-item shared lab collection. It has no weighted estimate or domain counts.
- Partial candidates use the existing `rankGaps` order, filtered to partial statuses: domain weight descending, then exam code, then stable matrix order.

Reproduce the human report with `npm run report:objectives`; reproduce the exact aggregate payload with `node scripts/objective-coverage.mjs --json`. The `test:insights-parity` test executes that JSON CLI and compares every exam and domain against the shared function used by the page.

## Recalculated track totals

These are outputs from the checkout on the date above, not values copied from the unavailable brief.

| Exam | Covered | Partial | Missing | Objectives | Weighted estimate | Questions | Flashcards | Labs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 220-1201 | 21 | 6 | 0 | 27 | 90% | 295 | 174 | 7 |
| 220-1202 | 36 | 0 | 0 | 36 | 100% | 494 | 231 | 0 |
| N10-009 | 25 | 0 | 0 | 25 | 100% | 1,113 | 517 | 6 |
| CLF-C02 | 8 | 11 | 0 | 19 | 75% | 397 | 287 | 9 |
| SAA-C03 | 0 | 14 | 0 | 14 | 50% | 149 | 113 | 13 |
| SY0-701 | 0 | 0 | 0 | 0 | 0% | 0 | 0 | 0 |
| AZ-900 | 0 | 0 | 0 | 0 | 0% | 0 | 0 | 0 |
| AZ-104 | 0 | 0 | 0 | 0 | 0% | 0 | 0 | 0 |
| Cisco CCNA (200-301) | — | — | — | — | no objective matrix | 0 | 0 | 25 |

The full domain-level status and resource values are visible in the page and in the reproducible JSON output. The three empty matrix tracks remain visible with zero values; the page says they have no mapped content or objectives in the current matrix. CCNA has resource data only and is labeled as outside the current objective matrix.

### Reconciliation changes since the prior Insights snapshot

`origin/main` was fetched and verified at `f99270696a314e645c47f9fb3a031090bed73b35`, three commits beyond c4 (`dab77e6`, `7a3cd8d`, and `f992706`). Recounting the c4 files with the same distinct-ID/exam-tag rule gives CLF 381 questions and 282 flashcards; current main has 397 and 287, from 16 and 5 added IDs respectively. CLF labs remain 9. Main also marks CLF objective 2.3 covered (it was partial at c4), making the matrix 8 covered and 11 partial and the shared weighted estimate 75% (previously 7 covered, 12 partial, 72%). This is an incoming main change; the Insights work did not edit objective statuses.

The CLF question IDs newly present since c4 are `q-clf-assess-41-mixed-purchase-01`, `q-clf-assess-42-budget-action-01`, `q-clf-assess-43-health-case-01`, `q-clf-gap-bill-source-01`, `q-clf-gap-credential-report-01`, `q-clf-gap-gateway-cache-01`, `q-clf-gap-marketplace-governance-01`, `q-clf-gap-parameter-store-01`, `q-clf-gap-partner-benefits-01`, `q-clf-gap-policy-ownership-01`, `q-clf-gap-ri-flex-01`, `q-clf-gap-ri-share-01`, `q-clf-gap-root-01`, `q-clf-gap-root-standalone-01`, `q-clf-gap-tags-01`, and `q-clf-gap-transfer-costs-01`. The five newly present flashcards are `fc-clf-gap-billing-tags`, `fc-clf-gap-gateway-cache`, `fc-clf-gap-parameter-store`, `fc-clf-gap-policy-ownership`, and `fc-clf-gap-root-centralized`.

Core 1, Core 2, Network+, the three empty matrix tracks, and CCNA retain their prior counts. SAA question/card counts move from 134/112 to 149/113: the question increase is the 15 committed questions listed below, and the flashcard increase is `fc-saa-gap-immutable`; other SAA figures remain 0/14/0 objective statuses, 50% weighted estimate, and 13 labs. Counts for every other track match the prior c4 calculation. No figures from the unavailable SWOT brief are used.

## Caveats and handoffs

The exact current matrix caveat is shown on the page: “First-pass coverage map. Objective titles are paraphrased; confirm wording and sub-bullets against the official CompTIA objectives PDFs. Statuses were set from notes section titles and item counts, not a full read, so review each one. Run: npm run report:objectives”. The report caveat is also preserved: domain weights apply to whole domains, and weighted coverage is a preliminary content-planning estimate, not learner readiness. The page states that these figures do not establish learning effectiveness, exam readiness, or pass probability.

### SAA question-bank handoff

The supplied summary describes a separate worktree at `/workspace/comptia-a-plus-review-saa-audit`, branch `content/saa-c03-question-bank-review`, based at `f99270696a314e645c47f9fb3a031090bed73b35`. It reports 16 uncommitted questions, `q-saa-bank-001` through `q-saa-bank-016`, and a 165-question SAA bank there, up from 149. Those 16 IDs are absent from the reconciled Insights branch; the audit’s validation results do not apply here.

For this checkout, the question inventory uses the study-selection rule: explicit `examCodes`, falling back to the associated topic’s exam codes, then matching `saa-c03`. At c4, `content/questions.json` had 134 unique SAA-C03 question IDs. Reconciled main has **149 unique IDs**, exactly 15 more, and no removed IDs. The increase is the 12 committed audit-batch questions `q-saa-auditbatch-01` through `q-saa-auditbatch-12` plus `q-saa-gap-containers-01`, `q-saa-gap-immutable-01`, and `q-saa-gap-storage-autoscaling-01`. These are present in reconciled `content/questions.json`; none of `q-saa-bank-001` through `q-saa-bank-016` are present. Thus the previous 134 count came from the older c4 checkout, while 149 is the existing count on current main before the separate 16-question uncommitted batch. The current IDs are the following original groups plus those 15 additions:

- `q-aws-found-01` through `q-aws-found-30`
- `q-aws-review-saa-c03-1-1`, `q-aws-review-saa-c03-1-2`, `q-aws-review-saa-c03-1-3`, `q-aws-review-saa-c03-2-1`, `q-aws-review-saa-c03-2-2`, `q-aws-review-saa-c03-3-1`, `q-aws-review-saa-c03-3-2`, `q-aws-review-saa-c03-3-3`, `q-aws-review-saa-c03-3-4`, `q-aws-review-saa-c03-3-5`, `q-aws-review-saa-c03-4-1`, `q-aws-review-saa-c03-4-2`, `q-aws-review-saa-c03-4-3`, `q-aws-review-saa-c03-4-4`
- `q-saa-arch-01` through `q-saa-arch-40`
- `q-saa-core-01` through `q-saa-core-42`
- `q-saa-multi-01` through `q-saa-multi-08`
- `q-saa-auditbatch-01` through `q-saa-auditbatch-12`
- `q-saa-gap-containers-01`, `q-saa-gap-immutable-01`, and `q-saa-gap-storage-autoscaling-01`

The supplied summary says all 14 SAA objective statuses remain partial and reports uneven domain counts, repeated decision patterns, weak distractors, inherited technical claims not independently rechecked, and unresolved service-scope questions. This checkout independently has all 14 SAA objectives marked partial. The summary did not include the underlying per-domain counts, question-level examples, sources, or detailed evidence, so those quality findings are retained as follow-up context, not presented here as a fresh audit of this branch. The SAA bank’s future review should verify the actual question pool, technical claims, and service scope before changing those assessments.

### Machine-translated UI strings for Louis to review

Spanish, French, and Portuguese values in `messages/es.json`, `messages/fr.json`, and `messages/pt.json` under `insightsPage` and the `header.insights` key were machine-translated. Review these `insightsPage` keys: `metadataTitle`, `metadataDescription`, `eyebrow`, `heading`, `intro`, `caveatHeading`, `weightCaveat`, `outcomeCaveat`, `coverageTitle`, `coverageTakeaway`, `coverageMethod`, `coverageSource`, `coverageChartLabel`, `weighted`, `counts`, `coverageTableCaption`, `track`, `domain`, `domainWeight`, `covered`, `partial`, `missing`, `resourcesTitle`, `resourcesTakeaway`, `resourcesMethod`, `resourcesSource`, `resourcesTableCaption`, `questions`, `flashcards`, `labs`, `weightedCoverage`, `noMatrix`, `noMatrixTrack`, `emptyTrack`, `candidatesTitle`, `candidatesMethod`, `noCandidates`, and `candidateSource`, plus `header.insights`.

### Unknown capstone rubric requirements

The rubric/guide was not available and was not sought or reconstructed. Its exact assessment criteria and weighting, required deliverables/checkpoints, source-evidence expectations, and required presentation/demo format remain unknown.

### Later tasks explicitly kept out of scope

Ranked as follow-up possibilities from the request's out-of-scope list, not as findings from the missing SWOT brief:

1. Notebook/SQL implementation and evidence.
2. A dedicated About/Capstone page.
3. A methodology rewrite.
4. Empty-track states on other pages.
5. Broader navigation redesign.
6. Gameplay TODO cleanup.
7. Naming changes.
