# CLF-C02 Domain 4 evidence re-audit

Audit date: 2026-11-07
Base: `content/aws-clf-domain4-current-refresh` at `c6d30126dd4a8987e6576a514b50e3b933ac2da6`
Scope: CLF-C02 objectives 4.1–4.3, including teaching, assessment, practice transfer, independence, mapping, and source freshness.

## Executive result

Domain 4 remains **0 covered / 0 missing / 3 partial objectives**. No objective was promoted or downgraded. The refresh materially improves the teaching and scenario coverage, but the promotion standard is not met because current official AWS material could not be live-verified and the artifact pools contain repeated variants of several core cues.

The full CLF-C02 distribution remains **8 covered / 11 partial / 0 missing**. This domain is suitable for supplementary review and useful as a structured review aid with limitations. It is not presented as a primary or standalone readiness measure and does not guarantee certification success.

Live retrieval status: **failed**. The environment could not connect to its configured proxy (`curl: (7) Failed to connect to proxy port 8080`; all requested AWS URLs returned HTTP `000`). No freshness claim is made from that failure.

## Current-scope and source verification

The objective records continue to reference the official CLF-C02 Domain 4 scope page and objective-specific topic sections. Those local references were inspected, but they are not equivalent to successful current-source retrieval.

| Source group | Result |
| --- | --- |
| CLF-C02 Domain 4 scope | Not live-retrieved; proxy connection failed |
| EC2 pricing, Savings Plans, Reserved Instances, Capacity Reservations, Spot, Dedicated Hosts/Instances | Not live-retrieved |
| Pricing Calculator, Cost Explorer, Budgets, CUR/Data Exports, Organizations | Not live-retrieved |
| Support plans, transition notice, Health, Trusted Advisor, Support Center, re:Post, Professional Services, Marketplace | Not live-retrieved |
| Repository-local topic, question, card, drill, visual, and lab artifacts | Inspected locally; not treated as fresh official verification |

The `reviewEvidence.checked` field remains absent for 4.1, 4.2, and 4.3. No date was restored.

## Objective matrix

| Objective | Current | Recommended | Confidence | Strongest evidence | Remaining blocker |
| --- | --- | --- | --- | --- | --- |
| 4.1 | partial | partial | Medium | `aws-clf-billing-support#objective-clf-c02-4-1`; 18 `q-clf41-*` questions; 50-topic-card set; cost-comparison drill; chooser visual | No live scope/pricing verification; repeated pricing/capacity variants reduce effective independence |
| 4.2 | partial | partial | Medium | `aws-clf-billing-support#objective-clf-c02-4-2`; 17 `q-clf42-*` questions; tool-selection cards/drill; paper lab | No live billing-tool verification; several questions repeat the same estimate/analyze/alert/report mapping |
| 4.3 | partial | partial | Low–Medium | `aws-clf-billing-support#objective-clf-c02-4-3`; 20 `q-clf43-*` questions; support-resource drill; support chooser visual | Support plans and transition dates are time-sensitive and unverifiable here; resource pairs include repeated case/Marketplace cues |

The broader mapped pools contain 24, 26, and 22 questions for 4.1, 4.2, and 4.3 respectively when older `q-aws-*`, `q-clf-*`, and review questions are included. The focused refresh counts are 18, 17, and 20. Neither count is treated as proof of completeness.

## Subskill and confusion-pair matrix

