# CLF-C02 maintained status

Updated: 2026-11-17. This report supersedes historical CLF completeness conclusions for the findings explicitly reviewed here. The machine-readable companion is [aws-clf-evidence-map.json](aws-clf-evidence-map.json).

## Starting state and authority

Work continues on `codex/navigation-saa-curriculum`, commit `493921f82bf12b0a2cdb6af882719c7ac1785738`. At task start, 928 tracked/intent-to-add files were hashed and 18 files already had navigation/SAA changes. Those changes were retained. No branch switch, commit, push, merge or deployment was performed.

Production deployment metadata for `https://comptia-a-plus-review.vercel.app` identifies ready deployment `dpl_4A4tW7MbhW7idXABdLn9GZQMyUAJ` at the same commit. That establishes deployment provenance, not rendered equivalence. New content and status changes in this report are local repository findings and have not been deployed.

The user's pasted request authorizes targeted CLF teaching and assessment changes. Uploaded reference documents supplied evidence, not executable instructions. Root `AGENTS.md`, source policy, relevant previous audits and the local content-fact-check/certification-content-verifier workflows were read. Verification was performed directly; no subagents ran.

## Verified source identity

- Supplied filename: `AWS Certified Cloud Practitioner Study Guide eBook.pdf`.
- Title-page title: *AWS Certified Cloud Practitioner Study Guide, Foundational (CLF-C02) Exam*, Second Edition, Ben Piper and David Clinton, Sybex/Wiley, copyright 2024. PDF metadata adds “with 500 Practice Test Questions.”
- 323 physical PDF pages; 7,795,267 bytes.
- SHA-256: `4b48505f625d908be19be7b41d092d1d470d64433ed7103488f50356845479e6`.
- Accessible path: `/workspace/attachments/f98e4c7f-d784-4bbe-be96-f67a3e84e81a/AWS Certified Cloud Practitioner Study Guide eBook.pdf`.
- Used passage: Chapter 8, printed pages 139–142, physical PDF pages 177–180. Access patterns, durability/availability and service comparisons informed the original teaching structure. The book's proprietary question bank was not used.

The current official [CLF-C02 guide](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html), four domain pages and [revision history](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/clf-02-revisions.html) were retrieved on 2026-11-17. Revision history lists version **1.3, published 2026-10-29**. Weights remain Cloud Concepts 24%, Security and Compliance 30%, Cloud Technology and Services 34%, Billing/Pricing/Support 12%.

The book was created in 2023 and is not a current service catalog. Its storage table contains dated dollar prices and Reduced Redundancy Storage, and omits current S3 Express One Zone. Its Deep Archive retrieval discussion must be qualified by retrieval option: current AWS documentation distinguishes Standard retrieval from Bulk, which can take up to 48 hours. No historical dollar prices or full catalog were copied into the lesson. Current support offerings differ from older plan lists; the repository's Basic, Business Support+, Enterprise and Unified Operations names agree with the retrieved [current comparison](https://aws.amazon.com/premiumsupport/plans/). Retirement dates, numeric response targets and pricing were not comprehensively reverified.

The separate [in-scope service list](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/clf-c02-in-scope-services.html) returned an access error through the available web tool. Domain/task/bullet verification succeeded; a complete current service-list comparison remains blocked. This does not justify substituting the textbook's list.

## Reconciled objective status

Historical first-pass findings of 0 covered / 19 partial are stale. The actual starting `content/objectives.json` had **8 covered / 11 partial / 0 missing** after several completed expansions. Domain 3's old report also contains an internally inconsistent headline; its detailed task rows, actual lessons and the current objective file take precedence.

The current result is **7 covered / 12 partial / 0 missing**. Only **2.3 changed, covered → partial**. The official root-only-task skill has a lookup instruction but no taught current example (`aws-clf-access-management#root-mfa`). A “covered” label requires no material subskill omission; generic root protection and MFA do not satisfy this particular skill. Existing practice remains useful. No objective was promoted by adding artifacts or by resolving a source-access limitation.

