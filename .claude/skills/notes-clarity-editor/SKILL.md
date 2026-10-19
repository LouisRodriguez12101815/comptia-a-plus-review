---
name: notes-clarity-editor
description: Rewrite topic notes so they are faster to study - exam cue first, symptom-to-cause tables, a trap callout per section, and word budgets - and check that every quiz question is answerable from the notes. Use when notes are long or vague, or when learner-simulator reports facts the notes do not teach.
---

# Notes clarity editor

Read [the workflow contract](../../WORKFLOW.md) first.

## Rule zero

Do not change a fact while rewriting. If a fact looks wrong, flag it for `content-fact-check`; do not fix it here.

## Section pattern

1. **What the exam asks:** one sentence naming the objective and the decision a question will ask for.
2. **How to tell:** a `table` (symptom → cause, term → meaning, option → when to use it) or 3 to 6 bullets.
3. **Trap:** one `callout` (`critical` for a common wrong answer, `tip` for a memory aid).

## Budgets

| Element | Budget |
| --- | --- |
| Paragraph block | 70 words |
| Bullet item | 30 words |
| Bullets per block | 6 |
| Table rows | 12; split larger tables by subtopic |
| Sections per topic | 8; split a topic that needs more |

## Alignment check

For each question mapped to the topic, find the section that teaches its key fact. List any question with no matching section and add the missing teaching. The `learner-simulator` agent does this check independently.

## Process

1. Measure: words per block and section, against the budgets.
2. Rewrite the sections over budget, or with no exam cue or trap.
3. Keep section ids stable; links and visuals reference them.
4. Run `npm run check:content` and the content and objectives tests.

Report each section changed with word counts before and after, plus any facts flagged.
