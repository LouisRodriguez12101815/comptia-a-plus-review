# SAA roadmap

Keep this file current. When a pull request completes a queue item, update the queue and the Done log in that same pull request.

## Goals

1. Optimize SAA-C03 review: testing, quizzes, and memory practice for commonly tested concepts.
2. Align the capstone with the Creative Hub course. The judge is the Python Classes 16–17 instructor.

## Decisions

- Exam guide v1.1 (2026-10-29). Domain weights 30 / 26 / 24 / 20.
- Timestream for LiveAnalytics is excluded. It closed to new customers on 2025-06-20.
- Cue gates are whatever `npm run audit:answer-cues -- --check` enforces for `saa-c03`. The ceilings live in `scripts/lib/answer-cues.mjs`. Do not copy them into this file.
- G-1 pool target is 453, with domain 1 at 30% and domain 2 at 26%. Five pull requests of at most 30 items. Per-task cap is 60.
- G-2 is 40 multi-response items, 8 of them "3 of 6", scored all-correct.
- G-3 adds fact records only for v1.1 in-scope services.
- Mocks keep unseen questions ahead of due review.
- AI Gateway stays on the free tier. It is owner-only through `AI_OWNER_PHONES` and fails closed. Explanations stay grounded. Plans carry `requires_human_review`. AI never edits content.

## Queue

1. G-1 batches 2–5
2. G-2
3. G-3
4. Step AI, Phase 1 design first
5. Step H capstone alignment
   - H-1 module, test, and README structure
   - H-2 five data problems with handling rules
   - H-3 leakage trap
   - H-4 unknown-category flag
   - H-5 classification view with precision and recall
   - H-6 `score_readiness` tool with `requires_human_review` always, as a LangGraph node
   - Prediction clipping, remove the pasted-report cell, and SQL equality asserts
6. B computed coverage
7. C reusable certification toolkit
8. D real-data bridge, Python API, and SQL project
9. E `/insights` dashboard
10. F `presentation.md`

## Done

- #256 Measure answer-length cues and shuffle game choices.
- #257 Rewrite the 65 most length-biased SAA items.
- #258 Rewrite the remaining strongly length-biased SAA items.
- #259 Rewrite the remaining self-disqualifying and non-parallel SAA items.
- #260 Replace strawman SAA distractors and enforce the SAA cue gates.
- #261 Lock the SAA cue ceilings and fill service-fact memory data.
- #262 Add fetched us-east-1 price anchors and exam classes.
- #263 Add the service-fact memory match.
- #264 Record the remaining core us-east-1 cost anchors.
- #265 Show the Twilio call that blocks the study report.
- #266 GitHub issue: the error report filed from /account/report arrived with an empty body and led to #268's auto-attached details.
- #267 Record first-attempt accuracy and mock seen-share.
- #268 Capture timestamps and report diagnostics.
- #269 Accept same-origin owner reads that omit Origin.
- #270 Bring thin SAA tasks 4.3, 4.1, and 3.1 up to 20.
- #271 Keep history past the sync caps and stamp each test.
- #277 Add 50 SAA match pairs for the thinner tasks, then revise the scheduled-rule hint and the Direct Connect backup pair.
- #278 Add SAA scenario cues for the study-guide cases.
