# Future evidence-driven learning platform

**Status: architectural exploration, not an implementation plan.** The current
certification-review site could eventually inform a reusable evidence-driven
learning platform. This document records possibilities, not shipped features,
product commitments, or authorization to collect data. Keep certification
review usable on its own; no product or branding change is proposed now.

## Status at this repository revision

| Area | Status and evidence boundary |
| --- | --- |
| Certification questions, objectives, notes, flashcards, labs and visuals | **Implemented:** authored content and interactive resources exist. Content coverage and software tests are not proof of learning or certification readiness. |
| Feedback and remediation | **Implemented / evolving:** quizzes show authored explanations; Network+ weak-area and inline remediation use deterministic mappings. See the [learner dashboard](learner-performance-dashboard.md). |
| Learner sync and evidence | **Implemented in repository:** authenticated learner sync, bounded telemetry and atomic progress snapshots; rollout and deployed state must be verified separately. See [telemetry](question-telemetry-v2.md) and [persistence](learner-progress-persistence.md). |
| Private activity export | **Implemented in repository:** an offline, read-only exporter produces deterministic analysis and private plans. It does not establish a complete history or improved outcomes; see [export documentation](learner-activity-export.md). |
| Protected learner activity API | **In review:** work exists on a separate feature branch, not on this main revision. Security/architecture review identified P2 issues; it is not a released or production capability. No learner-facing activity page is established by that work. |
| General engine, SQL Schema Lab | **Proposed:** neither a domain-independent engine nor the SQL proof case exists as described here. |
| Agent orchestration, learning-policy ML, knowledge tracing and IRT | **Research ideas:** require evidence, privacy review and evaluation; no model or learner agent is authorized by this note. |

The [adaptive review roadmap](roadmap-adaptive-review-agentic-ml.md) retains its
historical milestones; the [assessment workflow](assessment-workflow.md),
[visual guidance](adding-visuals.md), and [repository skill index](skills/README.md)
describe existing contributor practices. They should not be confused with a
deployed learner agent. Network+ remains the first consumer for current work;
do not refactor it into a generic engine prematurely.

## Principles and evidence boundary

- **Evidence before inference:** preserve observed behavior and its provenance; distinguish absent, contradictory and weak evidence.
- **Deterministic before probabilistic:** start with auditable rules and meaningful baselines.
- **Deterministic grading when possible:** when an outcome can be evaluated deterministically, deterministic evaluation should remain authoritative. A model may teach; it must not silently redefine the answer.
- **Transfer over memorization:** use a different task and delayed assessment, not just the same answer repeated immediately.
- **Uncertainty is a valid result:** use “not enough evidence” or “ambiguous” rather than inventing mastery.
- **Agent as orchestrator, not authority:** approved tools and independent evaluators determine facts and outcomes.
- **Visualizations should teach:** behavior, text equivalents and accessibility matter more than decoration.
- **Gamification should reinforce learning:** reward demonstrated progress, not activity volume.
- **Domain adapters over duplicated systems:** share contracts only once multiple domains justify them; preserve domain expertise.
- **Privacy by construction:** expose and retain only the minimum evidence needed.
- **Models must beat simpler baselines:** measure learning outcomes, safety, cost and latency before adopting complexity.

Possible future evidence includes task start/completion, first-attempt
correctness, retries, hint use, remediation views, transfer success, time
between attempts, delayed retention, independent versus assisted success,
deterministic test results, partial-competency evidence and uncertainty. These
are **candidate dimensions, not a collection mandate**. Expanded telemetry needs
explicit privacy, notice/consent, retention, deletion and access review first.
Current telemetry and local progress have different schemas and retention;
descriptive recovery or a later correct answer does not establish causality.

## Candidate learning engine and domain adapters

The certification vocabulary is useful today. A possible translation layer,
not a declaration that the concepts are identical in every domain, is:

| Certification context | Candidate general model |
| --- | --- |
| exam | learning domain |
| objective | competency |
| topic / concept | skill |
| question / lab | task |
| answer / result | evidence |
| remediation resource | learning resource |

Candidate identifiers are `domainId`, `competencyId`, `skillId` and `taskId`,
with versioned mappings and provenance. A transfer task would test the same
underlying skill in a meaningfully different situation. Preserve certification
scope and content-version semantics in adapters rather than assuming this mapping
is one-to-one.

```text
                         Learning engine (proposed)
                       /             |             \
              Network+ adapter   AWS adapter    SQL Lab adapter
              objectives        services       competencies
              questions         scenarios      executable tasks
              visuals           labs           schemas / queries
```

A future core could own learner identity boundaries, evidence contracts,
aggregation, weakness and recovery signals, recommendation contracts, privacy,
uncertainty and history. Adapters could own competency definitions, skill graphs,
tasks, deterministic evaluators, content mapping, resources, visualizations and
domain-specific remediation. Possible adapters include Network+, A+ Core 1 and
Core 2, AWS Cloud Practitioner and Solutions Architect, PL-300, SQL/database,
Python, cloud engineering, networking labs, ML fundamentals and other
competency-based domains. This is not a request for graph infrastructure or an
engine refactor now.

