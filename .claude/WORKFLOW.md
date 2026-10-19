# Claude workflow contract

Read this before applying any skill in `.claude/skills/` or any agent in `.claude/agents/`. The current user request and `AGENTS.md` (Next.js rules and the exam-coverage rule) take precedence over this file. These files are for Claude only; `.agents/` holds the separate copies other assistants use, and the two folders do not depend on each other.

## Authorization

- **Read-only assessment:** inspect, run non-mutating checks, and report inline. A suggested output path is not permission to write there.
- **Authorized implementation:** change only what was asked, keep unrelated work, and run the checks for the affected scope.
- **Shipping:** commit, push, open a pull request, publish or merge only when the current session asks for that action. Work on a branch; never push to `main`.
- Commands given to the author are zsh-safe, run from the repo root, with no inline `#` comments and no placeholders.

## Authority and evidence

- Official CompTIA objectives set **exam scope**. Record the exam code (220-1201, 220-1202, N10-009), the objectives version and the section used. Do not paste the objectives PDF into the site.
- Standards, RFCs, registries and vendor documentation set **technical behavior**.
- The author's book, class notes, saved keys and checker assertions are reviewable evidence, not final authority.
- A passing checker proves agreement with its own assertions, not truth. Keep exam scope, technical correctness, software behavior and learner outcomes separate.
- Never reproduce exam dumps or copy a book's review questions verbatim. Write original items that test the same objective.

## Repository map

| File | Shape |
| --- | --- |
| `content/topics.json` | List of topics: `id`, `group`, `examCodes`, `title`, `chapter`, `summary`, `concept`, `sections[]`. Each section has `id`, `title`, `blocks[]`. Block types: `paragraph {text}`, `bullets {items}`, `table {headers, rows}`, `callout {kind: tip, warning or critical; text}`, `code`. |
| `content/questions.json` | `id`, `topicId` (string or list), `prompt`, `choices` (4 by convention), `answer` (index, or list for choose-two), `explanation`, `weak`. |
| `content/flashcards.json` | `id`, `topicId`, `front`, `back`, `weak`. |
| `content/objectives.json` | `exams[].domains[].objectives[]` with `id`, `title`, `status` (covered, partial, missing), `topics`, optional `note`. Domain `weight` is the exam percentage. |
| `content/track-visuals.json` | Topic id to a list of `{file, title, description, group}` for `public/visuals/`. |
| `scripts/content-facts.json` | `facts`, `computed`, `pinChapters`, and `answerKeys` (question id to the exact text of the verified correct choice). |
| `public/visuals/*.html` | Standalone pages with navy console tokens on `:root`, dark tokens under `prefers-color-scheme` and `[data-theme="dark"]`, 44 px minimum button height, optional `visual-facts` block. |

New ids use a chapter or batch prefix, such as `q-ch13-01` and `fc-ch13-01`, and must be unique.

## Checks

| Command | Use |
| --- | --- |
| `npm run check:content` | Must report 0 errors. Read any new warning for the topics you touched (answer balance, choice count, explanation vs key). |
| `npm run report:objectives` | Coverage per objective. Re-run after mapping changes. |
| `npm run audit:visuals -- --check` | Validates `visual-facts` blocks. |
| `node --test tests/<file>.test.mjs` | The npm test scripts pass `--test-isolation=none`, which older Node rejects with "bad option". Run the test files directly when that happens. |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | For app code changes. |
| `npm run test:a11y -- --url http://127.0.0.1:3000` | axe on the main routes, with `npm run dev` running. |

`tests/objectives.test.mjs` pins the note, card, quiz and lab counts for 220-1201 objective 5.3. Adding items to that objective means updating the pinned numbers in the same change, deliberately.

## Agents

Agents in `.claude/agents/` are report-only unless their file says otherwise. The caller verifies each finding before presenting it as confirmed or changing content. Agent output is model output, not an independent source.
