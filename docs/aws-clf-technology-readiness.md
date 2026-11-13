# AWS CLF-C02 technology-and-services readiness slice

This change targets the CLF-C02 Cloud Technology and Services domain (objectives 3.1–3.6). The repository already had objective-level lessons, topic notes, visuals and labs; this slice makes the service-selection distinctions more explicit and adds original, objective-tagged practice without changing the quiz engine.

## Changes

- Added 12 questions (`q-clf31-15` through `q-clf36-16`), two per objective, with CLF-C02 tags and AWS documentation sources.
- Corrected the duplicate generic prompt in `q-clf35-13` while preserving its ID and answer key.
- Added a selection guard to the existing 3.4–3.6 decision table so learners evaluate workload model, access, availability, recovery, residency and cost together.
- Added regression coverage for objective mapping, CLF-only domain isolation, duplicate prompts, answer indices, feedback explanations, source links and single/multiple-response grading.

Existing topic-note links, diagrams and AWS labs remain the resource path for review. No unrelated visual or lab is attached to a question, and no new UI or learner-persistence behavior is introduced.

## Scope and follow-up

The official CLF-C02 domain weights and objective numbering are taken from the current AWS exam-guide mapping already present in `content/objectives.json`. Billing (4.1–4.3), Cloud Concepts (1.1–1.4), SAA-C03 content and application behavior are intentionally unchanged and should be handled in separate slices. Live retrieval of the AWS guide was unavailable in this audit environment; URLs in the question bank point to AWS documentation and the repository's existing objective mapping remains the source of truth for automated validation.