| Objective | Subskill / confusion pair | Teaching | Independent assessment | Practice | Source freshness | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | On-Demand vs commitment discounts | `pricing`, `objective-clf-c02-4-1`; `fc-clf41-ondemand-cue`, `fc-clf41-savings-cue` | `q-clf41-01`, `03`, `18` | `aws-clf-cost-compare` | Not live-verified | Correct distinction, but repeated basic cues |
| 4.1 | Savings Plans vs Reserved Instances | Objective section; `fc-clf41-ri-capacity` | `q-clf41-09`, `11`, `16` | Cost comparison and savings/capacity drill items | Not live-verified | Comparison is present; Cloud Practitioner simplification is explicit |
| 4.1 | Savings Plans vs Capacity Reservations | Explicitly states Savings Plans provide pricing benefits through commitment and Capacity Reservations reserve EC2 capacity | `q-clf41-04`, `10`, `12`, `15` | `savings-capacity`; paper lab | Not live-verified | Correct and regression-protected; no wording implies Savings Plans reserve capacity |
| 4.1 | Reserved Instances vs capacity | `objective-clf-c02-4-1`; `fc-clf41-ri-capacity` | `q-aws-review-clf-c02-4-1`, `q-clf41-04`, `16` | Cost comparison | Not live-verified | Correct; regional RI discount is not presented as an AZ guarantee |
| 4.1 | Spot vs On-Demand / guaranteed availability | Spot is spare capacity and interruptible | `q-clf41-02`, `13`; multi-response `q-clf41-15` rejects guaranteed Spot | `spot-guarantee`; paper lab | Not live-verified | Correct, with an interruption-tolerance cue; repeated variants remain |
| 4.1 | Dedicated Host vs Dedicated Instance | Host-level visibility/licensing vs dedicated tenancy without the same allocation control | `q-clf41-05`, `06`, `14` | `host-instance` | Not live-verified | Correct at CLF level; q05 and q14 are near-duplicate licensing scenarios |
| 4.1 | Storage, request/retrieval, and transfer factors | `pricing-factors` and objective section | `q-clf41-07`, `08`, `17` | Archive and transfer drill items | Not live-verified | Useful breadth, but not enough to establish complete official scope |
| 4.2 | Estimate vs analyze | `cost-tools`, objective section | `q-clf42-01`, `02`, `08`, `12`, `17` | Cost-comparison drill; paper lab | Not live-verified | Strong scenario transfer, with some repeated mapping |
| 4.2 | Cost Explorer vs Budgets | Explicit analysis vs threshold alert distinction | `q-clf42-02`, `03`, `07`, `13`, `17` | Cost-comparison drill | Not live-verified | Correct |
| 4.2 | Budgets vs hard cap | Budgets monitors/alerts; data and notifications may be delayed; not an instantaneous cap | `q-clf42-03`, `07`, `13` | `fc-clf42-budgets`; paper lab | Not live-verified | Correct and conservative |
| 4.2 | Detailed reporting vs alerting | CUR is a detailed reporting dataset, not a real-time cap | `q-clf42-04`, `12`, `16` | CUR drill item; paper lab | Not live-verified | Correct |
| 4.2 | Invoice vs Cost Explorer | Amount owed vs spend/trend analysis | `q-clf42-10` | Invoice drill item | Not live-verified | Correct |
| 4.2 | Cost allocation tags vs consolidated billing | Activated eligible tags attribute spend; Organizations provides account structure/consolidated billing; tags do not rewrite history | `q-clf42-05`, `09`, `11`, `15`, `16` | Tags/Organizations drill; paper lab | Not live-verified | Correct and appropriately qualified |
| 4.3 | Current support-tier cues | Basic, Business Support+, Enterprise Support, Unified Operations | `q-clf43-08`, `11`–`14` | Support-resources drill; chooser visual; paper lab | Not live-verified | Content is current-claim dependent; retain partial |
| 4.3 | Legacy/transitional plans | Developer Support, Business Support, and Enterprise On-Ramp are labeled transitional; dates are explicitly presented as claims needing verification | `q-clf43-20`; transition card | Support-resources drill | Not live-verified | Conservative wording, but no promotion without source verification |
| 4.3 | Support Center vs re:Post | Private eligible case path vs community knowledge | `q-clf43-04`, `15`, `16` | Case/community drill items | Not live-verified | Correct; q04 and q15 are near-duplicate case scenarios |
| 4.3 | Health vs Trusted Advisor | Health events vs recommendations/checks | `q-clf43-05`, `07`, `17` | Health/recommendation drill items | Not live-verified | Correct |
| 4.3 | Documentation, Knowledge Center, re:Post, Prescriptive Guidance | Reference, troubleshooting, community, and implementation-pattern roles | `q-clf43-01`–`03`, `16` | Support-resources drill; chooser visual | Not live-verified | Useful role distinctions |
| 4.3 | Marketplace vs Professional Services vs Partners | Third-party procurement vs AWS-delivered project expertise vs external qualified organizations | `q-clf43-09`, `10`, `18`, `19` | Third-party/experts drill items | Not live-verified | Correct; q09/q19 repeat the Marketplace cue |
| 4.3 | Abuse reporting | Trust and Safety is distinct from billing, support, and recommendation resources | `q-clf43-06` | Abuse drill item | Not live-verified | Correct |

