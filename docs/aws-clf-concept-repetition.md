# CLF-C02 2.1 concept repetition and remediation

Base: `origin/main` at `852a87e72878cd35a1c603aae9aab962ed378d3e`.
Branch: `feature/aws-clf-concept-repetition`.

This change reuses QuizRunner, its SR/MR feedback, current question IDs/objectives, study telemetry, quiz/mock history and progress sync. It adds a small CLF-only responsibility adapter and evidence derived from existing retained attempts. No new learner store, authentication path, dashboard, question bank, content promotion, protected-activity API dependency or certification-wide engine rewrite is introduced.

## Reviewed mapping

[Adapter](../lib/aws-clf-remediation.ts) IDs are stable and intentionally more specific than Objective 2.1. Membership requires a reviewed question ID, CLF-only exam metadata and exactly objective 2.1. A miss is evidence on that tested distinction, not proof of the learner's internal cause of error.

| Competency / misconception signal | Existing questions | Exact existing card |
| --- | --- | --- |
| `clf21-ec2-guest-os` — customer guest-OS patching versus AWS platform ownership | `q-clf21-01`, `q-clf21-05`, `q-clf21-06` | `fc-clf21-ec2` |
| `clf21-rds-data-access` — customer data/database-user access versus managed platform work | `q-clf21-03`, `q-clf21-08`, `q-clf21-09`, `q-aws-review-clf-c02-2-1` | `fc-clf21-rds` |
| `clf21-physical-infrastructure` — AWS ownership of physical infrastructure | `q-clf21-02` | `fc-clf21-physical` |
| `clf21-lambda-iam` — customer Lambda permission configuration | `q-clf21-04` | `fc-clf21-lambda` |
| `clf21-lambda-code` — customer application code/data handling | `q-clf21-07` | `fc-clf21-lambda` |

Ten questions map to five competencies. The broad `q-clf21-10` model question, mixed-competency EC2 multi-response item and shared CLF/SAA foundation items are deliberately not classified into a precise misconception. Existing RDS question `q-clf21-08` supplies multiple-response practice. Lambda IAM and application code are different competencies; they are not used as transfer alternatives for each other. There is no claim to a dedicated Lambda platform-maintenance question where the current bank lacks one.

All mapped resources use `/notes/aws-clf-security-transfer#responsibility` and the registered `aws-clf-security-transfer.html` visual, including its EC2/RDS/Lambda boundary comparison. Exact card IDs replace first-card-by-topic selection. No AWS questions, flashcards, topics, objectives, labs, drills or visual files change.

For CLF-only questions without an explicit adapter mapping, generic notes remain available but arbitrary first-topic cards, videos and visuals are omitted. This small selection guard prevents the known SG/NACL → Athena/Kinesis/Glue/global-infrastructure mismatch without adding a second set of AWS mappings or redesigning recommendations. N10 and other certifications keep their existing resource behavior.

## Learner flow

After an answer is submitted, mapped questions offer **Repeat question** and, when an eligible alternative exists, **Practice this concept**. Actions also appear after results. Repeating keeps the authored question ID but resets picks, revealed feedback and submission guards; choices are reshuffled through the existing mechanism. The correct answer/explanation appears only after the next submission.

Replacing a deck commits only its answered, not-yet-recorded items. Unanswered items are not scored. A per-deck identity and recorded-ID guard rejects stale/double action handlers and prevents finish from saving the same answers again. Repetition starts a new one-question deck with fresh submission/completion guards, so an intentional new answer remains a distinct attempt and study event. Other tracks retain their completion-driven history behavior.

“Practice this concept” selects a different reviewed ID with the same competency, current CLF identity and objective 2.1. It prefers items absent from retained history and the current deck's answers. No runtime questions are generated. A single-item competency shows a concise no-alternative message and still permits deliberate repetition; it does not substitute an unrelated 2.1 question.

Controlled quiz URLs carry the exam to QuizRunner for scoring/telemetry context. A filtered empty controlled pool stays empty with Start disabled instead of falling back to an unrelated quiz. Shared retry URL construction preserves N10 exam identity and supplies CLF identity for mapped AWS retries. Notes/visual links retain existing locale/static-asset behavior. New actions, labels and evidence text are translated for en/es/fr/pt.

## Evidence and recovery

