# CLF-C02 Domain 3 re-audit

Audit date: 2026-11-06  
Base: `content/aws-clf-domain3-data-network-storage` at `b96f262`  
Scope: CLF-C02 objectives 3.1–3.8, including teaching, independent assessment, practice transfer, scope, mapping, and source freshness.

## Executive result

Domain 3 remains **8 covered / 0 missing / 6 partial objectives**: 3.7 and 3.8 remain covered; 3.1–3.6 remain partial. No covered objective was downgraded. The new evidence materially improves breadth and transfer practice, but the conservative status is retained because the current-source page could not be live-retrieved in the managed environment and the audit does not establish complete official-scope coverage or psychometric readiness from artifact counts alone.

Across the full CLF-C02 map, the result remains **8 covered / 11 partial / 0 missing**. This is suitable for supplementary review and useful as a structured review aid with limitations; it is not presented as standalone or guaranteed exam readiness.

## Current-scope verification

The authoritative scope reference is recorded in `content/aws-review-sources.json`:

| Source | URL | Title | Access date | Live retrieval |
| --- | --- | --- | --- | --- |
| CLF-C02 Domain 3 | https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain3.html | AWS Certified Cloud Practitioner CLF-C02 Domain 3: Cloud Technology and Services | 2026-11-06 | Failed in managed environment: proxy connection unavailable |
| AWS global infrastructure | https://aws.amazon.com/about-aws/global-infrastructure/regions_az/ | AWS Global Infrastructure: Regions and Availability Zones | 2026-11-06 | Not live-retrieved in this environment |

The audit therefore uses the repository's current source metadata and existing review evidence, without claiming a fresh live verification. Service references for each objective remain in `content/aws-review-sources.json`; they are technical behavior sources rather than a substitute for the exam-scope page.

## Objective matrix

| Objective | Current | Recommended | Confidence | Strongest evidence | Remaining blocker |
| --- | --- | --- | --- | --- | --- |
| 3.1 | partial | partial | Medium | 14 mapped questions; `fc-clf31-*`; `aws-clf-cloud-tech-core`; `aws-clf-cloud-platform-selection` | Live scope verification unavailable; complete Console/CLI/SDK/API/IaC and deployment-model breadth is not independently established |
| 3.2 | partial | partial | Medium | 19 mapped questions; `fc-clf32-*`; global-design scenarios; Region/AZ/edge and residency cues | Live scope verification unavailable; availability, DR, latency, and residency coverage still needs broader independent evidence |
| 3.3 | partial | partial | Medium | 21 mapped questions; `fc-clf33-*`; compute/scaling distinctions and platform-selection lab | Live scope verification unavailable; service breadth is strong but not enough to establish complete official scope |
| 3.4 | partial | partial | Medium | 18 mapped questions; `fc-clf34-*`; RDS/Aurora/DynamoDB/ElastiCache/DMS/SCT comparisons | Live scope verification unavailable; managed/self-managed and migration distinctions need continued review |
| 3.5 | partial | partial | Medium | 19 mapped questions; `fc-clf35-*`; VPC/security/DNS/connectivity/Inspector scenarios | Live scope verification unavailable; network-service breadth is evidenced but not independently readiness-validated |
| 3.6 | partial | partial | Medium | 19 mapped questions; `fc-clf36-*`; storage selection lab and object/block/file contrasts | Live scope verification unavailable; storage breadth and transfer need more independent evidence before promotion |
| 3.7 | covered | covered | Medium | Existing AI/analytics decision table, 19 mapped questions, `aws-clf-ai-analytics-compare`, AI visual | No downgrade trigger found; live scope retrieval remains a confidence limitation |
| 3.8 | covered | covered | Medium | Seven category sections, 21 mapped questions, `aws-clf-other-services-compare`, category visual | No downgrade trigger found; fewer artifacts than 3.1–3.6 is not itself a gap |

## Subskill and confusion-pair matrix

