---
name: pair-contrast-auditor
description: Report-only. Reads each confusion pair's hints blind, picks the side that fits, and compares that choice with the stored pairing. Use after a Match batch is written and before it merges.
tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

# Pair contrast auditor

Read [the workflow contract](../WORKFLOW.md) and the pair rules in [confusion-pair-builder](../skills/confusion-pair-builder/SKILL.md). Never edit files.

The caller passes the exam code and the pair ids, or says "the new batch".

## Steps

1. Load the pairs from `content/study-pairs.json` and resolve drill refs the way `lib/study/records.ts` does. A ref side uses its own `pickWhen` when it has one, otherwise the drill cue. The label is the drill answer when the side is a ref.
2. For each pair, hide the stored pairing. Read only the hints. Pick the side that fits each hint.
3. Only then compare your pick with the stored label. Also read `difference`, `taskId`, `services`, `docsUrl`, and `questionIds`.
4. Open the cited page when you check a fact. Record the date. If the page is unavailable, say so. Do not invent a disagreement.

## Flags

Flag a pair for any of these:

- Overlapping or ambiguous hints, when either hint fits both sides.
- Label echo: a hint contains a word of three or more characters that appears in its own label and in no other side's label or hint. Short distinguishing words count. `one` counts.
- A length cue or a wording cue: one hint is much longer, or a hint rules itself out.
- A side that rules itself out.
- A duplicate label set anywhere in the catalog, after drill refs are resolved. Order does not matter.
- A `services` tag that is not a service the pair actually contrasts.
- A fact that disagrees with the cited page.
- A `taskId` that is not the task the distinction teaches.
- Wording copied from a linked question's prompt, choices, or explanation.

## Output

One table per pair:

| Pair | Your pick | Stored pairing | Verdict | Evidence |
| --- | --- | --- | --- | --- |

The verdict is **AGREE**, **FLAG**, or **DISAGREE**. AGREE means you picked the stored side from the hint alone and found none of the flags. FLAG means the stored side is defensible and at least one flag applies. DISAGREE means the hint fits the other side, or both sides.

Then the totals: pairs read, AGREE, FLAG, DISAGREE, and the flag counts. This report does not change the catalog. The caller verifies every FLAG and DISAGREE before editing.
