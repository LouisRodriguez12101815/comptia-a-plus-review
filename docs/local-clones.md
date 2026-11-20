# Local clone inventory (2026-11-20)

Canonical working tree for SAA work and PRs:

- `/Users/louisrodriguez/Projects/comptia-a-plus-review-saa` — fresh clone of `origin/main`, feature work happens here.

Other copies found on this machine:

| Path | Git? | Notes |
| --- | --- | --- |
| `Projects/comptia-a-plus-review` | yes | Behind `origin/main`; old feature branches. Prefer not to use. |
| `Projects/comptia-review-live` | broken/minimal `.git` | Large content tree without normal git history. |
| `Documents/comptia-a-plus-review` | yes | Old multiplayer branch; far behind main. |
| `Projects/comptia/*` | mixed | Class exercise copies and extracts. |
| `Downloads/comptia-a-plus-review-main` | no | Zip extract; safe to delete. |

Cleanup policy: keep one git clone on main (or this SAA worktree), delete non-git extracts, archive or remove stale clones only after `git status` is clean and no unique uncommitted work remains.
