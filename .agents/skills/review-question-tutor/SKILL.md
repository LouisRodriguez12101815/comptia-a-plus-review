---
name: review-question-tutor
description: "Use when the user shares review or quiz questions for a course chapter and wants them ingested, quizzed back and forth, explained, and turned into visualizations saved to a project."
---

# Review Question Tutor

Use this skill when the user uploads or pastes review questions (for example from a textbook chapter) and wants to study them through conversation.

## 1. Ingest the questions

- Read the uploaded file in full (RTF, DOCX, PDF, or pasted text).
- Save the questions and answer key to the attached project as `review/<chapter>-<topic>.md` using `project_write`. Keep the question numbering and choice letters. Put the answer key and a one-line rationale per answer at the bottom.
- Tell the user in one or two sentences what was saved and how many questions there are. Do not paste the full set back into chat.
- Clean obvious typos in the saved version, but never change the substance of a question or answer.

## 2. Run the quiz back and forth

- Ask one question at a time. Never send more than one question per turn.
- Keep every conversational turn under 450 characters, including explanations. Put longer material in an artifact instead of chat.
- Wait for the user's answer before grading. Grade in one of three ways: correct (confirm and add one reinforcing fact), partly correct (name the missing piece), or wrong (give the correct answer and the single reason it is correct, then move on).
- If the user says "not sure" or "none", teach the core idea in one or two sentences before the next question. Do not just reveal the letter.
- Track which concepts the user missed in this session and keep a short running list in the project doc or a `review/progress.md` file.
- Cover the concepts in rotation so that topics that repeat across questions get revisited, not just the first occurrence.

## 3. Build visualizations for missed concepts

- When the user misses a concept twice, or asks for a diagram, build an interactive HTML visualization. Load the artifact-design skill first.
- Each visualization should show the real mechanism (for example, frame flow across switches, or state changes over time), with controls the user can click through.
- Publish it with the Artifact tool and also save it to the project under `visualizations/<topic>.html` with `project_write` so it can be referenced later.
- Tell the user in one sentence what the visualization shows. Do not paste the URL unless asked.

## 4. Close out a topic

- When a topic's questions are done, summarize in no more than five short lines: what the user got right, what to revisit, and which visualization covers it.
- Ask at most one question about what to study next.

## Rules

- Never grade a question before the user answers it.
- Never write more than one question per turn.
- Keep the 450-character limit for conversational turns.
- Cite the source of any factual claim from the course material when you can, such as the chapter or question number.