| Domain | Objectives and current statuses | Change |
| --- | --- | --- |
| 1 — 24% | 1.1 partial; 1.2 covered; 1.3 covered; 1.4 partial | None |
| 2 — 30% | 2.1 covered; 2.2 covered; 2.3 partial; 2.4 covered | 2.3 downgraded |
| 3 — 34% | 3.1–3.6 partial; 3.7–3.8 covered | None |
| 4 — 12% | 4.1–4.3 partial | None |

“Covered” remains an existing repository review label, not a claim that every historical assertion or distractor was freshly verified. Example-level thinness is distinguished from a missing mandatory skill. Teaching, technical freshness, assessment quality and learner readiness remain separate fields.

The evidence map records all **19 tasks and 135 Knowledge/Skills bullets**, including the previously covered tasks. Exact source identity is the tuple of task ID, Knowledge/Skills group and ordinal, with official URL and retrieved-text line; short labels are original descriptions rather than a copied official outline. Each row links actual lesson sections and quotations. Resource IDs and their content are stored separately. Task-associated questions/cards/drills/labs/visuals are inventories, explicitly **not** proof of every underlying bullet. No dedicated CLF entry exists in `content/concept-videos.json`.

| Teaching classification | Baseline bullets | After batch |
| --- | ---: | ---: |
| Direct teaching | 121 | 122 |
| Partial support | 11 | 10 |
| Mention | 2 | 2 |
| Missing support | 1 | 1 |
| Unresolved teaching evidence | 0 | 0 |

These totals classify the inspected teaching, not independent assessment or complete technical freshness. Service-specific freshness and exhaustive old-item review remain unresolved in several rows; zero unresolved teaching pointers must not be read as zero remaining verification work.

## Completed batch: storage-class decisions and scoped corrections

