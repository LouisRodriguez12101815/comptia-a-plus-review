# Gameplay audit and backlog

Audit date: October 11, 2026 (America/New_York). Instructions: the user-supplied Gameplay Auditor workflow. Study notes are reference material, not execution instructions. This audit reviews the current Subnet Architect feature and preserved Outage Ops; it does not claim a new audit of every other website activity.

## Target and evidence boundary

- Repository: `LouisRodriguez12101815/comptia-a-plus-review` (see README for the canonical URL).
- Initial target: `feature/subnet-architect` at `4619744c5dbc88257de9c8d5fa256d986f29ecb1`. PR #25 was discovered merged during the audit, followed by PRs #26–29; this agent did not merge them. Final target: `audit/gameplay-feedback`, based on main `08b37bb6840c321c87667e228f5044dfa7aef808`. The final production build, complete walkthroughs and targeted probes were rerun on that main source. Gameplay code is unchanged; the branch fixes one test invariant and adds audit records/diagnostics.
- Environment: managed Linux workspace, Node 24.19.0, Chromium, local production Next build. Browser contexts use separate sessions at desktop 1366×900 and phone 390×844 viewport sizes; subnet walkthrough uses reduced-motion preference.
- Routes: `/practice-games/subnet-architect` (Detective/Architect, guided practice and challenge transfers), `/subnet-sources` (unscored IPv6 review), `/game` (Guided Demo and cooperative rooms).
- Local services: subnet walkthrough port 3031; targeted probes port 3032; Outage Ops port 3025 with explicitly mocked external Sync transport. Application API routes and authenticated cookies are real; no game-route or state bridge in these primary walkthroughs.
- Actual local `/api/game/version` reports `buildCommit: unknown`, protocol 3. The checked-out commit and build workflow identify the local source, but the running endpoint does not attest its SHA. Do not report a verified served commit from that response.
- Managed runtime observations were current and network policy enforced, with no configured service secrets or outbound identities. The production Vercel destination is outside the allowed host policy. No deployed browser or physical laptop/phone verification was performed in this audit.

| Evidence level | This audit |
| --- | --- |
| Code inspection | Repository instructions, existing audit records, subnet reducers/grading/UI, room UI/service contracts, scenario/source mapping and focus/reduced-motion styles |
| Automated regression | Initial feature commit: all 127 tests pass. Current main first failed one practice invariant (GA-05) and stopped before subnet tests; after its focused test correction, all 127 tests pass; Python fixture verification included |
| Local rendered browser | Fresh complete subnet walkthrough, targeted feedback/keyboard probes and unconfigured room error/retry check |
| Local multiplayer with mocked provider | Fresh Guided Demo plus two isolated players through both incidents, real API routes, timeout/disconnect/reconnect and duplicate checks |
| Deployed browser | Not performed; no running Production SHA, assets, subscriptions or authenticated two-player trace established |
| Physical laptop and phone | Not performed; emulated viewport sizes are not physical-device acceptance |

Fresh current-main lint (three existing image warnings), typecheck and production build passed. Test and browser results are stated separately below; no gameplay fix is implemented for GA-01–04. The initial feature validation remains in [Subnet Architect validation](subnet-architect.md). The first attempt to start the mocked walkthrough timed out in automatic permission approval; the permitted single retry ran successfully. This was an approval timeout, not an application failure.

## Complete player trace

### Subnet Detective

| Phase | Visible experience / action | Validation and feedback | Unlock and recovery |
| --- | --- | --- | --- |
| Entry | Source exercise, guided/challenge buttons, resume and storage explanation | Solo browser model; no server or room authorization is involved | Start or restore a valid latest run |
| Mask | Given IP/prefix, boundary octet, mask/block inputs; optional priced binary hint | Pure IPv4 arithmetic validates both fields; specific errors; one successful award | Both correct → Continue. Edit/retry on error. Repeated historical errors have GA-01 below |
| Bounds | Network and broadcast inputs | Compares aligned network and last address | Both correct → Continue; invalid octets and off-boundary values explain recovery |
| Usable range | First/last usable inputs | Excludes conventional network/broadcast | Both correct → Continue; revise wrong bounds |
| Capacity | Host count and given-address classification | Validates `2^(32-p)-2` and boundary status | Correct → context decision; transfer correctly treats .63/26 as broadcast |
| Context | Explained choices; hint still available | Correctness by stable choice ID; immediate explanation; incorrect choices remain retryable | Supported choice → Open debrief. The hint has GA-02 below |
| Debrief/review | Separate first attempts, retries, hints, completion, points; actual errors; note/lab links | No repeated correct credit; assisted completion is not proficiency | Source review/return/resume works; new boundary problem checks application; scoped reset is cancellable |

