# SAA-C03 gap batch 1 update — 2026-11-18

## Current-source and partial-evidence refresh — 2026-11-18

The current AWS [revision-history page](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-revisions.html)
was indexed today and its opened view reported a five-day-old crawl. It lists
version 1.1 (October 29, 2026) and states that AWS removed AWS DeepComposer,
Amazon DevOps Guru, Amazon Elastic Inference, Amazon Managed Blockchain, and
Amazon Sumerian from the out-of-scope list. The [in-scope list](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html)
snapshot was about two weeks old; the [out-of-scope list](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-out-of-scope-services.html)
snapshot was about three weeks old. The latter still contains all five names;
the former omits all five. Both service lists say, “This list is non-exhaustive
and is subject to change.”

This source conflict remains **unresolved**. The revision-history snapshot is
newer than the two conflicting service-list snapshots, and omission from a
non-exhaustive in-scope list does not prove inclusion. Direct shell access to
`docs.aws.amazon.com` was blocked by the environment proxy with HTTP 403, so the
older cached list snapshots could not be refreshed from the origin. Resolving
this requires an uncached current-origin copy of the in-scope and out-of-scope
pages, or written confirmation from AWS Certification. No service was relabeled
or taught as in-scope based on omission.

## Q&A-SAA-C03 candidate-question audit and first batch — 2026-11-18

The uploaded `Q&A-SAA-C03.pdf` was verified at 589 pages with SHA-256
`61f0caeca9c81cdd99d24b807250cf39336a992782120c2588ca9a874e163dd1`. Its PDF
metadata does not establish an author, version, provenance, or redistribution
permission. On the extracted text, counting case-insensitive `QUESTION <integer>`
only at the start of a line yields **1,213** headings. Counting that pattern
anywhere in the extracted text yields **1,259**: six 200-question sections and
a final 59-question section. The difference is **46 headings that were not at
line starts** in the extraction. The source was used only to identify concepts.

Current objective scope comes from the official SAA-C03 guide version 1.1,
published October 29, 2026, and the current four domain pages. The older supplied
17-page guide remains a historical evidence baseline. The Q&A document does not
define scope.

Twelve original questions now assess selected gaps across Objectives 1.1, 1.3,
2.1, 2.2, 3.3, 3.5, and 4.1. They cover root credential protections, imported
certificate renewal, long-term RDS backups, Step Functions job orchestration,
FSx for ONTAP recovery, DataSync ACL preservation and migration cutover, large
DynamoDB attributes, S3 lifecycle size behavior, Glue Parquet transformation,
Lake Formation row filtering, and EMR on Outposts. Each question has an
option-by-option explanation and current official AWS source URLs. The details
and mappings are kept in `docs/saa-c03-question-pdf-audit.json`; question IDs are
also linked in the existing task-resource associations in
`docs/saa-c03-evidence-map.json`.

The audit rejected a repeated CSV-to-Parquet item whose Exam B explanation is
about unrelated S3 encryption, and corrected an S3 lifecycle candidate that
omitted the current default exclusion of objects under 128 KB. Exam G's SQL
Server explanation was rejected because current RDS documentation supports
Always On Availability Groups for supported versions and editions; FSx shared
storage is a different Failover Cluster Instance design. A Secrets Manager
candidate was not added because the existing bank already tests that concept.

The existing `Question.explanation` field and `QuizRunner` already show
`ExplanationText` after submission for single- and multiple-response questions,
and in missed-question review. The new root-control question is multiple
response; focused tests verify shuffled scoring and all option explanations.
No quiz UI, scoring, saved progress, or question-ID behavior changed. All SAA
objective statuses remain partial; the new assessments do not establish full
objective coverage. Existing SAA partial-support gaps, the service-list
discrepancy above, and any remaining unassessed skills remain open.

I rechecked the repository evidence behind all **69 partial-support SAA bullets**
against their cited actual lesson/resource excerpts. The evidence pointers still
resolve and preserve the exact excerpted source text; the stated unsupported
breadth or procedure remains. The map retains **114 direct / 69 partial / 6
mention / 0 missing / 0 unresolved**. All 14 objective statuses remain partial;
no status or SAA instructional text changed in this source-refresh pass. This is
an evidence-pointer check, not an exhaustive AWS technical freshness audit of
every existing service claim. The highest-priority remaining gap groups and
their exact bullet IDs remain in the prioritized-gap table and JSON map.