| Objective | Subskill / confusion pair | Teaching | Independent assessment | Practice | Result |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Console vs CLI; CLI vs SDK/API; manual vs repeatable; IaC vs manual | `aws-clf-technology-services#objective-clf-c02-3-1`; `fc-clf31-console`, `fc-clf31-cli`, `fc-clf31-sdk`, `fc-clf31-api`, `fc-clf31-iac`, `fc-clf31-one-repeat` | `q-clf31-01`–`q-clf31-12` (including multi-response `q-clf31-05`) | `aws-clf-cloud-tech-core`; `aws-clf-cloud-platform-selection` | Transfer is present; keep partial pending full-scope and freshness confidence |
| 3.1 | Cloud-only vs hybrid vs on-premises; programmatic vs interactive | Hybrid section and deployment cards | `q-clf31-03`, `q-clf31-07`–`q-clf31-10`, `q-clf31-12` | Cloud platform lab and `hybrid` drill item | Correctly framed at CLF-C02 level; no CLI syntax or SDK coding claims |
| 3.2 | Region vs AZ; AZ vs edge; Multi-AZ vs Multi-Region; HA vs DR | `aws-foundation-cloud-global` sections and `fc-clf32-region`, `fc-clf32-az`, `fc-clf32-edge`, `fc-clf32-multi-az`, `fc-clf32-multi-region` | `q-clf32-01`–`q-clf32-12` (multi-response `q-clf32-05`) | `aws-clf-global-design`; `region-az`, `az-edge`, `residency` drill items | Strong scenario transfer; keep partial because current-scope evidence is not live |
| 3.2 | User proximity/latency vs failure isolation; residency vs performance | Residency and edge teaching blocks | `q-clf32-04`, `q-clf32-06`, `q-clf32-08`, `q-clf32-11`, `q-clf32-12` | Global-design lab | Distinctions are explicit and not reduced to geography memorization |
| 3.3 | EC2 vs Lambda; EC2 vs containers; ECS vs EKS vs Fargate | Compute sections and `fc-clf33-ec2`, `fc-clf33-lambda`, `fc-clf33-ecs-eks`, `fc-clf33-fargate`, `fc-clf33-kubernetes` | `q-clf33-01`–`q-clf33-14` (multi-response `q-clf33-09`) | `aws-clf-cloud-tech-core`; compute platform lab | Broad and scenario-oriented; no model-number memorization |
| 3.3 | Compute-, memory-, storage-optimized; Auto Scaling vs ELB | `fc-clf33-families`, `fc-clf33-scaling`; scaling/balancing drill | `q-clf33-03`–`q-clf33-05`, `q-clf33-10`–`q-clf33-14` | Cloud platform lab | Correct role distinctions; keep partial pending independent scope confirmation |
| 3.4 | Relational vs NoSQL vs cache; managed vs self-managed | Database topic sections and `fc-clf34-managed`, `fc-clf34-rds`, `fc-clf34-aurora`, `fc-clf34-dynamodb`, `fc-clf34-cache` | `q-clf34-01`–`q-clf34-06`, `q-clf34-10`–`q-clf34-14` (multi-response `q-clf34-06`) | `aws-clf-data-network-storage`; data platform lab | Strong comparisons, but not promoted without full current-scope confidence |
| 3.4 | DMS vs SCT; move/replicate vs convert schema/code | `fc-clf34-dms`, `fc-clf34-sct`, `fc-clf34-migration-trap` | `q-clf34-07`–`q-clf34-09` | Data platform lab and `dms-sct` drill item | Explicit distinction and transfer evidence |
| 3.5 | VPC vs subnet; security group vs NACL; stateful vs stateless | VPC/network-security sections and `fc-clf35-vpc`, `fc-clf35-subnet`, `fc-clf35-sg`, `fc-clf35-nacl` | `q-clf35-01`–`q-clf35-05` (multi-response `q-clf35-05`) | Data platform lab; `sg-nacl` drill item | Core boundaries are taught and assessed |
| 3.5 | Route 53 vs load balancer; name resolution vs connectivity; Inspector vs filtering | DNS/security sections and `fc-clf35-inspector`, `fc-clf35-route53` | `q-clf35-06`, `q-clf35-10`–`q-clf35-14` | `dns` and `inspector` drill items | Confusion pairs are explicit; keep partial |
| 3.5 | VPN vs Direct Connect; Direct Connect vs encryption | `fc-clf35-vpn`, `fc-clf35-directconnect` | `q-clf35-07`–`q-clf35-09`, `q-clf35-14` | Data platform lab | Correctly avoids claiming Direct Connect guarantees encryption |
| 3.6 | Object vs block vs file; S3 vs EBS; S3 vs EFS | Storage sections and `fc-clf36-s3`, `fc-clf36-ebs`, `fc-clf36-efs`, `fc-clf36-storage-models`, `fc-clf36-traps` | `q-clf36-01`–`q-clf36-05`, `q-clf36-09`, `q-clf36-12`, `q-clf36-14` (multi-response `q-clf36-09`) | Data platform lab; `s3-ebs` drill item | Good model-level transfer; keep partial |
| 3.6 | EBS vs instance store; persistent vs ephemeral | `fc-clf36-instance-store` and storage-model sections | `q-clf36-02`, `q-clf36-03`, `q-clf36-13`, `q-clf36-14` | Storage lab | Explicit and correctly scoped |
| 3.6 | EFS vs FSx; Storage Gateway vs EFS; hybrid storage | `fc-clf36-efs`, `fc-clf36-fsx`, `fc-clf36-gateway` | `q-clf36-04`–`q-clf36-06`, `q-clf36-14` | Data platform lab | Present, but continued independent assessment is a promotion blocker |
| 3.6 | Lifecycle vs backup; backup vs replication; archive/frequent access | `fc-clf36-classes`, `fc-clf36-lifecycle`, `fc-clf36-backup`, `fc-clf36-traps` | `q-clf36-07`–`q-clf36-11`, `q-clf36-13` (multi-response `q-clf36-11`) | Storage lab | Confusion pairs are explicit |
| 3.7 | AI/ML selection and analytics distinctions | `aws-clf-ai-analytics` decision tables | Existing `q-clf37-*` pool | `aws-clf-ai-analytics-compare`; AI visual | Reconfirmed covered; no material gap found |
| 3.8 | Integration, business apps, customer enablement, developer, end-user, frontend/mobile, IoT | `aws-clf-other-service-categories` sections: `application-integration`, `business-applications`, `customer-enablement`, `developer-tools`, `end-user-computing`, `frontend-mobile`, `internet-of-things` | Existing `q-clf38-*` pool | `aws-clf-other-services-compare`; category visual | Reconfirmed covered; service discrimination remains requirement-driven |

