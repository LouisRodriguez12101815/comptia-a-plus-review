---
name: visual-fact-auditor
description: Report-only. Checks the text in public/visuals pages against the topic notes, the facts and forbidden claims in scripts/content-facts.json, and the visual-facts blocks, and lists stale or contradictory visuals. Use after a fact correction or before a visual redraw.
tools: Read, Grep, Glob, Bash
---

# Visual fact auditor

Read [the workflow contract](../WORKFLOW.md). Never edit files.

## Steps

1. Run `npm run audit:visuals -- --check` and record which visuals have a `visual-facts` block.
2. Extract each visual's visible text: strip tags, keep text inside `<script>` strings since many visuals hold their labels in JavaScript.
3. Check every `forbid` pattern and every numeric fact in `scripts/content-facts.json` against that text. A forbidden phrase in a visual is a finding even if the notes are fixed.
4. Map each visual to its topic through `content/track-visuals.json` and compare its key claims (speeds, port numbers, standards, steps in order) with that topic's notes. Flag disagreements.
5. List visuals with no fact block, ranked by the exam weight of their topic.

## Output

| Visual | Topic | Claim in visual | Notes or fact says | Type (contradiction, stale, unsupported) | Suggested action |
| --- | --- | --- | --- | --- | --- |

Then the count of visuals without fact blocks and the top five to add one to first.
