# Fix Outage Ops answer selection, shuffling, and guided retries

The guided mission previously always displayed the correct answer first. Each question now starts unanswered with shuffled options, and correctness is checked using stable answer IDs and a separate `correctAnswerId`. Choosing an answer submits it and shows answer-specific feedback and mentor reasoning. An incorrect answer reveals a mentor hint and waits for the player to retry or continue.

Adds **Try again** without advancing or reordering the current question. Retries preserve hints and uptime penalties, and a question awards points at most once. Replay resets the mission and generates new answer orders.

Cherry-picked `c7b15a1` onto current `main` (`6dbda44`, the merge of MVP PR #4), producing `70a7c3a`. Resolved a README conflict by retaining the current README and adding the game and answer-flow documentation. The change contains the answer-flow fix, regression tests, and documentation; it does not reapply the MVP.

Validation on this branch:

- `npm run lint` passed with three existing image optimization warnings and no errors.
- `npx --no-install tsc --noEmit` passed.
- `npm run test:game` passed all six tests, including every possible answer order for all five incident questions.
- `npm run build` passed, including prerendering `/game`.

Branch: `fix/outage-ops-answer-flow`
Base: `main`

Do not merge without the repository owner's approval.
