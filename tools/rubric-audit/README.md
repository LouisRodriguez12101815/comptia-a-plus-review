# Rubric audit

Answers one question: **for every line of the official exam objectives, does the site teach it?**

```
objectives PDF ──extract──▶ rubric CSV ─┐
topics / cards / questions /            ├─▶ match ─▶ judge (agent) ─▶ grades ─▶ summary, todo, history, report
visuals / drills ──flatten──▶ evidence CSV ┘
```

Run it with the [rubric-audit skill](../../.claude/skills/rubric-audit/SKILL.md). Quick start for an exam that already has a rubric CSV:

```
npm run audit:rubric -- prepare --exam 220-1202
# send each waiting batch to the rubric-grader agent
npm run audit:rubric -- finish  --exam 220-1202
npm run test:rubric-audit
```

## Where things are

| Path | What | Committed |
| --- | --- | --- |
| `data/rubric/<exam>.csv` | The objectives, one row per line, with parent and path | yes |
| `data/rubric/<exam>-acronyms.csv` | The exam's acronym list | yes |
| `results/<exam>/judgments.jsonl` | Cached grader answers, keyed by item and evidence hash | yes |
| `results/<exam>/notes-recheck.jsonl` | Cached second-look answers | yes |
| `results/<exam>/grades.csv` | One graded row per rubric item | yes |
| `results/<exam>/summary.csv` | Scores per objective | yes |
| `results/<exam>/todo.csv` | What to teach next, ranked | yes |
| `results/<exam>/acronyms.csv` | Acronym coverage | yes |
| `results/<exam>/history.csv` | One row per objective per run, for trends | yes |
| `results/<exam>/report.md` | Human-readable summary | yes |
| `out/<exam>/` | Evidence, matches, batches, answer files | no (rebuilt) |

Formats and why each was chosen: [docs/formats.md](docs/formats.md).

## Grades

`taught` (1.0): the material explains it well enough to answer a question on it. `mentioned` (0.5): named or listed without explanation. `absent` (0). Two views: `notes_grade` counts the notes only; `material_grade` also counts visuals, flashcards, questions and drills. Scores average leaf items per objective, objectives equally within a domain, domains by exam weight.

## Limits

Keyword retrieval can miss a synonym (the recall check and the notes recheck reduce this). Labs are not scanned. Rubric lists are examples, not exhaustive requirements. The rubric CSV is derived from CompTIA's PDF for personal study; keep it out of the public site.

## Adding another exam

`extract` and `verify` with the new PDF, then the same stages. If extraction differs (new column layout), adjust the constants at the top of `extract_rubric.py` and make `verify` pass.