A complete source problem after mistakes and a hint earned 475, with two unique retries; a new unaided boundary transfer completed. Both observations were freshly rerun. The context question repeats in that transfer (GA-03), so its new-application evidence is limited to subnet arithmetic/address validity.

### VLSM Architect

| Phase | Visible experience / action | Validation and feedback | Unlock and recovery |
| --- | --- | --- | --- |
| Entry/order | Parent, gateway-inclusive requirements, logical topology, tap/keyboard reorder buttons | Requires every segment once in descending usable demand; equal-size links may swap | Correct → prefixes; wrong order can be corrected without restarting |
| Prefixes | Seven numeric prefixes with requirements | Sufficient usable capacity, total sizes fit parent, links exactly /30 | Valid set → allocation; undersized /25 for A is explained and recoverable |
| Allocation | Network/gateway/link-peer inputs; address-space preview | Alignment, capacity, containment, overlap, reservations, distinct link interfaces and previously selected prefixes | Valid layout → reasoning; misalignment and overlap identify the segment. Fields and hints survive reload/resume |
| Reason/context | Explained verification decision and IPv4 context choice | Checks constraints rather than exact sample matching | Correct → debrief; wrong choices remain available for recovery |
| Debrief/transfer | Validated layout, actual interface addresses, allocated/unallocated counts, errors and review | Alternative B/C /25 locations pass; assisted results are labeled | New parent and requirements complete independently; no cumulative point bank |

The starter after deliberate wrong order, insufficient capacity, misalignment, overlap and wrong decisions earned 450 with two hints and six unique retries. Both starter and new-parent transfer reached debrief. The SVG preview is labeled as a preview, not proof of validity; exact readable ranges are also provided as text.

### Outage Ops Guided Demo and cooperative rooms

| Phase | Visible action | Server validation / feedback | Unlock and recovery |
| --- | --- | --- | --- |
| Entry / create / join | Call sign and room code; lobby and participants | Real create/join routes establish distinct authenticated viewers; host matches host ID | Mark ready → host Start. Without configuration, create returns 503 `configuration_missing`, visible explanation and re-enabled retry |
| Token / room updates | Shared state, connection status, fallback polling | Real token route and viewer binding; mocked realtime is unavailable, so API reconciliation keeps state current | Polling continues gameplay locally; actual provider authorization/subscriptions remain unverified |
| Evidence | Each player sees one actionable assigned card; no clue text exposed before discovery | Authenticated viewer, stored assignment and returned cards match; actual discovery route creates receipts | Shared findings appear after discoveries; answers unlock when canonical requirements are satisfied |
| Empty/shared/disconnected evidence | Complete 0/0, shared owners, or disconnected status/outstanding requirements | Fault injections occur only in external provider fixture; no automatic contribution awarded to other owners | Empty requirements complete; one shared discovery satisfies owners; stale disconnected player stops blocking |
| Visible timeout | Prominent host continuation for missing/undiscovered host evidence | Real continue-evidence response waives current evidence gate without discovery points | Submission becomes immediately possible after documented timeout, even without a host card/discovery |
| Decision / role finding | Explained answers and optional justified publication | Correct decision authorizes role finding; wrong answer penalized once; repeated answer returns 409 without repeat penalty/credit | Different supported choice recovers; correct feedback shows consequence and What we learned |
| Advance / next incident | Host Continue mission, incident debrief and role rotation | Host authorization, deadline and current indices remain server-controlled; score changes once | Both clients advance; second incident starts and both finish final debrief |
| Reconnect | Saved player identity and current requirements | Authenticated identity and contribution preserved by real routes | Undiscovered requirement returns unless already waived; player can discover and submit |
| Final review | Reconstruction, individual contributions, actual misconceptions, source links and transfer prompt | DNS source Lab 03 and relay source Lab 02 support current scenarios; pending Miami lease test is not reported complete | Follow-up is a discussion prompt, not a graded transfer assessment |

