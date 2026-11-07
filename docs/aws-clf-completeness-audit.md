# AWS CLF-C02 completeness audit

Audit date: 2026-11-06
Exam: AWS Certified Cloud Practitioner (CLF-C02), version 1.3
Branch: `audit/aws-clf-completeness`

## Executive result

The repository has material mapped across all 19 CLF-C02 objectives. It is useful as a guided review system, but the evidence does not support promoting any objective to `covered`: several objectives have thin independent scenario breadth, the service-category objectives need more transfer discrimination, and visual/lab reinforcement is uneven. The recommended machine-readable result is therefore **0 covered, 19 partial, 0 missing**.

Readiness recommendation: **ready with limitations**. This is credible for structured review when combined with current AWS official practice/sample material; it should not be presented as a standalone guarantee of exam readiness.

## Method and evidence standard

The audit compared each objective's subskill groups with the authored topic sections, mapped questions, flashcards, drills, labs, visuals, and source metadata. `covered` requires all of the following: current scope coverage, meaningful independent assessment, transfer/scenario discrimination, and enough supporting practice to avoid a notes-only claim. `partial` means there is useful authored material but one or more of those dimensions is still weak. `missing` means no usable material is present.

The repository contains CLF-C02 v1.3 metadata, domain links, and the source register in `content/aws-review-sources.json`. A live fetch of the AWS domain page was attempted during this audit but the managed environment's proxy returned HTTP 403; this report does not claim a fresh external fetch or reproduce proprietary AWS content. The objective evidence dates were refreshed to 2026-11-06 for this repository review.

## Objective/subskill matrix

| Objective | Subskill groups checked | Repository evidence | Assessment | Recommendation and blocking gap |
| --- | --- | --- | --- | --- |
| 1.1 Benefits | elasticity, scalability, HA/fault tolerance, managed services, global reach | `aws-clf-cloud-concepts`; `aws-foundation-cloud-global`; `q-aws-found-01`, `q-aws-found-02`, `q-aws-found-03`, `q-aws-found-05`; `aws-clf-global-design` lab | Partial | Keep partial. Add more independent scenario tradeoffs before promotion. |
| 1.2 Design principles | Well-Architected, automation, elasticity, managed services, design for failure | Cloud-concepts design sections; `fc-aws-well-architected`; foundation questions | Partial | Keep partial. Independent transfer across competing constraints is limited. |
| 1.3 Migration | benefits, readiness/CAF, migration strategy, discovery, testing, rollback | Cloud-concepts migration sections; `fc-aws-review-clf-c02-1-3`; `q-aws-review-clf-c02-1-3` | Partial | Keep partial. Strategy and migration-lifecycle scenarios are thin. |
| 1.4 Economics | consumption model, CapEx/OpEx, variable cost, scale, cost tradeoffs | Cloud-concepts economics; `fc-aws-capex-opex`; `q-aws-found-04`; `aws-clf-cost-estimate` lab | Partial | Keep partial. Needs broader assessment and visual reinforcement. |
| 2.1 Shared responsibility | customer/AWS boundaries across compute, data, identity, patching | `aws-clf-security-compliance#objective-clf-c02-2-1`; `q-aws-review-clf-c02-2-1`; `aws-clf-iam-baseline` lab | Partial | Keep partial. Data, identity, and patching transfer is limited. |
| 2.2 Security/governance/compliance | Artifact, CloudTrail, Config, CloudWatch, KMS, encryption, governance | Security topic objective section; `q-aws-review-clf-c02-2-2` | Partial | Keep partial. Audit/encryption/compliance scenarios need more variation. |
| 2.3 Access management | workforce/workload/application access, authentication vs authorization, root MFA, credentials, users/groups/roles/federation, policies, secrets/keys | `aws-clf-access-management` sections; `q-clf23-01`–`q-clf23-14`; `aws-clf-access-compare`; access-management visual; IAM lab | Partial | Keep partial. Broad recent expansion still needs unseen breadth and hands-on transfer. |
| 2.4 Security resources | protective/detective resources, Firewall Manager, control selection | Security objective section; `q-aws-review-clf-c02-2-4` | Partial | Keep partial. Firewall Manager and preventive/detective transfer are shallow. |
| 3.1 Deploy/operate | console, CLI, SDK/API, CloudFormation, deployment and operating methods | Technology objective section; `q-aws-review-clf-c02-3-1`; `aws-clf-service-map` lab | Partial | Keep partial. Method selection and hybrid operating scenarios are limited. |
| 3.2 Global infrastructure | Regions, AZs, edge, latency, residency, failure domains | Technology objective section; `q-aws-review-clf-c02-3-2`; global-design lab | Partial | Keep partial. Residency and multi-region failure transfer need depth. |
| 3.3 Compute | EC2 and related compute choices, containers/serverless, scaling/load balancing | Technology objective section; `q-aws-review-clf-c02-3-3` | Partial | Keep partial. Auto Scaling, load balancing, and Fargate discrimination is thin. |
| 3.4 Database | relational, key-value, in-memory, graph, warehouse and service selection | Technology objective section; `q-aws-review-clf-c02-3-4` | Partial | Keep partial. Comparative selection and migration scenarios are under-assessed. |
| 3.5 Network | VPC/connectivity, routing, DNS, delivery and network service roles | Technology objective section; `q-aws-review-clf-c02-3-5` | Partial | Keep partial. Independent service discrimination is limited. |
| 3.6 Storage | object, block, file, archive, lifecycle, hybrid choices | Technology objective section; `q-aws-review-clf-c02-3-6` | Partial | Keep partial. Lifecycle and hybrid tradeoffs are weakly assessed. |
| 3.7 AI/ML and analytics | AI/ML requirement-to-service choices; analytics, streaming, warehouse/search | `aws-clf-ai-analytics` decision tables and confusion pairs; `q-clf37-01`–`q-clf37-14`; compare drill; visual | Partial | Keep partial. Current service-list breadth and unseen transfer remain incomplete. |
| 3.8 Other categories | messaging, integration, monitoring, management, developer and other in-scope categories | Technology objective section; `q-aws-review-clf-c02-3-8` | Partial | Keep partial. Category breadth and distinguishing cues need more questions. |
| 4.1 Pricing | pricing factors, discounts, reservations, tenancy, storage/transfer considerations | `aws-clf-billing-support` pricing sections; `q-clf41-01`–`q-clf41-10`; cost-compare drill, visual, cost lab | Partial | Keep partial. Current pricing facts and independent breadth require ongoing review. |
| 4.2 Billing/cost | estimates, spend analysis, alerts, detailed reports, allocation, consolidated billing | Billing objective section; `q-clf42-01`–`q-clf42-09`; cost-compare drill, visual, cost lab | Partial | Keep partial. Tool selection and transfer depth are not yet complete. |
| 4.3 Technical resources/support | support plans, technical resources, health, abuse, partners, Marketplace, expert assistance | Billing objective section; `q-clf43-01`–`q-clf43-10`; support-resources drill and visual | Partial | Keep partial. Support-plan facts are time-sensitive and need independent transfer. |

