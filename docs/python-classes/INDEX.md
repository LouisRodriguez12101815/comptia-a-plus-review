# Python class notes

Full-class notes generated from the course recordings (Classes 7–15). Each file covers the same ground the video covers — context, key concepts with code, best practices, common mistakes, and how it applies to capstone website development. The running course example is a lead-intake app whose functions later become AI-agent tools (Langflow / LangGraph), which is why several classes end with an agent-facing pattern.

| File | Class topic | Runtime | Core ideas |
| --- | --- | --- | --- |
| [class-07-loops.md](class-07-loops.md) | Loops | ~110 min | `for`/`while`, iteration model, `break`/`continue`, loop + conditional patterns |
| [class-08-functions-as-agent-tools.md](class-08-functions-as-agent-tools.md) | Functions as agent tools | ~124 min | `def`, parameters/returns, docstrings, turning functions into callable agent tools |
| [class-09-comprehensions-and-lambda.md](class-09-comprehensions-and-lambda.md) | Comprehensions & lambda | ~140 min | List/dict comprehensions, `lambda`, `sorted`/`map`/`filter`, cleaning batch data |
| [class-10-error-handling.md](class-10-error-handling.md) | Error handling & reliability | ~140 min | `try`/`except`, exception types, validator pattern in front of an agent |
| [class-12-modules-clip.md](class-12-modules-clip.md) | Modules (2-min clip only) | ~2 min | Clip has no lesson; module content reconstructed from the Class 15 recap |
| [class-13-numpy-arrays.md](class-13-numpy-arrays.md) | NumPy arrays | ~117 min | Vectorized math, `np.array`, aggregations, `summarize_leads` agent tool |
| [class-14-pandas-dataframes.md](class-14-pandas-dataframes.md) | Pandas DataFrames | ~142 min | `read_csv`, DataFrames vs list-of-dicts, `groupby`, human-in-the-loop agent pause |
| [class-15-capstone-agent.md](class-15-capstone-agent.md) | Capstone: pipeline to agent | ~125 min | 7-step pipeline (load→inspect→clean→validate→aggregate→report→suggest), grounded agents |

## Reading order

The course builds one app across classes, so the files read best in numeric order: 7 → 8 → 9 → 10 → (12) → 13 → 14 → 15. Class 15 is the payoff — it composes everything into a single pipeline — and its "where each piece came from" section is a map of the whole course.

## Capstone relevance

Every note ends with a capstone-website section: how the class's concepts map onto this repo's TypeScript codebase (the games, the subnet engine, the practice session scoring) and onto building a data-driven site generally. `docs/python-class-catchup.md` is the living record of which class concepts are already implemented in the site.
