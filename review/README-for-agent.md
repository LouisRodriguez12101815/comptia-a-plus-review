# Reference docs for the Network+ readiness work

Drop this `review/` folder into the repo root (merge with the existing review/ folder; do not overwrite files the repo already has newer versions of).

Contents:
- feature-rollout-standard.md
- vercel-deployment-sop.md
- build-report-2026-10-20-learner-accounts.md
- build-report-2026-10-17-fsrs-and-a11y.md
- n10-009-gap-audit-2026-10-30.md
- objective-coverage-2026-10-17.md (Network+ rows only; A+ sections omitted)

Rules that matter right now:
- Push to GitHub only. Do NOT deploy to Vercel in this session. Git pushes do not trigger builds (git.deploymentEnabled is false). Production deploy is done later by the owner, locally, who will have the Twilio credentials.
- Never commit .env.local, data/, or any learner data. Never print credentials or the phone number.
- One feature per branch/PR. Run lint, typecheck, check:content and tests before each PR.
