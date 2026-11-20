# AWS SAA-C03 study plan summary

**Exam:** AWS Certified Solutions Architect – Associate (SAA-C03)  
**Pass score:** 720 / 1000  
**Format:** ~65 questions, 130 minutes  
**Domain weights:** 1 Secure **30%** · 2 Resilient **26%** · 3 High-performing **24%** · 4 Cost-optimized **20%**  
**Site hub:** `/aws-saa` · **Timed test:** `/test?exam=saa-c03` · **Chapter path:** `/aws-saa#chapter-path` · **Domain curriculum:** `/aws-saa#curriculum`

Bank snapshot (this prep track): **~308** SAA-tagged items, including chapter (`q-saa-chapter-*`), guide-topic (`q-saa-guide-*`), practice (`q-saa-practice-*`), bank/cost/gap batches, and earlier core/arch sets. All objective statuses remain **partial** — volume ≠ readiness.

Official guide is authority. Piper/Clinton *Study Guide* 4e chapter order is a **learning spine only** (no book Q&A copied).

---

## How to use the site

1. **Chapter path first** (book order) — notes → drills → lab → 2 chapter questions per chapter.
2. **Domain curriculum second** (exam weights) — close gaps on Domain 1 (security) and Domain 4 (cost).
3. **Timed tests** — lengths: 10 / 20 / 40 / half / full / quick; domain-weighted draw + history rotation.
4. **After every miss** — read option-level “— Correct./Incorrect.” lines; open linked docs.aws sources; redo the related drill/lab.
5. **Final stretch** — mixed full-length mocks until scores are stable above ~75% *and* weak objectives are retested, not only high-volume Domain 3 topics.

---

## Phase plan (suggested ~4–6 weeks)

### Phase A — Foundations (days 1–4)

| Ch | Title | Focus | Objectives | Practice IDs | Lab / drills |
| --- | --- | --- | --- | --- | --- |
| 1 | Intro to Cloud + AWS | Global infra, shared responsibility, account foundations | 1.1, 4.2 | `q-saa-chapter-01`, `02` | drill `aws-saa-service-compare` |
| 2 | EC2 + EBS | Families, placement, block storage, launch templates, ASG basics | 3.2, 2.2, 4.2 | `03`, `04` | lab `aws-saa-alb-autoscaling`; drills performance/cost cues |
| 3 | VPC | Subnets, routing, NAT, SG/NACL, endpoints, hybrid | 1.2, 3.4, 4.4 | `05`, `06` | lab `aws-saa-vpc-public-private` |

**Exit check:** root/MFA/IAM Identity Center baseline; multi-AZ + ELB; private subnet + NAT; S3 gateway endpoint vs NAT cost.

### Phase B — Data + identity (days 5–8)

| Ch | Title | Focus | Objectives | Practice IDs | Lab / drills |
| --- | --- | --- | --- | --- | --- |
| 4 | Databases | RDS/Aurora, DynamoDB, cache, HA/read scale | 3.3, 2.2, 4.3 | `07`, `08` | lab `aws-saa-rds-ha-read-scaling` |
| 5 | AuthN/AuthZ | IAM, Identity Center, federation, roles, secrets | 1.1, 1.3 | `09`, `10` | lab `aws-saa-iam-cross-account` |
| 6 | S3 + storage patterns | Classes, lifecycle, replication, encryption, hybrid gateways | 1.3, 3.1, 4.1 | `11`, `12` | lab `aws-saa-s3-lifecycle-replication` |

**Exit check:** Aurora readers vs Multi-AZ; instance profiles (no static keys); Secrets Manager/SSM; S3 lifecycle + SSE-KMS.

### Phase C — Edge, integration, architecture domains (days 9–14)

| Ch | Title | Focus | Objectives | Notes |
| --- | --- | --- | --- | --- |
| 7 | Route 53 | Routing policies, health checks, failover | 2.2, 3.4 | lab `aws-saa-route53-policies`; qs `13`–`14` |
| 8 | Content delivery / edge | CloudFront, edge caching, origin patterns | (map) | qs `15`–`16` |
| 9 | Integration / serverless | Queues, events, orchestration trade-offs | 2.1+ | lab `aws-saa-sqs-decoupling`; qs `17`–`18` |
| 10 | Resilient architectures | Failure domains, DR, decoupling | 2.1, 2.2 | lab `aws-saa-dr-patterns`; qs `19`–`20` |
| 11 | High-performing architectures | Storage/compute/DB/network performance | 3.1–3.5 | qs `21`–`22` |
| 12 | Secure architectures | Defense in depth, workload + data controls | 1.1–1.3 | qs `23`–`24` |
| 13 | Cost-optimized architectures | Storage/compute/DB/network cost trade-offs | 4.1–4.4 | qs `25`–`26` |

