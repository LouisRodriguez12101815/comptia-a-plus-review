# AWS CLF-C02 targeted post-expansion re-audit

Audit date: 2026-11-06
Base: content/aws-clf-design-security-transfer (2302a95)
Scope: objectives 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.7, 3.8, 4.1, 4.2 and 4.3 only

## Executive result

Eight audited objectives are promoted to covered: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.7 and 3.8. Three remain partial: 4.1, 4.2 and 4.3. No regression was found in the audited content or objective mappings.

The result is ready with limitations. The site is credible as a primary structured review system and useful supplementary review, but it is not a standalone guarantee of exam readiness. Covered means the repository now has current-looking teaching, mapped assessment, comparison/transfer practice and source evidence; it is not a psychometric claim.

Live AWS retrieval was unavailable in this managed environment: requests to the four official CLF-C02 domain pages returned HTTP 000. The conclusions therefore use the repository's official-source metadata, dated 2026-11-06, and lower confidence for time-sensitive pricing and support objectives. No live verification is claimed.

## Objective table

| Objective | Current | Recommended | Confidence | Evidence | Blocking gap |
|---|---|---|---|---|---|
| 1.2 | partial | covered | High | 11 mapped questions, six-pillar topic, drill, visual, 26 topic cards, Final Review traps | No live AWS fetch; local scope source is current-dated |
| 1.3 | partial | covered | High | 16 mapped questions, 14 focused questions, migration topic, drill, 34 topic cards, paper lab | No live AWS fetch |
| 2.1 | partial | covered | High | 14 mapped questions, EC2/RDS/Lambda comparisons, multi-response, drill, lab, 41 topic cards | No live AWS fetch |
| 2.2 | partial | covered | High | 17 mapped questions, governance confusion set, encryption items, drill, lab, 41 topic cards | No live AWS fetch |
| 2.3 | partial | covered | Medium-high | 20 mapped questions, 14 focused questions, access drill, 34 cards, IAM baseline lab | Live IAM wording can change; recheck before a future scope refresh |
| 2.4 | partial | covered | High | 18 mapped questions, direct named-service questions, confusion pairs, drill, visual, lab, 41 cards | No live AWS fetch |
| 3.7 | partial | covered | Medium-high | 19 mapped questions, AI/analytics drill, 33 cards, service-selection visual | Current service-list naming should be rechecked live |
| 3.8 | partial | covered | Medium-high | 21 mapped questions, all seven category groups, comparison drill, 40 cards | Current category list should be rechecked live |
| 4.1 | partial | partial | Low-medium | 16 mapped questions, cost topic/drill/lab, 48 cards | Pricing and purchase terminology is time-sensitive; no live verification |
| 4.2 | partial | partial | Medium | 18 mapped questions, calculator/explorer/budget/CUR/tag/org distinctions, 48 cards | Billing feature behavior and terminology should be freshly verified |
| 4.3 | partial | partial | Low | 12 mapped questions, support-resource drill, 42 cards | Support-plan names and entitlements are time-sensitive; no live verification |

## Subskill and transfer matrix

