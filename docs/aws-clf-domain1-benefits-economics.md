# CLF-C02 Domain 1 benefits and economics expansion

Base: `audit/aws-clf-domain4-reaudit` at `d13ddacb8ebebf35180a64fc4d0581ce0b358181`

## Existing evidence and gaps

Before this expansion, Objective 1.1 had 8 mapped questions and Objective 1.4 had 5. The existing `aws-clf-cloud-concepts` topic had 14 flashcards and sections for benefits, design, migration and economics. Existing material already introduced agility, elasticity, scalability, global reach, rightsizing, consumption models and the warning that cloud is not automatically cheaper. Existing Domain 1 labs, drills and visuals covered related global-infrastructure, migration, cost-estimate and Well-Architected decisions, but independent scenario breadth was thin for the required confusion pairs.

The remaining blockers are independent re-audit, live verification of the current official scope and enough unseen scenario breadth to support promotion. Objectives 1.1 and 1.4 remain partial.

## Teaching added

The existing cloud-concepts topic now has focused `benefits-transfer` and `cloud-economics-transfer` sections. They distinguish elasticity/scalability, agility/elasticity, availability/resilience/fault tolerance, global reach/multi-Region design, economies of scale/guaranteed savings, fixed/variable spending, TCO/monthly bill, rightsizing/autoscaling, utilization/availability, managed-service economics and licensing/tenancy.

## Assessment added

- 1.1: 12 new scenario questions, including one multiple-response item.
- 1.4: 14 new scenario questions, including two multiple-response items.
- New questions use varied retail, manufacturing, development, geographic, licensing, facilities and managed-service scenarios rather than repeating one traffic-spike cue.
- Multi-response items use five choices and require exact conceptual distinctions.

## Cards, practice and visual support

- Added 9 focused 1.1 flashcards and 9 focused 1.4 flashcards.
- Added `aws-clf-benefits-economics`, a cue-to-concept and concept-to-cue drill.
- Added the paper-only `aws-clf-cloud-economics-selection` lab; it requires no AWS account or numeric pricing lookup.
- Added `public/visuals/aws-clf-benefits-economics.html` and its track entry as a compact decision aid.
- Added Domain 1 benefit/economics cues to AWS Top Five and Final Review traps.

## Scope and source guardrails

This remains Cloud Practitioner recognition-level content. It does not add Well-Architected implementation, detailed EC2 purchasing optimization, billing-tool workflows, Savings Plans calculations, accounting/tax advice or deep licensing rules. Domain 4 purchasing-model content is not duplicated.

The official CLF-C02 Domain 1 URL remains the source reference in the authored material. Live AWS retrieval was not performed successfully in this environment, so no fresh verification is claimed and no `reviewEvidence.checked` date was added or refreshed. Existing objective statuses and evidence dates remain otherwise unchanged.

## Remaining blockers

1.1 remains partial pending live scope verification and an evidence-only re-audit of independent benefit scenarios. 1.4 remains partial pending live scope/economics verification and an evidence-only re-audit of TCO, utilization and cost-tradeoff breadth. Cloud benefits remain enabling conditions, not guarantees of cost, availability, compliance or latency.
