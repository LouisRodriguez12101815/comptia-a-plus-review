---
name: question-quality-fixer
description: Improve existing quiz questions rather than add new ones - rebalance skewed answer positions, fix choice-count warnings, remove position-dependent wording, and rewrite thin explanations - without changing which answer is correct. Use when check:content reports answer-balance, choice-count or explanation-vs-key warnings.
---

# Question quality fixer

Read [the workflow contract](../../WORKFLOW.md) first.

## Find the work

Run `npm run check:content -- --json` and collect, per topic: `answer-balance`, `choices`, and `explanation-vs-key` warnings. Fix one topic at a time.

## Rebalance positions

- Target: no position above about 35 percent and none below about 15 percent in a topic with 8 or more single-answer items.
- Move the correct choice to a new index and keep the other choices in their original order. Update `answer`.
- Skip choose-two items (`answer` is a list).
- `answerKeys` stores choice text, not position, so moving a choice keeps its pin valid.
- Before moving, search the prompt, choices and explanation for position words ("option B", "both A and C", "the first", "above", "below"). Rewrite them, or leave that item in place.

## Choice counts

- Four choices is the convention. A 2-choice true/false item or a 5-choice "choose two" item can be deliberate; leave those and note them.
- For other items, add a plausible distractor or remove the weakest one. Never remove the correct choice.

## Explanations

- Rewrite explanations that only restate the key. Pattern: why the key is right, then why the most tempting distractor is wrong.
- For `explanation-vs-key` warnings, read the item. If the explanation argues for a different choice, do not change the key; send the item to the `answer-key-verifier` agent.

## Check

Run `npm run check:content` and the content and objectives tests. Report per topic: positions before and after, items changed, items skipped and why.
