# SAA textbook chapter path

Learner entry: `/aws-saa#chapter-path`

## Purpose
Map the Piper/Clinton *AWS Certified Solutions Architect Study Guide (SAA-C03), 4th Edition* chapter order onto repository resources that already exist:

- exam objectives from `content/objectives.json`
- notes topics
- domain drills under Practice Games
- design labs

The guide PDF is **not** stored or copied. Chapter titles are a study spine only.

## Source of truth
- Metadata: `content/saa-chapter-map.json`
- Resolver: `lib/saa-chapter-map.ts` (never invents missing links)
- UI: `app/components/SaaChapterPath.tsx` on the AWS SAA track hub

## Relationship to domain curriculum
`/aws-saa#curriculum` remains the domain-first exam map (weights 30/26/24/20).
The chapter path is the book-order learning path. Each chapter links into the matching domain anchors.

## Study plan and archive
- Learner study plan: `docs/saa-c03-study-plan.md`
- Frozen prep-track docs: `docs/archive/saa-c03-prep-2026-11-20/`
