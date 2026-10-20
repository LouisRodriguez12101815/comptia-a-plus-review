---
name: pbq-designer
description: Build performance-based question (PBQ) exercises in CompTIA's interactive style - match symptoms to causes, order steps, pick the right command or setting - as accessible standalone visual pages with per-item feedback. Use when an objective is scenario-based ("given a scenario, troubleshoot...") and multiple choice alone under-tests it.
---

# PBQ designer

Read [the workflow contract](../../WORKFLOW.md) first. Visual rules come from [exam-visual-designer](../exam-visual-designer/SKILL.md); this skill adds the exercise format.

## Pick the format

| Objective verb | Format |
| --- | --- |
| Troubleshoot (symptom to cause) | Match each symptom to its likely cause or first fix |
| Explain a process or procedure | Put the steps in order |
| Use a tool or command | Pick the command or setting for each scenario |
| Configure | Choose the setting values that meet stated requirements |

## Build

1. Write the fact list first: each item, its correct answer, and a one-line reason with a source. Every item must be taught in the topic's notes.
2. Use 6 to 10 items and 1 or 2 more answer options than items, so the last match is not free.
3. Make it work without dragging: a `select` per row, or buttons with `aria-pressed`. Dragging may be added on top, never as the only way.
4. "Check answers" marks each row correct or incorrect with its reason. "Try again" clears only the wrong rows. "Show answers" reveals all.
5. Shuffle answer order on load and on retry.
6. Use the navy console tokens, 44 px minimum targets, visible focus, and no horizontal scroll at 390 px.
7. Add a `visual-facts` block with `"kind": "exercise"` that lists the item facts and objective ids. The audit then checks for labels and a live feedback region instead of a figure.
8. Register the page in `content/track-visuals.json` under the topic, with a group name such as "Practice".

## Check

Run `npm run audit:visuals -- --check`. Load the page at 390 px and 1000 px in light and dark mode, finish it once with all correct answers and once with mistakes, and use the keyboard only once. Have the `ux-a11y-reviewer` agent run on the page.