## Proposed proof case: SQL Schema Lab

An unfamiliar relational schema offers a useful non-certification proof case:

```text
CUSTOMERS(customer_id, name, region)
ORDERS(order_id, customer_id, order_date, total)
PRODUCTS(product_id, name, category)
ORDER_ITEMS(order_id, product_id, quantity, price)
```

Example task: **Return the top five customers by total order value within a
specified region.** A well-specified evaluator could separately observe schema
navigation, relationship and key identification, join construction, filtering,
aggregation, `GROUP BY`, `HAVING` where appropriate, sorting, limiting, result-set
correctness and, where justified, query efficiency. Not every solution needs
every clause; evaluate the task's requirements rather than rewarding syntax.

Future competencies could cover `SELECT`, filters, joins and junction tables,
aggregates, `GROUP BY` / `HAVING`, subqueries, CTEs, window functions, schema
navigation, normalization, keys/constraints, indexing, query plans and
optimization, transactions, and permissions/security. An isolated SQL engine can
evaluate queries and results against varied fixtures, producing richer evidence
than a single multiple-choice answer. Multiple correct query forms, ties, nulls,
ordering requirements and data variants need explicit tests. Any sandbox would
require separate security design: isolated disposable data, read-only or scoped
permissions, resource/time limits and no access to production or credentials.

Candidate independent evaluators: SQL execution/results; Python unit tests and
runtime behavior; networking simulator or known topology state; authored quiz
answer keys; an independent subnet calculation oracle; and structured
configuration-state validation. Models may assist explanations, hints or task
selection, but should not replace these or act as the grading oracle.

## Skill graphs and learner maps

**Proposed:** versioned competency relationships could support prerequisites,
progressive difficulty, remediation paths, transfer selection, visual progress
and agent planning without requiring a graph database.

```text
Basic SELECT -> filtering; aggregation -> GROUP BY -> HAVING
Table relationships -> INNER JOIN -> multi-table joins -> bridge tables
```

An interactive learner map might show SQL branches for joins and aggregation,
with bridge-table and HAVING nodes beneath them. Candidate states are unseen,
attempted, weak evidence, improving, consistently successful and needs transfer
validation. “Mastered” requires a validated definition, not a colored node or a
single recent success.

## Interactive and multimodal visualization

**Proposed progression:** static explanation -> interactive demonstration ->
interactive practice -> learner-state-aware visualization. A visualization
should expose a teachable cause and effect, accessible text alternatives,
keyboard/touch operation and reduced-motion behavior; it must not reveal answers
before an attempt or treat animation use as proof of learning. Existing authored
visuals follow [visual guidance](adding-visuals.md).

- **Networking:** packet flow, switch forwarding, routing decisions, VLAN traversal, subnet allocation, NAT transformations, DNS resolution, spanning tree, and cloud/network architecture paths.
- **SQL/database:** schema exploration, click-to-build joins, foreign-key paths, logical execution order, row transformations per clause, data lineage, index selection, query plans, cardinality changes, and transactions/locking.
- **Cloud:** architecture construction, request/data flow, IAM policy evaluation, service-selection trees, cost/resilience tradeoffs, and region/AZ topology.
- **ML education:** interactive thresholds and confusion matrices, precision/recall, gradient descent, residuals, feature impact, training/validation error, overfitting and calibration.

Visualizing an ML concept for a learner is distinct from using ML internally to
model that learner. Possible modalities include text, diagrams, animations,
interactive controls, CLI simulations, code editors, database sandboxes,
network simulations, cloud builders, narration, quizzes and labs. Treat these as
resource/task types where practical, rather than assuming every domain is a quiz.

## Interactive and gamified learning

**Experimental:** game mechanics should encourage retrieval, transfer, repeated
practice, improvement, exploration and consistency—not points for their own
sake. Candidates include skill maps and competency nodes, progress paths,
missions/labs, challenge sequences, optional XP or streaks, validated checkpoints,
scenario campaigns, troubleshooting missions, unlockable transfer tasks,
cooperative scenarios, appropriate timed challenges, difficulty progression,
competency-tied badges and visual skill-graph progress. Avoid rewarding clicks,
trivial repetition, speed over understanding or memorized answer order.

For example, a **Restore database reporting** mission might ask a learner to
inspect a schema, find a broken join, repair a query, optimize a slow query and
then solve a different transfer scenario. Its evidence could distinguish schema
navigation and joins from uncertain aggregation or unsuccessful indexing; it
must not equate completion or XP with mastery.

Richer simulations could provide:

- **Network operations:** a topology, alerts, CLI output, logs and user reports to diagnose and repair.
- **Cloud architecture:** business requirements, budget, resilience and security constraints, with deterministic rule-based feedback.
- **SQL investigation:** an unfamiliar schema, a data problem and incomplete documentation to investigate with queries.
- **Incident response:** logs, network indicators, endpoints and alerts for scope and remediation decisions.

These are proposed environments, not evidence that such simulations improve
learning. They would need bounded execution, accessibility and independent tests.

## Agentic learning and tool boundaries