### Objective recommendation summary

| Domain | Current statuses | Recommendation |
| --- | --- | --- |
| 1 Cloud Concepts (24%) | 4 partial | Keep all partial; migration and design-principle transfer are the clearest gaps. |
| 2 Security and Compliance (30%) | 4 partial | Keep all partial; 2.3 is strongest but still needs independent breadth. |
| 3 Cloud Technology and Services (34%) | 8 partial | Keep all partial; 3.7 is strongest recent expansion, while 3.8 and the core service objectives need breadth. |
| 4 Billing, Pricing, and Support (12%) | 3 partial | Keep all partial; applied coverage exists but pricing/support facts need freshness and unseen transfer. |
| **Total** | **0 covered / 19 partial / 0 missing** | **No promotion recommended in this audit.** |

## Health of the learning system

### Questions

The CLF-C02 bank contains **151 questions**, including **5 multiple-response questions**. All 19 objective IDs have eligible questions and the configured 65-question weighted mock can be drafted with unique questions. The bank is strongest at recognition and service selection; comparison and scenario questions are present but not yet broad enough to establish mastery, especially in objectives 1.2, 1.3, 3.1–3.6, and 3.8. Counts are evidence of availability, not evidence of exam equivalence or psychometric validity.

### Flashcards

There are **147 CLF-C02-tagged flashcards**. They provide useful terminology and service recognition, with the largest recent reinforcement in access management, AI/analytics, and billing/support. They overlap by topic where appropriate; no duplicate or clearly erroneous card was identified in this audit. The main limitation is transfer: flashcards cannot substitute for independent scenario questions.

### Labs, drills, and visuals

The current CLF/foundation lab set includes the cost-estimate, IAM-baseline, service-map, and global-design labs. Practice drills include service comparison, domain cues, AI/analytics comparison, access comparison, cost comparison, and support-resource selection. Visuals are present for access management, AI/analytics, and billing/support. Most objectives still lack a dedicated visual or lab, so the system is uneven for applied learning.

### Source and content health

`content/aws-review-sources.json` records CLF-C02 v1.3, official AWS URLs, services, and revision history. New and updated material uses current terminology; legacy material is qualified where it remains useful. Pricing, support plans, and service catalogs are inherently time-sensitive and need scheduled source review. The AWS live-page request was blocked by the managed proxy (403), so URL reachability and current wording should be rechecked from an authorized environment before a future promotion decision.

## Prioritized gaps

### P0

None identified as a repository correctness blocker. However, the site should not claim standalone exam readiness from this bank alone.

### P1

1. Expand 3.8 across the current service-category breadth with independent contrast questions.
2. Expand 1.3 migration strategy/readiness/discovery/testing scenarios.
3. Add applied design and responsibility scenarios for 1.2, 2.1, 2.2, and 2.4.
4. Add independent scenario depth for 3.1–3.6, especially method selection, failure domains, scaling, database choice, networking, and storage lifecycle tradeoffs.

### P2

1. Add visuals or compact decision aids to the objectives that currently have none.
2. Increase unseen question diversity and balance recognition against transfer.
3. Periodically deduplicate/rebalance flashcards and review current AWS pricing/support/service terminology.
4. Add an auditable source-refresh check for time-sensitive CLF material.

## Recommended next step

Do not bulk-generate content from this audit. Use the P1 order above to design small, objective-specific expansions with explicit sources, comparison drills, and independent questions; then rerun the same matrix before promoting any objective. Keep the current `partial` statuses and their precise notes until the full standard is demonstrated.

## Post-audit work

The focused branch `content/aws-clf-objective-1-3` adds a targeted Objective 1.3 expansion covering CAF/readiness, migration strategy selection, discovery, migration resources, database replication, and validation/cutover scenarios. This is follow-up work after the 2026-11-06 audit, not a change to the original audit result. Objective 1.3 remains `partial` pending re-audit of current scope and unseen transfer breadth.

## Post-audit follow-up — grouped transfer expansion

After the original audit, a focused CLF-C02 transfer expansion added independent scenario practice for Objective 1.2 Well-Architected pillar decisions and Domain 2 Objectives 2.1, 2.2 and 2.4 security, governance, responsibility and service-selection decisions. The original audit matrix and result remain historical; these additions do not promote any objective beyond partial.