## Question quality and independence

Reviewer classification of the focused refresh pools is approximate and not psychometric evidence:

| Objective | Approximate classification | Assessment |
| --- | --- | --- |
| 4.1 | 2 recognition / 7 comparison / 9 scenario-transfer, including 1 multiple-response item | Balanced to transfer-heavy |
| 4.2 | 2 recognition / 5 comparison / 10 scenario-transfer, including 1 multiple-response item | Transfer-heavy, but centered on one tool-role model |
| 4.3 | 3 recognition / 6 comparison / 11 scenario-transfer, including 1 multiple-response item | Transfer-heavy, but current-plan facts are freshness-sensitive |

Positive findings:

- The refresh is not only product-name recognition. Most prompts include workload, finance, operational-signal, or support-need cues.
- Savings Plans vs Capacity Reservations, Spot interruption, Dedicated Host vs Dedicated Instance, the four cost-tool roles, and support-resource distinctions are explicitly assessed.
- Objective mappings are single-objective and remain correct.

Independence limitations:

- `q-clf41-05` and `q-clf41-14` both use physical licensing/host visibility to elicit Dedicated Host.
- `q-clf41-02` and `q-clf41-13` both use restartable/interruption-tolerant batch work to elicit Spot.
- `q-clf42-03`, `q-clf42-07`, and `q-clf42-13` repeat the threshold/alert/not-hard-cap distinction.
- `q-clf42-05`, `q-clf42-09`, and `q-clf42-15` repeat tag activation and historical-attribution limits.
- `q-clf43-04` and `q-clf43-15` repeat the Support Center case-entry cue.
- `q-clf43-09` and `q-clf43-19` repeat Marketplace procurement.
- The older mapped questions add breadth, but some reuse the same short cues and are not independent proof of every subskill.

The result is a useful transfer-oriented study set, not a defensible claim of full objective mastery. Keep all three objectives partial.

## Multiple-response review

| Question | Correct options | Review result |
| --- | --- | --- |
| `q-clf41-15` | Savings Plans provide pricing savings through eligible usage commitment; Capacity Reservation addresses launch capacity in a selected AZ | Both are correct. Spot is not guaranteed, Dedicated Instance does not provide host-level licensing control, and an RI does not automatically guarantee capacity in every AZ. |
| `q-clf42-14` | Pricing Calculator estimates a planned design; Cost Explorer investigates current/historical spend | Both are correct. Marketplace is not a threshold-alert tool, Health is not detailed billing reporting, and Budgets does not combine account bills. |
| `q-clf43-17` | AWS Health reports account/service health events; Trusted Advisor provides recommendations/checks | Both are correct. Marketplace is not case management, Support Center is not a software catalog, and Professional Services is not community Q&A. |

No hidden qualification makes a listed correct option ambiguous in this review. The multiple-response items remain mapped to the correct objective.

## Flashcards, drills, visual, and lab

### Flashcards

The `aws-clf-billing-support` topic has 50 cards. They cover the major confusion pairs, current support-tier labels, transition qualification, billing-tool roles, pricing/capacity separation, storage/transfer factors, and support resources. They are useful scaffolding but repeat several question cues and are not independent assessment. No stale terminology was found in the focused set beyond the deliberately qualified legacy-plan names.

### Drills