## Question-quality and independence analysis

The six expanded partial objectives now have independent scenario pools rather than only recognition prompts. Approximate review of the objective-specific pools is:

| Objective | Approximate mix | Assessment |
| --- | --- | --- |
| 3.1 | 4 recognition / 5 comparison / 5 scenario-transfer, including 1 multi-response | Balanced, with explicit method contrasts |
| 3.2 | 4 recognition / 5 comparison / 10 scenario-transfer, including 2 multi-response | Transfer-heavy |
| 3.3 | 5 recognition / 5 comparison / 11 scenario-transfer, including 1 multi-response | Transfer-heavy |
| 3.4 | 4 recognition / 5 comparison / 9 scenario-transfer, including 1 multi-response | Balanced to transfer-heavy |
| 3.5 | 4 recognition / 5 comparison / 10 scenario-transfer, including 1 multi-response | Transfer-heavy |
| 3.6 | 4 recognition / 5 comparison / 10 scenario-transfer, including 2 multi-response | Transfer-heavy |
| 3.7 | Existing pool remains requirement-driven; no new bulk content in this audit | Covered evidence retained |
| 3.8 | Existing pool remains requirement-driven across seven categories | Covered evidence retained |

These are reviewer classifications, not psychometric results. The prompts were checked for obvious noun-swaps, answer-revealing wording, and direct flashcard transcription. The new pools use distinct cues and include comparison and composite scenarios, but shared topic sections and shared visuals are not counted as independent objective evidence. The four Domain 3 visuals (`aws-clf-deploy-global-decisions.html`, `aws-clf-compute-decisions.html`, `aws-clf-database-network-decisions.html`, `aws-clf-storage-decisions.html`) support transfer but do not prove coverage on their own.

## Practice-artifact review

- `aws-clf-cloud-tech-core` contributes Console/CLI/SDK/API/IaC, deployment-model, Region/AZ/edge, compute-orchestration, scaling and load-balancing discrimination.
- `aws-clf-data-network-storage` contributes database, migration-tool, network-boundary, connectivity, storage-model, lifecycle and backup discrimination.
- `aws-clf-cloud-platform-selection` is a paper lab spanning 3.1–3.3 and explicitly avoids creating AWS resources or requiring syntax.
- `aws-clf-data-platform-selection` is a paper lab spanning 3.4–3.6 and explicitly avoids database administration, route configuration, security-rule authoring and storage tuning.
- `aws-clf-ai-analytics-compare` and `aws-clf-other-services-compare` remain the relevant service-selection practice for 3.7 and 3.8.
- Domain 3 visuals are decision aids, not independent assessment.

## Scope guards

The added material stays at CLF-C02 service-selection and architecture-cue level. It does not require CLI command memorization, SDK coding, CloudFormation syntax, Kubernetes administration, SQL administration, DynamoDB key design, CIDR calculations, route-table configuration, security-rule authoring, S3 lifecycle JSON, EBS tuning, or mount commands. Where those terms appear, they are explicitly framed as non-required context or contrast cues.

## Status decisions and remaining gaps

No objective was promoted in this re-audit. The evidence is substantially stronger for 3.1–3.6, but a covered status requires current official scope confidence, complete material subskill coverage, independent transfer, and no material gap. The failed live retrieval is a source-confidence limitation, and the audit cannot infer complete official coverage from question counts. Existing 3.7 and 3.8 remain covered because their prior breadth and discrimination evidence showed no real scope or evidence defect.

The highest-priority remaining CLF gaps remain outside this branch: Domain 1 objectives 1.1 and 1.4, and Domain 4 objectives 4.1–4.3. This branch adds no content for them.

## Regression evidence

`tests/aws-review.test.mjs` continues to verify the complete CLF status map, objective-specific mappings, source metadata, question counts, multi-response presence, scope guards, and the unchanged 3.7/3.8 status. A dedicated Domain 3 re-audit assertion makes the 3.1–3.8 decision explicit.

No question banks, flashcard sets, drills, visuals, labs, objective mappings, or application behavior were changed by this audit. No merge or deployment is part of this work.