`awsClfConceptEvidence()` uses the existing `progressAttempts()` inputs. It does not infer correctness from aggregate-only quiz stubs. Explicit other-exam mocks and mismatched objective snapshots are excluded. Duplicate same-time question outcomes collapse; contradictory copies cannot establish recovery. Same-time items within a sitting cannot prove an ordered transfer sequence.

| Evidence | Deterministic rule |
| --- | --- |
| Repeated-question evidence | Correct response to an ID with an earlier retained scored attempt. The earlier attempt can have been correct or incorrect. This alone does not establish concept recovery. |
| New-question transfer evidence | After a miss, a later correct response to a different, previously unattempted-in-retained-history ID in the same reviewed competency. Previously exposed alternatives count as repetition, not new transfer. |
| Current recovery evidence | A qualifying transfer success after the last concept miss. A later miss or contradictory latest evidence clears the current indicator; earlier misses and historical successful transfer IDs/counts remain. |
| Retention | Not claimed or scheduled. A later timestamp alone is not meaningful delayed-retention evidence. |

The results view shows repeated and new-question transfer counts for the current mapped competencies, with recovery explicitly labeled as evidence rather than mastery. Existing question-level recovery remains available through existing performance calculations. No mastery probability, pass probability or one-correct-answer mastery claim is added.

The lineage is derived: competency → prior miss ID/time → later different successful ID/time. It is not a claim that the learner opened a particular resource or that an offline/private summary is available through the unmerged protected API. Retained history caps (40 quizzes/30 mocks), metadata version changes, missing abandoned sittings and lack of a universal cross-stream attempt ID still limit interpretation. “New” means new within retained scored evidence, not guaranteed never viewed.

## Persistence compatibility

No progress schema or server telemetry schema changes. Existing parse/merge/save paths retain the attempts. `recordQuiz` accepts an optional recording timestamp; default callers retain the existing Date.now behavior. Only scoped AWS commits use a timestamp later than all retained quiz/mock evidence so a fixed/low-resolution clock or a change from mixed-topic to topic-specific practice cannot collide with earlier merge identities. Syncing the same snapshot does not create a second attempt.

Telemetry keeps the existing registered event types and fields. AWS mapped remediation-panel/flashcard opens are eligible alongside the existing N10 path; concept practice uses the existing similar-question event. There is no new API or relaxation of signed-in storage/privacy boundaries. Concept recovery can be recomputed after syncing the ordinary progress object; no parallel recovery record is written.

## Validation

- Targeted [AWS tests](../tests/aws-concept-repetition.test.mjs): 11 tests covering mapping/resource contracts, initial miss, repetition, transfer, recovery/relapse, invalid alternatives, empty alternatives, exposure/timing/contradiction safeguards, exam isolation, progress parse/merge, real recordQuiz plus fake-map telemetry, and N10 resource regression. Included in the existing `test:inline-remediation` command.
- Combined learner, sync/persistence, exporter, quiz-feedback, inline-remediation, weak-area, performance, telemetry, AWS/exam, controlled-pool, N10 objective-mapping and content-check run: **226 passed / 0 failed**.
- `npm run lint`: **0 errors / 4 existing warnings**. React review checked hook ordering, state/ref boundaries, button semantics, responsive wrapping, locale keys and submission gating. No decorative animation was introduced.
- `npm run check:content`: **0 errors / 207 existing warnings**. Question bank, authored resource files and objective status map are unchanged.
- `npm run typecheck`: blocked while loading next.config.ts by the pre-existing missing SWC native binding / `ERR_SWC_NATIVE_CACHE`, before normal type generation.
- Standalone tsc using copied, ignored baseline route declarations reproduces the same **232 existing generated-route diagnostics** on main and this branch, with no additional branch diagnostics. This is a baseline comparison, not a passing full typecheck. No generated types are committed.
- Local browser startup on port 3007 fails at the same SWC/native-cache boundary. No browser/E2E pass is claimed; no SWC, Turbopack, dependency or Vercel repair is included. Tests use synthetic data and fake maps only.
- `git diff --check`: passed. No PDFs, proprietary source material or production learner data are included.

## Follow-ups and review readiness

Implementation and deterministic regressions are ready for review. Full typecheck and rendered keyboard/mobile/repetition E2E verification remain blocked by the existing environment baseline and should run in a healthy environment before merge. No PR is opened by this task.

Retention scheduling, broad AWS mapping, dashboard isolation/aggregation fixes and protected-API integration remain separate work. The audit report, source-register repair and protected learner activity branches are preserved. No merge or deployment is part of this change.
