---
name: exam-drill-builder
description: Narrow a certification down to the facts most worth memorizing, then build rapid-fire memory drills for them on the Practice Games page (the FactDrill engine in lib/practice/drills.ts). Use when the author wants a drill, a memorization game, or a last-minute review plan for A+, Network+, CCNA or a new certification.
---

# Exam drill builder

Read [the workflow contract](../../WORKFLOW.md) first. This skill covers the two halves of the job: deciding **what** to drill, and **building** the drill.

## 1. Narrow down what to drill

Run the `drill-target-auditor` agent with the exam code, the time budget if there is one, and any weak spots the author named or missed in recent quizzes. Verify its top picks yourself before building.

The ranking rules, in order:

1. **Exam weight.** Spend effort in proportion to `weight` in `content/objectives.json`. Troubleshooting and hardware usually outweigh the rest.
2. **Recall over scenario.** Drills fit facts the exam expects cold: numbers, pairs, short lists, symptom → most likely cause, ordered steps. Multi-step "configure" or "troubleshoot" scenarios go to `pbq-designer` or `learning-challenge-designer`.
3. **The learner's weak spots.** Topics they missed or said they mix up come before topics they already know.
4. **Not already drilled.** Check the `objective` ids of existing decks first, and extend a deck rather than duplicate it.

When the author has only minutes before the exam, answer with a time-boxed plan instead of building: split the minutes by domain weight, point each drilled objective at its drill page, and list the undrilled facts to read.

## 2. Write the fact list before any code

For each item, write: the prompt, the answer the exam expects, a one-line `detail` (why), a short `hook` (how to remember it), and the objective id it serves.

- **Scope** comes from the official objectives for that exam version. Look up each objective id and title in `content/objectives.json`. Do not number objectives from memory: ids moved between 220-1101 and 220-1201.
- **Technical facts** come from standards, RFCs and vendor documentation. Use `certification-content-verifier` for anything numeric (speeds, distances, pin counts, port numbers, RAID minimums).
- Write original items. Never copy book review questions or exam dumps.

## 3. Pick the modes

A deck is a list of items with named `fields`. Each mode asks for one field given another (`from → to`). Answer choices are the other distinct values of the `to` field, so a mode works best with 6 to 25 items.

| What the fact looks like | Modes |
| --- | --- |
| Pair (port ↔ protocol, record ↔ purpose) | Both directions |
| Term with a definition | Term → meaning and meaning → term |
| Symptom with a likely cause | Symptom → cause only |
| Scenario with a best choice | Scenario → answer |
| Ordered steps (DORA, laser printing) | Step number → step name |
| Short answers from different families | One "facts" mode, with hand-picked `wrong` answers per item |

Rules:

- Within a mode, every prompt is unique; two prompts with the same right answer are fine.
- Answers in a mode must look alike. If a pool would mix "1, 6 and 11" with "NFC", add `wrong: { <field>: [...] }` to those items.
- Two to four modes per deck. Fact strings stay in English, like protocol names. UI labels are translated.

## 4. Build

1. Add the deck to `lib/practice/drills.ts` with `id`, `certification` (filter label, for example "A+ Core 1", "Network+", "CCNA"), `exam` (a code that exists in `content/objectives.json`), `objective` (ids such as `"2.3, 2.4"`), `topic`, `modes`, `tables` and `items`. Add it to the `drillDecks` array.
2. Add `drillDecks.<id>` to `messages/en.json`, `es.json`, `fr.json` and `pt.json`: `title`, `topic`, `intro`, `cardBody`, `modes.<modeId>.label` and `.ask`, a `fields` label for every table column, and `tables.<tableId>` when there is more than one table.
3. No route or catalog change is needed. Every deck except `ports` is served at `/practice-games/drills/<id>` and listed under **Memory drills** on Practice Games, filtered by its certification and topic.
4. A new certification needs its exam in `content/objectives.json` first, with ids and titles from the official objectives (never paste the PDF). The deck test fails until it exists.
5. Add one line per easy-to-reverse fact to the "facts that are easy to get backwards" test in `tests/practice-drills.test.mjs`.

## 5. Check

- `node --experimental-strip-types --import ./tests/register.mjs --test tests/practice-drills.test.mjs`. This test checks unique prompts, choice counts, translations in all four languages, and that the exam and objective ids exist.
- `npx tsc --noEmit` (after `next typegen`) and `npx eslint lib/practice app/components/practice`.
- Run `npm run dev` and load the drill in English and one other language. Click **Start drill**, finish a round with some misses, and confirm the misses come back and the console shows no hydration errors.

## 6. Ship

Commit on a branch, never `main`. Give the author zsh-safe commands to push the branch and open a pull request. If this session cannot push, export the commit with `git format-patch -1 --stdout` and give the commands to apply it with `git am` on a new branch.