| Objective | Subskill/confusion pair | Teaching evidence | Assessment evidence | Practice evidence | Source | Result |
|---|---|---|---|---|---|---|
| 1.2 | Six pillars | aws-clf-well-architected-decisions#six-pillars | q-clf12-01 through q-clf12-10 | aws-clf-well-architected-compare; aws-clf-well-architected-decisions.html | well | Covered |
| 1.2 | Reliability vs Performance Efficiency | #confusion-pairs | q-clf12-07 | Final Review clf-pillars | well | Covered |
| 1.2 | Cost Optimization vs Sustainability | #confusion-pairs | q-clf12-08, q-clf12-10 | fc-clf12-cost-sustain | well | Covered |
| 1.3 | Strategies and lifecycle | aws-clf-migration-decisions#strategy-chooser | q-clf13-03 through q-clf13-08 | aws-clf-migration-compare | migrationStrategies | Covered |
| 1.3 | Discovery, replication, validation | #discovery, #database-replication, #testing-cutover | q-clf13-09 through q-clf13-14 | aws-clf-migration-planning | applicationDiscovery, dms | Covered |
| 2.1 | EC2/RDS/Lambda boundary | aws-clf-security-transfer#responsibility | q-clf21-01 through q-clf21-10 | aws-clf-security-transfer; aws-clf-security-responsibility | shared, lambda, rds | Covered |
| 2.1 | AWS OF / customer IN cloud | aws-clf-security-compliance#responsibility | q-clf21-06, q-clf21-09, q-clf21-10 | responsibility table in lab | shared | Covered |
| 2.2 | CloudWatch vs CloudTrail vs Config vs Artifact | aws-clf-security-transfer#governance | q-clf22-01 through q-clf22-05, q-clf22-10 | aws-clf-security-transfer; governance lab table | watch, trail, config, artifact | Covered |
| 2.2 | At rest vs in transit and customer compliance | #governance | q-clf22-06 through q-clf22-09 | fc-clf22-encryption, fc-clf22-compliance | kms, shared | Covered |
| 2.3 | Auth, authorization, users, groups, roles | aws-clf-access-management#authentication-authorization | q-clf23-01 through q-clf23-14 plus mapped foundation items | aws-clf-access-compare; aws-clf-iam-baseline | IAM source set | Covered |
| 2.3 | Federation, workload roles, root, MFA, least privilege | #workforce-access, #workload-access, #root-and-mfa | focused access questions and mapped foundation items | fc-clf23-temporary, fc-clf23-explicit-deny, fc-clf23-secrets-kms | IAM source set | Covered |
| 2.4 | WAF vs Shield; GuardDuty vs Inspector | aws-clf-security-transfer#security-resources | q-clf24-01 through q-clf24-05, q-clf24-11 | security drill; Final Review clf-security-tools | waf, guard, inspector | Covered |
| 2.4 | Firewall Manager, Trusted Advisor, Marketplace | #security-resources | q-clf24-04, q-clf24-07, q-clf24-08, q-clf24-12 | fc-clf24-firewall, fc-clf24-advisor, fc-clf24-marketplace | firewallManager, trustedAdvisor | Covered |
| 2.4 | Knowledge Center, Security Center, Security Blog | #security-resources | q-clf24-09, q-clf24-10 | fc-clf24-resources; security visual | knowledgeCenter, securityCenter, securityBlog | Covered |
| 3.7 | AI/ML selection | aws-clf-ai-analytics#ai-services | q-clf37-01 through q-clf37-07 | aws-clf-ai-analytics-compare; fc-clf37-ai-family | AI service source set | Covered |
| 3.7 | Analytics selection | #analytics-services | q-clf37-08 through q-clf37-14 | fc-clf37-analytics-family, fc-clf37-opensearch-cloudwatch | analytics source set | Covered |
| 3.8 | Integration and business services | aws-clf-other-service-categories#application-integration, #business-applications | q-clf38-01 through q-clf38-06 | aws-clf-other-services-compare | service-category source set | Covered |
| 3.8 | Developer, end-user, frontend, IoT, support | #developer-tools, #end-user-computing, #frontend-mobile, #internet-of-things | q-clf38-07 through q-clf38-16 | same drill; fc-clf38-verb-map | service-category source set | Covered |
| 4.1 | Commitment vs capacity vs tenancy | aws-clf-billing-support#pricing-factors | q-clf41-01 through q-clf41-10 | aws-clf-cost-compare; cost lab | spot, rds, cost sources | Partial pending live pricing verification |
| 4.2 | Estimate vs analyze vs alert vs report | #cost-tools | q-clf42-01 through q-clf42-09 plus mapped foundation items | fc-clf43-tools, cost lab | billing source set | Partial pending freshness verification |
| 4.3 | Support channels and resources | aws-clf-billing-support#support-resources | q-clf43-01 through q-clf43-10 | aws-clf-support-resources; cost lab | support source set | Partial pending live plan verification |

## Question-quality review

The focused additions are not all definition recall:

- 1.2: scenario/comparison questions dominate; one multiple-response item tests pillar discrimination.
- 1.3: strategy, discovery, migration-resource and cutover questions are scenario-driven.
- 2.1: responsibility selection dominates, including two multi-response items.
- 2.2: service-selection and evidence-combination questions dominate, including one multi-response item.
- 2.3: the focused set mixes access-pattern recognition with role, policy, federation and credential decisions.
- 2.4: requirement-to-service selection dominates, with plausible neighboring-service distractors.
- 3.7 and 3.8: service-selection questions cover varied business requirements rather than isolated “what is X?” prompts.
- 4.1–4.3: existing questions and drills provide applied distinctions, but current terminology requires live source refresh before promotion.

This is a qualitative review only. No statistical or psychometric validity is claimed.

## Flashcards and practice artifacts

The cards add useful memory hooks and confusion pairs, but are supporting evidence rather than independent assessment. The strongest new transfer artifacts are:

- aws-clf-well-architected-compare
- aws-clf-security-transfer
- aws-clf-migration-compare
- aws-clf-other-services-compare
- aws-clf-cost-compare
- aws-clf-support-resources
- aws-clf-security-responsibility
- aws-clf-migration-planning

The two new visuals are compact decision aids, not proof by themselves. The paper labs require assignment and service-selection decisions without live infrastructure.

## Status map

The regression suite now asserts this explicit map for all 19 CLF-C02 objectives:

1.1 partial; 1.2 covered; 1.3 covered; 1.4 partial
2.1 covered; 2.2 covered; 2.3 covered; 2.4 covered
3.1 partial; 3.2 partial; 3.3 partial; 3.4 partial
3.5 partial; 3.6 partial; 3.7 covered; 3.8 covered
4.1 partial; 4.2 partial; 4.3 partial

## Remaining priorities

1. Refresh 4.1–4.3 against live official AWS pricing, billing and support pages before any promotion.
2. Re-audit 3.7 and 3.8 against the current official service/category list when AWS retrieval is available.
3. Address the largest untouched Cloud Technology and Services gaps: 3.1 deployment/operation methods, 3.2 global infrastructure, 3.3 compute, 3.4 databases, 3.5 networking and 3.6 storage.
4. Revisit 1.1 and 1.4 after those Domain 3 gaps are addressed.

No new P0 gaps were found. P1 priorities are 3.1–3.6 and live freshness verification for 4.1–4.3. P2 priorities are deeper unseen transfer breadth for 1.1 and 1.4.

## Scope and provenance

No bulk content was added in this audit branch. No proprietary questions were copied, and no raw AWS source files were committed. Nothing was merged or deployed.
