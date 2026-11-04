---
name: architecture-sad-designer
description: Build a System Architecture Document (arc42, C4, 4+1 views, ADRs) with interactive diagrams and a simulator for one hard exam concept, and publish it as a visual on the review site. Use for hardest-concept or highest-weight-domain requests.
---

# Architecture SAD Designer

Before applying this workflow, read the [workflow contract](../../WORKFLOW.md) for authorization, source authority and tool fallbacks. Work on a branch. Never push to `main`. Commit, push, open a pull request or deploy only when the current session asks for it. Never reproduce exam dumps or paste CompTIA objective PDFs.

## What this produces

One page per concept at `public/visuals/<slug>.html`, built from `tools/sad-visuals/sources/<slug>/`. The page renders a System Architecture Document for an invented example system that makes one hard idea unavoidable, with five diagrams and one simulator the learner can break. It is listed on the Network+ Visuals page under the topic's chapter.

## Choosing the concept

1. Rank domains by weight in `content/objectives.json` (`exams[].domains[].weight`). Take the heaviest domain the learner has not covered yet, or the one they name.
2. Inside it, pick the idea that needs a mechanism to understand, not a list to memorize. Good: loops, quorum, convergence, handshakes, failover. Weak: port tables, acronym lists.
3. Say plainly that the choice is a judgment call, and name the runner-up. Never claim a concept is "the hardest on the exam" without miss-count data; check `content/questions.json` counts by `topicId` and any weak-concept report.

## The document contract

The user supplies four inputs: core problem, technical stack, known constraints, key integrations. If they are missing, invent an example system and label every number "assumed".

- Start directly with the Markdown title `# <System>: System Architecture Document`. No preamble.
- Five sections, in this order: `## 1. Executive Summary & System Context`, `## 2. Logical & Building Block View`, `## 3. Runtime & Process View`, `## 4. Deployment View`, `## 5. Architecture Decision Records & Tradeoffs`.
- Follow arc42 (sections 1 to 3, 5 to 7, 9), C4 terms (Context, Container, Component, Dynamic, Deployment), Kruchten 4+1 (logical, process, physical, scenarios) and ADRs. Include a view map table that ties them together.
- Direct tone. Short list items. Tables for inputs, interfaces, topology and failover budgets. No filler.
- Each ADR is a `#### ADR-00N: title` block with Status, Context, at least two options with the cost of each, Decision, and Consequences (+) and (−).
- State the exam objective id at the top and which facts come from the site's notes versus an outside standard.

## Files

```
tools/sad-visuals/sources/<slug>/
  SAD.md        the document, with <!--diagram:name--> markers
  diagrams.js   dContext, dContainers, ... , simulator(el) and mount(q)
  facts.json    visual-facts block: claims with objective keys and sources
  meta.json     {out, title, back}
```

`engine.js` supplies `md`, `svg`, `box`, `arrow`, `label`, `group`, `mkFig`, `staticFig`, `toggleFig`. `diagrams.js` must define `mount(q)`, which replaces each marker.

## Diagram quality bar

- Show the mechanism. Each diagram makes one claim and draws it.
- Five views at minimum: context, containers or components, a sequence or process view with a toggle for the misconception versus the fix, a simulator, and a deployment view with a "what fails" toggle.
- The simulator lets the learner turn the protective feature off, see the fault, turn it on, break something, and read a plain-language result banner. It reports measured counters, not claims.
- Same colors for the same meaning: blue normal path, teal correct or synchronous, yellow focus, coral fault.
- Never overlap text with shapes. Label beside objects. Screenshot every diagram and fix overlaps before finishing.
- Label every number that is a teaching value. Say in the caption that the simulator is a model, not a measurement.
- Honest limits go in `facts.json` `simplifications`.

## Steps

1. Pick the concept (above) and the objective id. Read the site's notes for its topic id and record where the notes are silent.
2. Verify facts. Where the notes are silent, cite a standard or vendor document in `facts.json` and say in the final reply that it goes beyond the notes. Stop and ask if a fact conflicts with an answer key.
3. Write `SAD.md`, then `diagrams.js`, `facts.json`, `meta.json`.
4. `node tools/sad-visuals/build.mjs` writes `public/visuals/<out>`.
5. Register the page in `content/track-visuals.json` under the topic id: `file`, `title`, `description` ending in `(Notes: <section titles that exist>)`, `group`.
6. Test with Playwright against a static server: no console errors, every figure present, the simulator's counters behave in both modes, screenshot each figure.
7. Gate: `node tools/sad-visuals/build.mjs --check`, `npm run test:sad-visuals`, `npm run audit:visuals -- --check`, `npm run check:content`, `npm run lint`, `npm run typecheck`, `npm run build`, then `npm test`.
8. Independent review: run the `sad-reviewer` agent, then `visual-fact-auditor`, `answer-key-verifier` and `chapter-fact-reviewer` on the claims. Do not describe the facts as verified until they have run.

## Limits to state to the user

- The system, numbers and scenario are invented for teaching.
- Simulators model one mechanism and ignore queuing, jitter, CPU limits and vendor differences.
- A visual teaches a concept. It does not establish exam readiness.
- Page chrome follows the site; the document text is English only.
- Production deploys are manual and only from an up-to-date `main` (`review/vercel-deployment-sop.md`).

## Authorization

If the user asks to commit, push or deploy, give zsh-safe commands from the repo root with no inline comments or placeholders, chained with `&&`.
