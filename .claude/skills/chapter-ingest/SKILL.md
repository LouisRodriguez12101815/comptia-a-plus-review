---
name: chapter-ingest
description: Turn a chapter source the author shares (RTF, DOCX, PDF or pasted notes and review questions) into site content in one pass - notes topic, flashcards, original quiz questions and objective mappings - checked and balanced. Use when the author says "new content to add" for Core 1, Core 2 or Network+.
---

# Chapter ingest

Read [the workflow contract](../../WORKFLOW.md) first. It has the JSON shapes, id rules and checks this skill relies on.

## 1. Read the source

- Read the whole file. Convert RTF to text first (`textutil -convert txt` on macOS, or `striprtf` in Python). Say which parts were unreadable.
- List the exam code and objective numbers the chapter names. Separate three things: the objective list, the chapter's teaching, and its review questions with keys.
- Note book claims that look wrong or model-specific so you can flag them rather than copy them.

## 2. Decide where it goes

- For each objective, read its entry in `content/objectives.json`. If a topic already teaches it, extend that topic; otherwise create one topic for the chapter.
- Check `tests/objectives.test.mjs` for pinned counts on those objectives. If one is pinned (220-1201 5.3 is), either leave that objective's counts unchanged or update the pin in the same change.

## 3. Write the notes

- Write in your own words. Do not paste book paragraphs.
- One section per objective or sub-area. Lead each section with what the exam asks, then a `table` of symptom → cause or term → meaning, then a `callout` for the common trap.
- Follow [notes-clarity-editor](../notes-clarity-editor/SKILL.md) for length and structure.

## 4. Write questions and cards

- Do not copy the book's review questions. Use them only to see which ideas are tested, then write originals with [question-writer](../question-writer/SKILL.md).
- Aim for at least 3 questions per objective sub-area and one flashcard per key fact.
- Keep 4 choices and spread the correct position across A to D. After writing, count positions; no position should exceed about 35 percent of the topic.
- Ids: `q-chNN-01`, `fc-chNN-01`, unique across the file.

## 5. Map and register

- Update `status` and `topics` for each objective taught. Use `covered` only when notes, cards and questions all exist for it.
- Register any new visual in `content/track-visuals.json`.

## 6. Check

Run `npm run check:content` (0 errors, no new warnings on your topic), `npm run report:objectives`, and `node --test tests/content-check.test.mjs tests/objectives.test.mjs`. Then hand the new question ids to the `answer-key-verifier` agent and the topic id to the `learner-simulator` agent, and fix what they confirm.

## 7. Report

Say what was added (topic, sections, question and card counts, objectives changed), which book claims were flagged or left out, and what is still unverified. Do not commit unless the session asks.

## Definition of done

| Check | Pass |
| --- | --- |
| Content checker | 0 errors; no balance or choice-count warning on the new topic |
| Objectives | Each taught objective mapped; report re-run |
| Tests | content-check and objectives tests pass |
| Keys | Verified by answer-key-verifier; agreed keys pinned in `answerKeys` |
| Notes coverage | learner-simulator finds no `not taught` items |