`aws-clf-cost-compare` contains matching modes for workload-to-pricing-model and cost-need-to-tool, including discount vs capacity, Spot vs guarantee, Host vs Instance, invoice vs Explorer, and tags vs Organizations. `aws-clf-support-resources` contains support/resource matching for documentation, Knowledge Center, Prescriptive Guidance, Support Center, Trusted Advisor, Health, abuse, Marketplace/Partners, experts, and current support tiers.

Both drills provide useful transfer beyond a single flashcard, but they are still authored matching exercises with visible choice tables. They reinforce the same decision model rather than serving as independent evidence sufficient for promotion.

### Visual

`public/visuals/aws-clf-domain4-cost-and-support-chooser.html` correctly shows:

- discount/commitment vs capacity reservation;
- On-Demand, Spot, Savings Plans/RI pricing, Capacity Reservation, Dedicated Host, and Dedicated Instance;
- estimate → analyze → alert → detailed reporting → allocation → Organizations;
- documentation, troubleshooting, patterns, case, recommendation, health, and abuse roles;
- Basic, Business Support+, Enterprise Support, and Unified Operations;
- transitional legacy-plan labeling.

The visual is a recognition aid and its embedded source URLs are not live verification. It does not independently demonstrate readiness.

### Lab

`aws-clf-cost-estimate` is a paper-first lab. It requires choices around Pricing Calculator, budget threshold, tags, Cost Explorer, CUR, Organizations, invoice vs Explorer, pricing discount vs capacity guarantee, Spot vs Capacity Reservation, storage/transfer factors, and the four support-tier cues. It asks for explanations and independent tradeoffs, so it is more than copying a table. However, it is guided, ungraded, and does not create an independently scored record; it is supporting practice, not promotion evidence.

## Status decisions

No objective was promoted:

- **4.1 remains partial.** Teaching and transfer are strong, but live pricing/scope verification is unavailable and several pricing/capacity scenarios are near variants.
- **4.2 remains partial.** The estimate/analyze/alert/report/invoice/tag/Organizations model is accurate and well assessed, but the pool repeats the same tool-role distinctions and current billing-tool behavior was not live-verified.
- **4.3 remains partial.** The resource distinctions are useful and the support tiers are explicitly qualified, but support plan names, entitlements, and transition dates are time-sensitive and cannot be promoted from stale/local evidence.

`content/objectives.json` status values and the existing `expectedClfStatuses` map remain unchanged. No `reviewEvidence.checked` values were added.

## Readiness impact and remaining gaps

Domain 4 changes the interpretation from “recently expanded” to “substantially evidenced but still conservative.” The full CLF-C02 result remains **8 covered / 11 partial / 0 missing**.

Readiness interpretation: **Ready with limitations.** The repository is suitable as supplementary review and as a structured practice aid. It is not yet suitable as a primary or standalone review claim because current-source verification, complete official-scope confirmation, and independent assessment breadth are not established for these time-sensitive objectives.

Next-gap ranking after this audit:

1. Domain 1 objectives 1.1 and 1.4.
2. Domain 3 objectives 3.1–3.6, which remain partial despite stronger evidence.
3. Domain 4 objectives 4.1–4.3, pending live source verification and additional independent variants.

P0 gaps: none identified.
P1 gaps: no fresh official scope/support/pricing verification; current support-plan/transition claims must be rechecked before relying on them.
P2 gaps: repeated cue variants reduce effective question independence; drills and the lab are guided rather than scored independent assessment.

## Regression evidence and scope

Existing focused tests verify the Domain 4 counts, objective mappings, multiple-response presence, capacity-vs-discount wording, Spot interruption wording, current support-tier terminology, transitional-plan qualification, and the intentionally absent `reviewEvidence.checked` values. The existing status map continues to assert all 19 CLF-C02 objective statuses.

No question banks, flashcard batches, drills, visuals, labs, objective mappings, or application behavior were changed by this audit. No proprietary questions were copied. No raw AWS pages were committed. No merge or deployment is part of this work.