Both isolated players discovered, answered and advanced through all ten decisions across both incidents. Guided Demo completed all five DNS decisions after an incorrect choice and retry; incorrect feedback did not permit premature Continue. The shared transport fixture proves these local state and UI paths, not live Twilio configuration or cross-device behavior.

## Visual, accessibility and learning observations

- Phone viewport walkthroughs found no horizontal page overflow in the tested subnet decisions/debriefs or Outage diagrams. Exact address-space labels have a readable text list in addition to the scaled SVG.
- Targeted keyboard test moved from mask to block-size input using Tab, with a visible solid focus outline and a control height of at least 44px. Reorder actions have segment-specific accessible button labels. This is a spot check, not a full keyboard-only or screen-reader certification.
- Statuses pair color with words/icons. Typed inputs and buttons avoid mandatory hover, motion or dragging. Reduced-motion preference was used in the subnet walkthrough; the diagrams are static and existing global motion overrides were inspected. Comprehensive contrast measurements and assistive-technology testing remain pending.
- Current DNS/relay decisions practice scope, discriminating tests, evidence interpretation, targeted change and verification/documentation. The source's pending lease outcome is preserved. Selected answers are constrained reasoning opportunities, not execution of a repair or proof of mastery.
- Source uncertainty is documented: ten readable subnet headers plus authored transfers are used; narrow strips 2/4/6 and Chapter 8 remain unavailable. They are not graded. The new rendered Chapter 7 note conflicts with the prior correction audit (GA-04). This is confirmed conflicting educational guidance, not a measured learner misunderstanding.

## Open findings / backlog

GA-01–04 below are **reproduced and open**, not verified fixes. GA-05 is a locally verified test correction. Neither points nor passing completion tests imply that they are resolved.

Priority order: GA-04 (misleading learning guidance), GA-01 (wrong feedback), GA-02 (unhelpful paid hint), GA-03 (limited transfer evidence). GA-05 is a corrected validation issue; the separate live acceptance gap is not ranked as a confirmed gameplay bug.

### GA-04 — High: new Chapter 7 notes contradict verified subnet guidance

