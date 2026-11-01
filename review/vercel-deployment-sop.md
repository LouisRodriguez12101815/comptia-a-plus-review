# Vercel deployment SOP: CompTIA Certification Review Site

Manual prebuilt deployment workflow for reducing Vercel Build CPU usage.

**Current state:** automatic Git-triggered Vercel deployments are disabled. GitHub remains the source of truth. Production releases are built locally and uploaded with the Vercel CLI using prebuilt output.

## 1. What changed

- Automatic Vercel deployments from Git pushes are disabled with `git.deploymentEnabled` set to `false` in `vercel.json`.
- Feature-branch pushes no longer create automatic Preview deployments.
- Merges or pushes to `main` no longer create automatic Production builds.
- The production site is published intentionally from the local Mac using `vercel build --prod`, followed by `vercel deploy --prebuilt --prod`.
- The temporary test branch, temporary configuration branch, and extra worktree used during migration have been removed.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  }
}
```

## 2. Why the deployment process changed

The previous Git integration created frequent Preview and Production builds. That pattern consumed Vercel Build CPU minutes even when a hosted deployment was not needed for every incremental change. The new process moves compilation to the local development machine and reserves Vercel deployment for intentional releases.

| Activity | Previous behavior | Current behavior |
| --- | --- | --- |
| Feature push | Automatic Preview build | GitHub only; no Vercel deployment |
| Merge to `main` | Automatic Production build | GitHub only; no Vercel deployment |
| Production release | Triggered by Git | Explicit local build + prebuilt upload |
| Build workload | Vercel build machine | Local Mac |

## 3. Normal development workflow

1. Work locally and use the local development server.
   ```bash
   cd "$HOME/comptia-a-plus-review"
   npm run dev
   ```
2. Commit and push changes to GitHub as needed. These pushes should not create Vercel deployments.
   ```bash
   git add .
   git commit -m "Describe the change"
   git push
   ```
3. Continue using branches and pull requests normally. GitHub is still the source of truth for history, review, and merges.

## 4. Production release checklist

Use this sequence only when the public site should be updated. Run it from a clean, current checkout of `main`.

1. Confirm the working tree and branch before deploying.
   ```bash
   cd "$HOME/comptia-a-plus-review"
   git status --short --branch
   git switch main
   git fetch origin
   ```
2. Update `main`. If this command fails, stop and reconcile the branch before continuing.
   ```bash
   git pull --ff-only origin main
   ```
3. Run local validation before creating Vercel output.
   ```bash
   npm run lint &&
   npm run typecheck &&
   npm test
   ```
4. Pull the current Vercel production project settings and environment metadata.
   ```bash
   vercel pull --yes --environment=production
   ```
5. Build the production deployment locally.
   ```bash
   vercel build --prod
   ```
6. Upload the already-built output to Vercel and promote it to Production.
   ```bash
   vercel deploy --prebuilt --prod
   ```
7. Verify the protected production deployment through the Vercel CLI.
   ```bash
   vercel curl https://comptia-a-plus-review.vercel.app
   ```

**Recommended safety pattern:** chain validation and deployment steps with `&&` so the release stops immediately if linting, type checking, tests, the Vercel settings pull, or the local build fails.

```bash
npm run lint && npm run typecheck && npm test && vercel pull --yes --environment=production && vercel build --prod && vercel deploy --prebuilt --prod
```

## 5. Verification after deployment

- Run `vercel ls comptia-a-plus-review` and confirm the newest intended Production deployment is Ready.
- Use `vercel curl` with the full production URL, because Deployment Protection is enabled.
- Confirm key pages and dynamic routes behave correctly, especially any feature that depends on server-side environment variables.
- Do not treat a successful local Next.js compile alone as proof that all runtime integrations are healthy.

```bash
vercel ls comptia-a-plus-review
vercel curl https://comptia-a-plus-review.vercel.app
```

## 6. Environment-variable note

During `vercel pull`, Vercel may report that some secret values cannot be downloaded and may write `[SENSITIVE]` placeholders locally. The current project has successfully completed local builds and prebuilt deployments despite this warning. However, any future feature that needs one of those secrets at build time must be tested before release.

- Do not commit `.vercel/.env.production.local` or secret values to Git.
- If a new build-time integration is added, verify its required variables exist locally before relying on a prebuilt production release.
- Runtime-only secrets may still be supplied by Vercel at runtime even when they are not available during the local build.

## 7. Troubleshooting and stop conditions

| Symptom | What it means | Action |
| --- | --- | --- |
| `git pull --ff-only` fails | Local `main` is not a clean fast-forward of `origin/main`. | Stop. Inspect `git status` and reconcile local commits or changes before deploying. |
| Lint errors reference `.vercel/output` | ESLint is scanning generated Vercel artifacts. | Run lint before `vercel build`; optionally add `.vercel/` to ESLint ignores. |
| `vercel curl` says URL required | The command was run without a target. | Run `vercel curl` with the full production URL. |
| Preview appears after a Git push | Automatic Git deployment may have been re-enabled or the config changed. | Check `main:vercel.json` and the project Git settings before further pushes. |
| Build succeeds but site feature fails | The issue may be runtime config, secret access, or dynamic functionality. | Inspect the deployment and logs; verify affected routes before another release. |

## 8. What not to do

- Do not run `vercel deploy` without `--prebuilt` if the goal is to avoid a remote source build.
- Do not continue deploying after `git pull`, lint, typecheck, or tests fail.
- Do not paste JSON directly into the shell prompt. Write configuration files with an editor or a heredoc.
- Do not run `vercel build` for every commit. Build only when the public site should be updated.
- Do not assume old Preview entries in `vercel ls` indicate the new policy failed. Compare timestamps to the Git push being tested.

## 9. Recommended release command reference

Standard manual production release sequence, once `main` is clean and current:

```bash
cd "$HOME/comptia-a-plus-review"
git switch main
git fetch origin
git pull --ff-only origin main
npm run lint && npm run typecheck && npm test && vercel pull --yes --environment=production && vercel build --prod && vercel deploy --prebuilt --prod
vercel curl https://comptia-a-plus-review.vercel.app
```

## 10. Expected end state

- **Git activity:** commit, push, branch, and merge in GitHub without automatic Vercel builds.
- **Local validation:** run lint, typecheck, tests, and the production build on the Mac.
- **Production publishing:** upload `.vercel/output` intentionally with `vercel deploy --prebuilt --prod`.

**Operational rule:** GitHub changes are frequent; Vercel production deployments are intentional.
