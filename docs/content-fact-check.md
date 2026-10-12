# Content fact-checking

Three layers, because "is the content correct" is three different questions. None of them replaces the author reading the book.

## Layer 1: deterministic checks (this repo)

```
npm run check:content
npm run check:content -- --topic n10-ch7,n10-ch10
npm run check:content -- --json
npm run check:content -- --strict
```

`npm test` also runs `tests/content-check.test.mjs`, which fails on any error and checks that the checker still catches seeded mistakes.

What it checks:

- Quiz integrity: valid answer index, non-empty explanation, no repeated choices, known topic ids, duplicate ids and prompts, and a warning when an explanation never mentions the keyed answer.
- Answer-position balance per topic and minimum coverage (15 questions, 10 cards) for Network+ chapters.
- Visual files listed in `content/track-visuals.json` exist, and each "(Notes: ...)" description names a real section title.
- Author-confirmed facts in `scripts/content-facts.json`: `require` patterns the notes must still state, `forbid` patterns that must not appear in notes, cards, explanations or visuals (distractor choices are ignored), and `numeric` patterns whose captured numbers must be in an allowed list (for example every RIP administrative distance must be 120).
- Worked examples recomputed by the script: EUI-64 interface IDs, IPv4 class and private/public/APIPA type, and route lookups with longest-prefix match.

Errors fail the command. Warnings are advice on older content and do not fail unless `--strict` is passed.

Covered so far: Network+ chapters 7, 9, 10, and 11. To cover another chapter, add its facts to `scripts/content-facts.json`.

## Layer 2: source-grounded review (skill)

The `content-fact-check` skill compares each claim on the site with the author's own source material (class notes, chapter highlights, review-question answer keys saved in the Project). It reports claims the sources do not support, claims that contradict them, and site claims that exist only in a visual or card.

## Layer 3: external verification (skill, with web search)

The same skill checks checkable facts (RFC values, CompTIA exam objectives, vendor documentation) against authoritative sources and cites them. The author's book is the exam authority: where it differs from the outside source, the item is reported as a conflict for the author to decide, never changed automatically.

## Keeping the facts file honest

- Change a value in `scripts/content-facts.json` only after checking your book. It is the record of what you confirmed.
- When Layer 2 or 3 confirms a fact, add it to the facts file so Layer 1 keeps it pinned.
- A passing run means the site agrees with the facts file and is internally consistent. It does not prove the facts are true.
