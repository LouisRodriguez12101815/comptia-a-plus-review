# SAA diagnostic: current state and remaining work

Baseline: `88482fd2f099f3fcec839cf039ca0bf7dfe8de7e`, examined 2026-11-19 ET. The ordinary timed practice remains at `/test?exam=saa-c03`. A separate, shorter diagnostic is available locally at `/test?diagnostic=saa`, linked from `/aws-saa`. It is limited to the 25 records with prior per-option AWS source checks, not a 65-question simulation.

## Official format

The [AWS certification page](https://aws.amazon.com/certification/certified-solutions-architect-associate/) specifies 65 questions in 130 minutes and both multiple choice and multiple response. The [current AWS exam guide](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html) assigns 30%, 26%, 24%, and 20% of **scored** content to domains 1–4. It states that 50 questions are scored, 15 are unscored, unanswered answers count as incorrect, and AWS reports a scaled score. The practice test cannot identify or simulate AWS's unscored items or scaled score.

## Observed inventory and selection

The pool has 173 unique SAA question IDs; domain counts based on the first mapped SAA task are 41, 31, 66, and 35. A deterministic seed-7 weighted draw from `draftTest` returned 65 distinct IDs: 19, 17, 16, and 13 per domain. A seed is a reproducible example, not the application's normal random draw. The bank contains 11 multiple-response items; the draw does not guarantee a particular format mix. Existing selection can prioritize due questions and use earlier mock question IDs to prefer unseen ones.

For triage, 40 of 173 explanations contain the exact text of every choice; 25 of those use an `Option:` prefix. The remaining 133 do not contain every choice's exact text. This is a text-matching indicator only: an explanation can discuss a choice without repeating its wording, and matching text does not prove correctness. The seed-7 draw includes 49 questions that fail this exact-text indicator. The 24 new bank questions and `q-saa-arch-31` have per-option official-source audit records in `docs/saa-c03-question-bank-audit.json`; older inherited questions still require claim-level review. The previously documented service-scope discrepancy remains unresolved. Do not label this entire pool independently verified.

## Existing implementation and gaps

- `lib/exam-test.mjs` drafts by domain and task, shuffles choices, grades exact multiple-response sets, and preserves the existing progress record. The normal test reveals review explanations after the session; its review defaults to missed questions and can show all questions.
- `ExamTest.tsx` records mock question IDs, assigned objectives, missed IDs and some confidence fields. It counts selected unanswered questions as incorrect for overall grading; older history cannot reliably distinguish every unanswered item from an incorrect answer. The new task result counts use current-session responses and do not change stored scoring.
- `lib/weakness.ts` uses recent mock history, requires three observations for a weak label, and orders weak then middling tasks. Due-review scheduling can deliberately repeat a missed question. Repetition is useful practice but is not independent confirmation; there is not yet a verified same-decision-skill alternate workflow.
- `QuizRunner.tsx` offers immediate question feedback and `lib/quiz-answer-history.ts` maps displayed choices to authored indices. `learner-performance.ts` derives first-seen and repeat history only where saved question IDs exist; missing historical detail must remain unknown.
- The diagnostic draws all 25 source-reviewed records (5/4/3/13 across the four domains), using a 50-minute proportional timer and revealing all option explanations after submission. It is 40 short of 65 and cannot represent domain weights reliably. Tasks 3.4 and 3.5 have no diagnostic items. The ordinary 173-question practice pool is not independently verified in full. Since every reviewed item is used in the session, no unused independently verified question for the same decision is offered; the UI explicitly says it is unavailable. Repeating the diagnostic repeats the questions.

All objective statuses, question IDs, answer keys and progress formats remain unchanged. A task link points to the selected question's existing topic and does not establish complete task coverage. Small task samples are descriptive. Prioritize security policy combinations, network routing, data transfer and storage cost decisions, and database migration/cost tradeoffs, as documented in `docs/saa-c03-question-bank-audit.md`; verify actual teaching and each proposed assessment against current official sources before adding or revising content.

## Seed-7 draw: items needing manual explanation review

The following IDs failed the exact-choice-text triage above. They have not been independently verified in this pass; review each explanation and its claims against current official AWS documentation. This list is not a claim that every item is incorrect. A different random draw selects different IDs.

- `q-saa-core-05` — task 1.2
- `q-saa-arch-33` — task 4.1
- `q-saa-multi-08` — task 1.2
- `q-saa-arch-08` — task 1.3
- `q-aws-review-saa-c03-2-1` — task 2.1
- `q-saa-core-37` — task 3.4
- `q-saa-arch-34` — task 4.4
- `q-aws-found-01` — task 3.2
- `q-saa-arch-37` — task 4.3
- `q-aws-found-26` — task 2.1
- `q-saa-arch-18` — task 2.2
- `q-saa-core-20` — task 3.4
- `q-saa-core-30` — task 1.1
- `q-saa-arch-07` — task 1.3
- `q-saa-arch-19` — task 2.1
- `q-aws-found-07` — task 1.1
- `q-saa-core-35` — task 2.1
- `q-saa-arch-17` — task 2.2
- `q-saa-core-18` — task 3.4
- `q-saa-arch-11` — task 2.1
- `q-aws-found-27` — task 2.1
- `q-aws-found-15` — task 3.1
- `q-aws-review-saa-c03-4-3` — task 4.3
- `q-saa-core-29` — task 1.1
- `q-saa-multi-02` — task 2.2
- `q-aws-found-02` — task 2.2
- `q-aws-found-06` — task 2.2
- `q-aws-review-saa-c03-1-1` — task 1.1
- `q-saa-arch-05` — task 1.2
- `q-saa-core-08` — task 1.3
- `q-saa-arch-15` — task 2.2
- `q-saa-core-23` — task 3.3
- `q-saa-core-06` — task 3.1
- `q-aws-found-11` — task 1.1
- `q-aws-found-12` — task 1.2
- `q-saa-core-09` — task 4.1
- `q-aws-found-23` — task 3.3
- `q-aws-found-09` — task 1.2
- `q-aws-found-05` — task 3.2
- `q-saa-arch-30` — task 3.5
- `q-saa-multi-07` — task 1.3
- `q-saa-core-28` — task 3.3
- `q-saa-multi-04` — task 4.2
- `q-aws-review-saa-c03-3-5` — task 3.5
- `q-saa-core-33` — task 1.3
- `q-saa-multi-05` — task 3.4
- `q-saa-arch-39` — task 4.1
- `q-aws-review-saa-c03-3-2` — task 3.2
- `q-aws-review-saa-c03-1-3` — task 1.3

## Source review and manual triage update

The 25 eligible records were individually checked against official AWS sources in `saa-c03-question-bank-audit.json` on 2026-11-20 UTC, with a source and check for each option. In this pass all 66 distinct official URLs listed for the 25 were reopened through the web documentation reader; some pages had older crawl dates. `saa-diagnostic-source-manifest.json` records those references and a SHA-256 of each exact question record, and a regression test fails if a selected record changes without review. The source-list/revision-history discrepancy remains unresolved. The full per-option source checks are the earlier recorded audit; reopening the sources does not by itself constitute 25 new complete independent re-audits.

All 49 previously flagged seed-7 explanations were manually read for rationale breadth. Seven clearly address all alternatives by name or description; 42 give the keyed rationale but do not provide a distinct explanation for every alternative. The classification and actual explanation for each item are in `saa-diagnostic-triage.json`. This is an explanation review, not independent verification of those 49 answers or AWS claims; none are eligible for this diagnostic merely because they passed this triage.

History labels describe only whether an ID appeared in available saved quiz or mock records before the session. They do not infer first attempts or distinguish previously viewed, unanswered questions from answered ones. Translations in Spanish, French, and Portuguese require human review.
