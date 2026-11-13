# AWS CLF-C02 Domain 4 readiness slice

This change targets Domain 4 — Billing, Pricing, and Support (objectives 4.1–4.3). PR #221 is merged into `main`; this branch starts from that merge.

## Content improvements

- Added a Free Tier decision cue to the existing pricing-factors lesson. Learners are told to verify current eligibility, limits, account/time conditions and usage rather than treating Free Tier as unlimited.
- Added one original scenario each for Free Tier safety (4.1), Cost and Usage Report selection (4.2), and AWS Skill Builder learning-resource selection (4.3).
- Added semantic answer-key and answer-position regression checks to the Domain 4 re-audit test.

Existing Domain 4 lessons already cover On-Demand, Reserved Instances, Savings Plans, Spot, Dedicated Hosts, capacity reservations, storage/data-transfer pricing, Cost Explorer, Budgets, Pricing Calculator, Organizations, tags, CUR, current support-plan terminology, Trusted Advisor, AWS Health, documentation, Knowledge Center, re:Post, Partners and related AWS resources. Existing IDs and quiz behavior are preserved.

## Sources and limitations

Question sources point to AWS Free Tier/pricing, the CUR guide and AWS Skill Builder. The repository's current objective mapping and support-plan references were reviewed locally. Live AWS documentation retrieval was unavailable in this environment, so the applicable exam-guide revision could not be independently fetched; the implementation does not claim a revision date. Support-plan names and transition dates should receive a final human check against the current AWS Support Plans page before merge.

Billing objective statuses remain `partial`; adding questions does not by itself establish complete exam coverage. No UI, persistence, Network+, SAA-C03 or weakness-assessment work is included.
