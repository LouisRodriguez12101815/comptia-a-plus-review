# Content disputes ("Report an error")

Every page has a **Report an error on this page** button in the footer. Quiz questions, flashcards, and visuals also have a **Dispute this…** link that opens the same form with the item prefilled. Highlighting text before opening the form fills in the item too.

## How a report flows

1. The visitor fills in category, item, what is wrong, a source, and an optional name. The page path and title are added automatically.
2. The browser posts to `/api/report` (`app/api/report/route.ts`).
3. The route checks: same-origin request, a hidden honeypot field, at least 3 seconds to fill the form, 5 reports per IP per 10 minutes (per server instance), a 12 KB size cap, and field validation (`lib/report/issue.ts`).
4. It creates a GitHub issue in the repo with the `content-dispute` label. User text is quoted, with `@mentions`, `#123` references, and HTML neutralised.
5. If no token is configured, or GitHub refuses, the visitor gets a link to the prefilled GitHub issue form (`.github/ISSUE_TEMPLATE/content-dispute.yml`) instead, so no report is lost.

## One-time setup (owner)

1. GitHub → Settings → Developer settings → Fine-grained personal access tokens → **Generate new token**.
   - Repository access: **Only select repositories** → `comptia-a-plus-review`.
   - Permissions: **Issues: Read and write** (Metadata: Read is added automatically). Nothing else.
   - Set an expiry and a calendar reminder to rotate it.
2. In the repo, create the label `content-dispute` (Issues → Labels → New label). Optional: the route retries without the label if it is missing.
3. Vercel → Project → Settings → Environment Variables:
   - `GITHUB_ISSUES_TOKEN` = the token (Production and Preview). Mark it **Sensitive**.
   - Optional `GITHUB_ISSUES_REPO` = `owner/repo` if issues should go to a different repo.
4. Redeploy. Submit a test report from a preview URL and confirm the issue appears.

## Triage

Filter issues by `label:content-dispute`. Check the claim against the current exam objectives (N10-009, 220-1201, 220-1202) and the course book. Fix the content (and add a fact to `scripts/content-facts.json` if it is a checkable claim), or reply with the source and close.
