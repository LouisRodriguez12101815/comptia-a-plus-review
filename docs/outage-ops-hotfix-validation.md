# Outage Ops hotfix evidence and validation

Investigation date: October 11, 2026. Branch: `hotfix/outage-ops-end-to-end`. Draft against main; do not merge.

## Deployment comparison

The initial environment checkout was `fa52bc87ad820d290f488d87fdca360919d58986`, after PR #14. GitHub and a refreshed fetch confirm current main is `b7c1f2154b68fb7ed211e5b5ea58249d1b652b0d`, including PR #16. The hotfix starts from that exact commit; its base tree matched `90d61785f6409dbd7ddff29aa77885482eee108e` before changes.

GitHub deployment record [6996565102](https://api.github.com/repos/LouisRodriguez12101815/comptia-a-plus-review/deployments/6996565102) is labeled `Production`, references `b7c1f2154b68fb7ed211e5b5ea58249d1b652b0d`, and reports `success`. Its status identifies [this immutable Vercel URL](https://comptia-a-plus-review-m57oeqssn-louis-projects-b5c89c35.vercel.app). The record's separate `production_environment` flag is false; the conclusion is specifically about the record labeled Production. This metadata does not independently verify the public alias or client assets.

| Merged PR | Head | Merge commit | Present in recorded Production SHA and main |
| --- | --- | --- | --- |
| #11 evidence gate | `d30d74a` | `e73d871` | Yes |
| #12 discoverable items | `c958af9` | `3c8c565` | Yes |
| #13 diagnostics | `acfcc0a` | `c443a0f` | Yes |
| #14 client flow | `b08f8f6` | `fa52bc8` | Yes |
| #16 host timeout | `83737ef` | `b7c1f21` | Yes |

The previous Production-labeled record, 6990349097, references `fa52bc8`. A successful Vercel commit status exists for both that commit and current main. No deployment was initiated by this investigation.

Two isolated Chromium contexts attempted the public Production `/game` page through the configured proxy; both failed at the network boundary before application interaction. A separate proxy check of both the public alias and immutable URL returned HTTP 403 on CONNECT. This is a proxy response, not a room/API or Twilio response. The environment reports no configured secrets, runtime variables or test Sync service bindings.

## Confirmed findings and limits

Current-main service tests pass the host-timeout behavior introduced in #16: invalid/missing items normalize to Complete 0/0; timeout overrides waive the host's own discovery and immediately open the answer gate. The older host-own-discovery checks in #11–#14 are confirmed historical blockers, already removed by #16. They cannot be presented as the cause of an outage on verified #16 code.

A separate corruption replay against the exact main source confirmed that a null entry in `evidenceAssignments` makes room retrieval throw while dereferencing assignment ownership. The canonical model now safely removes malformed entries and invalid IDs, persists normalized assignments through the existing revision-checked write, and derives actionable cards, counts and coverage together. A service regression checks the persisted Complete 0/0 result and absence of fabricated points. There is no evidence that this malformed state exists in the reported live rooms.

The earlier browser scripts replace game routes with a fixture bridge. Passing those tests did not establish integration of the production route handlers, cookie paths or Twilio SDK. The primary test added here retains all of those, mocking only external provider HTTP and browser realtime transport when explicitly requested.

**The actual deployed cause of the missing host card and blocked submission remains unconfirmed.** The host/guest authenticated viewer identities, stored live assignments, returned live cards, statuses and gates could not be collected because neither deployment was reachable. Outdated assets, alias drift, client/API incompatibility and provider authorization remain possibilities, not findings. The new no-store build/protocol endpoint and response headers make a future accessible trace concrete; incompatible snapshots prompt a reload instead of silently presenting an empty requirement.

## Changes

- Deterministic assignments remain frozen server-side in shared room state. One canonical model filters assignments and receipts and supplies cards, player counts, item ownership, connected coverage and answer eligibility. Empty/invalid assignments satisfy 0/0 without points; shared discovery satisfies every owner; missing/disconnected owners do not block. Existing authorization, CAS retries, deadlines, scoring, penalties, duplicate protection, roles, reconnects, Guided Demo and daily cost guard remain in effect.
- Preserve #16's prominent host timeout control and complete evidence waiver; make the empty-card message explicitly `Complete · 0/0`.
- Add build identity and protocol checks without logging request headers, credentials, cookies or tokens. Remove configuration/account booleans from server logs; retain operation/status/reason/request IDs.
- Add responsive, accessible network diagrams mapped to Lab 03/DNS notes and Lab 02/DHCP notes. Public infrastructure and interface labels identify investigation paths. Fault/test annotations are derived only from the authenticated player's assigned discovered cards; incorrect settings and routing repair commands are absent from the baseline diagram.
- Pin Playwright and add a primary real-route browser command. Explicit mock mode uses synthetic configuration and a test-only external HTTP fixture, never an application memory-store switch or API test bridge. File fault injection stays in the fixture. Test summaries include sanitized operation names, statuses, failure reasons and request IDs only.
- Make Node's test isolation mode explicit so this runtime reports every individual regression rather than seven file-level results.

## Validation

- `npm run lint`: passed, zero errors; three existing unrelated image warnings.
- `npm run typecheck`: passed.
- `npm test`: 83 individual tests passed, zero failures/skips. Covers host/join evidence, empty/invalid/malformed assignments, shared discoveries, disconnected/missing players, timeout override/authorization, submission, duplicate scoring, reconnects, Twilio-store revisions, penalties, roles, source mappings, privacy and cost guard.
- `npm run build`: attempted; default Turbopack failed because the execution environment blocks its helper port. `npm run build -- --webpack`: passed using Next's supported production compiler fallback and normal Google Fonts fetching. No mocked font/build responses.
- `npm run test:e2e -- --mock-sync --browser /usr/bin/chromium`: real-route tests cover two isolated laptop/phone viewport contexts completing all ten questions and both incidents, matching authenticated identities and persisted assignments/cards, discoveries, answers, advancement, duplicate-answer rejection, and responsive/private diagrams. They also cover actual visible timeout with invalid/no host card and valid-undiscovered host card, answer unlock within one second of the successful override response, no fabricated points, shared ownership, disconnected-owner exemption and reconnect identity. Provider HTTP and browser realtime transport are explicitly mocked; the SDK, route handlers, JWT, membership cookies, shared-store logic and CAS execute normally.

Both existing supplemental browser scripts also passed: client-flow recovery and all three host-timeout fixtures. They explicitly use mocked application routes and are supplemental only. Local browser contexts cannot certify physical-device acceptance.

## Live checks still pending

1. On an accessible machine, verify the public alias against the immutable deployment and Vercel's commit metadata; compare `/api/game/version`, the client's HTML/chunk URLs and API protocol. Existing deployments lack the new version endpoint until reviewed code is deployed, so Vercel metadata is required for that check.
2. In two isolated deployed sessions, trace create, join, token, GET, discovery, continue-evidence, answer and advance. Compare viewer identity, stored assignments, returned actionable cards/counts and gates internally; export only sanitized operations/statuses/reasons/request IDs.
3. Run the primary browser test without `--mock-sync` against a configured dedicated test deployment/Sync service, including subscription permissions and real realtime reconnect behavior.
4. Use an actual laptop and phone on the same deployed URL/room: both receive cards, discover, submit answers and advance; repeat the visible host timeout with evidence unavailable. Record device/browser versions and observed results. Multiplayer is not certified working until this succeeds.

No secret values are needed in chat. No merge is authorized or performed.
