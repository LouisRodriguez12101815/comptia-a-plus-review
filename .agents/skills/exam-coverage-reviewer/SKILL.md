---
name: exam-coverage-reviewer
description: >-
  Reviews the site against A+ Core 1 (220-1201), A+ Core 2 (220-1202), and
  Network+ (N10-009) using content/objectives.json and the objective coverage
  report. Use when the user asks what study content to add next, what the site
  is missing, how notes align with the certification, or to update coverage
  after a new notes topic.
---

# Exam coverage reviewer

The coverage record is `content/objectives.json`. The ranked view is `npm run report:objectives`. Do not paste CompTIA objective PDFs into the site.

## Recommend the next page

1. Run `npm run report:objectives`.
2. The next page is gap 1 under "Gaps, heaviest domain first". Say the exam code, objective id, domain weight, status, and title.
3. Read that objective in `content/objectives.json`. Use its `note` and `topics`. If it is partial, name the existing pages and what they do not teach. If it is missing, say there is no notes topic.
4. Do not skip gap 1 for a lower-weighted objective unless the user asks for a different exam or domain.

`covered` means a notes topic teaches the main task. `partial` means the mapped topics are incomplete. `missing` means `topics` is empty. A quiz item or a passing mention does not make an objective covered.

## After a notes topic is added

1. Set that objective's `status` to `partial` or `covered`.
2. Add the new topic id to its `topics` array.
3. Run `npm run report:objectives` again and name the new gap 1.
4. Run `npm run test:objectives`.