**Research idea:** after deterministic recommendations have a reliable baseline,
a bounded agent could observe a minimal learner evidence summary, diagnose a weak
competency, inspect approved resources, choose an activity, offer progressive
hints, observe independent evaluation, select remediation, request a different
transfer task, reassess and choose the next activity:

```text
Observe -> Diagnose -> Choose activity -> Learner attempt
        -> Deterministic evaluation -> Explain / remediate
        -> Different transfer task -> Measure again
```

Possible strictly allowlisted tools: retrieve verified notes, diagrams or
flashcards; inspect a minimal evidence summary; select a lab or drill; launch a
visualization; generate a constrained candidate variation or progressive hint;
request a transfer task; start an isolated SQL task and run its deterministic
evaluation; run isolated Python tests; or open a network simulator. Calls need
server-side learner scoping, bounded destinations, steps, latency and cost, plus
an auditable deterministic fallback.

The agent must not autonomously modify production data, learner identity,
repository contents, authentication, grading rules or Twilio; access credentials;
deploy; or publish generated instructional content. Candidate generated
questions, explanations, visualizations and transfer tasks require factual and
scope verification and human review where appropriate. Prompts and retrieved
content are untrusted inputs. A model must not invent exam scope, silently change
answer keys or become the authoritative grading oracle.

## Recommendations, ML and psychometrics

**Proposed progression**, each level contingent on evidence that it improves the
preceding baseline:

0. Static topic review.
1. Deterministic adaptation: repeated misses point to an approved resource.
2. Evidence-aware rules: recent misses and a failed transfer task indicate a need.
3. Agent-assisted selection from approved resources and activities.
4. Model-assisted policy estimating uncertainty and suggesting a next skill.

Possible **research** spans Bayesian knowledge tracing and mastery uncertainty,
forgetting curves and spaced-repetition optimization; observed item difficulty,
distractor effectiveness, discrimination, ambiguous questions and version drift;
task and resource recommendation that avoids repetition and preserves transfer;
clusters of related skills, content gaps, mapping concerns, recurring
misconceptions and explanations associated with later improvement. Correlation
does not establish that an explanation or resource caused improvement.

An adaptive policy might use learner evidence -> estimated uncertainty -> task
selection -> appropriate challenge. Preserve required content coverage; do not
narrow learning to predicted weaknesses. Classical item analysis, Bayesian
mastery, IRT and computerized adaptive testing require sufficient data, stable
item versions, independent evaluation, fairness checks, uncertainty intervals,
held-out evaluation and calibration. Do not claim certification pass probability
without validation or infer global mastery from a small local history.

## Evaluation and shadow experiments

Link to the existing [assessment workflow](assessment-workflow.md) for
content/rubric evidence. Future evaluation should cover:

- **Software:** unit, integration and end-to-end tests.
- **Learning-system correctness:** deterministic recommendations, mapping and evaluator accuracy, evidence merging and privacy boundaries.
- **Agent evaluations:** tool selection, factual grounding, safe tool use, hallucinations, prompt injection, deterministic fallback, cost and latency.
- **Learning effectiveness:** delayed retention, unseen transfer, repeated-miss resolution, time to a *validated* competency, completion and recommendation acceptance/dismissal. Immediate recall alone is not proof of learning.

**Experimental:** compare a deterministic recommendation delivered to the
learner with a shadow model's prediction and later observed outcomes; do not let
the shadow model change the experience. Use fixtures first. Real learner shadow
processing requires appropriate privacy review and permission. Define held-out
evaluation, safety and cost criteria before adoption.

## Privacy and operational boundaries

Keep identity, evidence, content and recommendation concerns separate where
practical. Default to minimal server-side identity, learner isolation, explicit
browser DTO allowlists, no raw provider records or answer-key leakage, bounded
retention, and explicit deletion/export policies. Never send credentials or phone
numbers to models or analytics; avoid cross-learner recommendation contamination.
Current authenticated `study_event` logs can contain validated allowlisted
session/question IDs; do not describe them as anonymous or add copies elsewhere.
Any new use or expanded collection requires its own privacy review.

## Possible proof sequence — not a commitment

1. Complete and review protected Network+ learner activity; then consider a learner-facing activity UI.
2. Validate the end-to-end learner loop and stabilize deterministic recommendations.
3. Document/generalize contracts only when useful; add another certification adapter.
4. Explore SQL Schema Lab as a first non-certification domain and richer deterministic evaluators.
5. Explore interactive competency visualizations and gamified missions.
6. Prototype bounded agent orchestration; evaluate it in shadow mode before influencing learners.
7. With sufficient high-quality, appropriately governed evidence, evaluate knowledge tracing and other ML against simpler baselines; adopt only if measured outcomes improve.

Conceptually the product could evolve from a certification review site to an
adaptive review platform, interactive learning lab and evidence-driven learning
platform. These labels are architectural possibilities, not a branding decision.

**Non-goals:** this document authorizes no engine refactor, learner API change,
new telemetry, model training, vector database or embeddings, deployed agent,
provider account, credentials, autonomous repository modification, rollout,
certification scoring change or branding change.
