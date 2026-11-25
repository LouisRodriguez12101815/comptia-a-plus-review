---
name: confusion-pair-builder
description: Build confusion-pair Match content for any certification. Use when adding or extending Match pairs that a candidate would mix up, including a new exam or the next SAA batch.
---

# Confusion pair builder

Before applying this workflow, read the [workflow contract](../../../docs/skills/README.md#workflow-contract) for authorization, source authority, explicit loading and tool fallbacks. Inputs are parameters. Do not hard-code an exam, a deck, a weight, or a target into the steps. This copy is for assistants that load `.agents/`. Claude's copy is `.claude/skills/confusion-pair-builder/SKILL.md`.

## Inputs

The caller supplies:

- **Exam code.** For example `saa-c03`, `220-1201`, `220-1202`, or `n10-009`. Read task ids and domain weights from that exam's record. Do not number tasks from memory.
- **Deck ids.** The drill decks whose cues may be linked as a side. A side is either a drill ref or its own label and `pickWhen`.
- **Domain weights.** Percentages for the exam being built. Read them from `content/objectives.json` when the exam is already there. The SAA worked example used 30 / 26 / 24 / 20.
- **Target count.** How many pairs the catalog should reach. Stop below the target rather than pad, and say why.
- **Batch size.** Default 50. A batch is one pull request.
- **Sources.** The exam guide, the vendor pages, the reference textbook if the author has it, and the question bank. Record each one as this skill requires.

## Sources

Use sources in this order. Record what you actually opened.

1. **Official exam guide, for scope and task ids.** Record the filename, version, page count, and SHA-256. Compare it with the live guide pages and write down every difference that changes a name or a task id. Do not paste the guide into the site. The SAA worked example used the Version 1.0 PDF, 17 pages, SHA-256 `78e9aa30bd67653603a8a782aeeca1619a7576916fe9bb0588db49429e31033c`. That PDF says AWS SSO. The live guide pages say IAM Identity Center and number the tasks 1.1 through 4.4.
2. **Current vendor documentation, for every fact.** Each pair gets a `docsUrl` and the date that page was checked. A limit, a price, or a default that you did not read on that page does not go in the pair.
3. **A reference textbook, only to find confusions and how to explain them.** Record the filename, page count, and SHA-256. Never copy its text, questions, or answers. Never commit the book. The SAA worked example used Ben Piper and David Clinton, AWS Certified Solutions Architect Study Guide, Associate (SAA-C03) Exam, Fourth Edition, 477 pages, SHA-256 `de7456e3fd3f1e0ea24870ae6a8e73615baaf2199ae62a0a15e35fadadbd70fb`. If the book is not on hand, say so and build from the guide, the vendor pages, and the question bank.
4. **The question bank, mined for the right answer versus the strongest wrong option.** Write the pair in original words. A six-word run that already appears in a prompt, a choice, or an explanation does not go in the pair.

## Pair rules

- The two sides are services or features a candidate would actually mix up.
- `pickWhen` states a requirement. It is not a definition, and it is not the opposite of the other side.
- No word that appears in a side's own label, and in no other side's label or hint, appears in that side's hint. A token is a run of letters or digits at least three characters long. Short distinguishing words count. `one` counts: the label "Lambda for one invocation" must not be cued by "fits one short call". Words shared by every side, such as `policy` or `certificate`, are fine. Function words in the stop list in `scripts/lib/answer-cues.mjs` do not count. `two` is still in that list.
- The sides of a pair are parallel and similar in length. The longest hint stays within one and a half times the shortest.
- No side rules itself out. A hint does not say "instead of", "rather than", "because", "and no", "does not", or "is not".
- Do not copy wording from a linked question.
- A duplicate is two pairs whose normalized side labels, with drill refs resolved, are the same set. Check the whole catalog. Task id and the service list do not make two pairs different.
- `services` names the services the pair actually contrasts. A NAT gateway versus a NAT instance is Amazon VPC, not Amazon EC2.
- Spread the batch by domain weight and cover every task. Associate depth for an associate exam: the learner picks the option that meets the stated requirement. Do not add professional-level parameters to fill a quota.
- Stop below the target rather than pad. Name the tasks that ran out of real confusions.

A drill ref may also carry its own `pickWhen`. Use that when the drill cue repeats a word that belongs only to the resolved label. Do not edit a hashed drill item to clear the echo.

## Schema

Pairs live in `content/study-pairs.json`. `lib/study/records.ts` resolves them.

Each pair has `id`, `exam`, `taskId`, `services`, `docsUrl`, `questionIds`, `difference`, and `sides`. A side is a drill `ref`, or a `label` plus `pickWhen`. `questionIds` lists only questions that test that exact distinction. An empty list is correct when no question does.

Do not change an existing pair id, question id, card id, or drill id.

## Game rules

Leave the games as they are.

- Match on the flashcards page plays one fixed round of 20 pairs. Weak tasks come first, then the round fills round-robin. A task filter with fewer than 20 pairs plays all of them. Retrying missed pairs does not draw a new round. The constants are `FLASHCARD_MATCH_ROUND` and `sampleMatchRound` in `lib/study/records.ts`.
- Concentration uses at most 8 pairs (`concentrationPairs` in `lib/study/games.ts`).
- Progress stays in `comptia-a-plus-review-progress-v1`. Do not change that storage key or the progress record shape in `lib/progress.ts`.

## Steps

1. Plan the counts by task from the domain weights, the target, and the pairs already in the catalog.
2. Write the batch in original words, with a `docsUrl` and the date checked for every fact.
3. Run the cue audits: `npm run audit:answer-cues -- --check`. Label-echo sides must be 0. The same normalized label set must not appear twice.
4. Run the `pair-contrast-auditor` instructions. They only report. Verify each FLAG or DISAGREE yourself before editing.
5. Fix what the audits and the auditor found.
6. Update the pair count and the study-record count in the tests. Comment the new numbers with the batch name.
7. Validate, then open the pull request. One batch is one pull request. Stop for `accepted #<number>` before the next batch.

## Validation

Run:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run check:content`
4. `npm run test:exam`
5. `npm run audit:answer-cues -- --check`
6. `npm test`
7. `npm run build`

Then check Match and the games hub in the browser at 320, 390, and 1280 px in every locale. Confirm the round size, no overflow, keyboard play, reduced motion, and that seeded progress survives a reload. Confirm that no existing id changed.

`npm run build` needs `node_modules` inside the project. Turbopack does not resolve `next/package.json` through a symlink to another checkout.

## Pull request report

The report has:

- Branch and commit.
- Pairs added, and the catalog total.
- Counts by task and by domain, for the batch and for the catalog.
- Sources, with the date checked and the hashes.
- Whether the reference textbook was available.
- Cue-audit numbers: label echo, length, self-disqualifying hints, and duplicates.
- Validation results, including the browser viewports.
- What remains, and why the batch stopped if it is under the target.
- Whether anything was deployed.
- The line `waiting for accepted #<number>`.

## Deployment

Vercel Git deployments are off. `vercel.json` sets `git.deploymentEnabled` to false, so a merged batch is not live until someone deploys it by hand. Do not deploy from this skill. The pull request report says whether anything was deployed. A merge with nothing deployed says that production is unchanged.
