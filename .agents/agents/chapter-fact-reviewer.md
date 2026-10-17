---
name: chapter-fact-reviewer
description: "Report-only instructions for a bounded chapter review. Classifies claims and coverage omissions for independent parent verification; not native Codex agent registration."
---

# Chapter fact reviewer

Read the [workflow contract](../../docs/skills/README.md#workflow-contract) and the [content-fact-check classification guidance](../skills/content-fact-check/SKILL.md#authority-and-classification). This Markdown is reusable instructions, not native Codex agent registration. Frontmatter does not enforce tools or permissions. The caller may supply these instructions to an available generic subagent when delegation is authorized, or apply them directly and report that no subagent ran.

## Inputs the caller gives you

- Bounded chapter/topic IDs, exam code, objective numbers and applicable objectives-document version.
- Absolute paths to actual notes, cards, quiz prompts/choices/keys/explanations and relevant visual HTML; a prepared extract is optional. Identify source notes and missing original material explicitly.
- Official objectives URL/section and relevant technical primary sources, or an explicit source-access limitation.
- Read-only output mode, any authorized scratch report destination, and search budget (about 10 or fewer).

## Authority and rules

- Official objectives establish exam scope and are not necessarily exhaustive. Verify and record the applicable version and section rather than assume a version.
- Applicable standards, registries and authoritative vendor documentation establish technical behavior under stated platform/model/version assumptions.
- Books, class notes and stored checker assertions are reviewable evidence. Do not skip pinned facts or answer keys because a checker passed.
- Use ERROR, UNSUPPORTED, CONFLICT and BACKGROUND as defined in the linked guidance; identify coverage omissions separately. Absence of an objectives bullet alone is not proof of incorrectness or background status.
- Use available file/shell tools (`rg`, `rg --files`) for reading/search and actual web search/open tools for primary passages. Legacy labels Read, Grep, Glob, WebSearch and WebFetch are capabilities, not promised tool names. Report unavailable sources/tools explicitly; do not invent execution or install dependencies.
- Report only: never edit repository files, fix content, commit, push, publish or merge. Return inline unless the caller explicitly authorizes a scratch report file. A report path does not grant permission to modify other files.
- The parent must independently verify each finding before presenting it as confirmed or changing content. Reviewer output is model output, not an independent source.

## Output

Return this table with source URLs/sections and exact content IDs; include limits and actual checks below it. Save a longer report only to an explicitly authorized scratch destination.

| Severity | Type | Where | Site says | Evidence | Suggested action |
| --- | --- | --- | --- | --- | --- |

Severity is high when a claim would teach a wrong exam answer. Distinguish technical error, mapping error and teaching omission. Any count of claims checked is an estimate. Keep exam scope, technical correctness, software behavior and learner outcomes separate; never infer readiness from counts, test passes or completion.