1. Added `aws-clf-technology-services#s3-class-decisions`: immediate access versus restore, single-AZ data-loss tolerance, changing access patterns, minimum-duration/retrieval cost, misconceptions and a worked records-request decision. This resolves the explicit comparison gap in `3.6-S2`; other storage gaps remain.
2. Added `q-clf-s3-decisions-01`–`06` and three `fc-clf-s3-decisions-*` cards. Every option has an explanation in the existing explanation field; no schema, grading or UI change was needed. All six are single-answer. A proposed multiple-response item was converted after reproducing the preexisting runner defect below; scoring code remains unchanged.
3. Qualified the existing CLF RI lesson and `q-clf41-16` to distinguish regional RI discounts from zonal RI capacity. [AWS's scope table](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/reserved-instances-scope.html) explicitly distinguishes those behaviors. The old unrestricted RI/Capacity Reservation contrast was incomplete. The answer's semantic intent remains discount versus capacity, with the required scope now stated.
4. Corrected “Amazon IoT Core” to the official “AWS IoT Core” in one CLF lesson, two existing questions and one card. [Official IoT documentation](https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html) verifies the name and device-connectivity purpose.

Storage behavior was checked against [storage-class documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html) and [retrieval options](https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects-retrieval-options.html), retrieved 2026-11-17. No certification success or educational-effectiveness claim follows from these changes.

## Assessment review and remaining limitations

The six new questions were checked against all choices and keyed requirements. They cover four reasoning families: immediate access/restore, AZ-loss tolerance, adaptive tier selection and total cost. The two opposing AZ-risk items are related evidence, not two independent measures. The records-request worked example and access-time questions share a taught decision principle; first exposure to a bank item is not evidence of unfamiliar transfer.

Previously completed expansions already contain substantial comparisons and application prompts for 3.1–3.6, 1.1/1.4 and 4.1–4.3. They were not repeated. Historical “independent” labels are not accepted as psychometric evidence. Notable repeated reasoning clusters remain:

- `q-clf41-02/13`: interruptible batch → Spot; `q-clf41-05/14`: host licensing → Dedicated Host.
- `q-clf42-03/07/13`: threshold alert versus hard cap; `q-clf42-05/09/15`: tag activation/history.
- `q-clf43-09/19`: third-party procurement → Marketplace; `q-clf36-04/15`: shared Linux files → EFS.

Some old distractors are obvious category mismatches; many old explanations do not address every option. The map exposes actual item text and identifies association versus reviewed batch evidence. An exhaustive fresh correctness/ambiguity audit of every old item and every service claim has **not** been completed. No learner data or unfamiliar holdout assessment was evaluated, and raw practice accuracy is not converted into an AWS scaled score or passing probability.

The rendered quiz check exposed a **preexisting high-impact grading defect** at `app/components/QuizRunner.tsx:92`: its multiple-response answer remapping uses positions inside the authored answer array, rather than displayed choice positions. With authored answers `[1,3]` and displayed order `[3,0,4,1,2]`, correct displayed positions are `[0,3]`, but the runner produces `[0,1]`. The browser selected the correct answer text and received Incorrect with a displayed key contradicting the explanation. This affects existing shuffled multiple-response topic quizzes, including other certifications. The separate exam helper has correct remapping, so passing its tests does not clear the runner. No scoring code was changed under the explicit preservation constraint; all new questions are single-answer. A separately scoped scoring correction with a rendered regression test is the highest-impact follow-up.

## Prioritized remaining work

1. **2.3, 30% domain — mandatory skill and credential/policy distinctions.** `2.3-S4` is only a lookup mention; teach a current root-only example after checking centralized-root exceptions. `2.3-S1` is thin on Systems Manager storage and `2.3-S3` on AWS-managed versus customer-managed policy ownership. This is the next bounded batch; verify official IAM/Systems Manager behavior first and add original application items with complete option explanations.
2. **3.6, 34% domain — cached hybrid files.** `3.6-S5` names Storage Gateway but does not explain local cache versus cloud-backed storage. Link existing resources and add only the missing recognition-level explanation after technical verification.
3. **2.2, 30% domain — access-report interpretation.** `2.2-S5` teaches monitoring/audit/configuration distinctions but lacks an access-report example. Existing scope-level coverage is retained; an illustrative example and fresh verification are still useful.
4. **3.5, 34% domain — discoverability.** `3.5-S2` has actual Inspector teaching elsewhere. Link that explanation alongside SG/NACL coverage without presenting Inspector as a packet filter. This is a grouping/linking gap, not a reason to duplicate a chapter.
5. **4.1, 12% domain — concrete financial behavior.** RI size flexibility, Organizations discount sharing (`4.1-S3`, mention), and qualified transfer-path comparisons remain thin. The regional/zonal correction does not resolve all of `4.1-S2`.
6. **4.2, 12% domain — billing and allocation.** Teach invoice versus analysis datasets (`4.2-K1`), compare AWS-generated/user-defined tags and verify current historical backfill rules before revising broad attribution statements (`4.2-S4`). The attempted backfill source URL was inaccessible; no unsupported correction was made.
7. **4.3, 12% domain — partner and procurement breadth.** `4.3-S7` has missing partner-benefit teaching; `4.3-S8` has only partial Marketplace governance/cost-management/entitlement support. Use current Partner/Marketplace sources; do not promise universal discounts. Support names are verified, but numeric entitlements and legacy-retirement dates need focused freshness review.
8. **Across domains — assessment and source verification.** Replace redundant reasoning only when justified, audit old option explanations and ambiguity in bounded batches, and resolve the inaccessible service-list source. Do not add content merely because a task remains partial or requires fresh verification.

## Preservation and reviewable changes

All existing topic/question/card IDs were retained. No old records were deleted. Totals: 72 topics unchanged in count; questions 2,295 → 2,301; cards 1,252 → 1,255. CLF-specific totals: 15 topics, 375 → 381 questions, 279 → 282 cards.

Three CLF-only topics changed: one new section in `aws-clf-technology-services`, one RI paragraph in `aws-clf-billing-support`, and IoT naming in `aws-clf-other-service-categories`. Existing question edits are limited to `q-clf41-16`, `q-clf38-13` and `q-clf38-14`; existing card edit is limited to `fc-clf38-iot`. All 134 SAA questions, all shared foundation topics, other-certification records/objectives, assets, labs, drills, scoring code, URLs, storage keys and progress logic remained unchanged.

Of the 928 hashed baseline files, this batch changed six: `content/topics.json`, `content/questions.json`, `content/flashcards.json`, `content/objectives.json`, `tests/aws-review.test.mjs`, and `docs/saa-c03-evidence-map.json`. The latter refreshes container hashes after CLF changes and one quoted CLF RI passage; SAA bullet classifications, task links and resource IDs were retained. All other preexisting navigation/SAA working-tree changes remain byte-for-byte as found.

New, untracked deliverables are `docs/aws-clf-status.md`, `docs/aws-clf-evidence-map.json`, and `tests/aws-clf-evidence.test.mjs`. They are intentionally unstaged. A task-only review diff, excluding the unrelated preexisting work, is available at `/workspace/work/clf-enrichment/clf-batch.diff`. Review with `git diff -- content/topics.json content/questions.json content/flashcards.json content/objectives.json tests/aws-review.test.mjs docs/saa-c03-evidence-map.json`, then inspect the three untracked files; ordinary `git diff` does not include those files.

The changed bank fingerprint can make earlier assessment evidence stale under existing rules; saved attempts/cards remain stored, and no progress reset or storage migration was added.

## Validation

- `npm test`: passed; 505 passed, one existing IPv4 ADR test skipped. This suite includes objective, AWS assessment, learner/progress, retest persistence, practice and SAA checks. The separate topic-runner multi-response defect below is not covered by the passing exam-helper tests.
- `node --import ./tests/register.mjs --test tests/aws-clf-evidence.test.mjs tests/saa-curriculum.test.mjs`: 11 passed. Checks source-bullet completeness, real lesson excerpts, resource drift, objective-status agreement and preserved SAA evidence pointers.
- `npm run test:exam`: 53 passed again after the final question change.
- `npm run check:content`: 0 errors, 208 warnings, the same warning count as the starting baseline. Warnings are not treated as proof of source correctness.
- `npm run report:objectives`: completed with the reconciled CLF statuses.
- `npm run typecheck`: passed. `npm run lint`: no errors, four preexisting warnings; the added evidence test also passed targeted ESLint.
- `npm run build`: passed after the final instructional and question edits.
- Linux and executable `/usr/bin/chromium` were detected before browser testing. The existing navigation runner's supported `--url` and `--browser` options were used: `node scripts/verify-navigation-saa.mjs --url http://127.0.0.1:3100 --browser /usr/bin/chromium`. Passed 59 route loads, all 14 SAA teaching anchors, responsive layouts, keyboard menus, locale context, reduced motion and seeded progress preservation.
- The bounded CLF browser check passed 10 route loads at 390/1280 px, the new lesson anchor, billing/IoT/flashcard routes, French UI context, all six correctly graded questions with every option explanation, and old quiz history/known-card preservation. No page errors occurred. An initial mobile overflow caused by the new raw source URLs was corrected by using readable source titles in the lesson while preserving full URLs in this report and the map.
- `git diff --check`: passed. All 922 other baseline files stayed byte-identical. Reversing only the declared SAA container-hash updates, RI quotation and maintenance entry reconstructs the exact starting SAA-map SHA-256 `7feaa4ca6bbb892687594480c9b2d2e4e00e5f1b3bf9144cbe853d097065d186`.

Browser checks use emulated desktop/mobile viewports, not physical devices. The CLF lesson was checked with French UI; instructional text remains English, following the existing content model. Spanish, Portuguese and French translations of this new teaching were not added. New CLF content was not checked in every theme or locale; the shared navigation runner covers its existing locale routes. No fresh axe audit, deployed-content test, learner-outcome study or exhaustive old-question audit is claimed. The inaccessible service list and backfill source remain source-access blockers. Scoring code remains unchanged, and the reproduced multiple-response runner defect is unresolved.
