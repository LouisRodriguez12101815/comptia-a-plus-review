# Claude skills and agents

This folder holds the skills and agents Claude uses to build and review the CompTIA review site. Claude Code loads skills from `.claude/skills/` and agents from `.claude/agents/`. Copies for other assistants live in `.agents/` and are maintained separately.

Read [WORKFLOW.md](WORKFLOW.md) first: it covers authorization, sources of truth, the content file shapes and the checks.

## Adding a chapter, end to end

1. `objective-gap-auditor` (agent) picks what to add.
2. `chapter-ingest` (skill) turns the source into notes, cards, questions and mappings, using `question-writer` and `notes-clarity-editor`.
3. `answer-key-verifier` and `learner-simulator` (agents) check the keys and the teaching.
4. `pbq-designer` or a visual skill adds practice, and `ux-a11y-reviewer` and `visual-fact-auditor` (agents) check it.

## Skills

| Skill | Use it when |
| --- | --- |
| [chapter-ingest](skills/chapter-ingest/SKILL.md) | The author shares a new chapter to add |
| [question-writer](skills/question-writer/SKILL.md) | An objective has few or no questions |
| [question-quality-fixer](skills/question-quality-fixer/SKILL.md) | The checker reports balance, choice-count or explanation warnings |
| [pbq-designer](skills/pbq-designer/SKILL.md) | A scenario objective needs a match, order or pick-the-command exercise |
| [notes-clarity-editor](skills/notes-clarity-editor/SKILL.md) | Notes are long or vague, or don't teach what the quiz tests |
| [content-fact-check](skills/content-fact-check/SKILL.md) | A chapter needs a correctness review |
| [certification-content-verifier](skills/certification-content-verifier/SKILL.md) | Facts, keys, mappings or subnet math need checking |
| [review-question-tutor](skills/review-question-tutor/SKILL.md) | The author wants to be quizzed on a chapter's questions |
| [exam-visual-designer](skills/exam-visual-designer/SKILL.md) | A visual explains with paragraphs instead of a picture |
| [hardware-diagram-designer](skills/hardware-diagram-designer/SKILL.md) | A hardware chapter needs a board map or part drill |
| [network-diagram-designer](skills/network-diagram-designer/SKILL.md) | A networking visual, packet path or VLSM view |
| [learning-challenge-designer](skills/learning-challenge-designer/SKILL.md) | A practice mission with feedback and retries |
| [comptia-site-pm](skills/comptia-site-pm/SKILL.md) | Deciding what to build next or reviewing a pull request |
| [shared-state-regression-tester](skills/shared-state-regression-tester/SKILL.md) | Multiplayer rooms or shared state misbehave |

## Agents

Agents run in their own context and report back. All are report-only; the caller verifies before changing content.

| Agent | Use it when |
| --- | --- |
| [objective-gap-auditor](agents/objective-gap-auditor.md) | Deciding which objective to cover next |
| [answer-key-verifier](agents/answer-key-verifier.md) | New questions were written or a key is disputed |
| [learner-simulator](agents/learner-simulator.md) | A topic was added or rewritten |
| [ux-a11y-reviewer](agents/ux-a11y-reviewer.md) | UI or visual changes are about to merge |
| [visual-fact-auditor](agents/visual-fact-auditor.md) | A fact was corrected, or before a visual redraw |
| [chapter-fact-reviewer](agents/chapter-fact-reviewer.md) | content-fact-check needs one reviewer per chapter |