- **Route/mode:** `/notes/n10-ch7`, learning review outside the solo game; introduced on main by PR #29. Its lesson can conflict with the game’s explicit classless assumptions.
- **Reproduction:** Open IP Addressing → Which private range should you use? Read the corporate-network rule and /24 count, then compare `/subnet-sources` and the source audit.
- **Expected:** Explain historical classes as context; choose RFC 1918 space/prefixes from requirements. State the parent `10.0.0.0/8` when calculating 65,536 /24 children.
- **Observed:** Rendered text says consultants use Class A for a corporate network “of any size,” and states “10.0.0.0 with a /24 mask gives 65,536 networks” without an explicit parent. The game’s source review expressly corrects both formulations. The Chapter 7 APIPA bullet also includes automatic-selection addresses within the reserved first/last /24 portions; this was identified by code/reference inspection, not a simulated DHCP exchange.
- **Evidence:** Rendered probe `universal_class_default_guidance_confirmed`; `content/topics-network-plus.json`, `n10-ch7`, `choosing-private` and `public-private`; compare [the existing corrections and inspected RFC references](subnet-source-verification.md#corrections-to-chapter-7-concepts). RFC 3927 section 2.1 excludes the first and last 256 addresses from automatic selection. Additional primary material was not newly fetched through this environment’s restricted policy.
- **Correction:** Ask the content author to review the unsupported universal recommendation; replace it with requirements-based guidance, qualify the /8 parent, and distinguish the full link-local prefix from the automatic-selection range. Keep historical class knowledge contextual.
- **Regression:** Content assertions must require an explicit parent for that count and prevent the universal sizing rule; a source-review walkthrough must present consistent note/game explanations. Check any corresponding flashcards/questions for the same claims.
- **Still required:** Author confirmation and a focused correction with primary-reference review; do not interpret automated source-text checks as proof of understanding.

### GA-01 — Medium: feedback belongs to another wrong submission

- **Route/mode:** `/practice-games/subnet-architect`, Detective Challenge; shared submit/render pattern also serves guided and Architect modes, but those repetitions were not separately reproduced.
- **Reproduction:** On 151.37.151.53/23, submit mask `255.255.255.0`, block `2`; then submit correct mask `255.255.254.0`, wrong block `3`; then resubmit the original wrong-mask/block pair.
- **Expected:** No duplicate retry/points, while feedback identifies the currently submitted mask error.
- **Observed:** Current input has the wrong mask and correct increment, but the displayed error still says to reconsider block size. A correct final submission remains recoverable.
- **Evidence:** Targeted rendered-browser probe and screenshot; `submitRun` returns unchanged state for an old fingerprint (`lib/subnet/session.ts:41`), while `SubnetGame` grades the last unique receipt (`app/components/subnet/SubnetGame.tsx:21`). Diagnostic result: `stale_feedback_confirmed`.
- **Correction:** Separate the most recent submitted payload used for display from deduplicated scoring/attempt receipts. Validate the current submission for feedback even when it is a duplicate; do not append duplicate attempts or award points.
- **Regression:** Browser sequence wrong-mask → wrong-increment → first wrong-mask again must show mask feedback with unchanged retry/score counts; correcting it must unlock Continue. Include allocation/reason feedback if the implementation is shared.
- **Still required:** Implement and rerun that exact sequence in guided/challenge, reload/resume and the complete primary browser walkthrough. Real-device reading/interaction remains separate.

### GA-02 — Medium: paid hint does not address the context decision

- **Route/mode:** `/practice-games/subnet-architect`, Detective Challenge, Chapter 7 concept check after the four arithmetic stages.
- **Reproduction:** Reach the IPv4 width question and choose Use hint before submitting a choice.
- **Expected:** A hint distinguishes IPv4 from IPv6 or guides reasoning about the current concept; the displayed cost remains clear.
- **Observed:** Hint discusses converting prefix bits, block alignment and first/last reservations, while the question asks IPv4 width. It costs 25 potential points without useful guidance for that question. Correct choice still advances.
- **Evidence:** Rendered probe `unrelated_hint_confirmed`; conditional hint in `SubnetGame.tsx` selects by activity rather than stage/concept. Architect uses its prefix-selection hint during reason/context too by code inspection.
- **Correction:** Put task-specific hints beside the stable concept/stage data and select by active stage; preserve existing priced hint receipt and scoring behavior.
- **Regression:** Cover all five context concepts and Architect order/prefix/allocation/reason; assert relevant hint text, one cost per stage, unchanged first-attempt correctness and successful recovery.
- **Still required:** Implement, independently review factual wording against cited references, and rerun hint/answer/debrief flows. Learners must assess whether hints actually help reasoning.

### GA-03 — Low: the transfer repeats the context question

- **Route/mode:** Detective source exercise img1-01 and `detective-transfer` Challenge; Architect starter/transfer repeat by code inspection.
- **Reproduction:** Complete the source problem and choose the new transfer; after its new arithmetic stages, observe the concept choices.
- **Expected:** A new application of the claimed context objective, or a label explaining that only the arithmetic/allocation is a new transfer.
- **Observed:** The same IPv4-width prompt and answer IDs reappear, so that scored interaction is familiar recall. Arithmetic/address classification and the new-parent design are genuinely different problems; the UI correctly avoids an enduring-mastery claim.
- **Evidence:** Rendered probe `same_context_question_confirmed`; `getConcept` uses the first source concept when the transfer ID is absent from the source exercise list (`lib/subnet/session.ts:10`).
- **Correction:** Add a source-supported applied context variant for transfers, or explicitly limit independent-transfer feedback to the new subnet/allocation objectives and treat repeated context as review.
- **Regression:** Assert distinct applied context IDs/prompt for transfers, or assert objective-specific transfer reporting excludes familiar context. Continue testing first attempts and hint use separately.
- **Still required:** Content author review and learner transfer testing; a finite replayable bank is not an assessment of retained understanding.

### GA-05 — Low: expanded review deck broke a rigid validation invariant (verified locally)

- **Route/mode:** Automated `tests/practice-mission.test.mjs`, content/source integrity check for `/practice-games/next-hop-mission` review links.
- **Reproduction:** On main `08b37bb`, run `npm test`; practice test asserts three total n10-ch9 cards, while PR #26 expanded the deck to thirteen.
- **Expected:** Confirm that the three required mission cards still exist uniquely in the linked Chapter 9 deck; additional relevant cards should not invalidate the mission.
- **Observed before correction:** Assertion `13 !== 3`; npm test stops before the subnet suite. No learner progression failure follows from this assertion alone.
- **Evidence:** Fresh current-main failed run; the linked topic still contains `fc-next-hop-1`, `fc-next-hop-2`, `fc-next-hop-3` plus ten new cards.
- **Correction implemented:** Parse the actual review-link topic, require each stable mission card exactly once, and retain meaningful explanation checks. Gameplay/content is unchanged.
- **Regression/verification:** The previously failing content test and all 127 tests now pass. Missing or duplicate required cards still fail the assertion; unrelated deck growth is allowed. Final lint/typecheck/build/browser results are recorded above.
- **Still required:** No claim of learner or Production verification follows from this test correction.

## Acceptance gaps carried forward

- **High release-verification gap, not a confirmed live bug:** Actual Production code/asset identity, client/API compatibility, real Sync token permissions/subscriptions and laptop/phone shared-room progression remain unverified. Existing live acceptance checklist remains in [multiplayer documentation](outage-ops-multiplayer.md#required-laptopphone-acceptance-test), with deployment-access limitations in [hotfix validation](outage-ops-hotfix-validation.md). Configure a dedicated test service through secret configuration; never supply secrets in chat. Run real-route configured-service tests, then physical-device acceptance before declaring deployed multiplayer operational.
- **Learning/accessibility gap:** Reading load, teamwork quality, full keyboard-only completion, contrast/screen readers, physical touch interactions and retained application need actual learner/device testing. Automated completion does not prove learning.
- Existing unresolved source/image records stay open in [the source audit](subnet-source-verification.md).

## Reproduce this audit

`npm test`; after a production build, `npm run test:e2e:subnet -- --browser /usr/bin/chromium` and `npm run test:e2e -- --mock-sync --browser /usr/bin/chromium`.

For the feedback diagnostic, start `npm run start -- --hostname 127.0.0.1 --port 3032`, then run `node scripts/audit-subnet-feedback.mjs`. This records observed reasons under `work/gameplay-audit-probes.json` and a screenshot; it is a diagnostic, **not** a passing regression assertion. It uses rendered UI only. Local room traces contain sanitized operation names, status codes, failure reasons and request IDs; no credentials, tokens, cookies or headers are printed.

## Recommended next fix and definition of done

Address **GA-04** next: align the newly added Chapter 7 review with the game’s verified CIDR/RFC guidance. Done means the content author has reviewed the unsupported universal sizing rule; rendered notes explicitly name the /8 parent, correctly distinguish link-local scope from automatic-selection bounds, and agree with `/subnet-sources`; related flashcards/questions are checked; meaningful source regressions, lint, typecheck, all tests, build and the source-review browser walkthrough pass. Mark it verified only after those exact reproductions no longer fail in the named local environment. Production/device and learner verification remain separate.


## OO-01 · Disconnected unready guest prevents lobby start

Severity: impossible progression. Route `/game`, cooperative lobby. Follow-up fix on `fix/disconnected-lobby-recovery`, based on main `3bf1fc1`.

Reproduction: create as host, join as guest, mark only the host ready, then stop guest heartbeats for the existing 30-second absence threshold. Original UI disabled start and the service returned 409 requiring every stored player ready. Post-start evidence continuation could not recover a lobby. The new deterministic regression reproduced this failure before implementation.

Correction: server-projected readiness/presence gate; prominent host-only **Continue with connected players** with excluded-player names; atomic start excludes only absent players while connected unready players remain blockers. Late reconnect keeps authenticated identity/contributions as a campaign observer, Complete · 0/0, without evidence or answer requirements. See [contract and validation](outage-ops-lobby-recovery.md).

Regression: threshold boundaries, connected unready rejection, reconnect before/after recovery, CAS start/reconnect races, repeat start/answer scoring, remaining actionable evidence and both incidents through final debrief. **Verified locally with mocked external Sync and real application API routes**: the two-context rendered reproduction no longer deadlocks; the host completes the campaign and the returned guest observes the final debrief. Ordinary two-player and Guided Demo flows also pass.

Deployed/physical-device status: pending. Do not mark Production or laptop/phone acceptance verified from this local result.
