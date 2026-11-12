# AWS CLF-C02 professor first-50 audit

Audit date: 2026-11-12. Learner milestone supplied by the user: Network+ passed; AWS Certified Cloud Practitioner (CLF-C02) is the next primary target.

Base: current `origin/main`, `852a87e72878cd35a1c603aae9aab962ed378d3e`, fetched before branching. Branch: `audit/aws-clf-professor-50`. Initial working tree: clean. No work was based on or written to `feature/protected-learner-activity`.

## Decision and review of recent work

Keep the existing AWS material and learning infrastructure. The earlier completeness documents describe historical states; they are not the current inventory. There was no existing `docs/aws-clf-professor-50-audit.md` at this base and this conversation had made no application changes before the corrected attachments arrived. The merged AWS expansions and learner work were inspected against the corrected request; no rollback or additional application implementation is authorized by this audit.

Current evidence: **357 CLF-eligible questions, 21 multiple-response questions, 279 CLF-tagged flashcards, 13 CLF drill decks, nine CLF paper labs, and 12 distinct registered CLF visual files**. Machine-readable coverage remains **8 covered / 11 partial / 0 missing** across 19 objectives. This audit changes no statuses or source verification dates. Existing scenario breadth is substantially greater than the historical 94/151-question snapshots. Content availability is not independent transfer performance, mastery, or a pass probability.

Highest-value next work: a source-register repair and current-scope check, then a small misconception-gap PR and AWS feedback/remediation parity. Do not regenerate databases, storage, benefits or economics wholesale. Narrow gaps include ALB path-routing recognition, quota-tool selection, S3 File Gateway versus other hybrid/file models, and EventBridge scheduling. Cognito and CloudHSM require current service-list confirmation before any CLF expansion; a broken professor item is not a reason to add Directory Service content.

## Source provenance and authority

Read first: [source policy](aws-source-policy.md), [completeness audit](aws-clf-completeness-audit.md), [targeted re-audit](aws-clf-targeted-reaudit.md), [v1.3 reconciliation](aws-clf-v13-reconciliation.md), [source register](../content/aws-review-sources.json), and [objective map](../content/objectives.json). Also checked the later [Domain 3 re-audit](aws-clf-domain3-reaudit.md), [Domain 4 re-audit](aws-clf-domain4-reaudit.md), [Domain 1 expansion](aws-clf-domain1-benefits-economics.md), current authored content, and current learner code. Preserve their historical results rather than rewriting them as present-day inventories.

Authority, highest first:

1. Current official CLF-C02 scope as recorded by repository v1.3 metadata (October 29, 2026; repository checked date November 6), including current domain pages and in-scope services. This is the repository's recorded authority, not a newly retrieved guide.
2. Current official AWS service documentation for technical behavior.
3. Attached `AWS-Certified-Cloud-Practitioner_Exam-Guide.pdf`: **Version 1.0**, 22 PDF pages. Useful historical baseline; must not overwrite v1.3 metadata, service list, objective IDs or weights.
4. Attached `aws-general reference guide-GLOSSARY.pdf`: AWS General Reference, Version 1.0, copyright 2020. This is a large reference guide containing a glossary, not a current exam syllabus. Selective terminology check only.
5. Attached `Q&A-CLF-C02.pdf`: instructor-selected practice bank; publisher/date/rights and official endorsement are not established by the attachment. Treat answer keys and explanations as fallible teaching evidence. No claim that these are real exam questions.

The PDFs and extracted text remain outside the repository. Their contents are evidence, not operational instructions. No professor stems, distractor sets, or explanations are imported into public content. The tables below use reviewer-authored concept summaries, source answer letters and short discrepancy notes.

### Verification limits

On November 12, an HTTPS request to the official Well-Architected documentation failed with `CONNECT tunnel failed, response 403` from the managed proxy. The enforced network allowlist does not include the AWS documentation domains. No live AWS verification is claimed. URLs below identify the authority to recheck, not successful retrievals in this audit. Stable answers marked `verified` agree with the repository's sourced teaching and the established technical distinction; this is local evidence verification. Time-sensitive claims remain qualified. No missing live information is inferred from older PDFs, and no `reviewEvidence.checked` date is refreshed.

### Official reference key