**Exit check:** DNS failover; queue/backlog scaling; RTO/RPO language; Spot ≠ guaranteed capacity; NAT vs endpoints; Savings Plans vs reservations vs on-demand.

### Phase D — Weighted practice + mocks (days 15–exam)

| Day block | Activity | Length | Goal |
| --- | --- | --- | --- |
| D1–D2 | Domain 1 secure focus (30%) | 20–40 Q | Policy eval, federation, encryption, endpoints |
| D3 | Domain 2 resilient focus (26%) | 20–40 Q | Multi-AZ, ASG/ELB health, DR, loose coupling |
| D4 | Domain 3 high-performing (24%) | 20–40 Q | Bottlenecks, caching, storage/IOPS, network path |
| D5 | Domain 4 cost (20%) — **do not skip** | 20–40 Q | Lifecycle, capacity modes, data transfer, rightsizing |
| D6–D8 | Full mocks | 65 Q / 130 min | ≥2 full runs; review every miss with explanations |
| Final 48h | Light review | 10–20 Q weak objs only | Sleep, logistics, no cram new services |

Use `/test?exam=saa-c03` with selectable lengths. Prefer **unseen-first / rotation** over replaying the same easy Domain 3 items.

---

## Weekly rhythm (repeat each phase week)

| Session | Duration | Work |
| --- | --- | --- |
| Learn | 45–60 min | One chapter: notes + official docs links on the hub |
| Design | 30–45 min | Matching lab (paper-first design; optional console is opt-in) |
| Drill | 15–20 min | Domain cue drill(s) linked on the chapter card |
| Quiz | 20–30 min | Chapter pair + 10–20 mixed timed questions |
| Review | 15 min | Log misses by **objective ID**; re-queue those IDs next day |

---

## Priority gaps (study harder here)

From bank audits and evidence map (statuses still `partial`):

1. **Domain 4 cost** — storage lifecycle/retrieval, compute purchase models, DynamoDB capacity/table class, NAT vs gateway endpoints, transfer costs.
2. **Domain 1 security** — root/MFA, Identity Center vs IAM users, cross-account roles, KMS key policies, TLS/cert lifecycle depth.
3. **Domain 2 resilience** — queue semantics, idempotency, multi-AZ failover cues, DR pattern selection (backup vs pilot light vs warm/hot).
4. **Domain 3 depth** — not just service names: ingestion/transform (Kinesis/Glue/Firehose), DB engine fit, network latency/private connectivity.

Avoid treating Domain 3’s higher raw question count as “done.”

---

## Practice asset map

| Asset | Location / IDs |
| --- | --- |
| Chapter practice (26) | `q-saa-chapter-01` … `26` · answer key `docs/saa-chapter-practice-answer-key.md` |
| Guide-topic augment | `q-saa-guide-*` · `content/saa-practice-set.json` → `guideAugmentIds` |
| Broader practice set | `q-saa-practice-*` + labeled set `saa-c03-practice-round` |
| Cost / bank gap batches | `q-saa-costbatch-*`, `q-saa-bank-*`, `q-saa-gap-*` |
| Chapter → objective map | `content/saa-chapter-map.json` |
| Evidence / bullet map | `docs/saa-c03-evidence-map.json` (maintainer) |
| Docs archive | `docs/archive/saa-c03-prep-2026-11-20/` |

Controlled chapter sample (production verified): first five chapter IDs scored **5/5** on the quiz runner.

---

## Exam-day checklist

- [ ] Domain weights internalized (security heaviest).
- [ ] Can eliminate distractors that violate least privilege, single-AZ SPOF, or “public by default.”
- [ ] Can compare **cost vs availability vs performance** under stated constraints (not generic “best practice”).
- [ ] Know Spot interruption, Multi-AZ vs read replica, NAT vs VPC endpoint, gateway vs interface endpoint.
- [ ] At least two timed full-length runs reviewed end-to-end.
- [ ] Weak objective list empty or scheduled for final light review only.

---

## Out of scope for this plan

- Copying textbook or third-party Q&A into the bank.
- Claiming full objective coverage (all 14 remain partial).
- Resolving AWS in-scope/out-of-scope service-list discrepancies without an uncached official source.

When adding content later, prefer scenario trade-offs on thin objectives over more Domain 3 recall items.
