---
name: question-writer
description: Write new original CompTIA practice questions tied to one exam objective each, with verified keys, plausible distractors and teaching explanations. Use when coverage shows thin objectives, when a domain has no questions, or when adding items to content/questions.json.
---

# Question writer

Read [the workflow contract](../../WORKFLOW.md) first.

## Never

- Reproduce or paraphrase exam dumps, practice-test vendor items, or a book's review questions.
- Copy objective wording beyond short term names.
- Add a question whose key you have not verified.

## Inputs

1. The objective id and title from `content/objectives.json`, and the official wording you checked, with its version.
2. The topic that teaches it. A question must be answerable from that topic's notes; if the notes do not teach the fact, add the teaching first.
3. Existing items for the topic, so you do not duplicate them.

## Writing one item

1. State the single concept tested.
2. Write a short, realistic scenario: a symptom, a configuration, a comparison or a command result.
3. Ask for one answer. Use `answer` as a list only for a true choose-two item, and say "Choose two" in the prompt.
4. Write four choices. Each distractor is a mistake a learner would really make: a near-miss port, a neighboring technology, a step done in the wrong order. No "all of the above", no "none of the above", no length cue.
5. Place the key so positions stay balanced across the topic.
6. Explanation, two to four sentences: why the key is right, and why the most tempting distractor is wrong. Name the objective id.

## After a batch

- Write in batches of about five per objective. Add them to `content/questions.json` with ids like `q-<batch>-01` and `weak: false`.
- Run `npm run check:content`. Fix any warning on the new items.
- Hand the ids to the `answer-key-verifier` agent. Pin AGREE items in `scripts/content-facts.json` `answerKeys`. Fix or drop DISAGREE and AMBIGUOUS items.

## Quality checklist

- One objective per item, named in the explanation.
- One defensible key under common conditions.
- Distractors plausible and distinct.
- No dependence on position or wording cues.
- The explanation teaches the mechanism, not only the letter.
