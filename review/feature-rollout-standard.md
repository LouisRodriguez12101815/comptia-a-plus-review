# Feature rollout standard

How a change goes from an idea to the live site at the lowest cost. This is the process used for the Core 2 work in October 2026, where several PRs were batched into one deploy that added about $0.07 of Vercel build CPU.

## Principles

1. **One feature per branch and per pull request.** Small PRs are easier to review, test and roll back.
2. **Nothing builds on Vercel when you push.** `vercel.json` sets `"git": { "deploymentEnabled": false }`, so pushes and merges do not start cloud builds. Keep it that way.
3. **Build on your own machine, deploy the result.** `vercel build --prod` runs locally and `vercel deploy --prebuilt` uploads the finished output, so Vercel does not rebuild it.
4. **Batch merges, then deploy once.** Merge several finished PRs, then deploy. Do not deploy after every PR.
5. **Measure before and after a change that could affect speed or build size.** Record the numbers in the PR description.

## 1. Start a feature

```bash
git switch main && git pull --ff-only origin main
git switch -c <short-feature-name>
```

Use a name that says what the change does, such as `core2-feedback-loop` or `quiz-rotation`.

When an assistant prepares the change in its own sandbox, it delivers a patch file into the `Claude outputs` folder of this repository. That folder is excluded locally with `echo "Claude outputs/" >> .git/info/exclude`, so the patches never get committed. Apply one with:

```bash
git am "Claude outputs/<patch-file>.patch"
```

## 2. Check the change before opening a PR

```bash
npm run lint && npm run typecheck && npm run check:content && npm test
```

The bar for every PR:

| Check | Required result |
| --- | --- |
| `npm run lint` | 0 errors. Do not add new warnings. |
| `npm run typecheck` | Passes. |
| `npm run check:content` | 0 errors. Do not add new warnings for the content you changed. |
| `npm test` | Every suite passes. |
| Pages you changed | Load in a phone-sized browser with no sideways scrolling and no script errors. |
| Accessibility | An axe scan of new or changed pages reports no violations. |

Content changes also follow these rules:

- Questions, notes, flashcards and labs are original. Never copy a course's or video's questions or wording, and never use sources that claim to show real exam questions.
- Video transcripts stay in `sources/private/`, which Git ignores. Only the original material written from them is committed. Log each video and each ingest step on the Assessment workflow page (see `docs/assessment-workflow.md`).
- Every question has four choices, an explanation that contains the exact correct answer text, and an objective tag.

## 3. Open the pull request

```bash
git push -u origin <short-feature-name>
gh pr create --base main --head <short-feature-name> --title "<what the change does>" --body "<summary>"
```

The PR description should say:

- what changed and why
- how it was checked (the commands above and any browser checks)
- the build impact when relevant, such as pages generated or JavaScript per page before and after

The **Checks** workflow in `.github/workflows/checks.yml` runs lint, typecheck, the content check and the tests on every PR. Merge only when it passes.

If GitHub refuses to push a change under `.github/workflows/`, your login lacks the `workflow` permission. Run `gh auth refresh -h github.com -s workflow` once, then push again.

## 4. Merge, then batch the deploy

```bash
gh pr merge <number> --merge
gh pr list --state open
```

Deploy when a batch of merged PRs is ready, usually once at the end of a work session. Before deploying:

```bash
git switch main && git pull --ff-only origin main
git status --short
npm run lint && npm run typecheck && npm run check:content && npm test
```

`git status --short` should print nothing.

## 5. Deploy

```bash
vercel pull --yes --environment=production
vercel build --prod && vercel deploy --prebuilt --prod --archive=tgz
```

- `vercel pull` is only needed when environment variables or project settings changed. It warns that sensitive values cannot be downloaded and writes placeholders. That is expected.
- Let `vercel build` run to the end. It is done when `vercel deploy` prints the production URL and says it is aliased to `comptia-a-plus-review.vercel.app`.
- `--archive=tgz` is required because the output has more than 15,000 files.

## 6. Check the live site

```bash
for p in / /search?q=DHCP /glossary /core2/visuals /quiz /test /scorecard /notes/core2-macos /sitemap.xml; do
  printf "%-30s " "$p"; vercel curl "https://comptia-a-plus-review.vercel.app$p" -- -s -o /dev/null -w "%{http_code}\n"
done
```

Every page should return `200`. Add the pages your batch changed to the list. Open the Outage Ops multiplayer game once after any deploy that pulled environment variables.

## 7. If something breaks

Return production to the previous deployment, then fix the problem on a new branch:

```bash
vercel rollback
```

## Keeping build cost low

- **Do not prerender large page sets that most visitors never open.** Notes topics render on first visit and are cached (`dynamicParams` in `app/[locale]/notes/[id]/page.tsx`). Apply the same pattern to any new route with many generated pages.
- **Keep content data out of shared components.** The header and certification bar import `lib/track-meta.ts`, which has no content imports. Client components shared across every page must not import `lib/content` or the large JSON files.
- **Watch the build summary.** The "Generating static pages (N/N)" count and build time show the effect of a change. As a reference, the October 2026 deploy generated 702 static pages in about 10 seconds.
- **Check the Vercel usage page** after a deploy that changes routes, to confirm the cost stayed in line.
