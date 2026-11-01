# Build report: Network+ explanation polish and related links (2026-11-01)

Branch `content/n10-explanation-polish`, base `be7a917` from origin/main after #172 merged. #173 was still open at inspection: this branch includes polished versions of its 38 explanations plus the three other remote-access explanations corrected in #172, **41 unique questions**. It supersedes #173's content instead of depending on that unmerged branch. No merge, Vercel operation, secret or learner-data access.

## Added / changed

- Each explanation opens with a definition in plain words before applying the answer. Named option lines replace generic “Other option” prefixes. Hooks are spoken mnemonics or concrete pictures; each Common trap line names the tempting wrong thought. Forwarding chips, learned destinations and packet wrappers replace unexplained ASIC/known-unicast/decapsulation jargon.
- All 41 are **72–102 words** including related-link labels and path tokens, with every exact keyed answer string retained. IDs, prompts, choices, correct-answer values, objective tags, weak flags, topic assignments and question ordering are unchanged against the merged base.
- Related concepts now use descriptive authored links: `[label](/notes/topic#section)`. All 41 pointers map to **31 distinct valid route-and-anchor targets**. No target needed dropping.
- `ExplanationText` renders explanation lines and normal locale-aware links in the two quiz locations and three test-review locations (missed answers, correct guesses and full review). It retains the existing paragraph containers/styles. Links are underlined, keyboard focusable and at least 44 px high; prefetch is disabled. All other bank explanations are single-line plain text and retain their literal rendering.
- A small pure parser accepts only the exact local notes/anchor syntax. Unsupported, malformed, external or script-like targets remain literal text. React escapes text; no HTML injection, general Markdown engine or dependency was introduced.
- Three regression tests cover a valid link, malformed/unsafe/legacy fallbacks, and the existence of every authored question link's topic/section. No progress/FSRS or learner-history behavior changed. Personalized blocks and animated explainers remain deferred.

## Content manifest

