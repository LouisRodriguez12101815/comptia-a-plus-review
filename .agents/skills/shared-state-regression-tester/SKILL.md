---
name: shared-state-regression-tester
description: Audit and test server-authoritative multiplayer progression, evidence, reconnects, scoring, and failure recovery through the existing room APIs and Twilio Sync. Use for stuck rooms, shared-state regressions, or multiplayer acceptance testing.
---

# Shared State Regression Tester

## Scope and safeguards

- Follow `AGENTS.md` and applicable nested instructions; read the relevant installed Next.js guide before application code changes.
- Keep work within the authorized task. Inspect and report before modifying code unless implementation is requested; do not require another approval for work already authorized.
- Preserve Guided Demo, Twilio integration, server-authoritative scoring, reconnects, duplicate protection and the daily cost guard. Add no services or dependencies without a task-specific reason.
- Never request or expose secret values. Never log credentials, tokens, cookies or request headers. Record only sanitized operation names, status codes, failure reasons and request IDs; do not dump API payloads or raw provider errors.
- Distinguish code inspection, automated tests, local browser testing, deployed browser testing and physical-device verification. Report unavailable tools and unperformed checks. Do not merge pull requests.

## Establish the target and state contract

1. Record branch/commit, environment, route `/game`, mode and served `/api/game/version` identity. Compare protocol/build identity in `lib/game/version.ts`; an unknown build SHA or successful deployment metadata does not prove which assets ran or that gameplay worked.
2. Read `docs/outage-ops-multiplayer.md`, `docs/outage-ops-hotfix-validation.md`, and `docs/gameplay-audit.md`. Inspect `lib/game/room-types.ts`, `lib/game/room-service.ts`, `lib/game/evidence-model.ts`, `lib/game/room-store.ts`, and `lib/game/room-api.ts`.
3. Trace `app/api/game/rooms/route.ts`, `app/api/game/rooms/[code]/route.ts`, and their join, ready, start, token, evidence, continue-evidence, actions, advance, next and leave route handlers. Check authenticated viewer identity, not player order or nickname alone.
4. Inspect subscriptions/polling in `app/components/game/MultiplayerRoom.tsx` and snapshot reconciliation in `lib/game/room-client.ts`. Inspect provider handling in `lib/game/provider-errors.ts`, daily guard in `lib/game/room-store.ts`, and signed usage handling in `lib/game/usage-webhook.ts`.

## Define and exercise invariants

Build a matrix with precondition, player action, server invariant, rendered outcome, recovery, test and evidence level. Trace create → join → token → GET → ready/start → discover → continue-evidence → submit → advance/next → final debrief in two isolated browser contexts. Exercise host and guest independently.

- Canonical persisted assignments drive rendered cards, counts and answer gating. Every required item exists and is actionable for its owner. Empty/invalid assignments show **Complete · 0/0**, never an impossible requirement. Compare each viewer's identity, assignment, card IDs, discovery status and gate using assertions; exclude sensitive payloads from logs.
- A shared item discovery satisfies every applicable owner without automatically awarding contribution points to passive owners. Discovered findings are shared; undiscovered private evidence is not exposed by diagrams or snapshots.
- One-player rooms remain playable. Missing, disconnected or idle players must have a recovery path in **every phase**, including lobby readiness/start, evidence, answer collection and advancement. Do not limit disconnect coverage to already-started rooms.
- The authorized host's visible timeout continuation works even with no valid card or no discovery. Its successful response immediately unlocks answer submission. Non-host and premature requests fail; no fabricated discovery credit is awarded.
- Reconnect preserves the authenticated player's identity, role and contributions. Exercise reconnect with the same isolated session, not a fresh player impersonating it.
- Scoring, authorization, deadlines and transitions remain server-authoritative. Duplicate/concurrent discoveries, answers, role actions, hints and advancement cannot award repeated credit or corrupt state. Exercise compare-and-swap contention; stale incident/step requests cannot affect the current phase.
- Cover expiration, failed token creation, service failures, subscription interruption, polling recovery and token refresh. Verify clear recoverable status and Guided Demo fallback. Retain daily-pause, signed webhook and read-only Sync permission tests.

## Use real routes and label mocks

- Inspect `tests/outage-ops-rooms.test.mjs`, `tests/outage-ops-evidence.test.mjs`, `tests/outage-ops-client.test.mjs`, and `tests/outage-ops-production.test.mjs`; run `npm run test:game`. Use the service's injected clock for deterministic timeout boundaries, including immediately before/at expiration. Never change a live server's clock to simulate acceptance.
- Primary browser walkthrough: after `npm run build`, run `npm run test:e2e -- --mock-sync`. If needed, supply `--browser` with an installed executable path. `scripts/verify-outage-ops-e2e.mjs` exercises real application API routes while `tests/fixtures/mock-sync.cjs` replaces external provider HTTP transport. Label this **local real-route verification with mocked Sync**, not live Twilio verification.
- `scripts/verify-outage-ops-client.mjs` and `scripts/verify-outage-ops-host-evidence.mjs` are supplemental fixture/bridge checks; inspect their interception before citing results. They cannot replace the primary real-route walkthrough.
- For an authorized configured dedicated test deployment, use `npm run test:e2e -- --url <dedicated-test-origin>` without `--mock-sync`, adding an available browser path if required. Obtain configuration through approved environment mechanisms, never secret values in chat. Do not run `scripts/setup-twilio-sync.mjs` merely to audit: provisioning mutates provider configuration.
- Existing primary browser timeout coverage uses actual elapsed server time; injected-clock regression tests supplement it. A desktop/phone viewport pair is not two physical devices. Never claim laptop-and-phone success until both devices joined the same deployed room, discovered evidence, submitted and advanced.
- For authorized fixes, run relevant regressions, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; rerun the affected complete browser trace.

## Report

Store detailed invariant matrices, sanitized reproduction steps and results in `docs/`; update the existing audit backlog only when documentation edits are authorized. For each finding record severity, route/mode, expected versus observed behavior, evidence, proposed correction, regression and remaining verification. Mark verified only when the reproduction stops failing in the named environment. Recommend one highest-impact fix with a concrete definition of done. A passing mock or deployment status does not close deployed-service or physical-device checks.
