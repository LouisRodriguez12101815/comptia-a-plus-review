---
name: review-question-tutor
description: "Use when the user supplies chapter review questions and wants one-question-at-a-time tutoring, explanations and targeted visual support, inline or in authorized local files."
---

# Review Question Tutor

Before applying this workflow, read the [workflow contract](../../WORKFLOW.md) for authorization, source authority, explicit loading and tool fallbacks. Apply only sections relevant to the requested scope.

Use this for conversational study of supplied review questions, not automatic site authoring or publishing.

## 1. Ingest and verify

- Read the supplied file or pasted questions using available tools. If extraction is incomplete or unavailable, say which parts are unreadable; do not claim a full read.
- Keep original numbering, choice identity and supplied keys distinguishable from verified answers. Flag disputed or ambiguous keys **before grading**. Use `certification-content-verifier` and applicable sources to resolve them; if unresolved, mark unverified, explain the uncertainty and defer scoring rather than grading against a questionable key. Do not silently change the source question.
- Return a short intake summary inline by default. Save a question/answer record only when file writing is authorized, using supported local-file tools and an agreed destination. Suggested templates, not required existing paths: `review/<chapter>-<topic>.md` and `review/progress.md`.
- State exactly what was read or saved. The `project_write` tool is not assumed available; no saved-file claim is permitted without an actual write. Do not ingest exam dumps or reproduce an unauthorized question collection.

## 2. Run the quiz back and forth

- Ask one question at a time. Never send more than one question per conversational turn, and wait for the user's answer before grading.
- Keep normal tutoring turns under 450 characters. For a source dispute or explanation needing more room, give a brief summary and offer longer inline material or an authorized local note; do not require an artifact tool.
- Grade verified questions as correct (one reinforcing fact), partly correct (name the missing piece), or wrong (explain the correct answer and why). Avoid answer-letter-only feedback.
- If the user says "not sure" or "none", teach the core idea before continuing. Rotate recurring concepts rather than presenting every repetition consecutively.
- Track misses, assistance and retries in conversation. Persist progress only when authorized; do not infer mastery from completion or score.

## 3. Support missed concepts

- When a concept is missed twice or a diagram is requested, provide a targeted explanation or accessible text diagram first. Use an interactive visual only when it helps the learning task and its creation is authorized.
- Do not assume Artifact, `artifact-design`, publishing, or project-storage tools exist. With no such tools, use inline teaching; for an authorized HTML file, follow the repository's existing visual conventions in `docs/adding-visuals.md` and use available local tools. Use network-diagram guidance only for networking diagrams.
- Diagram requests route to the visual skills: `hardware-diagram-designer` for PC hardware pictures, `network-diagram-designer` for networking diagrams, and `exam-visual-designer` for other chapter visuals. Those skills own the fact block and checks.
- Verify the depicted mechanism and provide a text equivalent. Report rendering/browser checks only if actually performed. Saving HTML is not publishing it; publishing requires separate explicit authorization and an available tool.

## 4. Close out a topic

- Summarize in at most five short lines: demonstrated correct answers, concepts to revisit, unresolved keys and any actual supporting visual/note.
- Ask at most one question about what to study next. For site-content recommendations, follow `AGENTS.md`'s coverage report rule rather than treating a missed question as coverage evidence.

## Rules

- Never grade before an answer, or score an unresolved key as verified.
- Cite source chapter/question and primary evidence when resolving claims; distinguish objective scope from technical behavior.
- This workflow does not authorize site edits, progress-file writes, dependency installation, commits, pushes, publication or merges.
