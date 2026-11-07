# AWS CLF-C02 v1.3 reconciliation

Checked: 2026-11-06 against the supplied current AWS CLF-C02 Exam Guide version 1.3 (October 29, 2026), the official domain pages, and the current in-scope service-list reference recorded in [`content/aws-review-sources.json`](../content/aws-review-sources.json).

This is a scope and freshness audit, not a completeness claim. All 19 site objectives remain `partial`. The repository currently has 94 CLF-eligible questions, 89 CLF-eligible flashcards, and four CLF-specific labs; those counts do not prove coverage of every official subskill.

## Objective reconciliation

| Objective | Current site status | v1.3 scope check | Gap | Action |
|---|---|---|---|---|
| 1.1 | strong | Title and 24% Cloud Concepts placement remain aligned | Independent breadth and unseen scenarios are limited | Keep current material; add later transfer scenarios |
| 1.2 | moderate | Design-principles task remains represented | Few explicitly tagged questions relative to the breadth of the task | Add original principle-to-scenario items later |
| 1.3 | moderate | Migration benefits and strategies remain in scope | Migration evidence is review-led rather than hands-on | Add strategy comparison and migration-constraint scenarios later |
| 1.4 | strong | Cloud economics remains in Cloud Concepts | Pricing tradeoffs still need broader service-cost contexts | Preserve; extend only with verified current pricing behavior |
| 2.1 | strong | Shared responsibility remains a Security and Compliance task | More service-model transfer cases would improve breadth | Preserve current EC2/RDS/Lambda comparisons |
| 2.2 | moderate | Security, governance, and compliance remain in scope | Governance breadth and service-specific boundaries remain incomplete | Add focused governance/compliance scenarios later |
| 2.3 | moderate | Access-management capabilities remain in scope | IAM users/groups/roles/policies, Identity Center, federation, MFA, root/access keys, password policies, temporary credentials, and secrets need a subskill audit | Add a dedicated access-management pass later |
| 2.4 | moderate | Security components/resources remain in scope | Service recognition is stronger than independent scenario depth | Add resource-selection scenarios later |
| 3.1 | strong | Deployment and operating methods remain in Cloud Technology and Services | Hands-on execution is not evidence of exam coverage | Preserve console/CLI/SDK/IaC distinctions |
| 3.2 | strong | Global infrastructure remains in scope | Residency and regional-failure tradeoffs need more unseen cases | Preserve Region/AZ/edge distinctions |
| 3.3 | strong | Compute services remain in scope | Service-family breadth exceeds the current compact assessment set | Preserve EC2/Lambda/ECS/EKS/Fargate coverage |
| 3.4 | strong | Database services remain in scope | More service-selection and migration scenarios are possible | Preserve RDS/Aurora/DynamoDB/ElastiCache/Redshift distinctions |
| 3.5 | strong | Network services remain in scope | Current material is broad but not exhaustive across service-list categories | Preserve VPC, Route 53, CloudFront, VPN, Direct Connect distinctions |
| 3.6 | strong | Storage services remain in scope | Retrieval, retention, and transfer combinations need more unseen cases | Preserve S3/EBS/EFS/FSx and lifecycle material |
| 3.7 | thin | AI/ML and analytics remains an explicit technology objective | SageMaker AI, Lex, Comprehend, Polly, Rekognition, Textract, Transcribe, Translate, Amazon Q, Athena, EMR, Glue, Kinesis, OpenSearch, QuickSight, and Redshift are not uniformly taught or assessed | Next PR: reconcile each service/category before adding content |
| 3.8 | moderate | Other in-scope service categories remain represented | Category breadth is wide and current scope can change | Audit category-by-category; do not bulk-import services |
| 4.1 | strong | Pricing models remains a 12% Billing, Pricing, and Support task | Exact current plan/product behavior must be rechecked before new examples | Preserve On-Demand, Spot, Savings Plans, RI, Dedicated Host/Instance, capacity and transfer distinctions |
| 4.2 | strong | Billing, budget, and cost-management resources remain in scope | Reporting delays and account/tag setup need scenario breadth | Preserve Calculator, Cost Explorer, Budgets, CUR, Organizations, consolidated billing, and cost-allocation tags |
| 4.3 | moderate | Technical resources and Support options remain in scope | Support offerings change; old plan tables must not be reintroduced | Recheck live support matrix before adding support-plan questions |

## Scope and service findings

The 19 task statements and weights represented in `content/objectives.json` remain the v1.3 structure: Domain 1 24%, Domain 2 30%, Domain 3 34%, and Domain 4 12%. No task title, objective ID, weight, or status was changed in this reconciliation.

The repository's Domain 3 foundation already mentions Athena, Kinesis, Glue, QuickSight, SageMaker AI, and Lex. It also has related service recognition for EMR and Redshift in broader AWS material. The following requested 3.7 review set is not uniformly represented as dedicated CLF teaching and should not be treated as covered merely because a name appears in a table or shared material:

| 3.7 service/category | Audit result |
|---|---|
| SageMaker AI, Lex | taught at recognition level |
| Athena, Kinesis, Glue, QuickSight | taught at recognition level |
| EMR, Redshift | mentioned in broader AWS material; CLF-specific depth is thin |
| Comprehend, Polly, Rekognition, Textract, Transcribe, Translate, Amazon Q, OpenSearch | not uniformly taught as CLF-specific content |

For 2.3, the current material covers roles and temporary credentials well, but the full current capability set needs a separate audit of users, groups, policies, Identity Center, federation, MFA, root-user controls, access keys, password policies, and Secrets Manager. For 4.1 and 4.2, the site already distinguishes On-Demand, Spot, Savings Plans, Reserved Instances, Dedicated Hosts, capacity reservations, transfer/storage costs, Pricing Calculator, Cost Explorer, Budgets, Cost and Usage Reports, Organizations/consolidated billing, and cost-allocation tags. These remain partial because breadth, freshness, and unseen assessment evidence are incomplete.

For 4.3, current repository wording already avoids importing retired support-plan tables and names Basic Support, Business Support+, Enterprise Support, and Unified Operations cautiously. Support Center, Trusted Advisor, AWS Health, re:Post, Knowledge Center, Prescriptive Guidance, Professional Services, AWS Partners, and AWS Marketplace are represented at a recognition level. The live AWS support matrix must be checked again before adding plan-specific prices, response targets, or entitlements.

## Stale-source findings

- The uploaded CLF-C02 Exam Guide version 1.0 is historical and must not control current scope.
- The uploaded PowerPoint's support-plan table is stale reference material and must not be imported.
- Historical Snowball Edge/Snowcone assumptions require qualification; the repository already records Snowball Edge as existing-customer-only and Snowcone as discontinued rather than presenting either as a default new-customer recommendation.
- Older support-plan names, prices, response targets, and maximum-discount claims should not be copied into new content without a current AWS source.

## Follow-up plan

1. Perform the 3.7 service/category reconciliation against the current in-scope list and add only the highest-value original recognition scenarios.
2. Complete a 2.3 access-management subskill matrix, especially Identity Center/federation, MFA/root/access-key controls, password policies, and secrets.
3. Recheck 4.1/4.2 current pricing and billing terminology before expanding examples.
4. Recheck 4.3 support offerings and resources from the live AWS support documentation before writing support-plan questions.

No raw source archive, proprietary PDF, video, installer, or third-party question bank is committed by this reconciliation.
