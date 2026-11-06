# CLF-C02 Domain 4 current refresh

Refresh date: 2026-11-06  
Base: `audit/aws-clf-domain3-reaudit` at `b791c6ff752433ed2122983dfa88d45ae3495686`  
Scope: objectives 4.1–4.3 only.

## Source freshness

The repository retains official AWS source metadata for the CLF-C02 Domain 4 scope, AWS Support plan comparison/FAQ, EC2 purchasing options, Savings Plans, Capacity Reservations, Reserved Instances, Pricing Calculator, Cost Explorer, Budgets, Cost and Usage reporting, Organizations, Health, Trusted Advisor, Support Center, re:Post, Professional Services, Partners, Marketplace, and Trust and Safety.

The managed environment could not live-retrieve AWS pages: the configured proxy was unavailable and returned HTTP `000` for the Domain 4 scope page, Support plans, Cost Explorer, CUR, and related official URLs. Therefore the existing `reviewEvidence.checked` dates for 4.1–4.3 were removed rather than reasserting a live verification date. The current terminology supplied for this refresh is implemented with explicit “verify current AWS plan details” language; a later evidence-only re-audit should restore dates only after successful official-source retrieval.

## Current support-plan correction

The learner-facing material now uses these current recognition cues:

- Basic Support: account, billing, documentation, community, and general resources; not normal enhanced technical-support case coverage.
- Business Support+: production workloads needing 24/7 technical support and AWS expert engagement.
- Enterprise Support: business-critical workloads needing proactive strategic guidance and Technical Account Manager support.
- Unified Operations: mission-critical workloads needing the highest proactive operations/resilience assistance and application-specific expertise.

Developer Support and Business Support stopped accepting new subscriptions on December 2, 2025 and are scheduled for discontinuation on January 1, 2027. Enterprise On-Ramp is also treated as transitional. Those names appear only in qualified transition context and are not used as the current standard paid-plan lineup.

## Objective 4.1 — pricing models

Existing evidence included ten mapped questions (`q-clf41-01`–`q-clf41-10`), ten targeted cards, the `aws-clf-cost-compare` drill, Domain 4 final-review traps, a paper cost lab, and the Domain 4 chooser visual. Existing content correctly covered On-Demand, Spot, Savings Plans, capacity reservations, Dedicated Hosts/Instances, storage factors, transfer, and RI scope.

This refresh adds eight scenario/comparison questions (`q-clf41-11`–`q-clf41-18`), including multi-response `q-clf41-15`, and cards for Savings Plans versus Capacity Reservations and Spot versus guaranteed capacity. The questions explicitly separate:

- flexibility vs commitment;
- Savings Plans vs Reserved Instances;
- pricing discount vs AZ capacity assurance;
- Spot vs guaranteed availability;
- Dedicated Host vs Dedicated Instance;
- storage/retrieval/request/transfer factors.

No model-number memorization or deep RI marketplace details were added. Objective 4.1 remains partial because current-source verification and independent unseen assessment remain blockers.

## Objective 4.2 — billing and cost management

Existing evidence included nine mapped questions (`q-clf42-01`–`q-clf42-09`), eight targeted cards, the cost-compare drill, and the `aws-clf-cost-estimate` paper lab. It already distinguished Pricing Calculator, Cost Explorer, Budgets, CUR, tags, Organizations, and reporting delay.

This refresh adds eight scenario/comparison questions (`q-clf42-10`–`q-clf42-17`), including multi-response `q-clf42-14`, and cards for invoice vs Cost Explorer and tags vs Organizations. The teaching now explicitly separates:

- estimate → Pricing Calculator;
- analyze current/historical spend → Cost Explorer;
- threshold/alert → AWS Budgets;
- detailed reporting dataset → Cost and Usage Report/current equivalent;
- amount owed → bills/invoices;
- attribution → activated cost allocation tags;
- account consolidation → Organizations/consolidated billing.

Budgets is not taught as an instantaneous hard spending cap, and tags are not taught as a mechanism that rewrites historical billing. Objective 4.2 remains partial pending current-source verification and independent unseen assessment.

## Objective 4.3 — technical resources and support

Existing evidence included ten mapped questions (`q-clf43-01`–`q-clf43-10`), eleven targeted cards, the support-resources drill, final-review traps, and the Domain 4 chooser visual. Existing content already covered documentation, Knowledge Center, Prescriptive Guidance, Support Center, Trusted Advisor, Health, abuse reporting, Marketplace, and Professional Services.

This refresh adds ten scenario/comparison questions (`q-clf43-11`–`q-clf43-20`), including multi-response `q-clf43-17`, and cards for the four current support-tier cues, re:Post, invoice/support distinctions, and the transition wording. It strengthens:

- support plan vs Support Center;
- Support Center vs re:Post/community resources;
- AWS Health vs Trusted Advisor;
- Professional Services vs Partners;
- Marketplace vs support;
- current support tiers vs transitional legacy names.

Objective 4.3 remains partial because support entitlements are time-sensitive and live source retrieval was unavailable.

## Practice changes

- `aws-clf-cost-compare` now includes discount/capacity, Spot/guarantee, Dedicated Host/Instance, invoice/analysis, and tags/Organizations distinctions.
- `aws-clf-support-resources` now includes Basic, Business Support+, Enterprise, Unified Operations, and re:Post/community cues.
- The existing `aws-clf-cost-estimate` paper lab now covers invoice vs analysis, delayed controls, and current support-tier selection without requiring an AWS account.
- The existing Domain 4 visual now presents discount vs capacity, estimate → analyze → alert → report, and Basic → Business Support+ → Enterprise → Unified Operations. Legacy plans are labeled transitional.
- Domain 4 Top Five and final-review traps were refreshed with the same cues.

## Regression protections

Focused AWS review tests verify:

- all required 4.1–4.3 service/model cues;
- Savings Plans vs Capacity Reservations and Spot interruption tolerance;
- Dedicated Host vs Dedicated Instance;
- Calculator, Explorer, Budgets, CUR, invoices, tags, Organizations, and consolidated billing distinctions;
- Basic, Business Support+, Enterprise Support, Unified Operations, Health, Trusted Advisor, Support Center, Marketplace, Professional Services, Partners, re:Post, and documentation resources;
- no claim that Developer Support, Business Support, and Enterprise On-Ramp are the current standard paid lineup;
- 4.1–4.3 remain partial and all other CLF statuses remain unchanged.

No proprietary questions or raw AWS pages were copied into the repository. No other objectives were changed. This branch does not merge or deploy anything.
