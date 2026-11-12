# Roadmap: adaptive review, agentic remediation, and machine learning

**Status:** Proposal only — no agentic AI or ML feature is implemented by this document.  
**Created:** 2026-11-05  
**Product:** Tech Certification Lab — rubric-driven certification review and remediation.  
**Learner loop:** Study → Test → Remediate → Measure.  
**System loop:** Ingest → Map → Assess → Drill → Remediate → Measure.

**Broader direction (proposed):** The [future learning platform note](future-learning-platform.md)
explores a domain-independent evidence/competency engine and adapters after the
existing Network+ work is proven. An SQL Schema Lab is a possible non-certification
proof case, with deterministic query evaluation. Interactive visualization and
gamification could support practice and transfer; bounded agents and ML belong
later in evaluated, privacy-reviewed experiments. None is a commitment to refactor,
collect new telemetry, deploy a model, or rename the product. The historical
milestones and decision record below remain intact.

## Why this belongs here

The application already provides exam objectives, topic/concept-mapped materials, quizzes, weak-area and scorecard interfaces, a remediation pathway, and learner telemetry. A recent production log inspection showed multiple completed Network+ quizzes with question counts, correct counts, and missed counts. **These logs establish event receipt, not durable completeness of synced history or improved learning outcomes.**

The next useful feature is an evidence-driven answer to: **“What should I review next, and why?”** Keep AI subordinate to that learner task. Do not introduce a generic chatbot as a substitute for the existing tools.

## Existing capabilities vs. proposed capabilities

| Area | Existing foundation | Proposal (not built) |
| --- | --- | --- |
| Evidence capture | Quiz events and progress/telemetry, with optional Twilio-backed learner sync | Quality-controlled per-attempt evidence and cross-device reconciliation checks |
| Rubric linkage | Exam objectives and mapped content | Reliable question → concept → objective → remediation lookup, with provenance |
| Recommendations | Weak-area / progress interfaces and remediation links | Deterministic ranking of next-best review actions with explanations |
| Agentic workflow | Documented assessment workflow and review tools | Bounded agent that chooses *existing* verified resources and drills |
| ML/psychometrics | Not established by telemetry alone | Experimentally calibrated item difficulty / mastery estimates when data supports it |
| Evaluation | Content checks and feature tests | Offline replay, leakage checks, prospective A/B tests, calibration and retention measures |

## Milestone 0 — evidence and privacy contract (prerequisite)

Before building adaptive recommendations:

1. Inventory the exact telemetry schemas, user-visible progress states, data retention, question IDs, objective IDs, concept tags, and remediation identifiers. Identify which events are persistent in Twilio Sync versus merely emitted to Vercel runtime logs.
2. Specify the learner-session lifecycle and deduplication rules. Use stable event/attempt IDs to avoid double-counting retries, reloads, beacons, and cross-device merges. Record source/time consistently; reject implausible times and out-of-order conclusions.
3. Establish a quality report: starts vs. completions, answered-count consistency, dropped events, retry/duplicate rate, mappings missing for attempted questions, and age of evidence.
4. Keep learner identity server-side. Do not send phone numbers, SMS codes, Twilio identifiers, cookies, tokens, or raw provider responses to language models, analytics exports, client logs, or public benchmarks. The existing phone allowlist is a deployment-specific owner-only guard, **not** a general multi-user authorization model.
5. Provide consent/notice and delete/export affordances as appropriate for any expanded learning analytics. Define retention before expanding captured data. Forks must configure their own privacy model.
6. Partition all evidence and recommendations by authenticated learner; no cross-learner mixing. Avoid exposing raw history in public endpoints, client bundles, Vercel logs, or GitHub.

**Exit gate:** Telemetry correctness tests pass; a sampled completed quiz reconciles to persistent progress without leaking secrets or full phone numbers. Existing production learner sync and quiz behavior remain unchanged.

## Milestone 1 — explainable adaptive review (no LLM required)

Implement a deterministic selector first. For each eligible objective/concept, compute an auditable priority from:

- Recent wrong answers and repeated misses, with deduplication;
- Sample size and uncertainty (one miss is weak evidence);
- Recency and prior successful retries;
- Official exam domain weight (not a claim about a candidate's chance of passing);
- Availability of verified notes, visuals, flashcards and drills;
- Anti-repetition and coverage diversity constraints.

Return the **top one to three** review actions with: evidence summary, mapped objective/concept, link to a real existing resource, and a plain-language “why this was recommended.” Provide “not enough evidence” rather than inventing a proficiency score. Ensure a learner can dismiss or choose a different path.

Start with an **offline, opt-in shadow mode** on stored test fixtures or consented history. Compare against static recommendations and random practice without changing the quiz-selection algorithm.

**Exit gate:** Deterministic results for identical snapshots; no cross-certification misrouting; every recommendation resolves to a valid asset; no fabricated links; safe defaults for missing mappings and low counts.

## Milestone 2 — bounded remediation agent

Only after the deterministic baseline is reliable, prototype an agent that orchestrates approved tools:

1. Read an authenticated, minimally scoped evidence summary.
2. Resolve missed question IDs to validated concepts/objectives.
3. Retrieve existing verified study assets and suitable drills.
4. Propose a short remediation sequence with citations/links and uncertainty.
5. Optionally draft new *candidate* items in an isolated authoring workflow, **never publishing generated exam material without human review, rubric checks, and factual validation**.
6. Log the agent's tool choices, costs, model/version, retrieved asset IDs, and failure reasons without logging secrets or personal identifiers.

Safety/engineering constraints: allowlist tools and destinations; enforce server-side learner access; cap steps/tokens/latency/cost; prevent prompt injection from retrieved materials; no autonomous credential, Twilio, deployment, or repository writes; fallback to the deterministic selector when the model/API is unavailable.

**Exit gate:** Verified links and objective mapping, high factual/grounding accuracy on a held-out benchmark, safe refusals for out-of-scope actions, and reliable deterministic fallback. Keep quiz grading independent of model output.

## Milestone 3 — ML and psychometric experiments

Do **not** train a neural model on a handful of quizzes. Start when data volume, labeling quality and learner permission justify experiments.

Candidate approaches:

- Item analysis: observed difficulty, distractor selection, discrimination, ambiguity alerts;
- Bayesian mastery / knowledge tracing per concept, with uncertainty intervals;
- Spaced-repetition parameter tuning, if repeated attempts support calibration;
- Later, IRT / computerized adaptive testing only with sufficient calibrated items, content balancing, fairness checks, and independent validation.

Avoid training directly against the same repeated questions a learner memorizes. Separate initial attempts, immediate retries, and delayed transfer assessments. Treat question-bank revisions as new item versions; do not silently mix them.

**Exit gate:** The ML approach outperforms the deterministic baseline on predeclared measures and does not inflate proficiency estimates, leak answers, or narrow objective coverage.

## Evaluation design

Use three layers, aligned with the site's established testing direction:

1. **Unit/contract tests:** event parsing, merging, identity isolation, mapping integrity, recommendation scores, missing data, deduplication, timestamps, costs.
2. **End-to-end tests:** real UI navigation and a simulated learner lifecycle: complete → sync → remediate → retry → measure. Test mobile and keyboard usage; test Twilio with an isolated test service where available, never by mutating production history.
3. **Model/agent evaluations:** fixture-based question/concept mapping, factual grounding, link correctness, tool selection, hallucination rate, adversarial prompt injection, model-version regressions, and cost/latency budgets.

For learning effectiveness, compare predeclared baselines with randomized or carefully controlled cohorts when justified:

- Delayed concept retention and unseen-question transfer;
- Questions/minutes needed to reach a fixed validated proficiency threshold;
- Coverage across the rubric and repeated-miss resolution;
- Recommendation acceptance / dismissal, with interpretability;
- Error rates, costs, accessibility and equitable outcomes.

Quizzes taken immediately after showing an answer are **not** sufficient evidence of mastery. Do not present a numerical certification pass probability without a validated predictive study.

## Product surface and visual identity

Do not add a new global “AI” tab. Keep the interface task-oriented:

- **Progress:** “Recommended next review” with evidence and links;
- **Quiz results:** “Try this focused follow-up”;
- **Weak areas:** transparent repeated-miss and uncertainty signals;
- **Methodology:** disclose what is rules-based, model-assisted, experimental, and what evidence is used;
- **Repository:** public design docs and evaluation fixtures, never real learner history.

Orbs/animation remain decorative or educational; no recommendation should depend on an animation or be hidden by reduced-motion preferences.

## Suggested implementation units (future PRs, not part of this release)

1. **Telemetry evidence audit + fixtures:** read-only diagnostics and identity/data-quality tests.
2. **Objective/concept remediation index:** validated mappings and link integrity.
3. **Deterministic Adaptive Review:** recommendation utility, explanation format, feature flags, and UI.
4. **Shadow evaluation:** record outcomes without influencing learner experience; compare baselines.
5. **Agent-assisted review (optional):** bounded tools, grounded responses, cost controls.
6. **ML research track (optional):** item analytics/calibration, held-out evaluation and an evidence-based go/no-go decision.

Keep each PR narrow. Do not alter Twilio auth/Sync architecture, production telemetry events, exam scoring, or deployments during design experiments. Ship behind default-off feature flags and explicitly verify consent/privacy before processing real learner data.

## Implementation decision log

- **2026-11-05:** Roadmap proposed and documented alongside the design-release work. No ML model, adaptive selector, agent, data export, or additional telemetry collection authorized or deployed.