Every row is an explanation-only change. The corresponding local chapter section is the teaching evidence and the actual navigation target. The prior rewrite source review for the 38-question subset is preserved in [#173's build report](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/3f8c5114369283aa0a2ad0d9aed630678bb52f9f/review/build-report-2026-11-01-n10-explanation-rewrites.md); that report is historical evidence, not a claim #173 has merged.

| Question ID | Words | Related route and anchor |
| --- | ---: | --- |
| `q-41` | 92 | `/notes/networking-dns-dhcp#dhcp` |
| `q-44` | 99 | `/notes/networking-dns-dhcp#dns` |
| `q-n10c11-01` | 102 | `/notes/n10-ch11#mac-learning` |
| `q-n10c7-01` | 77 | `/notes/n10-ch7#public-private` |
| `q-n10sec-01` | 72 | `/notes/n10-security#iam-terms` |
| `q-n10osi-01` | 82 | `/notes/n10-osi-models#osi-layers` |
| `q-n10cloud-connectivity-01` | 92 | `/notes/n10-cloud-models-connectivity#1-3-models` |
| `q-n10wireless-devices-01` | 82 | `/notes/n10-wireless-standards-security#2-3-bands` |
| `q-n10physical-installation-01` | 76 | `/notes/n10-physical-install-factors#2-4-power-cooling` |
| `q-n10access-management-01` | 74 | `/notes/n10-remote-access-methods#3-5-methods` |
| `q-n10access-management-02` | 93 | `/notes/n10-remote-access-methods#3-5-oob` |
| `q-n10access-management-03` | 86 | `/notes/n10-remote-access-methods#3-5-methods` |
| `q-n10access-management-04` | 87 | `/notes/n10-remote-access-methods#3-5-vpn` |
| `q-n10performance-01` | 85 | `/notes/n10-performance-troubleshooting#5-4-terms` |
| `q-n10performance-02` | 89 | `/notes/n10-performance-troubleshooting#5-4-terms` |
| `q-n10performance-03` | 80 | `/notes/n10-performance-troubleshooting#5-4-wireless` |
| `q-n10performance-04` | 73 | `/notes/n10-performance-troubleshooting#5-4-terms` |
| `q-n10m-01` | 84 | `/notes/n10-troubleshoot-method#5-1-steps` |
| `q-n10m-02` | 82 | `/notes/n10-troubleshoot-method#5-1-steps` |
| `q-n10m-03` | 87 | `/notes/n10-troubleshoot-method#5-1-approaches` |
| `q-n10m-04` | 82 | `/notes/n10-troubleshoot-method#5-1-approaches` |
| `q-n10t-01` | 87 | `/notes/n10-troubleshoot-tools#5-5-hardware` |
| `q-n10t-02` | 78 | `/notes/n10-troubleshoot-tools#5-5-hardware` |
| `q-n10t-03` | 87 | `/notes/n10-troubleshoot-tools#5-5-hardware` |
| `q-n10t-04` | 84 | `/notes/n10-monitoring-technologies#3-2-traffic` |
| `q-n10p-01` | 78 | `/notes/n10-troubleshoot-physical#5-2-cable` |
| `q-n10s-01` | 88 | `/notes/n10-troubleshoot-services#5-3-stp` |
| `q-n10s-02` | 79 | `/notes/n10-troubleshoot-services#5-3-stp` |
| `q-n10s-03` | 98 | `/notes/n10-troubleshoot-services#5-3-stp` |
| `q-n10s-04` | 97 | `/notes/n10-troubleshoot-services#5-3-stp` |
| `q-n10org-01` | 81 | `/notes/n10-org-documentation#3-1-diagrams` |
| `q-n10dr-01` | 84 | `/notes/n10-disaster-recovery#3-3-metrics` |
| `q-n10sdn-01` | 84 | `/notes/n10-sdn-overlay#1-8-sdn` |
| `q-n10zt-01` | 83 | `/notes/n10-zerotrust-iac#1-8-zta` |
| `q-n10top-01` | 81 | `/notes/n10-topologies-architecture#1-6-topologies` |
| `q-n10tx-01` | 76 | `/notes/n10-transceivers-fiber#1-5-transceivers` |
| `q-n10pt-01` | 72 | `/notes/n10-ports-reference#1-4-ports-core` |
| `q-n10mon-01` | 74 | `/notes/n10-monitoring-technologies#3-2-snmp` |
| `q-n10dhcp-01` | 76 | `/notes/n10-dhcp-ipam-time#3-4-dhcp` |
| `q-n10ap-01` | 83 | `/notes/n10-appliances-functions#1-2-security` |
| `q-n10sf-01` | 90 | `/notes/n10-security-features-43#4-3-controls` |

## Fact-check and caveats

Applied `.claude/skills/content-fact-check/SKILL.md` and its workflow contract directly, with the certification verifier guidance; no subagents ran. Rechecked all 41 definitions, distractor purposes, hooks and traps against the local N10-009 teaching and existing source ledger. Historical source review does not exempt a pinned fact or memory hook from scrutiny. Original wording only; no exam-dump or course prose copied.

Scope follows the supplied N10-009 outline/current matrix and `review/n10-009-evidence-ledger.md` (V9 objectives document v6.0). The supplied gap audit identifies v4.0. A fresh [official PDF](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652?download=1) retrieval still failed; no claim of freshly verifying the complete PDF or resolving that version difference.

Primary evidence revisited on 2026-11-01:

- [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html), abstract/§1, and [Microsoft APIPA guidance](https://learn.microsoft.com/en-us/windows-server/troubleshoot/how-to-use-automatic-tcpip-addressing-without-a-dh), More Information: local IPv4 fallback when DHCP is unavailable. Microsoft's page is historical Windows guidance; its registry instructions were not used. The explanation does not infer the failure's root cause from the address alone.
- [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131), §3.1: initial address allocation versus renewal. The DORA hook describes the initial four-message exchange, not every DHCP transaction.
- [Cisco STP guide](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/lan-wan/lan-wan/m_lsw-span-tree-prot.html), root election/port roles, plus the existing switching evidence ledger: lowest bridge ID and per-instance root-port roles. A switch still floods broadcasts and traffic to unknown destinations within its VLAN.
- [NIST SP 800-207 abstract](https://www.nist.gov/publications/zero-trust-architecture): network location does not grant implicit trust; authentication and authorization are distinct. The badge hook does not imply a password challenge for every packet.
- [RFC 4251](https://www.rfc-editor.org/rfc/rfc4251.html), abstract/§4: secure remote terminal architecture, distinct from graphical remote access and file transfer.
- [Cisco out-of-band guidance](https://www.cisco.com/c/en/us/solutions/collateral/service-provider/out-of-band-best-practices-wp.html), Out of Band Networks/Console Servers: independent recovery access during production disruption. This is architectural guidance, not a validated universal design or an instruction to deploy one.
- [Cisco VPN group-policy attributes](https://docs.manage.security.cisco.com/c_general-attributes.html), Split Tunneling: selected traffic uses the tunnel, other traffic bypasses it. Local `n10-remote-access-methods#3-5-methods` defines jump-box administrative access and its authentication/logging requirements. No claim that a jump box alone supplies those controls.

Existing technical limits are retained in plain words: choppy voice does not uniquely prove jitter; packet loss can also explain it. The switch question's exact keyed “only where needed” phrase is explicitly limited to learned-destination traffic. Connector fit does not establish optical/rate compatibility. Matching MACs do not prove device identity. A failed ping can reflect filtering. Hooks do not remove these caveats. Keys/stems were not changed to resolve pre-existing ambiguity.

## Verified

- `npm run lint`: PASS, exit 0; **0 errors / 4 existing warnings**, no new warnings.
- `npm run typecheck`: PASS, exit 0; route types generated and TypeScript complete.
- `npm run check:content`: PASS, exit 0; **0 errors / 89 advisory warnings** (merged-main baseline: 90; q-44 now includes its keyed answer).
- `npm test`: PASS, exit 0; **279 Node tests / 16 Python tests**, independent subnet fixtures pass, **41 visual fact blocks / 0 problems**. Three new parser/link-content tests are included in the normal content suite.
- `NODE_USE_ENV_PROXY=1 npm run build -- --webpack`: PASS; optimized production compilation, TypeScript, and **715/715 generation tasks** complete. Used the documented webpack option for the worktree's shared dependency layout; no Next/Vercel configuration changed. No new routes/dependencies. No before/after bundle-performance claim; a bundle baseline was not measured.
- Exact scope/identity comparison against `be7a917`: PASS; 41 explanation strings changed and every other question field/order unchanged. Word cap, exact keyed text, absence of old generic prefixes/unexplained target jargon and existing anchors checked.
- Browser route validation: **31 distinct targets returned 200 and contained their requested anchor**, covering all 41 authored links. The matching notes route template was also inspected.
- Local Chromium quiz reviews: APIPA and switching at **360, 430 and 1000 px**, six complete review flows. Correct opening text and six source line breaks render. Related links activated with the keyboard reach the expected anchor. **No horizontal document overflow, no page errors, 0 axe WCAG A/AA violations**; related link boxes are **44 px high**.
- Local Chromium test reviews: missed APIPA and correct-but-guessed OSI drills at **360 and 1000 px**, four completed flows. Each exposes the related link both in its fix/guess feedback and full review. **No horizontal document overflow, no page errors, 0 axe WCAG A/AA violations**. Synthetic isolated browser storage only; no real account history.
- Condensed React review: shared component imports no content bank, adds no fetches/effects/hooks, uses escaped text and the existing locale-aware Link, has visible focus/underlining and avoids extra dependencies. `git diff --check`: PASS.

## Not verified / notes

No physical-device, real-learner, offline or deployed testing; no learning-retention/readiness claim. All 41 destinations were checked, while rendered quiz/test feedback used representative cases rather than every question at every width. The existing quiz reveal location is wired to the shared renderer; the walkthrough exercises the reachable completed-review flow rather than changing quiz progression.

A browser harness initially treated same-document hash navigation as a new HTTP response; fixed the harness to check the route response separately. A test drill exposed two existing “Review before finishing” controls; the harness selected the primary control. These were harness fixes, not application failures or waived checks. The four completed test-review flows and six quiz flows passed afterward.

The branch is based on main after #172. Use this polish change in place of separately merging #173's older wording; #173 was not closed or merged by this work. No production or preview deploy was attempted.
