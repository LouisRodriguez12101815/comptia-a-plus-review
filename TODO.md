# CompTIA A+ Review — project board

Public Vercel site for classmates: notes, flashcards, and original practice quizzes from the class study guide. No logins. Progress stays in the browser.

## v1 checklist

- [x] Scaffold Next.js app, README, copy study guide to `content/source.md`
- [x] Model topics, flashcards, and questions (TypeScript types + JSON)
- [x] Convert the study guide into structured notes by chapter
- [x] Author flashcards and original MCQs (extra weight on the 10 weak areas)
- [x] Notes UI: TOC, chapter pages, search, weak-area callouts
- [x] Flashcard UI: deck by chapter, shuffle, known/unknown (`localStorage`)
- [x] Quiz UI: by chapter or mixed, score, review missed (`localStorage`)
- [x] Polish: mobile layout, home dashboard, Quick Reference
- [x] Deploy to Vercel and document the public URL in the README

## Out of scope for v1

- Individual accounts, leaderboards, or a database
- Official CompTIA exam dumps
- Full textbook coverage beyond this study guide


## Gameplay audit backlog

See [the October 11 gameplay audit](docs/gameplay-audit.md) for target commits, reproduction evidence, complete phase traces and verification boundaries. Reproduced issues remain open until the stated sequence passes after a fix.

- [ ] GA-04: align new Chapter 7 notes with verified CIDR/RFC guidance; obtain author review of the universal sizing claim (recommended next fix).
- [ ] GA-01: show feedback for the most recent submitted payload while preserving duplicate-scoring/attempt protection.
- [ ] GA-02: make priced hints relevant to the active stage/context decision.
- [x] GA-05: replace the rigid three-card deck assertion with unique required-card checks; current-main regression passes locally.
- [ ] GA-03: apply context in a different transfer question or limit transfer reporting to the new objectives.
- [ ] Verify actual deployed commit/assets, configured Sync and physical laptop/phone shared-room acceptance; local mocked runs do not complete this item.
- [ ] Learner testing and comprehensive keyboard/screen-reader/contrast/physical-phone checks; completion does not establish mastery.