This update is isolated on `content/aws-clf-saa-gap-batch-1`, based on `c4c10061f2c3a4869097e2b6a4ff06dcac027ab6`. The existing review branch and worktree were preserved. The supplied 17-page Version 1.0 SAA-C03 exam guide remains the PDF baseline; its verified hash and every source bullet mapping are unchanged. The attachment is an exam guide, not an instructional study guide. No SAA textbook was supplied, so no SAA textbook page is cited.

The three previously missing evidence bullets now have direct repository teaching, an existing topic section, and a new scenario question with explanations for every option:

| PDF bullet | Exact supplied-guide wording | Repository destination and question | Current official technical source |
| --- | --- | --- | --- |
| 2.1-K08, p. 4, Domain 2, Task 2.1, Knowledge of | How to migrate applications into containers | `aws-saa-resilient-architectures#container-migration-decisions`; `q-saa-gap-containers-01` | [AWS App2Container](https://docs.aws.amazon.com/app2container/latest/UserGuide/what-is-a2c.html), [Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) |
| 2.2-K07, p. 5, Domain 2, Task 2.2, Knowledge of | Immutable infrastructure | `aws-saa-resilient-architectures#immutable-infrastructure-decisions`; `q-saa-gap-immutable-01` | [AWS Well-Architected REL08-BP04](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel08-bp04.html) |
| 4.1-S04, p. 8, Domain 4, Task 4.1, Skills in | Determining when storage auto scaling is required | `aws-saa-cost-optimized#storage-autoscaling-decisions`; `q-saa-gap-storage-autoscaling-01` | [RDS storage autoscaling](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIOPS.Autoscaling.html), [RDS best practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html) |

These explanations teach container dependency and state assessment, immutable replacement with health validation and rollback, and when capacity autoscaling is useful versus inadequate. The RDS example names service-specific limits and monitoring; it does not imply that EC2 Auto Scaling scales storage.

The PDF alignment map still contains all 189 bullets. After this batch, repository-teaching classification totals are 114 direct, 69 partial, 6 mention, 0 missing, and 0 unresolved. These are per-bullet teaching judgments, not an exam-coverage score.

All three PDFs bullets remain separate from lesson prose in `docs/saa-c03-evidence-map.json`. The map adds technical source URLs, verified page/bullet identity, exact anchors and question IDs. SAA objective statuses remain unchanged: Objectives 2.1, 2.2 and 4.1 are partial. Their other mapped subskills remain partial or mention-only, so three fixed bullets do not meet the broader task promotion threshold.

# GapLift navigation and SAA curriculum implementation

The existing pages now connect GapLift’s introduction, methodology, technical
walkthrough, certification catalog and study tools. The SAA hub adds a domain-first
index of existing teaching. No instructional content or coverage status changes
were made. The supplied 17-page PDF is now verified, and all 189 knowledge and
skill bullets have individual evidence assessments. This evidence audit does not
upgrade any existing objective status or fill educational gaps.

## Revision and scope

- Implementation branch: `codex/navigation-saa-curriculum`.
- Base: `493921f82bf12b0a2cdb6af882719c7ac1785738` on `main`.
- The original clean `work` branch at `4d8f7aa7c1efeb6f449a79218698eda0683b90c1`
  remains intact. No merge was used to move to the implementation base.
- No commit, push, merge or deployment was performed.
- Root `AGENTS.md` and installed Next.js navigation, internationalization and
  server/client component guidance were read.

## Changes for review

- Methodology links directly to the existing certification example; the technical
  walkthrough links to methodology, the example and coverage.
- Study breadcrumbs say Certifications and lead to `/certifications`, matching
  the certification brand destination. The shared header retains direct Study,
  methodology and language access; the GapLift homepage is unchanged.
- `/aws-saa#curriculum` groups the existing four domains and 14 tasks. Task
  lessons use recorded `reviewEvidence.section` references, with no invented
  fallback anchors. Missing references display a review-needed message.
- The ten existing SAA chapter links at `#topics` and five shared foundation
  chapter links remain. Related notes, visuals and guided labs are grouped as
  topic associations rather than claims of complete task coverage.
- Existing task questions and domain recall decks remain the practice resources.
  Shared weak-area and performance links identify their cross-certification scope.
- SAA lesson strips now expose the existing visual workspace and hashes.
- Locale changes retain the query and fragment. Document navigation through the
  locale prefix lets next-intl update its cookie and preserves the fragment when
  returning through the default-English redirect. Saved progress remains local.
- Navigation labels are added in English, French, Spanish and Portuguese.
- Targeted curriculum and browser checks are provided. The curriculum test is
  included in `npm test`; the accessibility runner includes all five audited pages.

## Verified PDF and current AWS guide comparison

The baseline is the user-uploaded `AWS-saa-c03_Exam-Guide.pdf`, downloaded to
`/workspace/attachments/890ee054-4bd7-4456-8841-e808ce2305f4/AWS-saa-c03_Exam-Guide.pdf`.
Measured SHA-256:
`78e9aa30bd67653603a8a782aeeca1619a7576916fe9bb0588db49429e31033c`.
`pdfinfo` confirms 17 pages and a 171,606-byte file. The printed footer says
**Version 1.0 SAA-C03**; PDF format version 1.7 is a separate technical property.
All 17 pages were read through extracted text, including the appendix. Physical
and printed page numbers agree. Only line wrapping/whitespace was normalized in
transcribing the exact source bullets.

The current [AWS exam guide](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html)
and its [revision history](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-revisions.html)
were checked on November 16, 2026. The history lists version 1.1, published October
29, 2026. The four domain names/weights and 14 task intents remain the same. Both
outlines have 189 knowledge/skill bullets: 165 wordings match after whitespace
normalization; 24 differ. No knowledge/skill bullet was added or removed.

| Supplied PDF location | Specific current-guide difference |
| --- | --- |
| 1.1-K02, page 3 | The legacy AWS SSO workforce example is now IAM Identity Center; IAM is abbreviated. |
| 1.2-S03, page 3 | The integration example similarly uses IAM Identity Center instead of AWS SSO. |
| 3.5-K01, page 7 | The BI service example is labeled Amazon Quick rather than QuickSight. |
| 4.2-K06, page 9 | Snowball Edge is omitted from the hybrid-compute examples; Outposts remains. |
| Twenty other bullet wordings | Abbreviations and AWS/Amazon prefixes are normalized. Each changed bullet ID and its domain source is recorded in the JSON; these are not treated as changed task intent. |

The domain comparisons use the official
[Domain 1](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain1.html),
[Domain 2](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain2.html),
[Domain 3](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain3.html),
and [Domain 4](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain4.html)
pages. AWS also [explains its short-name convention](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-service-mentions.html).

The appendix comparison is separate from curriculum coverage:

- In the [current in-scope list](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html),
  AppSync, Audit Manager, Migration Hub, Server Migration Service, Trusted Advisor,
  Elastic Transcoder, Forecast, Fraud Detector, Kendra, Pinpoint, QLDB and Timestream
  are no longer explicitly listed. The broad VPN label is replaced by explicit
  Client VPN and Site-to-Site VPN labels. Twenty other labels are shortened or
  updated, including Identity Center, Health Dashboard, SageMaker AI and Quick.
- The [retrieved out-of-scope list](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-out-of-scope-services.html)
  omits 20 previously listed labels and shortens two others; the full differences
  are recorded in the JSON. These lists are explicitly non-exhaustive: removal
  from either list does not establish retirement or the opposite exam scope.
- Source inconsistency remains: the revision history says DeepComposer, DevOps
  Guru, Elastic Inference, Managed Blockchain and Sumerian were removed from the
  out-of-scope list, but the retrieved list still contains all five. Its reported
  crawl age was three weeks; an attempted cache-busting URL was inaccessible.
  The conflict is recorded rather than silently resolving membership.
- The supplied file has creation metadata dated February 17, 2022, whereas the
  web history dates its version-1.0 entry to August 28, 2026. The identical version
  number is not sufficient to establish identical publication lineage.

## Bullet evidence and coverage totals

`docs/saa-c03-evidence-map.json` keeps three questions separate: alignment with the
verified supplied PDF, differences from the current official guide, and actual
repository teaching. It is maintainer metadata, separate from instructional
content and runtime coverage/scoring logic.

Every domain and task retains its source location. Each of the 189 source bullets
records its exact wording, PDF page, task/domain, classification, rationale and
specific gap. Existing topic/section/file references and relevant resource IDs
resolve to an evidence catalog containing exact supporting excerpts. Rejected
nearby evidence is separately labeled for missing-support rows.

Classification follows substantive teaching, not keywords, counts, topic tags or
existing status labels. Direct teaching means an explanation, comparison or
worked application materially teaches that particular knowledge/skill bullet; it
does not claim exhaustive exam preparation or verified learner execution. Partial
support identifies the missing part. A mention only names or prompts a concept.
Missing support means no substantive instruction was found in the reviewed scope.

| Domain | Direct teaching | Partial support | Mention | Missing support | Unresolved | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.0 Design Secure Architectures | 19 | 12 | 1 | 0 | 0 | 32 |
| 2.0 Design Resilient Architectures | 25 | 14 | 2 | 2 | 0 | 43 |
| 3.0 Design High-Performing Architectures | 26 | 23 | 1 | 0 | 0 | 50 |
| 4.0 Design Cost-Optimized Architectures | 41 | 20 | 2 | 1 | 0 | 64 |
| **Total** | **111** | **69** | **6** | **3** | **0** | **189** |

There are 107 knowledge bullets (78 direct, 24 partial, 3 mentions, 2 missing)
and 82 skill bullets (33 direct, 45 partial, 3 mentions, 1 missing). These are
unweighted source-bullet counts, including repeated cost-management requirements;
they are not unique competencies, a coverage percentage or learner readiness.

Shared and CLF-only teaching is identified explicitly. For example, cost-allocation
activation/consolidated billing and several AI/BI use cases are supported in
existing CLF resources even though SAA task navigation does not establish that
connection. That is a discoverability distinction, not an instruction to duplicate
or rewrite the material.

All 14 recorded task anchors contain relevant teaching, but **all 14 existing
objective statuses remain partial**. A valid task link is not used as proof for
its underlying knowledge and skill bullets.

## Prioritized curriculum gaps for separate future work

This batch resolves only the three rows above. The following priorities remain candidate instructional work; the JSON retains exact bullet-level evidence and classifications.

| Priority | Specific gap | Source bullet IDs |
| --- | --- | --- |
| Resolved | Container migration now has dependency/state assessment, image publication and cutover teaching with a new scenario item. | 2.1-K08, page 4 |
| Resolved | Immutable replacement, validation and rollback now have direct teaching with a new scenario item. | 2.2-K07, page 5 |
| 1 | Security implementation remains partial: IAM/root MFA enforcement, directory federation, multi-account guardrail design, integrated application security, TLS setup and backup/restore configuration. | 1.1-S01/S04/S06; 1.2-S03/S04; 1.3-S01/S02/S03/S04/S05 |
| 1 | Key rotation and certificate renewal are named without lifecycle/validation instruction. | 1.3-S07, page 4 |
| 1 | Data pipeline design lacks quantitative ingestion sizing, secured lake/catalog examples, complete stream configuration, BI implementation and CSV-to-Parquet transformation/validation. | 3.5-K05/K06; 3.5-S01–S07 |
| Resolved | RDS storage autoscaling decision cues, maximum thresholds, monitoring and limits are taught with a new scenario item. | 4.1-S04, page 8 |
| 2 | Orchestration and API depth is thin: REST/API management and Step Functions are mentions; container scheduling/deployment and broader serverless patterns remain partial. | 2.1-K01/K12/K14/K16; 3.2-K05/K06 |
| 2 | Recovery/operations need deeper automation, standby quotas, tracing and a worked reliability retrofit for unmodifiable legacy applications. | 2.2-K10/K12; 2.2-S01/S05/S07 |
| 2 | Database sizing and engine selection lack quantitative capacity examples, MySQL/PostgreSQL suitability comparisons, replica provisioning and full migration/retention configuration. | 3.3-K04/K06/K08; 3.3-S01/S02/S03; 4.3-K05/K07; 4.3-S01/S02/S03/S05 |
| 2 | Cost design lacks batch-upload comparisons, capacity/transfer-cost calculations, AWS HDD/SSD volume choices, NAT-instance comparisons, hibernation decisions and bandwidth/throttling selection. | 4.1-K06/K08/S01/S02/S03/S10; 4.2-K05/K06/K09/S02/S06; 4.3-S04; 4.4-K04/S02/S06/S07 |

The three previously missing rows above are now direct teaching. The six other mention-only rows are 1.3-S07, 2.1-K01, 2.1-K16, 3.5-K06, 4.3-S04 and
4.4-S07. The 69 partial-support rows each state the unsupported breadth or
procedure in the JSON; they are not silently treated as complete.

A separate resource-quality note flags the IAM map/video's simplified single-Allow
language. Newer task notes explain deny/boundary/principal exceptions. The media
are useful for policy attachment, but not a complete authorization model. Their
instructional content was preserved unchanged.

## Preservation comparison

The original implementation comparison against commit `493921f82bf12b0a2cdb6af882719c7ac1785738` remains valid:

- All 350 existing files under `content/` and `public/` are byte-identical by
  SHA-256. This includes lessons, questions, answers, explanations, flashcards,
  labs, visuals, videos, captions, source references, IDs and coverage statuses.
- All 79 existing route, layout and API file paths remain present. Existing note
  anchors and visual URLs are unchanged; only navigation anchors were added.
- Existing translation keys and values are identical in all four locales after
  excluding the newly added `navigationJourney` namespace.
- Scoring, progress parsing/storage, learner sync, recommendation rules and motion
  implementation files are unchanged. The browser test also compares seeded
  saved history and card progress before and after the navigation journey.

The PDF audit also captured every tracked/intent-to-add file hash and the full
working-tree status before editing. Only this report, the evidence-map JSON and
its metadata tests changed during this continuation. All other existing
implementation/unrelated working-tree bytes are preserved; no new repository
files were introduced. No scoring, learner data or application files changed.

## PDF audit validation

- Recomputed the uploaded file SHA-256 and page count and read its version footer.
- Compared all 189 metadata wordings/pages against a fresh extraction of that
  exact verified PDF; no missing or extra source bullets.
- Checked all 14 knowledge/skill group counts, page transitions, four domain
  totals, classification totals, evidence pointers, existing IDs and source hashes.
- Validated exact lesson, question, card, drill-item, lab, visual and transcript
  excerpts against their unchanged source content.
- Ran `npm run test:saa-curriculum` and `git diff --check`; both passed.
- Application/browser/build checks were not repeated because application code did
  not change. Existing implementation results below are historical, not new runs.

## Earlier implementation validation

Environment: Linux x86_64, Node v24.19.0, Playwright 1.62.1. Browser availability
was checked before execution; `/usr/bin/chromium` exists. Browser commands use
the runners’ supported `--browser` and `--url` options.

- `npm ci --ignore-scripts --no-audit --no-fund`: passed.
- `npm run lint`: no errors; four existing warnings in unchanged files.
- `npm run typecheck` and `npm run build`: passed. Stale ignored `.next/dev` route
  types from the older checkout were moved aside before the successful runs.
- Content consistency and visual-registry checks: passed.
- 291 targeted tests: passed across curriculum, objectives, exam, AWS domain and
  mixed feedback, weak areas, performance, learner, practice and video suites.
- Browser navigation: passed 59 route loads, all 14 teaching anchors, 320/390/1280
  pixel layouts, keyboard menus, localized direct routes, query/fragment retention,
  reduced motion, SAA visual deep links, shared-topic focus and seeded progress.
- Accessibility: six failing viewport checks across three existing issues; the
  same findings reproduce on the untouched base at both 390 and 1280 pixels:
  assessment-explorer source contrast; Network+ practice-link contrast; motherboard
  battery graphic visible-label/accessibility-name mismatch. The new SAA index
  passes. These unrelated content/diagram presentation issues were not changed.

Commands to reproduce after a production build:

```sh
npm run test:saa-curriculum
npm run start -- --hostname 127.0.0.1 --port 3100
```

In another terminal, select an available browser executable for the host OS:

```sh
npm run test:e2e:navigation -- --url http://127.0.0.1:3100 --browser /usr/bin/chromium
npm run test:a11y -- --url http://127.0.0.1:3100 --browser /usr/bin/chromium
```

The full aggregate `npm test`, live-production interactions, physical devices and
screen-reader behavior were not tested. All targeted commands above ran; PDF
verification and detailed PDF mapping were blocked in that earlier phase; the
verified audit above now supersedes that blocker.