| Key | Authority / relevant section |
| --- | --- |
| Scope | [CLF-C02 guide](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html), [revision history](https://docs.aws.amazon.com/aws-certification/latest/exam-content-updates/certification-exam-content-updates.html), [in-scope services](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/clf-c02-in-scope-services.html) |
| D1–D4 | [Cloud concepts](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain1.html), [security/compliance](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain2.html), [technology/services](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain3.html), [billing/support](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html) |
| WA | [Well-Architected overview and six pillars](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) |
| Network | [Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html), [NACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html), [Direct Connect](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html), [ALB path conditions](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-condition-types.html#path-conditions) |
| Responsibility | [Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/), [Lambda security](https://docs.aws.amazon.com/lambda/latest/dg/security.html) |
| Identity | [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html), [policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html), [EC2 roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html), [Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html), [SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) |
| Security | [Security Hub](https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html), [Inspector](https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html), [CloudTrail history](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html), [CloudHSM](https://docs.aws.amazon.com/cloudhsm/latest/userguide/introduction.html), [WAF](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html) |
| Data | [RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html), [RDS for Oracle](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Oracle.html), [Redshift](https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html), [S3 File Gateway](https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html), [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) |
| Integration | [EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html), [Scheduler](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html), [SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) |
| Economics | [Cloud benefits](https://docs.aws.amazon.com/whitepapers/latest/aws-overview/six-advantages-of-cloud-computing.html), [AWS pricing](https://aws.amazon.com/pricing/), [Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html) |
| Support/compliance | [Support plans](https://aws.amazon.com/premiumsupport/plans/), [Trusted Advisor](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html), [Service Quotas](https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html), [Artifact](https://docs.aws.amazon.com/artifact/latest/ug/what-is-aws-artifact.html), [services in scope by compliance program](https://aws.amazon.com/compliance/services-in-scope/) |

### Selective glossary review

Used only the glossary entries that help explain these decisions: `network ACL` (PDF page 557 / printed 544), `security group`, `service control policy` and `Service Quotas` (PDF page 567 / printed 554), and `session` (PDF page 568 / printed 555). They support subnet-versus-resource filtering, governance vocabulary, quota terminology and temporary-credential sessions. Current service documentation remains necessary for allow/deny semantics, SCP permission evaluation and supported quota behavior.

The old guide also illustrates why wholesale glossary import is unsuitable: its `read replica` entry ties replication to MySQL 5.1 (PDF page 563), and it uses historical AWS Single Sign-On and Amazon Elasticsearch naming. These are reference-age signals, not current learner wording. No glossary entry is imported or used to expand exam scope.

### Attachment fingerprints

Fingerprints identify the exact supplied editions without committing their content.

| Attachment | SHA-256 |
| --- | --- |
| AWS-Certified-Cloud-Practitioner_Exam-Guide.pdf | `e5f907840e7a58c9956f99ce933e2823b467f825e43588e34a812d45abe90b9f` |
| aws-general reference guide-GLOSSARY.pdf | `8ac23eab325109a6a15d212a832256c095b18258d97896918f7271441768ce25` |
| Q&A-CLF-C02.pdf | `4902c69e201456bc8f0dadf3e8dba82e9d9b5e06d83310eea7c6021713e028b0` |

## Exact professor scope

**Exam A Questions 1–50 only**: first occurrence of Q1 on PDF page 1 through the first Q50 on page 20. The first Q51 on page 20 is the exclusive boundary. No later exam section or reset numbering is included. Questions are counted by position, so Q44 and its exact duplicate Q47 both appear: 50 positions, 49 unique stem/option sets, of which two positions have unusable stems (Q27 and Q49). The malformed appended text inside Q37 is not another item.

Extraction used `pdftotext -layout`; visual inspection of original PDF pages 11 and 20 confirmed Q27's mismatch and Q49's missing example are in the attachment, not merely text-extraction loss. There are 13 multiple-response and 37 single-response positions; every multiple-response position requests two selections from five choices.

## Question audit

One primary objective per position keeps distributions additive. The objective's first digit is its domain. Q27 and Q49 have **provisional inferred mappings**, not validated question intent; their current answers cannot be established. Q16 also reinforces 1.1/3.2, Q18 reinforces 1.4, Q20 reinforces 3.4, and Q45 reinforces 3.1/1.2. These secondary relations do not increase the counts.

Status codes: **V** `verified`; **U** `verified-answer-explanation-needs-update`; **Q** `needs-qualification`; **A** `ambiguous`; **S** `stale`; **I** `incorrect`; **O** `out-of-current-scope`. U includes a correct key with an incorrect or stale explanation. A takes precedence when no answer can be established. S/I/O would mean a primary item failure, not merely an old distractor, a bad explanation, or unconfirmed scope. Categories are mutually exclusive. MR = multiple-response; SR = single-response.

“Current answer” below is the reviewer conclusion under the stated verification limits. Evidence IDs refer to [current original questions](../content/questions.json), not professor items.

| Q (PDF page) | Domain / task | Type | Concept / services | Professor key | Current answer / condition | Status | Site support / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 (p1) | D1 / 1.2 | MR | Well-Architected pillars | BE | BE: Reliability; Operational Excellence | U | strong; q-clf12-01 |
| 2 (p1) | D3 / 3.5 | MR | VPC filtering: security groups / NACLs | AD | AD: security groups; NACLs | U | strong; q-clf35-03 / 04 / 05 |
| 3 (p1) | D2 / 2.4 | SR | Security Hub / Inspector / Detective / Macie | D | D: Security Hub | U | adequate; q-clf24-05 / 06 |
| 4 (p2) | D4 / 4.2 | SR | Forecast cost alerts: Budgets / Cost Explorer | A | A: AWS Budgets | V | strong; q-clf42-03 / 07 / 13 |
| 5 (p2) | D3 / 3.4 | SR | Managed MySQL: RDS / EC2 / CloudFormation | B | B: RDS for MySQL, with configured backups and maintenance | Q | adequate; q-clf34-01 / 10 / 14 |
| 6 (p3) | D2 / 2.1 | MR | Lambda IAM permissions and application code | BC | BC: customer permissions and code | V | strong; q-clf21-01 through 10 |
| 7 (p3) | D2 / 2.2 | SR | Organizations service control policies | B | B: Organizations manages SCPs; SCPs do not grant permissions | U | missing; No CLF SCP teaching or question |
| 8 (p3) | D1 / 1.4 | SR | Consumption / pay-as-you-go / commitments | B | B: pay-as-you-go | U | strong; q-clf14-01 through 14 |
| 9 (p4) | D2 / 2.1 | MR | AWS infrastructure vs customer workloads | AD | AD: infrastructure network/virtualization and physical hardware security | V | strong; q-clf21-06 / 09 / 10 |
| 10 (p4) | D2 / 2.3 | SR | Temporary API credentials: STS / IAM users | C | C: AWS STS | V | thin; q-clf23-01 / 14; no named STS item |
| 11 (p5) | D2 / 2.3 | MR | Application identity: Cognito vs IAM | AD | AD: Cognito and IAM, for different identity audiences | Q | thin; q-clf23-04 / 14; no Cognito teaching |
| 12 (p5) | D3 / 3.5 | MR | CIDR ranges in SG and NACL rules | AC | AC: security groups; NACLs | U | adequate; q-clf35-03 / 04 / 05 |
| 13 (p5) | D2 / 2.1 | MR | Infrastructure patching and physical security | AC | AC: AWS network-device patching and physical compute security | V | strong; q-clf21-06 / 09 / 10 |
| 14 (p6) | D3 / 3.5 | SR | Dedicated private connectivity: Direct Connect / VPN | B | B: Direct Connect | V | strong; q-clf35-07 / 08 / 09 |
| 15 (p6) | D1 / 1.2 | SR | Operational Excellence: learning from failures | C | C: learning from operational failures | U | strong; q-clf12-01 through 10 |
| 16 (p7) | D3 / 3.3 | MR | EC2 Auto Scaling and Multi-AZ availability | AC | AC: Auto Scaling and multi-AZ resources | U | adequate; q-clf33-10 / 12 / 14; q-clf32-05 |
| 17 (p7) | D4 / 4.1 | MR | Compute usage and data-transfer cost factors | DE | DE: outbound transfer and compute usage, subject to rates/allowances | Q | adequate; q-clf41-17 |
| 18 (p8) | D1 / 1.1 | MR | Availability and economies of scale | DE | DE: enabling availability and economies of scale | U | strong; q-clf11-01 through 12 |
| 19 (p8) | D4 / 4.3 | SR | Trusted Advisor / Config / Security Hub | A | A: Trusted Advisor, within supported checks and access | Q | adequate; q-clf43-05 / 17 |
| 20 (p8) | D3 / 3.7 | SR | Analytics warehouse: Redshift / RDS / DynamoDB / cache | C | C: Redshift is intended; complex SQL alone is insufficient | Q | adequate; q-clf37-09 / 13 |
| 21 (p9) | D3 / 3.8 | SR | Event routing: EventBridge / SQS / Lambda | D | D: EventBridge for compatible event sources and targets | Q | strong; q-clf38-01 / 03 / 04 |
| 22 (p9) | D2 / 2.3 | SR | EC2 roles vs stored long-lived access keys | A | A: EC2 role via an instance profile | V | strong; q-clf23-01 / 12 / 14 |
| 23 (p10) | D3 / 3.6 | SR | Durable object storage: S3 / EBS / EFS / FSx | A | A: Amazon S3 | V | strong; q-clf36-01 / 12 / 14 |
| 24 (p10) | D2 / 2.1 | SR | Retired physical storage-media sanitization | B | B: AWS for underlying physical devices | U | adequate; q-clf21-06 / 09 / 10 |
| 25 (p10) | D2 / 2.3 | SR | IAM default deny / identity vs resource policy | B | B under no other grant; attachment absence alone is insufficient | Q | adequate; q-clf23-09 / 13 |
| 26 (p11) | D3 / 3.2 | SR | Region vs Availability Zone | A | A is closest; Region is a geographic area containing multiple AZs | Q | strong; q-clf32-01 / 02 |
| 27 (p11) | D2 / 2.3* | SR | Managed Microsoft AD / Directory Service, inferred only | C | Not determinable from supplied stem | A | missing; No CLF Directory Service teaching or question |
| 28 (p11) | D1 / 1.2 | SR | Reliability and automatic failover | C | C: automatic failover to healthy resources | V | strong; q-clf12-07 |
| 29 (p12) | D3 / 3.6 | SR | Hybrid NFS/SMB to S3: File Gateway / volume gateway / EFS | C | C: S3 File Gateway, subject to current availability/support | Q | thin; q-clf36-06 / 14 |
| 30 (p12) | D1 / 1.1 | SR | Business agility and time to market | C | C: agility | V | strong; q-clf11-03 / 08 |
| 31 (p12) | D3 / 3.4 | SR | Managed relational maintenance: RDS / EC2 / DynamoDB | D | D: RDS, retaining customer data/access decisions | U | strong; q-clf34-01 / 10 / 14 |
| 32 (p13) | D3 / 3.3 | SR | S3-triggered processing: Lambda / EC2 / Lightsail | C | C: Lambda | U | strong; q-clf33-02 |
| 33 (p13) | D1 / 1.4 | MR | Cloud migration cost categories and licensing | AD | AD for retired on-prem facilities/hardware; licensing can remain | U | strong; q-clf14-01 through 14 |
| 34 (p13) | D2 / 2.2 | SR | Compliance reports: Artifact / Trusted Advisor | B | B: AWS Artifact | V | strong; q-clf22-01 / 05 |
| 35 (p14) | D3 / 3.8 | SR | Daily Lambda invocation: EventBridge scheduling | C | C: EventBridge; prefer Scheduler for new schedules | U | thin; q-clf38-03; no dedicated scheduling item |
| 36 (p14) | D3 / 3.4 | SR | Oracle-compatible managed migration: RDS | C | C: RDS for Oracle, after compatibility and licensing review | Q | adequate; q-clf34-01 / 05 / 10 |
| 37 (p15) | D2 / 2.1 | SR | WorkSpaces physical infrastructure vs identity/configuration | B | B: AWS physical/environmental infrastructure | U | adequate; q-clf21-06 / 09 / 10 |
| 38 (p15) | D2 / 2.2 | SR | API attribution: CloudTrail / CloudWatch / Inspector | C | C: CloudTrail management-event history for termination | U | strong; q-clf22-02 / 03 / 04 / 05 |
| 39 (p15) | D2 / 2.2 | SR | Dedicated cryptographic hardware: CloudHSM / KMS / ACM | C | C: CloudHSM for dedicated HSM requirement; current scope must be checked | Q | missing; CloudHSM exists only in SAA teaching; no CLF question |
| 40 (p16) | D1 / 1.4 | SR | Fixed-to-variable expense / pay-as-you-go | C | C: pay-as-you-go | V | strong; q-clf14-01 through 14 |
| 41 (p16) | D4 / 4.3 | SR | TAM access and support plans | D | D: Enterprise among supplied choices, pending live plan matrix | Q | adequate; q-clf43-13 / 20 |
| 42 (p17) | D2 / 2.4 | SR | HTTP-layer filtering: WAF / Shield / SG / NACL | D | D: AWS WAF | V | strong; q-clf24-01 / 02 / 11 |
| 43 (p17) | D3 / 3.8 | SR | Publisher/subscriber: SNS / SQS / EventBridge | B | B: Amazon SNS | V | strong; q-clf38-01 / 02 / 03 |
| 44 (p17) | D1 / 1.4 | SR | Economies of scale vs agility/global reach | B | B: economies of scale | V | strong; q-clf14-01 through 14 |
| 45 (p18) | D4 / 4.3 | MR | Quota visibility: Service Quotas / Trusted Advisor | AB | AB within supported quota checks and access | Q | thin; q-clf43-05; no Service Quotas question |
| 46 (p18) | D3 / 3.3 | SR | URL-path routing: ALB / NLB / self-managed balancer | B | B: Application Load Balancer | U | thin; q-clf33-11 / 12 / 14; no ALB-path item |
| 47 (p19) | D1 / 1.4 | SR | Economies of scale, duplicate of Q44 | B | B: economies of scale | V | strong; q-clf14-01 through 14 |
| 48 (p19) | D3 / 3.4 | MR | Relational schema: Aurora / RDS / NoSQL families | AB | AB: Aurora and RDS | U | strong; q-clf34-01 / 02 / 06 / 12 |
| 49 (p20) | D4 / 4.2* | SR | Cost governance / architecture optimization, inferred only | C | Not determinable: referenced example is absent | A | adequate; q-clf42-01 through 17; q-clf14-01 through 14 |
| 50 (p20) | D2 / 2.2 | SR | Service compliance evidence: Artifact / other security tools | A | A: Artifact for reports; also check Services in Scope by program/Region | Q | strong; q-clf22-01 / 05 |

### Per-item quality and freshness

Cognitive classification records the strongest demand actually present: recognition = recall/cue; discrimination = distinguish alternatives; application = use an explicit requirement; transfer = apply in a meaningfully new context. **No professor item is credited as independently validated transfer**: a scenario stem alone does not establish unseen transfer. Q27/Q49 are unclassifiable because their required premises are absent.

Scope: `aligned` means the concept fits a current recorded task, not that every named distractor is currently in scope. `confirm` requires current in-scope-list verification before CLF teaching expansion. Explanation/terminology flags are assessed separately from the answer. `usable` still carries the live-verification limit. Distractor/ambiguity notes below are the per-item review, not a bank-wide assumption.

| Q | Demand | Scope | Explanation freshness | Terminology | Distractor quality / ambiguity / discrepancy |
| --- | --- | --- | --- | --- | --- |
| 1 | recognition | aligned | update | historical / recheck | Five-pillar explanation omits Sustainability; plausible non-pillar distractors. |
| 2 | discrimination | aligned | update | usable; live check limited | Explanation incorrectly gives security groups deny rules; SG allows only, NACL allows/denies. |
| 3 | discrimination | aligned | update | usable; live check limited | Good adjacent-service distractors; Inspector description is EC2-only and too narrow. |
| 4 | application | aligned | usable | usable; live check limited | Clear forecast-alert requirement; explain delayed billing data, not a hard spending cap. |
| 5 | application | aligned | qualify | usable; live check limited | Automation does not remove customer configuration, maintenance decisions, or engine compatibility checks. |
| 6 | application | aligned | usable | usable; live check limited | Service-specific boundary is clear; do not generalize managed OS responsibilities to EC2. |
| 7 | recognition | aligned | update | usable; live check limited | Explanation describes accessible actions without stating the permission-ceiling boundary. |
| 8 | discrimination | aligned | update | usable; live check limited | Consumption does not eliminate charges for idle provisioned capacity; discounts are separate. |
| 9 | discrimination | aligned | usable | usable; live check limited | Clear physical versus guest/application boundary; mostly easy distractors. |
| 10 | application | aligned | usable | usable; live check limited | Useful temporary-credential discrimination; STS issues credentials and policies constrain permissions. |
| 11 | recognition | confirm service list | qualify | historical / recheck | IAM and Cognito are not interchangeable; CodeStar is historical terminology in a distractor. |
| 12 | recognition | aligned | update | usable; live check limited | Explanation again conflates SG with deny rules; CIDR recognition is enough, no subnet calculation requirement. |
| 13 | discrimination | aligned | usable | usable; live check limited | Sound EC2 guest-OS distractor; repeats Q9 responsibility distinction. |
| 14 | discrimination | aligned | usable | usable; live check limited | Dedicated path is distinct from internet VPN; private does not automatically mean encrypted. |
| 15 | recognition | aligned | update | historical / recheck | Answer sound; explanation repeats obsolete five-pillar count. |
| 16 | application | aligned | update | historical / recheck | SMS distractor is historical; PoPs are not EC2 placement locations and Global Accelerator is not content caching. |
| 17 | recognition | aligned | qualify | usable; live check limited | No universal per-byte egress fee; direction, route, tiers and free allowances matter; acceleration can add cost. |
| 18 | discrimination | aligned | update | historical / recheck | HA is an architecture outcome, not automatic; exclusive TAM-plan claim requires current support qualification. |
| 19 | discrimination | aligned | qualify | usable; live check limited | Real-time wording is too broad; check refresh cadence, coverage and plan entitlements. |
| 20 | discrimination | aligned | qualify | usable; live check limited | RDS can run complex queries; warehouse-scale analytics would make the requirement decisive. |
| 21 | application | aligned | qualify | usable; live check limited | No additional code applies to routing/configuration, not arbitrary data integration or application logic. |
| 22 | application | aligned | usable | usable; live check limited | Good secure-workload distinction; temporary credentials still exist and must be protected. |
| 23 | recognition | aligned | usable | usable; live check limited | Correct object-model cue; durability is a design target, not backup or availability guarantee. |
| 24 | recognition | aligned | update | historical / recheck | Owner correct; old DoD/NIST procedure citations are not proof of the current AWS sanitization process. |
| 25 | application | aligned | qualify | usable; live check limited | Resource-based or group grants can authorize without directly attached user policy; qualify the premise. |
| 26 | recognition | aligned | qualify | usable; live check limited | Vague location wording overlaps AZ intuition; do not teach a fixed AZ count from this old source. |
| 27 | unclassifiable | confirm service list | unusable premise | historical / recheck | Cloud-versus-on-prem stem does not ask about AD; explanation uses old AWS Single Sign-On name. |
| 28 | application | aligned | usable | usable; live check limited | Quarterly testing is useful but not sufficient for component-failure continuity; duplicates CloudFormation in explanation. |
| 29 | discrimination | aligned | qualify | usable; live check limited | Generic gateway taught; file/volume distinction thin; compression claim is unsupported by cited local evidence. |
| 30 | recognition | aligned | usable | usable; live check limited | Clear speed-to-market cue; weak distractor with the opposite outcome. |
| 31 | application | aligned | update | historical / recheck | Answer sound; static engine list is historical and should not be treated as exhaustive. |
| 32 | application | aligned | update | usable; live check limited | Explanation overclaims zero administration and no idle charges; requests, provisioned features and configuration matter. |
| 33 | application | aligned | update | usable; live check limited | Explanation contradicts key by naming licensing instead of facilities; migration alone does not eliminate every cost. |
| 34 | application | aligned | usable | usable; live check limited | Good report-access cue; reports do not establish customer workload compliance. |
| 35 | application | aligned | update | historical / recheck | Explanation centers legacy scheduled rules; CodeStar distractor is historical. |
| 36 | application | aligned | qualify | usable; live check limited | No rewrite is conditional on supported engine/version/features; not a blanket compatibility guarantee. |
| 37 | discrimination | aligned | update | usable; live check limited | Option D includes unrelated S3 text; preserve corruption instead of treating it as an additional question. |
| 38 | application | aligned | update | usable; live check limited | Every API call claim is too broad; event coverage and data-event logging depend on supported services/settings. |
| 39 | discrimination | confirm service list | qualify | usable; live check limited | Do not infer present scope from v1.0 list; HSM certification is hardware/version-specific, not a universal compliance guarantee. |
| 40 | recognition | aligned | usable | usable; live check limited | Answer follows offered choices; distinguish cost structure from guaranteed lower total cost. |
| 41 | recognition | aligned | qualify | historical / recheck | Legacy Developer/Business choices require transition context; do not infer exclusive entitlements or response times. |
| 42 | discrimination | aligned | usable | usable; live check limited | Application-layer filtering distinguishes WAF from baseline network-layer DDoS protection. |
| 43 | recognition | aligned | usable | usable; live check limited | Correct pub/sub cue; other offered services make this easier than a close SNS/SQS/EventBridge comparison. |
| 44 | recognition | aligned | usable | usable; live check limited | Exact same stem/options/key as Q47; count positions separately, not independent evidence. |
| 45 | discrimination | confirm service list | qualify | usable; live check limited | Do not imply every quota is adjustable, covered or continuously updated; improvement and enforcement are separate. |
| 46 | application | aligned | update | historical / recheck | Useful L7 vs L4 cue; explanation treats historical OpsWorks as current and overreduces NLB routing. |
| 47 | recognition | aligned | usable | usable; live check limited | Duplicate Q44; no additional independent learning signal. |
| 48 | discrimination | aligned | update | historical / recheck | Good service-family contrast; fixed engine count and promotional throughput multiples need removal/qualification. |
| 49 | unclassifiable | aligned | unusable premise | usable; live check limited | Explanation cannot repair a missing scenario; objective assignment is provisional. |
| 50 | application | aligned | qualify | usable; live check limited | Service eligibility differs by framework/Region; AWS reports are not certification of the customer's configuration. |

### Status totals

| Primary status | Count |
| --- | --- |
| verified | 16 |
| verified-answer-explanation-needs-update | 18 |
| needs-qualification | 14 |
| stale | 0 |
| ambiguous | 2 |
| incorrect | 0 |
| out-of-current-scope | 0 |

Zero primary `stale` does **not** mean zero stale content: Q1/Q15's five-pillar explanation, Q11/Q35's CodeStar distractor, Q16's SMS distractor, Q27's Single Sign-On terminology, Q41's legacy plan choices, and Q46's OpsWorks context require update/recheck. No wrong answer key is established independently of an unusable premise; Q33 has an explicitly incorrect explanation but a defensible AD key. No item is declared out of current scope merely because its service appears in the old guide or is absent from current site teaching. In particular Q39 remains scope-unconfirmed.

Key discrepancies to retain when reviewing instructor material:

- Q1 and Q15: professor explains five Well-Architected pillars; current teaching uses six including Sustainability. Preserve the correct key, reject the old explanation.
- Q2 and Q12: professor explanation assigns deny behavior to security groups; security groups use allow rules, while NACLs can allow/deny. This is more consequential than stale product naming.
- Q27: the professor key points to managed AD, but the printed stem does not establish that need. Request a corrected source item in a later instructor review; do not invent a replacement stem in this audit.
- Q33: professor key is AD, but prose identifies licensing plus hardware. Facilities/hardware can move out of the owned data center; application licensing can persist and must be evaluated.
- Q37: the physical-infrastructure answer remains B, but a distractor contains unrelated S3 material. Do not silently normalize this as a clean question.
- Q44/Q47: identical assessment stimulus; two positions, one independent learning opportunity.
- Q49: the referenced example is absent from the printed page; C cannot be verified. Do not use its explanation to fabricate the missing evidence.

## Domain distribution

Official weights remain 24/30/34/12. Professor percentages describe these 50 positions, not official exam probabilities. Site percentages use all CLF-eligible questions counted once under their explicit primary CLF objective; they are availability, not question-quality weighting.

| Domain | Professor count | Professor % | Official weight | Difference (percentage points) | Site explicit questions | Site % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 — Cloud Concepts | 10 | 20% | 24% | -4 | 66 | 18.5% |
| 2 — Security and Compliance | 17 | 34% | 30% | +4 | 69 | 19.3% |
| 3 — Cloud Technology and Services | 17 | 34% | 34% | +0 | 150 | 42.0% |
| 4 — Billing, Pricing, and Support | 6 | 12% | 12% | +0 | 72 | 20.2% |

Excluding only the unclassifiable Q27/Q49 leaves 48 positions; the table intentionally preserves the required 50-position denominator. Q27's provisional Domain 2 and Q49's provisional Domain 4 assignments each contribute two percentage points. Removing duplicate Q47 changes independent stimulus counts and reduces the cloud-economics signal. Do not treat either missing premise or duplication as learner evidence.

## Objective distribution and current-site evidence

This uses the existing `covered / partial / missing` model. No promotion from mere counts. Notes/flashcards/labs/visuals below are **topic-associated**, can overlap across objectives, and do not demonstrate direct assessment. Q counts are recomputed from CLF eligibility plus explicit `objectiveIds['clf-c02']`, not topic membership. This is deliberately stricter than the existing report's topic-based Quiz column (for example, it reports 106 questions for each 3.1–3.6 objective although the explicit counts differ).

| Task statement | Professor positions | % of 50 | Current status | Direct Q / MR | Associated notes / cards / labs / visuals | Current assessment and remaining limit |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 — Define the benefits of the AWS Cloud | 2 | 4% | partial | 20 / 2 | 14 / 37 / 4 / 1 | Benefit transfer expansion exists; independent re-audit and live scope still pending. |
| 1.2 — Identify design principles of the AWS Cloud | 3 | 6% | covered | 11 / 1 | 17 / 43 / 4 / 2 | Six pillars, comparison questions, drill and visual already exist; reuse rather than duplicate. |
| 1.3 — Understand the benefits of and strategies for migration to the AWS Cloud | 0 | 0% | covered | 16 / 0 | 23 / 51 / 4 / 2 | Strategy/readiness/discovery/cutover decisions and paper lab exist; not sampled by first 50. |
| 1.4 — Understand concepts of cloud economics | 5 | 10% | partial | 19 / 2 | 14 / 37 / 4 / 1 | TCO, utilization, licensing and variable-cost expansion exists; independent review still pending. |
| 2.1 — Understand the AWS shared responsibility model | 5 | 10% | covered | 14 / 2 | 16 / 41 / 2 / 1 | Service-specific EC2/RDS/Lambda boundaries and lab exist; physical-media detail is general. |
| 2.2 — Understand AWS Cloud security, governance, and compliance concepts | 5 | 10% | covered | 17 / 1 | 16 / 41 / 2 / 1 | Governance/security decision set exists; CloudHSM CLF teaching absent and scope uncertain. |
| 2.3 — Identify AWS access management capabilities | 5* | 10% | covered | 20 / 0 | 20 / 34 / 2 / 1 | IAM/roles/federation strong; Cognito is only a distractor and Directory Service absent. |
| 2.4 — Identify components and resources for security | 2 | 4% | covered | 18 / 0 | 16 / 41 / 2 / 1 | WAF/Shield/GuardDuty/Inspector/Hub present; Hub-specific assessment remains one recognition item. |
| 3.1 — Define methods of deploying and operating in the AWS Cloud | 0 | 0% | partial | 14 / 1 | 18 / 74 / 4 / 4 | Console/CLI/SDK/API/IaC scenarios exist; not represented in professor 50. |
| 3.2 — Define the AWS global infrastructure | 1 | 2% | partial | 19 / 2 | 18 / 74 / 4 / 4 | Global-design and residency scenarios exist; visual is a chooser rather than nested failure-domain model. |
| 3.3 — Identify AWS compute services | 3 | 6% | partial | 21 / 1 | 18 / 74 / 3 / 4 | Compute/scaling scenarios exist; ALB URL-path vs NLB discrimination missing. |
| 3.4 — Identify AWS database services | 4 | 8% | partial | 18 / 1 | 18 / 74 / 3 / 4 | RDS/Aurora/DynamoDB/cache and DMS/SCT scenarios exist; Oracle-specific caveats thin. |
| 3.5 — Identify AWS network services | 3 | 6% | partial | 19 / 1 | 18 / 74 / 3 / 4 | SG/NACL and VPN/Direct Connect scenarios exist; deeper implementation is outside this audit. |
| 3.6 — Identify AWS storage services | 2 | 4% | partial | 19 / 2 | 18 / 74 / 3 / 4 | Object/block/file and lifecycle scenarios exist; exact file/volume gateway discrimination thin. |
| 3.7 — Identify AWS AI/ML and analytics services | 1 | 2% | covered | 19 / 0 | 17 / 83 / 3 / 5 | AI/analytics selector, questions, cards and drill exist; only warehouse selection sampled here. |
| 3.8 — Identify services from other in-scope AWS service categories | 3 | 6% | covered | 21 / 1 | 27 / 90 / 4 / 5 | Integration and other categories exist; EventBridge Scheduler practice thin. |
| 4.1 — Compare AWS pricing models | 1 | 2% | partial | 24 / 1 | 13 / 56 / 1 / 1 | Purchasing/capacity distinctions expanded; live rates/product freshness and independent breadth pending. |
| 4.2 — Understand resources for billing, budget, and cost management | 2* | 4% | partial | 26 / 2 | 13 / 56 / 1 / 1 | Tool-role decisions expanded; repeats common cues, live billing behavior still pending. |
| 4.3 — Identify AWS technical resources and AWS Support options | 3 | 6% | partial | 22 / 1 | 9 / 50 / 1 / 1 | Support resources expanded; Service Quotas direct teaching missing and live entitlements pending. |

`*` Includes one provisional mapping. Five highest counts, with deterministic objective-ID ordering at ties, are shown below. Equal counts are equal emphasis, not meaningfully distinct ranks.

- **1.4: 5 positions (10%).**
- **2.1: 5 positions (10%).**
- **2.2: 5 positions (10%).**
- **2.3: 5 positions (10%)** including a provisional item.
- **3.4: 4 positions (8%).**

Underrepresented professor tasks: **1.3 migration and 3.1 deployment/operations have no primary item**; 3.2 and 3.7 each have one. This does not remove these tasks from exam preparation. Repeated concepts include physical/shared responsibility (Q6/9/13/24/37), relational databases (Q5/31/36/48), cloud economics (Q8/33/40/44/47), traffic controls (Q2/12), event routing/scheduling/pub-sub (Q21/35/43), compliance evidence (Q34/50) and Well-Architected principles (Q1/15/28). The professor set is not dominated by databases alone: responsibility, governance, IAM and economics each have five primary positions.

## Professor-emphasis gap analysis

Support classifications are concept-specific: strong = teaching plus appropriate comparison/scenario practice; adequate = usable core explanation and assessment, but narrower application; thin = generic related material or recognition only; missing = no direct CLF instruction/assessment; stale = current learner-facing evidence contradicted by authority. No topic is labeled stale merely because a source question is stale. The following matrix accounts for all 50 positions by concept family; differing per-item support in the main table takes precedence.

For each column, `Y` = directly present, `P` = partial/general/topic-level only, `—` = absent. E = explanation, Dist = distinction, Cue = exam cue, OQ = original question, Sc = requirement scenario, Tr = meaningful different-context practice (authored, not validated learner transfer), Vis = visual aid, Dr = drill, Rem = remediation. Generic notes/cards/visual links count only P for Rem because exact misconception targeting and transfer retries are absent. Vis does not imply interactivity or independently scored practice.

| Professor positions / concept | E | Dist | Cue | OQ | Sc | Tr | Vis | Dr | Rem | Support / smallest useful improvement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1,15,28 — six pillars / design | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong; reuse existing six-pillar material; no new pillar overview. |
| 2,12,14 — SG/NACL and connectivity | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong core distinction; CIDR is recognition, not Network+ subnet implementation. |
| 3,42 — Hub/Inspector and WAF/Shield | Y | Y | Y | Y | P | P | P | Y | P | Adequate to strong; Hub has only one direct recognition question. |
| 4 — forecast budget alerts | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong; avoid another threshold-alert variant. |
| 5,31,36,48 — relational/managed database choices | Y | Y | Y | Y | Y | Y | Y | Y | P | Adequate to strong; Oracle compatibility is thinner than generic RDS selection. |
| 6,9,13,24,37 — shared responsibility | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong baseline; media destruction/WorkSpaces applications are broader-boundary transfer opportunities. |
| 7 — Organizations SCP governance | — | — | — | — | — | — | P | — | P | Missing direct SCP coverage; Organizations billing is not SCP teaching. |
| 8,18,30,33,40,44,47 — benefits/economics | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong recent expansion; audit 1.1/1.4 rather than regenerate it. |
| 10 — STS issuing temporary credentials | P | P | P | — | P | P | P | P | P | Thin exact service coverage; role/temporary-credential scenarios exist, named STS assessment does not. |
| 11 — Cognito vs IAM | P | — | — | — | — | — | P | P | P | Thin overall; Cognito instruction absent, only used as a distractor. Confirm current scope first. |
| 17 — compute and transfer charges | Y | Y | Y | Y | Y | P | Y | Y | P | Adequate; do not add numeric rates without current sources. |
| 19,41 — Trusted Advisor and support/TAM | Y | Y | Y | Y | Y | P | Y | Y | P | Adequate; live entitlements and check cadence remain unresolved. |
| 20 — warehouse analytics vs operational databases | Y | Y | Y | Y | Y | P | Y | Y | P | Adequate; sharpen warehouse-vs-OLTP cue instead of duplicating Redshift definitions. |
| 21,43 — EventBridge/SNS/SQS roles | Y | Y | Y | Y | Y | P | Y | Y | P | Strong role teaching; broader unseen comparisons are future transfer evidence. |
| 22,25 — workload roles, least privilege, default deny | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong roles; qualify default deny for resource/group grants and target exact misconceptions. |
| 23 — object/block/file | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong; no need for another S3 definition card. |
| 26 — Region/AZ/edge | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong concepts; improve relationship visualization/discoverability. |
| 27 — Directory Service (inferred) | — | — | — | — | — | — | — | — | — | Missing; do not prioritize from an invalid item or assume current scope. |
| 29 — S3 File Gateway vs volume gateway/EFS | P | P | P | P | P | P | P | P | P | Thin specific gateway-mode comparison; generic Storage Gateway exists. |
| 32 — event-driven Lambda | Y | Y | Y | Y | Y | P | Y | Y | P | Strong; current q-clf33-02 already uses an image-arrival scenario, so avoid recreating it from professor text. |
| 34,38,50 — Artifact/CloudTrail/Config/CloudWatch | Y | Y | Y | Y | Y | Y | Y | Y | P | Strong; teach report vs configuration vs API event distinction with existing artifacts. |
| 35 — EventBridge Scheduler | P | P | P | — | — | — | P | P | P | Thin; one scheduling requirement would add a distinct concept, subject to current scope. |
| 39 — CloudHSM vs KMS | — | — | — | — | — | — | — | — | — | Missing CLF support; SAA material is not CLF evidence. Confirm scope before adding. |
| 45 — Service Quotas vs Advisor | P | — | P | — | — | — | P | P | P | Thin combined requirement; Service Quotas direct support absent. |
| 46 — ALB URL paths vs NLB | P | — | P | — | — | — | P | P | P | Thin; generic load balancing exists but no explicit ALB/path question or distinction. |
| 49 — cost governance (inferred) | Y | Y | Y | Y | Y | Y | Y | Y | P | Adequate existing economics/cost decisions; an absent professor example cannot identify a specific site gap. |

### Source-register correctness defect

`content/aws-review-sources.json` has **two top-level `sources` properties**. The first map contains the raw official guide, revision-history and service-list references; the second begins at line 670 at this base. Standard `JSON.parse` and Python `json.loads` retain only the last value, leaving **32 effective source entries**. Within the earlier map, `athena`, `glue`, `tags` and `redshift` also repeat. These are observed duplicate-key findings, not a claim that every duplicate URL conflicts.

This is a **P1 auditability/correctness issue**: humans reading the raw register see references that a runtime consumer cannot access. The current content checker and AWS tests pass despite it. Do not treat the presence of a URL in the raw file as successful machine-readable evidence. First follow-up should reconcile the maps without dropping references, resolve each duplicate deliberately, and add a duplicate-key check before parsing; compare the resulting key inventory to both original maps. This audit deliberately records the defect without altering the source register, app code, credentials or coverage statuses.

### Reassessed priorities versus historical gaps

- 3.1–3.6 remain partial, but each now has 14–21 explicitly mapped questions and transfer material. “Missing scenarios across Domain 3” is obsolete. Focus on service distinctions still not directly taught/tested, source confirmation and independent re-audit.
- 1.1 and 1.4 now have 20 and 19 explicitly mapped questions respectively, with benefit/economics transfer, drill, paper lab and visual support. Re-audit this addition before adding more.
- 4.1–4.3 now have 24/26/22 explicitly mapped questions. Keep partial for current-source uncertainty and repeated cue patterns, not because content is absent.
- The first professor 50 omit migration and operations, both of which the site already teaches. Maintain official scope rather than letting that omission hide them from study.
- Narrow gaps at otherwise covered security/access objectives show that an objective flag cannot substitute for service-level review. Covered does not mean every relevant concept or future source is automatically correct.

## High-value confusion pairs

The five strongest professor-tested comparison families are ranked by repeated emphasis and consequence, not a fabricated probability:

1. **AWS vs customer responsibility**, especially physical infrastructure, guest OS, Lambda code/permissions and managed databases (Q5/6/9/13/24/31/37).
2. **RDS/Aurora vs EC2-hosted databases vs DynamoDB**, with Redshift for warehouse analytics and compatibility qualification (Q5/20/31/36/48).
3. **IAM roles/STS temporary credentials vs long-lived IAM-user keys**, plus audience separation for Cognito/IAM (Q10/11/22/25).
4. **SG vs NACL vs monitoring/detection**, where statefulness, layer and allow/deny behavior matter (Q2/12 and Q42).
5. **EventBridge vs SNS vs SQS vs Lambda**, including routing, fan-out, buffering, execution and scheduling (Q21/32/35/43).

Also review all requested comparison families against existing evidence:

| Family | Current CLF evidence / remaining opportunity |
| --- | --- |
| GuardDuty vs Inspector vs Security Hub | q-clf24-03/05/06 and security-transfer topic distinguish threat detection, vulnerabilities and aggregation; Hub/Inspector pairwise transfer thin. |
| WAF vs Shield | q-clf24-01/02/11, security drill/visual and Final Review exist. Reuse. |
| CloudWatch vs CloudTrail vs Config vs Artifact | q-clf22-01–05, governance teaching/lab and review exist. Reuse. |
| IAM users vs roles; Identity Center vs IAM users; role credentials vs access keys | Access topic and q-clf23 set already strong. Add only missing STS issuance distinction; retain preferred exam context for shared questions. |
| IAM vs Cognito | Cognito is only a distractor, not instruction. Verify current scope before original scenarios. |
| S3 vs EBS vs EFS; EBS vs EFS; EFS vs FSx | q-clf36 set, data-platform lab, storage visual and drill exist. Reuse decision model. |
| Storage Gateway vs native storage; S3 classes | Generic gateway and lifecycle present; file vs volume gateway and exact class/retrieval tradeoffs need narrower evidence. |
| RDS vs DynamoDB vs Aurora; Redshift vs RDS/Athena | Database and AI/analytics topics cover families; warehouse-vs-transactional and Oracle-compatibility transfer can improve. |
| SNS vs SQS vs EventBridge | q-clf38-01/02/03 and integration comparisons exist; scheduling distinction is thinner. |
| Direct Connect vs VPN | q-clf35-07/08/09 and data/network visual exist; never equate private with encrypted. |
| CloudFront vs Global Accelerator | CloudFront appears in core recognition; no CLF Global Accelerator instruction found. Current-scope check precedes expansion. |
| Region vs AZ vs edge | q-clf32 set and global-design lab exist; nested failure-domain interaction would improve relationships. |
| Budgets vs Explorer vs Calculator vs CUR | Expanded 4.2 teaching, questions and cost chooser already exist. Reuse before adding variants. |
| On-Demand vs Spot; Savings Plans vs RI; RI vs Capacity Reservation | Expanded 4.1 set, cost drill/lab/visual explicitly distinguish them. Source freshness remains the gate. |
| EC2 vs RDS vs Lambda responsibility | Strong table, q-clf21 set, lab and visual already exist; add scored changed-context validation, not another static overview. |

Additional pairs derived from the bank: SCPs vs IAM grants (Q7), IAM identity vs resource grants (Q25), CloudHSM vs KMS/ACM (Q39, scope pending), Service Quotas vs Advisor (Q45), ALB vs NLB (Q46), agility vs elasticity (Q30), economies of scale vs consumption pricing (Q8/40/44/47), operational analytics vs warehousing (Q20), and file vs volume gateway (Q29).

## UX and readability findings

### Current hierarchy and evidence limit

The AWS track route `/aws-clf` renders [TrackHub](../app/components/TrackHub.tsx): study sequence and tool cards, progress/sync components, CLF topic cards, then shared topics. It links to `/notes/[id]`, `/aws-clf/visuals`, flashcards/quiz, `/test?exam=clf-c02`, labs and practice tools. The AWS-specific hierarchy is topic-oriented; the Network+ track additionally renders dedicated concept/domain/workspace components.

Notes render an objective/section table of contents and all sections in one article through [the notes route](../app/[locale]/notes/[id]/page.tsx) and [SectionBlocks](../app/components/SectionBlocks.tsx). Tables have horizontal overflow containers, focus support and labels; mobile menu disclosure, responsive grids and minimum-height links are positive existing features. Visuals are separately registered and browsable. These are code/content observations, not a desktop/mobile usability test result.

Browser execution was attempted with the existing Next dev command on local port 3005. Startup failed while loading `next.config.ts` because `@swc/core` could not load `swc.linux-x64-gnu.node` and rejected the environment's cache paths (`ERR_SWC_NATIVE_CACHE`). A workspace-cache retry produced the same parent-permissions error. No rendered app screenshot, measured overflow result or full browser learning-flow pass is claimed. No dependency, filesystem permissions, configuration or deployment changes were made to repair this unrelated environment issue.

### Findings ranked by study impact

| Priority | Observed structure / problem | Consequence / bounded follow-up |
| --- | --- | --- |
| P1 | AWS hub uses a flat topic-card collection; no AWS equivalent of NetworkPlusDomains. | Learner cannot scan four official domain weights, objective statuses and resource counts in one concise decision surface. Add domain summaries linked to objective anchors later. |
| P1 | `aws-clf-technology-services` contains 14 sections spanning eight tasks, introductory tables, transfer tables and objective reviews. | Long TOC and repeated service lists give related facts equal visual emphasis; group objective-first with one “choose this because…” comparison and immediate practice link. |
| P1 | Quiz feedback has common explanation/notes/cards, but AWS lacks authored wrong-choice cues and related-question retries. | Review-to-reassessment flow ends at generic resources rather than a different concept-matched problem. Fix the learning loop before cosmetic redesign. |
| P2 | AWS study sequence has no fifth review step; that branch is limited to Core 1/Core 2/Network+. AWS Final Review data nevertheless exists in `lib/practice/finalReview.ts`. | Finish-line review exists but is less visible than its data availability suggests. Link the existing resource before creating another review page. |
| P2 | Generic TopicPage gives all headings/sections similar treatment; objectives repeat concepts from overview and transfer sections. | Use concise Exam focus / Compare / Common trap / Practice headings and fold secondary detail. Avoid simply adding more callouts to the existing long page. |
| P2 | Mobile tables scroll horizontally and the TOC uses many full-height rows. | Code has overflow handling, but comparative headers may leave the visible viewport and the TOC consumes screen height. Confirm at 390px and keyboard zoom after the runtime blocker is repaired. |
| P2 | Current source-policy freshness differs from old intake/audit notes. | `aws-clf-class-intake.md` still recommends registration/initial content that already exists. Keep it historical, add a status pointer in a later documentation cleanup rather than treating its next steps as current work. |
| P2 | Track focus relies in part on state set by navigation; shared questions can have multiple exams. | Future links/retries must carry explicit exam plus objective context and avoid assigning ambiguous evidence. Test direct URLs and returning navigation. |

Assessment: the underlying material is now an **exam review system**, with original questions, comparisons, drills, labs and review traps. The AWS navigation still feels like browsing a library of review pages. Improve findability and the remediation path; no wholesale information-architecture replacement is justified.

### Recommended objective and domain flow

Adopt the proposed objective flow incrementally: **Objective → exam focus → core decision → confusion pair → relationship visual → quick check → requirement scenario → distinct transfer scenario → remediation**. Begin with 3.3 or 3.6 where a narrow new distinction can be tested. Reuse existing topic sections and questions instead of duplicating every stage on every page.

Each future domain card should show name, unchanged official weight, objectives/status, two or three high-value decisions, links/counts for questions/drills/visuals/labs, and observed weakness only when trustworthy evidence exists. Keep absent evidence explicitly “not yet observed”; never infer weakness from `partial` content status. Avoid a second long documentation page per domain.

Use requirement-oriented compact tables/cards rather than service alphabets. Existing core/transfer decision tables already do this well. Use Exam cue / Common trap / Why not the other service sparingly; expand acronyms once, keep exact service names consistent, and remove promotional claims or numeric trivia that does not change a CLF decision. Progressive difficulty should follow recognition → comparison → requirement selection → scenario → changed-context transfer. q-clf24-01–10 are mostly direct recognition, while newer 1.1/1.4 and 3.1–3.6 sets contain requirement scenarios; do not call the whole bank definition-only.

## Ranked interactive visualization opportunities

All eight candidate families already have related CLF visual aids; the opportunity is to add relationship exploration and assessed decisions to the best existing artifacts. Current visual files were inspected as source artifacts; no claim that every visual is a fully interactive exercise.

| Rank | Candidate | Reuse / interaction | Learning evidence and acceptance gate |
| --- | --- | --- | --- |
| 1 | Shared responsibility EC2/RDS/Lambda | Extend `aws-clf-security-transfer.html` with a service switch and responsibility placement, then change service mid-scenario. | Distinguish OS, code, data and IAM ownership; score the changed-service answer, not animation or clicks. |
| 2 | Security-service map | Extend the same visual or a narrowly separated companion: detection vs vulnerability vs aggregation vs auditing/compliance vs filtering. | Compare GuardDuty/Inspector/Hub and Watch/Trail/Config/Artifact with plausible adjacent alternatives. |
| 3 | Storage workload selector | Extend `aws-clf-storage-decisions.html`: object/block/file, persistence, Linux/specific filesystem, on-prem integration, archival tradeoffs. | Branch on workload requirements; add file/volume gateway only after current availability/scope check. |
| 4 | Global infrastructure | Extend `aws-clf-deploy-global-decisions.html` with Region → AZ nesting and a separate edge/PoP delivery layer. | Show AZ failure, regional disaster, latency and residency as different constraints; include Local Zones only if confirmed in current scope. |
| 5 | Database selector | Extend `aws-clf-database-network-decisions.html`: relational/NoSQL/cache/warehouse and managed vs self-managed. | Differentiate RDS/Aurora/DynamoDB/Redshift; explain warehouse vs operational SQL, not just labels. |
| 6 | Conceptual VPC | Reuse network part of the existing database/network visual, emphasizing routes/gateways and SG/NACL layer/state. | CLF depth only; no CIDR arithmetic or production routing lab. Distinguish VPN from dedicated path and encryption. |
| 7 | Cost-tool selector | Extend `aws-clf-domain4-cost-and-support-chooser.html` through estimate → analyze → alert → detailed reporting → allocation/org billing. | Current chooser already strong; add one changed-requirement task rather than rebuild. Reverify live product behavior first. |
| 8 | Six-pillar decisions | Reuse `aws-clf-well-architected-decisions.html` including Sustainability. | Existing practice strong; incremental scenario-to-pillar feedback has more value than another six-icon poster. |

Require keyboard operation, visible focus, text equivalents, appropriate contrast, no color-only correctness, and `prefers-reduced-motion` behavior. Preserve working static explanations. An interaction earns priority only when it teaches a relationship or produces interpretable learning evidence.

## Gamified missions, ranked

1. **Secure the AWS account / security-service triage**: root/MFA, workload roles, least privilege, logging and selecting detection/aggregation/filtering services. Reuse current access/security material. Require a rationale and a different follow-up decision after a miss.
2. **Choose the right storage**: mixed workloads with competing file/block/object and hybrid needs. Unlock a changed workload after correct service discrimination.
3. **Restore availability**: AZ failure, load distribution and capacity changes; later a residency-constrained regional disaster. Reward selecting the correct failure boundary, not reflexively adding Regions.
4. **Control AWS cost**: utilization/rightsizing vs purchasing, then estimate/analyze/alert/report choices. Gate time-sensitive facts on current sources.
5. **Service-selection challenge**: vary adjacent database, networking and integration services; record confidence separately from correctness if later supported.

Reward retrieval, distinct transfer, recovery demonstrated on a different item and spaced consistency. Cap repeat-item credit; do not reward raw clicks, speed, answer exposure or repeating the same trivial question. Missions should expose uncertainty and authored scope limits rather than claim mastery/pass likelihood.

## Learner-system reuse and smallest AWS adapter

Recent work on current main is broader than a Network+-only engine. Do not recreate persistence, telemetry, dashboards or evidence reconciliation for AWS.

| Capability | Current evidence / coupling | Smallest follow-up |
| --- | --- | --- |
| Immediate answer feedback | `QuizRunner.tsx` reveals answer/explanation only after submit and supports exact-set MR scoring through `lib/quiz-feedback.ts`; AWS already participates. | Preserve submission gating and separate Next action; add original per-distractor/service-distinction metadata only for a small AWS set. |
| Generic remediation | `lib/inline-remediation.ts` selects notes/cards/visual/video and expands flashcards for repeated misses. `lib/weak-areas.ts` ranks misses across quiz/mock attempts. | Reuse common selector; target a specific AWS concept/section instead of broad-topic first cards/first visual. |
| Authored misconception clusters | `lib/n10-remediation.ts` supplies N10 clue/memory/wrong-answer keys and same-cluster alternative questions. AWS falls back to topic cluster and no retries. | Add a small CLF metadata adapter with concept ID, objective, cue, distractor reasoning, exact notes anchor and genuinely different retry IDs. |
| Retry navigation | `QuizRunner.tsx` retry URL hard-codes `exam=n10-009`. | Resolve the validated active exam; do not expose AWS retries until routing and choice handling are tested. |
| Telemetry | `lib/study-telemetry.ts` resolves all registered exam codes, and quiz start/answer/complete are generic. Remediation-open in QuizRunner is still gated by `isN10Question`. Server v1 validates event IDs/exam fields. | Reuse schema, consent/session/storage behavior; enable CLF remediation events for validated CLF context, preserving ambiguity rejection. |
| Weakness/performance | `lib/learner-performance.ts` has exam/objective grouping, repeated misses and recovered/currently-recovered tracking. Shared-question quiz attempts may lack an unambiguous exam. | Preserve exam-plus-objective keys; surface ambiguous/unknown separately. Distinguish recovery on a repeated question from transfer to a different question. |
| Objective mappings | `lib/question-objectives.mjs` prefers explicit mapping and avoids crediting every broad-topic objective. All 357 eligible CLF items have one explicit primary CLF mapping. | Reuse existing resolver; do not treat report topic-level counts as per-objective learner evidence. |
| Export/remediation planning | `scripts/export-learner-activity.mjs` and `scripts/lib/learner-activity-data.mjs` validate exam/bank/context, preserve ambiguity and reconcile retained streams. `learner-activity-plan.mjs` ranks evidence and chooses follow-ups; N10 cluster lookup is specific but objective fallback is generic. | Extend concept lookup behind one adapter, not a parallel AWS export pipeline. Require prior correct evidence for spaced review and avoid treating a missing record as failure. |
| Dashboard/sync | Existing progress, performance and learner persistence handle multiple exams; AWS hub already renders ProgressDashboard/LearnerSync. | Add objective/concept resource links and active exam filters; do not create another learner data store. |

Proposed adapter boundary, **planning only**: `remediationMetadata(examCode, questionId)` returns optional concept cluster, notes anchor, cue/memory rule, distractor explanations and candidate transfer IDs. Shared functions keep scoring, repeated-miss ranking, event validation, storage/merge, recovery logic and resource navigation. No engine-wide rewrite, auth work, credential changes or protected-learner branch dependency is required.

Target loop: **submit → explain answer and distractors → identify the missed distinction → targeted resource → different eligible transfer question → reassess**. A generic same-objective item is a candidate review item, not proof of concept transfer. Avoid answer leakage through pre-submission hints or an “original wording” clone of a professor scenario.

### Evidence for deterministic adaptation and future ML

Already usable: attempts and timestamps, exact question/topic/exam/objective mappings, correctness, repeated misses, some selected-choice history, authored choice-order handling, recovery history, retained events, resource opens and export ambiguity/gaps. Current server StudyEvent v1 does not carry all local selected-choice fields, duration, a canonical cross-stream attempt ID, or a content version suitable for historical regrading. Do not claim distractor effectiveness or response-time analytics from fields that are not actually retained in that source.

For future work, define evidence before collecting it: stable content version; canonical presented-choice mapping and MR selections; attempt identity; source stream; validated exam/objective/concept; selection reason; first-seen/repeated status; hints/answer exposure; target transfer relation; response timing if supported and justified; resource followed and subsequent reassessment. Record ambiguous or missing context rather than backfilling an invented result. Do not access a learner's private activity merely to complete this content audit; no personal history was fetched here.

This could later support difficulty analysis, plausible-distractor review, misconception recurrence, spaced repetition, uncertainty-aware selection, Bayesian knowledge tracing and changed-context transfer measurement. Those require enough clean longitudinal evidence and validation. Keep deterministic rules first; neither existing coverage flags nor local accuracy establishes mastery or certification-pass probability.

## Deterministic planning model

Use categorical reasons, not a numerical probability. For each concept attach:

- **Official importance:** its actual task and whole-domain weight, unchanged. No objective weights are invented by dividing the domain percentage equally.
- **Professor emphasis:** repeated at least twice / sampled once / absent, with duplicate and unusable-premise flags. Q44/Q47 count once for independent emphasis; Q27/Q49 provide no reliable premise-based priority.
- **Site weakness:** missing / thin / adequate / strong, plus source-currentness and independent-transfer limitations.
- **Learner evidence:** repeated recent misses / unresolved miss / recovered on same item / transfer-validated / unknown. In this audit it is **unknown**, not zero weakness.

Apply ordered rules: (1) source integrity or known teaching error first; (2) official-scope confirmed missing/thin service discrimination next, raising priority when professor repetition or trustworthy repeated learner misses supports it; (3) re-audit recent partial expansions before producing duplicates; (4) use whole-domain weight to order otherwise comparable gaps; (5) stable objective/concept ID breaks remaining ties. Price/support facts without current sources go to a verification queue rather than an automated content-writing queue. Keep the reason text visible.

| Priority | Concept/work | Deterministic reason |
| --- | --- | --- |
| P1 first | Source-register reconciliation and live scope/freshness check | Duplicate JSON keys silently discard authority references; no reliable source-currentness gate for new sensitive content. |
| P1 next | SCP grants/limits and STS credential issuance, after scope confirmation | D2 30%; related IAM/governance concepts repeated; exact named-service teaching/assessment absent. |
| P1 next | ALB path vs NLB; file vs volume gateway; scheduled vs event-driven invocation | D3 34%; sampled in professor material; generic site family exists but exact distinction is thin. Keep one small concept group per PR. |
| P1 loop | AWS misconception feedback and distinct retry | Current answer feedback exists, but generic topic resources do not close the transfer loop; reuse narrow adapter. |
| P2 review | 1.1/1.4, then 3.1–3.6 independent re-audit | Recent expansion already addresses historic breadth gaps; avoid generating duplicate content from stale counts. |
| P2 freshness | 4.1–4.3 live checks, then only demonstrated gaps | D4 official 12%; professor also 12%; support claims and billing behavior time-sensitive, current banks already substantial. |
| Conditional | Cognito/CloudHSM/Directory Service/Global Accelerator additions | Confirm current service scope; Directory Service signal comes from a broken premise and is not reliable emphasis. |

## Recommended small PR sequence

| PR | One concern / scope | Acceptance evidence |
| --- | --- | --- |
| A — this audit | Documentation only: all 50 positions, source defects, distributions, current inventory, UX and reuse plan. | Existing content/mapping tests, objective report, link/excerpt checks, diff check; explicitly retain live/browser limits. |
| B1 — source integrity | Reconcile duplicate source maps and duplicate IDs; validate keys before JSON parsing. Retrieve current guide/list and sensitive service/support facts through approved access. | Compare full source inventory before/after; duplicate-key regression; dated exact source evidence with no manufactured freshness. Do not mix a general content expansion into this repair. |
| B2 — one highest-value content gap | Start with SCP vs permission grants and STS vs long-lived keys if current scope confirms them; otherwise choose ALB vs NLB recognition. Original scenarios/choices/explanations only. | Small direct mappings, plausible distractors, at least one different-context follow-up; existing AWS tests and checker. No professor wording or image-trigger clone. |
| C — AWS quiz feedback/remediation parity | Small authored metadata adapter, post-submit distractor/service cues, exact resource anchors, valid CLF retries and exam-neutral event gating. | No pre-submit reveal; single/MR correctness; correct CLF retry route; repeated miss vs recovery; unrelated N10 behavior preserved. |
| D — one decision interaction | Shared-responsibility switch/transfer first, then security service map only if warranted. Extend existing visual. | Keyboard/reduced-motion/text access and scored changed-context decision; no duplicate static visual catalogue. |
| E — learner evidence integration | Wire adapter concepts into existing export/performance/remediation; preserve ambiguous exam/objective context and prior-correct spaced-review requirement. | No double counting across streams; explicit unknowns; same-item recovery distinguished from concept transfer; existing learner tests. No ML. |
| F — AWS review UX | Concise four-domain overview, objective-first navigation, immediate practice/remediation links and existing Final Review visibility. | Desktop/mobile/keyboard validation once runtime works; readable comparisons without long service lists; official weights unchanged. |
| G — independent content re-audit | Review recent 1.1/1.4 expansion, then residual 3.1–3.6 and source-sensitive Domain 4. | Evidence-based status decision per objective; no status promotion from counts or professor frequency. |

B1 is the recommended next AWS PR. It creates the reliable source foundation needed to choose B2 safely. C can be prepared against existing authored content independently of live product facts; D/E/F remain bounded follow-ups. No other implementation PR was created by this audit.

## Validation and safeguards

- `npm run check:content`: passed, **0 errors / 207 warnings**. These are existing warnings on unchanged content, including some five-choice convention and unrelated notes-reference findings. This is not a duplicate-JSON-key validator.
- `npm run report:objectives -- --out /workspace/work/aws-audit/objective-coverage.md`: passed. CLF remains **8 covered / 11 partial / 0 missing**. The report's approximate weighted content percentage is not learner readiness and is not used as a pass estimate.
- `node --import ./tests/register.mjs --test tests/aws-review.test.mjs tests/aws-domain4-reaudit.test.mjs tests/aws-domain1-benefits-economics.test.mjs tests/objectives.test.mjs`: **42 passed, 0 failed**.
- Related feedback/remediation/telemetry/performance regression checks: **33 passed, 0 failed** across `quiz-feedback`, `inline-remediation`, `study-telemetry`, `learner-performance` and `question-telemetry-v2` test files.
- Additional AWS question mapping check: all 357 CLF-eligible questions have exactly one valid explicit primary CLF objective; all 19 tasks represented; 21 MR questions. The professor extraction has exactly 50 consecutive first-occurrence positions and matching source keys, with no Q51 included.
- Relative Markdown link targets and referenced question IDs were checked against current files. Official external URLs are reference locations, not claimed successful live fetches.
- `git diff --check`: passed before commit. Staged-file review must contain only this audit document. No application/content JSON, objective status, source date, Vercel configuration, credential, PDF or professor source extract is changed or committed.
- App startup/browser validation: attempted and blocked by the existing SWC native-binding/cache issue described above. No deployment or build/deployment step ran. No merge, push to main, or protected-learner branch operation occurred.

The reviewable deliverable is this audit. A local audit commit is appropriate; a PR may follow once the user elects to publish the branch. This audit does not claim an externally reverified answer set or a complete mobile usability pass.
