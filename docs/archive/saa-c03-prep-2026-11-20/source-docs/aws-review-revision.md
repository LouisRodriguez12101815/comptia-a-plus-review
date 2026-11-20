# AWS review revision — 2026-10-23

The original AWS stack had useful introductory material, but its objective labels and practice scores overstated the available evidence. This revision corrects technical scope, adds applied review, and makes the assessment more resistant to memorized answer positions.

## Content and assessment changes

- 33 original objective workshops, scenario questions and reasoning flashcards: one for each of the 19 CLF-C02 and 14 SAA-C03 task statements. Each workshop adds mechanics, a worked choice, a transfer exercise and an official scope reference.
- 94 CLF-eligible and 134 SAA-eligible questions, including the 30 shared questions eligible for both. There are 198 unique AWS questions and 171 AWS flashcards. Counts describe content volume, not validated exam coverage.
- Explicit primary objective tags replace AWS topic-based scoring attribution. Domain-weighted full mocks contain 65 distinct items, and each domain meets the official weight within one-question rounding. CLF uses exactly 90 minutes; SAA uses exactly 130 minutes. Shorter sessions use proportional time.
- Choice presentation is shuffled in both quiz and mock modes. Quiz copies remap answer keys; mocks preserve canonical answer indices through a shuffled display order. All 13 existing multiple-response questions now have five distinct options.
- One shared timer supports previous/next, skipping, flagging and a review screen. Finish scores the complete sitting; unanswered items count as incorrect.
- Results display raw study accuracy against a local 80% study target. AWS scaled passing scores are not converted to raw percentages and the UI does not label the outcome an exam pass.
- Current-bank practice evidence excludes legacy/unversioned attempts, attempts older than 90 days and future-dated attempts. It requires distinct multiple-response exposure, all domains per full mock, and first-observed mock performance as well as bank exposure. This is local browser history, not proof that a learner has never seen an item elsewhere. It can be reset or lost; there is no independent held-out exam bank or psychometric validation.
- All 33 AWS objectives are honestly marked **partial**. This intentionally prevents the practice-target gate from asserting curriculum completeness. Workshops do not establish every official subskill, completed hands-on execution or exam readiness.

## Trace of the original findings

| Findings | Revision / evidence |
| --- | --- |
| F01–F02 | Stored order rebalanced; display shuffling preserves correct answer text; 100 seeded positional-baseline runs per exam remain below 35%; multi-response options expanded. |
| F03–F04, F28 | Every eligible AWS question has one valid primary objective per exam; all shared questions enter both pools; 100 seeded full mocks per exam check uniqueness and domain quotas. Cross-domain final-review drills also use per-item objective tags. |
| F05–F06 | Raw study target replaces unsupported pass inference; shared exact timer and reversible navigation replace individual-question lockouts. |
| F07 | Objective status downgraded to partial, linked workshops added; remaining breadth and execution evidence explicitly acknowledged. |
| F08 | Single-standby RDS DB instances distinguished from readable-standby Multi-AZ DB clusters and asynchronous read replicas across lessons, questions, cards, drills, lab and visual. |
| F09 | Permissions-boundary explanations distinguish identity-policy intersections from same-account direct user/session resource-policy exceptions and applicable explicit denies. |
| F10, F20 | Public IPv4 NAT prerequisites, private NAT limitation, zonal versus regional availability and native IPv6 egress-only IGW distinction added; paper failure tracing expands the VPC exercise. |
| F11 | Snowball Edge existing-customer restriction since November 7, 2025 and Snowcone discontinuation qualified; new-customer alternatives identified for evaluation. |
| F12 | ALB all-unhealthy fail-open behavior and explicit ASG ELB health-check configuration added. |
| F13–F14 | Lifecycle age/date versus access monitoring clarified; replication versioning on both buckets, permissions, backfill, async lag, deletion and retention controls expanded. |
| F15 | Route 53 weights apply to DNS choices, not exact HTTP proportions; resolver caching, latency assumptions and all-unhealthy multivalue fallback explained. |
| F16–F18 | Kinesis ordering scoped to shards/keys with sequencing/retry caveats; DAX eventual-cache-hit latency separated from strong reads/misses; DynamoDB on-demand limits acknowledged. |
| F19 | Presigned links described as reusable/transferable bearer access bounded by signer, policy and credential lifetime. |
| F21–F22 | SQS commit/delete acknowledgement, duplicate handling, DLQ/redrive and finite retention added; budget delays and cost-allocation-tag activation clarified. |
| F23–F24 | Official technical URLs added to visual manifests; objective-code casing corrected; residency separated from regional DR. |
| F25–F26 | Version, recency, distinct-item and first-observed-mock gates added; domain-floor regression repaired; existing test wording updated to incomplete objectives. |
| F27 | Spot discount and interruption tradeoffs replace an unconditional lowest-total-cost assertion. |

Technical references are recorded in `content/aws-review-sources.json`, including the 104 official sources used in the original item audit. Scope links establish what AWS tests; service documentation establishes technical behavior. Source references are not a claim that every service was deployed or every configuration was executed.

## Validation

The six lower branch snapshots (#92–#97) each passed their own typecheck, content check and visual-fact check. This also caught and repaired framework-level AWS exam/concept translation keys that had previously arrived only in the top branch.

Executed on the complete revised stack:

- `npm run lint`: pass, four existing warnings in unrelated image rendering/multiplayer code.
- `npm run typecheck`: pass.
- `npm test`: pass using the bundled Python runtime on PATH. macOS system Python 3.9 cannot run the existing subnet oracle's `zip(strict=True)`; no application or oracle change was needed.
- `npm run check:content`: pass with warnings, including topic-level answer balance and existing unpinned Network+ keys. Display shuffling addresses positional predictability; it does not validate distractor quality.
- `npm run report:objectives`: pass; AWS objectives remain partial.
- `npm run audit:visuals -- --check`: 33 fact blocks checked, zero problems.
- `npm run build`: default Turbopack build blocked by sandbox worker-port binding. The initial dependency symlink was replaced with a local dependency copy; Google Font fetching required network access.
- `npm run build -- --webpack`: production compilation, TypeScript and static generation passed using the supported alternate builder.

The production server started locally at 127.0.0.1:3111. Browser interaction could not be verified: Playwright Chromium was blocked at launch by macOS sandbox Mach-port permission denial, before any page opened. Deployed browser testing, physical devices and live AWS lab execution were not performed. No deployment or merge is part of this revision. Automatic Vercel Git deployments remain disabled by `vercel.json`; batching branch pushes alone does not reduce build usage.

## Remaining curriculum work

The new material is an expanded review, not a validated standalone certification course. Reconcile each official subskill against a precise lesson section, add more unfamiliar requirement-driven scenarios and robust distractors, reserve assessment variants from lesson answers, execute representative sandbox fault/recovery labs, and review official sample questions and current service changes. A sample derived from a small repeatedly used bank must not be treated as a passing probability.
