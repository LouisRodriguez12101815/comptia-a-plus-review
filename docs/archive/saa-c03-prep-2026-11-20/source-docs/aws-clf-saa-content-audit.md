# AWS CLF-C02 and SAA-C03 content audit

Audit branch: `audit/aws-clf-saa-content`  
Baseline: latest `origin/main` at `6d912e2` (includes merged PR #219)

## Evidence and source limits

Repository evidence was inspected locally, including `content/objectives.json`, `content/questions.json`, `content/topics*.json`, `content/flashcards.json`, `content/track-visuals.json`, `content/labs.json`, `content/aws-review-sources.json`, the AWS routes, and the existing validation tests.

The two supplied PDFs could not be authorized or resolved by the file-access tool in this environment. Their filenames identify them as:

- `AWS Certified Cloud Practitioner Study Guide eBook.pdf` — Ben Piper/David Clinton CLF-C02 study guide, Second Edition (edition supplied in the request; PDF contents were inaccessible).
- `AWS Certified Solutions Architect Study Guide Associate (SAA-C03) Exam, 4th Edition (Ben Piper, David Clinton).pdf` — SAA-C03, 4th edition.

No course-note or lab-walkthrough archive was attached in an accessible form. I therefore did not claim to review textbook chapter outlines, recordings, or private course material. The repository's authored labs and notes were the only supporting material available. No copyrighted material was copied into the repository.

The official AWS guide URLs are present in question provenance (`content/questions.json`) and were used as the scope reference. Live retrieval of the AWS pages was unavailable from this execution environment; classifications below are therefore repository-evidence classifications and should receive a final guide-version check before content changes.

Reproducible command:

```bash
node scripts/audit-aws-content.mjs
```

## Executive summary

CLF-C02 has broad, useful authored coverage and the new domain-first workflow is connected to the official four-domain map. The strongest areas are security/shared responsibility, migration/design decisions, AI/ML and other service-category selection, and the paper-first CLF labs. The main readiness risk is uneven depth: objectives 1.1, 1.4, 3.1–3.6, and 4.1–4.3 are marked partial in the repository and rely heavily on shared foundation topics. Domain 3 has many questions but still needs more objective-specific scenarios and balanced answer positions.

SAA-C03 has a credible foundation of notes, questions, visuals, and design labs, but every objective is marked `partial` in the objective map. Cost-optimized architecture is the clearest gap: objectives 4.1, 4.3, and 4.4 each have only four explicitly tagged questions, and 4.2 has nine. SAA practice also needs more trade-off, constraint, and failure-mode questions instead of service-definition recall.

Highest-priority readiness work is CLF first: deepen partial objectives, repair question-quality warnings and exact duplicates, connect feedback to mapped visuals/labs, and add objective-level mixed/domain quotas. Then expand SAA cost/resilience trade-off coverage and lab verification.

## CLF-C02 objective coverage matrix

Counts below use explicit `objectiveIds.clf-c02` tags, not merely shared topic membership. “Covered” means the repository has authored teaching plus mapped questions and at least one useful study asset; it does not mean exam readiness is proven.

| Domain / objective | Repository status | Evidence | Audit classification | Priority / next action |
|---|---|---|---|---|
| 1.0 Cloud Concepts (24%) / 1.1 Benefits | `partial`; 20 questions | `aws-clf-cloud-concepts`, `aws-foundation-cloud-global`; `q-aws-found-01`, `q-clf-01`; `aws-clf-cloud-economics-selection` | Partially covered | P1: add quantified elasticity, agility, global reach, availability and TCO scenarios with distractor contrasts. |
| 1.2 Design principles | `covered`; 11 questions | `aws-clf-well-architected-decisions`; `q-aws-review-clf-c02-1-2`, `q-clf12-01`; Well-Architected visual | Covered, with depth risk | P1: add scenario trade-offs and explicit pillar-to-decision practice. |
| 1.3 Migration benefits/strategies | `covered`; 16 questions | `aws-clf-migration-decisions`; `q-clf-08`, `q-clf13-01`; `aws-clf-migration-planning` | Covered | P2: add strategy-selection distractors and validation/rollback transfer. |
| 1.4 Cloud economics | `partial`; 19 questions | `aws-foundation-observability-cost`; `q-aws-found-04`, `q-clf-07`; `aws-clf-cloud-economics-selection` | Partially covered | P1: add rightsizing/utilization/licensing/TCO cases and cost-model comparisons. |
| 2.0 Security and Compliance (30%) / 2.1 Shared responsibility | `covered`; 14 explicit questions | `aws-clf-security-compliance`, `aws-foundation-identity-security`, `aws-clf-security-transfer`; `q-aws-found-10`, `q-aws-review-clf-c02-2-1`; `aws-clf-security-responsibility` | Covered | P1: retain as CLF anchor; add service-specific responsibility transfer cases. |
| 2.2 Security, governance, compliance | `covered`; 17 questions | `q-aws-found-08`, `q-aws-found-09`, `q-clf-11`; Artifact/CloudTrail/Config material | Covered | P1: distinguish evidence, detective controls, prevention, and governance ownership. |
| 2.3 Access management | `covered`; 20 questions | `aws-clf-access-management`; `q-aws-found-07`, `q-clf-16`; access-management visual | Covered | P1: add Identity Center vs IAM user/role and policy-evaluation scenarios. |
| 2.4 Security components/resources | `covered`; 18 questions | `aws-clf-security-transfer`; `q-aws-found-12`, `q-clf-12`; security responsibility lab | Covered | P2: add service-selection cases for WAF, Shield, GuardDuty, Inspector, Macie, and Firewall Manager. |
| 3.0 Cloud Technology and Services (34%) / 3.1 Deployment/operations methods | `partial`; 14 questions | `aws-clf-technology-services`, `aws-foundation-observability-cost`; `q-clf-28`, `q-aws-review-clf-c02-3-1`; `aws-clf-cloud-platform-selection` | Partially covered | P1: expand Console/CLI/SDK/API/IaC and hybrid/on-premises selection cases. |
| 3.2 Global infrastructure | `partial`; 19 questions | `aws-foundation-cloud-global`; `q-aws-found-02`, `q-aws-found-03`, `q-clf-04`; global design lab | Partially covered | P1: separate Region/AZ/edge/Local Zone/Outposts and failure-scope decisions. |
| 3.3 Compute services | `partial`; 21 questions | `aws-foundation-compute-storage`; `q-aws-found-13`, `q-aws-found-17`, `q-clf-21`; compute visual | Partially covered | P1: add EC2/ECS/EKS/Fargate/Lambda and scaling-role contrasts. |
| 3.4 Database services | `partial`; 18 questions | `aws-foundation-network-database`; `q-aws-found-22`, `q-aws-found-23`; data-platform lab | Partially covered | P1: add relational, key-value, cache, graph, warehouse, and migration decision cues. |
| 3.5 Network services | `partial`; 19 questions | `aws-foundation-network-database`; `q-aws-found-19`, `q-aws-found-20`; database/network visual | Partially covered | P1: add VPC, Route 53, CloudFront, VPN, Direct Connect, SG/NACL comparisons. |
| 3.6 Storage services | `partial`; 19 questions | `aws-foundation-compute-storage`; `q-aws-found-14`, `q-aws-found-15`; storage visual | Partially covered | P1: add S3/EBS/EFS/FSx/Storage Gateway/Backup selection and durability/availability cues. |
| 3.7 AI/ML and analytics | `covered`; 19 questions | `aws-clf-ai-analytics`; `q-clf-22`, `q-clf-23`; AI/analytics visual | Covered, verify freshness | P2: recheck service names and current in-scope categories against the guide revision. |
| 3.8 Other service categories | `covered`; 21 questions | `aws-clf-other-service-categories`; `q-aws-found-25`, `q-aws-found-26`; service-category visual | Covered, verify breadth | P2: add eventing, integration, management and developer-tool contrasts. |
| 4.0 Billing, Pricing, Support (12%) / 4.1 Pricing models | `partial`; 24 questions | `aws-foundation-observability-cost`; `q-aws-found-30`, `q-clf-34`; cost lab | Partially covered | P1: add On-Demand, Reserved/Savings Plans, Spot, data-transfer and licensing cases. |
| 4.2 Billing/budget/cost resources | `partial`; 26 questions | `aws-foundation-observability-cost`; `q-aws-found-28`, `q-clf-31`; cost visual/lab | Partially covered | P1: distinguish Billing console, Cost Explorer, Budgets, Pricing Calculator, tags and CUR. |
| 4.3 Technical resources/support | `partial`; 22 questions | `aws-clf-billing-support`; `q-clf-38`, `q-clf43-01`; cost/support visual | Partially covered | P1: add support-plan and Trusted Advisor/resource-selection scenarios. |

## SAA-C03 objective coverage matrix

| Domain / objective | Repository status | Evidence | Audit classification | Priority / next action |
|---|---|---|---|---|
| 1.0 Secure (30%) / 1.1 Secure access | `partial`; 11 questions | `aws-saa-secure-architectures`, `aws-saa-identity-observability`; `q-aws-found-07`, `q-saa-core-29`; IAM cross-account lab | Partially covered | P1: add policy-evaluation, federation, cross-account and workload-identity case chains. |
| 1.2 Secure workloads/apps | `partial`; 16 questions | SAA secure/VPC/IAM topics; `q-aws-found-08`, `q-saa-core-08`; VPC lab | Partially covered | P1: add layered controls and threat-to-control trade-offs. |
| 1.3 Data security controls | `partial`; 6 questions | SAA storage/IAM topics; `q-saa-core-08`, `q-saa-core-33`; S3 lifecycle/replication lab | Partially covered | P1: expand encryption, key policy, data movement and retention scenarios. |
| 2.0 Resilient (26%) / 2.1 Scalable/loosely coupled | `partial`; 7 questions | SAA resilient/compute/DNS topics; `q-aws-found-17`, `q-saa-core-35`; SQS decoupling lab | Partially covered | P1: add queue semantics, retries, idempotency, fan-out and independent scaling. |
| 2.2 HA/fault tolerance | `partial`; 16 questions | resilient/compute/database/network topics; `q-aws-found-02`, `q-saa-core-22`; ALB/ASG, RDS and DR labs | Partially covered | P1: add failure-domain, quorum, failover, health-check and RTO/RPO cases. |
| 3.0 High-performing (24%) / 3.1 Storage | `partial`; 9 questions | SAA high-performing/storage; `q-aws-found-14`, `q-saa-core-06`; storage visual/lab | Partially covered | P1: expand throughput/IOPS, access pattern, tiering and consistency trade-offs. |
| 3.2 Compute | `partial`; 12 questions | SAA high-performing/compute; `q-aws-found-01`, `q-saa-core-06`; ALB/ASG visual | Partially covered | P1: add instance/network/EBS scaling and bottleneck diagnosis. |
| 3.3 Databases | `partial`; 11 questions | SAA databases; `q-aws-found-23`, `q-saa-core-23`; RDS HA/read scaling lab | Partially covered | P1: add read/write scaling, caching, partitioning/indexing and engine-selection cases. |
| 3.4 Network | `partial`; 16 questions | SAA networking/DNS; `q-aws-found-03`, `q-saa-core-15`; VPC/Route 53 visuals | Partially covered | P1: add routing, edge, private connectivity and latency/throughput trade-offs. |
| 3.5 Data ingestion/transformation | `partial`; 9 questions | SAA DNS/data; `q-saa-core-12`, `q-saa-core-14`; SQS/data-pipeline material | Partially covered | P1: add Kinesis/Glue/Batch/Lambda ingestion and transformation selection. |
| 4.0 Cost-optimized (20%) / 4.1 Storage | `partial`; 4 questions | SAA cost/storage; `q-saa-core-09`, `q-saa-arch-33`; S3 lifecycle lab | Partially covered / high risk | P0: at least double scenario coverage with lifecycle, retrieval, replication and access-pattern constraints. |
| 4.2 Compute | `partial`; 9 questions | SAA cost/compute; `q-aws-found-04`, `q-aws-found-28`; ALB/ASG and compute material | Partially covered / high risk | P1: add Spot/Reserved/Savings Plans, Graviton, right-sizing and serverless trade-offs. |
| 4.3 Database | `partial`; 4 questions | SAA cost/databases; `q-saa-core-25`, `q-saa-arch-36`; RDS lab | Partially covered / high risk | P0: add Aurora/RDS/DynamoDB/serverless capacity and caching cost cases. |
| 4.4 Network | `partial`; 4 questions | SAA cost/network/DNS; `q-saa-arch-34`, `q-saa-arch-38`; VPC/Route 53 visuals | Partially covered / high risk | P0: add NAT vs endpoints, data transfer, Direct Connect/VPN and edge-cost scenarios. |

## Question-quality findings

Static checks found 357 CLF-C02 and 134 SAA-C03 questions. All inspected AWS questions have non-empty explanations and valid answer indices. Findings requiring remediation or review:

- Exact duplicate prompt: `q-clf32-10` and `q-clf35-13` in `content/questions.json`. They currently have different answers, so this is a wording/intent collision even though the answer choices differ. Preserve both IDs; rewrite one scenario to make the tested concept distinct.
- The content checker reports answer/explanation keyword mismatches for `q-clf-04`, `q-clf-07`, `q-clf-09`, `q-clf35-02`, `q-clf35-11`, `q-saa-core-26`, `q-saa-core-29`, `q-saa-arch-02`, `q-saa-arch-09`, `q-saa-arch-16`, `q-saa-arch-17`, and `q-saa-arch-27`. Manual review shows most explanations are semantically correct but omit the exact answer phrase; make the answer term explicit to reduce learner ambiguity and checker noise.
- Multi-response banks intentionally contain five choices (`q-clf-multi-*`, `q-saa-multi-*`); this is valid for “select all that apply,” but UI and explanations should state the required set and why common distractors fail.
- Answer-position imbalance is material in `aws-clf-cloud-concepts` (A 73%) and `aws-clf-technology-services` (A 82%). This increases test-taking cues and should be rebalanced without changing correctness.
- Keyed-answer length warnings are concentrated in AWS banks. Review whether explanation-rich correct choices are visibly longer than distractors.
- No missing AWS explanations or invalid answer indices were found by this audit. This does not replace SME review of service facts and current exam scope.

## Instructional-content gaps

Notes are generally substantial, but shared foundation topics make per-objective depth hard to verify. A topic appearing under an objective is not proof that the objective is taught. Add objective-level “must be able to” checklists and short transfer examples, especially for CLF 3.1–3.6 and 4.x and all SAA cost objectives.

Flashcards are topic-linked rather than objective-linked in the current data model, so objective-level flashcard coverage cannot be independently proven from `content/flashcards.json`. Add objective tags or an audit mapping before using card counts as readiness evidence.

## Existing lab inventory

CLF paper-first labs: `aws-clf-cost-estimate`, `aws-clf-iam-baseline`, `aws-clf-service-map`, `aws-clf-global-design`, `aws-clf-migration-planning`, `aws-clf-security-responsibility`, `aws-clf-cloud-platform-selection`, `aws-clf-data-platform-selection`, and `aws-clf-cloud-economics-selection`.

SAA labs: `aws-saa-vpc-public-private`, `aws-saa-alb-autoscaling`, `aws-saa-rds-ha-read-scaling`, `aws-saa-iam-cross-account`, `aws-saa-route53-policies`, `aws-saa-s3-lifecycle-replication`, `aws-saa-dr-patterns`, and `aws-saa-sqs-decoupling`.

The CLF labs correctly avoid live resources and therefore have no AWS spend or cleanup risk. SAA labs are primarily design exercises with optional console builds; the repository should make the optional path's cost and cleanup boundaries more explicit before learners run it.

## Recommended new labs

Only add labs where they materially improve exam transfer. Every live lab should be opt-in and include a budget cap, least-privilege permissions, verification, troubleshooting, and cleanup.

| Certification / objective | Proposed lab | Cost and permissions | Verification / cleanup |
|---|---|---|---|
| CLF 4.1–4.2 | Budget + cost-allocation tagging sandbox | Prefer paper/simulator; optional AWS Budgets alert can be free but requires billing access. No production permissions. | Verify budget threshold, tag coverage, Cost Explorer grouping; delete budget and test tags. |
| CLF 3.2, 3.5 | Region/AZ/edge decision simulator | No AWS resources or permissions; use existing visual format. | Learner explains failure scope, latency, and sovereignty choice; no cleanup. |
| SAA 1.3, 4.1 | S3 lifecycle + replication controlled sandbox | S3 storage, requests, replication and transfer can incur charges; require S3/IAM permissions only and a dedicated test account/bucket. | Upload tagged test objects, verify lifecycle/version/replication state, then remove objects, replication, and buckets. |
| SAA 2.1–2.2 | Resilient queue worker | Lambda/SQS/CloudWatch may incur small usage charges; least-privilege execution role and isolated queue. | Force retry/DLQ, confirm idempotency and visibility timeout, then purge/delete queue, function, role, alarms. |
| SAA 4.4 | NAT Gateway versus VPC endpoint cost/design comparison | Prefer a diagram-first lab; NAT Gateway hourly/data charges make live use unsuitable for default coursework. | Verify route behavior and cost assumptions; delete NAT gateway, routes, endpoints, and subnets if created. |

## Potentially incorrect or stale claims

No claim was classified as definitively technically incorrect from repository-only evidence. The following require targeted AWS-guide/SME verification before release:

- Service-category and AI/ML lists in CLF objectives 3.7–3.8 may change with the current guide revision; review `aws-clf-ai-analytics` and `aws-clf-other-service-categories`.
- SAA service trade-offs in cost, networking, and data ingestion are often context-dependent; short explanations should state the constraint that makes an answer preferable.
- `content/check-content` keyword warnings are not proof of wrong answers, but they are release-quality risks when learners cannot see the exact keyed concept in the explanation.

## Learning-experience audit

The current path is: certification selection → `/aws-clf` domain card → `/test?exam=clf-c02&practice=domain&domain=...` → one-question feedback → notes link → continue. The PR #219 workflow provides domain cards, immediate feedback, objective and topic context, unseen-first selection, and per-domain results.

Broken or incomplete connections:

- Feedback links to the topic notes but does not automatically expose the mapped lab or visual for that question. `questions.json` has `topicId`, objective IDs, and source URLs, but no direct visual/lab relation.
- SAA has objective/topic content and labs, but no equivalent domain-first landing experience or focused immediate-feedback workflow.
- Labs are not consistently discoverable from question feedback; add an objective/topic asset index rather than hard-coding unrelated links.
- Objective-level flashcard evidence is not auditable because cards lack objective tags.

## Prioritized remediation backlog

| Priority | Certification | Objective/domain | Problem | Recommendation | Acceptance criteria |
|---|---|---|---|---|---|
| P0 | CLF | 3.0 / 4.0 | High exam weights but uneven partial depth | Expand service, billing, support, and cost scenarios | Every objective has ≥20 distinct scenario questions, explicit explanations, and mapped study assets. |
| P0 | SAA | 4.1, 4.3, 4.4 | Four explicitly tagged questions each | Add cost-constraint design questions and labs | ≥12 distinct questions per objective; cost trade-off tests pass SME review. |
| P1 | CLF/SAA | All | Question feedback does not surface visual/lab assets | Add validated question→asset mapping | No unrelated assets; every surfaced asset resolves and is objective-compatible. |
| P1 | CLF | 3.1–3.6 | Shared topic content obscures objective depth | Add objective checklists and service contrast sets | Coverage audit reports objective evidence independently of shared topics. |
| P1 | SAA | 1.1–3.5 | Too much recall relative to architecture trade-off | Add multi-constraint scenarios and failure analysis | Tests include explicit requirements, alternatives, and rationale. |
| P1 | CLF | Question bank | Duplicate wording and answer-position bias | Rewrite duplicate and rebalance keys | Duplicate-prompt audit is clean; answer positions stay within agreed bounds. |
| P2 | CLF/SAA | Flashcards | Cards are topic-only | Add objective IDs to cards | Objective card counts become reproducible and validated. |
| P2 | SAA | Labs | Optional live builds lack standardized cost/cleanup metadata | Add lab safety metadata and cleanup checklists | Every live-capable lab declares cost, permissions, verification, troubleshooting, cleanup. |

## Proposed implementation PRs

1. `audit/aws-clf-saa-content` (this audit): documentation and non-destructive audit script only.
2. `feature/aws-clf-objective-depth`: CLF partial-objective teaching and scenario expansion; CLF first.
3. `feature/aws-question-asset-links`: validated question-to-topic/visual/lab mapping and feedback surfacing.
4. `feature/aws-saa-cost-tradeoffs`: SAA Domain 4 and resilience/high-performance scenario expansion.
5. `feature/aws-card-objective-metadata`: objective tags and validation for AWS flashcards.
6. `feature/aws-lab-safety-metadata`: cost, permissions, verification, troubleshooting, and cleanup metadata for optional live labs.

No lesson, question, quiz, or deployment changes were made by this audit.
