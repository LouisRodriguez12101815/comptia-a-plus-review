# Exam prioritization implementation plan

## Goal

Let each learner choose the certification track they need now, while retaining the same notes, flashcards, quiz history, and ability to return for a retake.

## Decision

- Default study focus: **CompTIA A+ Core 1 (220-1201)**.
- Available focus options: **220-1201**, **220-1202**, **N10-009**, and **All material**.
- Save the learner's selection in browser-local progress so classmates can choose differently and returning learners can switch tracks without losing their history.
- Tag source topics with every exam they support; shared material can appear in multiple tracks.

## Protected behavior

- Existing notes, flashcards, quiz questions, per-device known-card status, and quiz history remain available.
- Original questions remain clearly identified as practice material rather than exam dumps.
- The current static, public Vercel site remains the deployment target.

## Implementation

- [x] Inspect the current content model, progress storage, pages, and Next.js 16 documentation.
- [x] Add exam/focus types, metadata, topic tags, filtering helpers, and persisted selection.
- [x] Add a reusable focus selector and focus-aware home dashboard, notes, flashcards, quizzes, and navigation copy.
- [x] Fix existing React hook lint failures encountered in the touched progress components.
- [x] Update project documentation.
- [x] Run data validation, lint, production build, and browser interaction checks.
- [x] Commit and push after verification.
- [ ] Link the existing Vercel project to the GitHub repository, then verify the production deployment.
