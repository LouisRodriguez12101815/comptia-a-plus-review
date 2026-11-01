# Build report: Network+ post-answer explanation rewrites (2026-11-01)

Branch `content/n10-explanation-rewrites`. Started from merged Phase 1a `origin/main` at `1781721`; stacked on numbering PR A (`e8223fd`) to avoid conflicting edits to the SSH explanation. This PR targets `fix/n10-objective-numbering`; merge A first, then retarget B to main. B's own diff contains only `content/questions.json` and this report.

## Added / changed

Rewrote **exactly the 38 IDs** in the audit's explicit ≤4/10 list. Priority below is ascending audit score, with named worst-offender excerpts first on ties. Question bank ordering was not changed to reflect editorial priority. Original audit scores remain historical, not a fresh re-score or learner evaluation.

Each explanation contains: why the keyed answer fits, three separate wrong-option lines, an accurate memory hook, the specific trap, and an existing chapter/section pointer. Every exact correct answer string appears. All are **74–107 words**, with no exception above 120. Wrong sequences/nonsensical choices are explained as such, not assigned a fictional purpose.

Preserved question IDs, prompts, choices, correct-answer values, objective tags, weak flags, topic assignments and array order. No UI, progress/FSRS formats, personalized block, animations or dependencies changed. No learner data was read. Related concepts are plain path pointers because the existing explanation renderer is plain text; no new clickable-link behavior is claimed. Source strings contain separate lines, while existing paragraph rendering controls whitespace.

## Rewrite manifest / source review

**L** means the matching local topic and section listed in the final explanation's `Related concept` pointer. Both the topic ID and section anchor were checked to exist in `content/topics{,-network-plus}.json`, and the notes page renders those section IDs. Correct keys and all distractors were reviewed against that local teaching; references below supply additional independent protocol/vendor evidence. Each row identifies its current topic-map scope, which may overassociate shared chapter content with additional objectives; that is not a new objective tag.

| Priority | Question ID | Original /10 | Words | Topic-map objectives | Evidence |
| --- | --- | ---: | ---: | --- | --- |
| 1 | `q-n10ap-01` | 1 | 78 | 1.2 | L; S2 |
| 2 | `q-n10pt-01` | 1 | 74 | 1.4 | L; S4 |
| 3 | `q-n10tx-01` | 1 | 85 | 1.5 | L; S5 |
| 4 | `q-n10top-01` | 1 | 83 | 1.6 | L; S0 |
| 5 | `q-n10sdn-01` | 1 | 78 | 1.8 | L; S7 |
| 6 | `q-n10wireless-devices-01` | 1 | 86 | 2.3 | L; S10 |
| 7 | `q-n10mon-01` | 1 | 79 | 3.2 | L; S11 |
| 8 | `q-n10sf-01` | 1 | 87 | 4.3 | L; S15 |
| 9 | `q-41` | 1 | 107 | 1.4, 3.4 | L; S6, S13 |
| 10 | `q-n10s-04` | 1 | 95 | 5.3 | L; S9 |
| 11 | `q-n10m-02` | 1 | 101 | 5.1 | L; S0 |
| 12 | `q-n10m-03` | 1 | 81 | 5.1 | L; S0 |
| 13 | `q-n10t-02` | 1 | 82 | 5.5 | L; S16, S2 |
| 14 | `q-n10cloud-connectivity-01` | 2 | 83 | 1.3 | L; S3 |
| 15 | `q-n10dhcp-01` | 2 | 89 | 3.4 | L; S13 |
| 16 | `q-n10m-01` | 2 | 92 | 5.1 | L; S0 |
| 17 | `q-n10p-01` | 2 | 92 | 5.2 | L; S5, S16 |
| 18 | `q-n10performance-01` | 2 | 100 | 5.4 | L; S17, S10 |
| 19 | `q-n10zt-01` | 3 | 94 | 1.8 | L; S8 |
| 20 | `q-n10dr-01` | 3 | 85 | 3.3 | L; S12 |
| 21 | `q-n10access-management-01` | 3 | 77 | 3.5 | L; S14 |
| 22 | `q-n10sec-01` | 3 | 75 | 3.2, 4.1 | L; S8 |
| 23 | `q-n10t-01` | 3 | 96 | 5.5 | L; S16, S2 |
| 24 | `q-n10performance-02` | 3 | 102 | 5.4 | L; S17, S10 |
| 25 | `q-n10performance-03` | 3 | 87 | 5.4 | L; S17, S10 |
| 26 | `q-n10performance-04` | 3 | 82 | 5.4 | L; S17, S10 |
| 27 | `q-n10s-02` | 3 | 79 | 5.3 | L; S9 |
| 28 | `q-n10m-04` | 3 | 100 | 5.1 | L; S0 |
| 29 | `q-n10t-03` | 3 | 94 | 5.5 | L; S16, S2 |
| 30 | `q-n10osi-01` | 4 | 75 | 1.1, 1.5, 5.2 | L; S0 |
| 31 | `q-n10c7-01` | 4 | 75 | 1.7, 1.8, 3.4 | L; S6 |
| 32 | `q-n10c11-01` | 4 | 103 | 2.2, 4.3, 5.3 | L; S9 |
| 33 | `q-n10physical-installation-01` | 4 | 81 | 2.4 | L; S0 |
| 34 | `q-n10org-01` | 4 | 84 | 3.1 | L; S0 |
| 35 | `q-n10s-01` | 4 | 98 | 5.3 | L; S9 |
| 36 | `q-n10s-03` | 4 | 104 | 5.3 | L; S9 |
| 37 | `q-n10t-04` | 4 | 89 | 5.5 | L; S16, S2 |
| 38 | `q-44` | 4 | 102 | 1.4, 3.4 | L; S6, S13 |

## Fact-check sources and decisions

Applied the repository's Anthropic workflow at `.claude/skills/content-fact-check/SKILL.md` with `.claude/WORKFLOW.md`, and the corresponding certification verifier guidance directly; no subagents ran. Retrieval date: 2026-11-01. New wording is original; memory hooks were written for this change, not copied from course or exam material. Objectives establish scope, not technical correctness. Local teaching and checker pins remain reviewable evidence.

- **S0 — scope / methodology:** supplied `review/n10-009-gap-audit-2026-10-30.md`, current objective matrix and local 5.1 notes; `review/n10-009-evidence-ledger.md` identifies N10-009 V9 objectives v6.0. The supplied gap audit identifies v4.0. Direct [official PDF](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652?download=1) fetch failed; Japan's old official PDF URL now redirects. No claim of newly inspecting the full official PDF or resolving that version difference. Numbering follows the supplied outline and PR A. OSI/topology/documentation/power/methodology teaching is checked against local sections and this scope evidence, not falsely labelled independently standards-certified.
- **S2 — detection, inline prevention and monitoring taps:** [NIST SP 800-94](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf), §§4.2, 4.3.4. Passive observation versus prevention and tap/SPAN distinctions; historical architecture guidance, not a modern product guarantee. Tap installation may disrupt a link, even when observation after installation does not.
- **S3 — cloud models:** [NIST SP 800-145](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf), Deployment Models, printed p3. Distinct private/public/community environments; the scenario's on-premises side is interpreted as private infrastructure. No claim that merely owning a local server automatically constitutes a private cloud.
- **S4 — FTP control and distinct protocols:** [RFC 959](https://www.rfc-editor.org/rfc/rfc959.html), §8, server control connection on TCP 21. Other protocol ports cross-checked with the local ports reference and SSH architecture in S14. FTP control/data and SFTP are distinguished.
- **S5 — Ethernet transceiver families:** [Cisco 25GE/100GE white paper](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-9000/nb-09-25ge-100ge-wp-cte-en.html), pluggable optics discussion. SFP28/25G and quad-lane QSFP28/100G; local table supplies SFP/SFP+ comparisons. Rate examples are explicitly Ethernet examples and do not promise universal physical/rate compatibility.
- **S6 — private versus link-local addresses:** [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html), §3, independently checked all three private ranges; [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html), abstract and §§1–2, IPv4 link-local use. Historical class labels are separated from configured prefixes. APIPA does not prove a server is down or identify the DHCP root cause.
- **S7 — SDN roles:** [RFC 7426](https://www.rfc-editor.org/rfc/rfc7426.html), §§2–3. Forwarding/data plane versus control, management and application roles.
- **S8 — zero trust and identity:** [NIST SP 800-207 publication abstract](https://www.nist.gov/publications/zero-trust-architecture), no implicit trust from location/ownership and distinct authentication/authorization. Local IAM section supplies accounting/nonrepudiation distinctions. The badge analogy does not require a fresh password for each packet.
- **S9 — switching/STP:** [Cisco STP guide](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/lan-wan/lan-wan/m_lsw-span-tree-prot.html), root-bridge election and path costs; existing source ledger R4/R5 plus local MAC-learning/STP sections. Lower bridge ID wins; root-port roles are per instance. Known-unicast selectivity is qualified with broadcast/unknown-unicast flooding. The original keyed wording remains verbatim as required, but is not presented as universal truth.
- **S10 — wireless channels and measurements:** [Cisco RF Reference Guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wireless-rf-reference-guide.html), 2.4 GHz channel plan; [Cisco Wi-Fi Descriptions](https://www.cisco.com/c/en/us/td/docs/security/secure-access/secure-access-help/CiscoSecureAccessHelp/experience-insights-intro/wi-fi-descriptions.html), RSSI/BSSID/SNR table. Explicit US/20 MHz assumptions; strength is not signal-to-noise quality.
- **S11 — SNMP:** [RFC 3411](https://www.rfc-editor.org/rfc/rfc3411.html), architecture and application roles. Manager/agent/notification distinctions; MIB definitions checked against local SNMP notes. The mnemonic does not suggest a MIB actively sends requests.
- **S12 — recovery metrics:** [NIST RPO glossary](https://csrc.nist.gov/glossary/term/recovery_point_objective) and [RTO glossary](https://csrc.nist.gov/glossary/term/recovery_time_objective), definitions referencing SP 800-34 Rev.1; local DR metrics section supplies MTTR/MTBF. Backward data-loss window versus forward restoration target; no guarantee that a target is achieved.
- **S13 — DHCP and diagnostics:** [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131), §3.1 initial allocation versus renewal; S6 and local DNS/DHCP notes. DORA is scoped to initial DHCPv4 allocation. A failed numeric ping is an investigation clue, not proof of outage; ICMP filtering remains possible.
- **S14 — SSH:** [RFC 4251](https://www.rfc-editor.org/rfc/rfc4251.html), abstract and §4 architecture. Encrypted remote login; local management methods distinguish RDP/VNC/FTP roles. The explanation no longer carries the stale 3.4 prefix fixed by A.
- **S15 — port/ARP/DHCP controls:** [Cisco DAI guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/sec-crypto/fhs-sisf/fhs-and-sisf-configuration-guide/dynamic-arp-inspection.html), validation/binding discussion; local 4.3 controls table supplies port security, DHCP snooping and private VLAN distinctions. No claim MAC-based admission proves identity.
- **S16 — physical diagnostic tools:** [Fluke VisiFault](https://www.flukenetworks.com/datacom-cabling/fiber-testing/VisiFault-Visual-Fault-Locator), Product Highlights/Features (breaks, bends and connectors); [Fluke copper tester guide](https://www.flukenetworks.com/content/copper-cable-testers-selection-guide) and local tools table for cable testing versus tone tracing. No optical-distance measurement claim for a visible fault locator; optical compatibility must match specifications, not just connectors.
- **S17 — performance:** [RFC 3393](https://www.rfc-editor.org/rfc/rfc3393.html), abstract/§1.2, delay variation; local performance definitions for loss/latency/contention and serial bottlenecks. Link capacity is an upper bound before overhead, not guaranteed throughput.

### Remaining ambiguity preserved transparently

`q-n10performance-01` does not uniquely rule out packet loss. Its explanation now states that caveat instead of teaching that choppy voice proves jitter. Changing the stem/choices/key is outside this request. `q-n10c11-01` retains the exact “only where needed” keyed phrase but immediately limits it to the known-unicast scenario and explains flooding exceptions. These are explicit limits, not newly certified unambiguous questions.

## Verified

- `npm run lint`: PASS, exit 0; 0 errors / 4 existing warnings, no new warnings.
- `npm run typecheck`: PASS, exit 0; route types and TypeScript complete.
- `npm run check:content`: PASS, exit 0; **0 errors / 89 warnings**, down from A's 90 (the q-44 keyed-text warning is resolved).
- `npm test`: PASS, exit 0; **276 Node tests / 16 Python tests**, independent subnet fixtures pass, **41 visual fact blocks / 0 problems**.
- Scratch identity/scope validation: exactly the audit's 38 explanations changed against A; all other question fields, total question count and array order identical. Every exact keyed string retained; each has three wrong-option source lines and the required ordered blocks; all under 120 words; every chapter anchor exists. No test merely mirroring the rewritten prose was added.
- Local Playwright Chromium: IDS and jitter quiz topics completed with deliberate wrong answers at **360, 430 and 1000 px**. All six completed review screens show the rewritten why/distractors/hook/trap/related pointer, with **no horizontal document overflow, no page errors and no axe WCAG A/AA violations**. All browser storage was isolated synthetic history; no real account or Twilio API was used. This is representative rendered feedback validation, not a browser audit of all 38 questions or learning-outcome evidence.
- `git diff --check`: PASS. No UI, source-code, visual or deployment config differences against A. No Vercel commands or deployment.

## Not verified / notes

Direct official PDF/version revalidation remains unavailable as described in S0; the bounded scope follows supplied references. Local-only statements above are identified rather than presented as fresh external standards verification. Existing pinned-fact checks are not independent proof of those pins. No exam-readiness, retention or miss-frequency claim was made.

Browser harness notes: default Turbopack rejected the worktree dependency symlink; used documented `next dev --webpack` without modifying config. The default Playwright browser bundle was absent; installed system `/usr/bin/chromium` completed the six checks. A scratch identity comparison initially hit Node's default subprocess output-buffer limit, then passed with an explicit larger buffer. One dev-server stream-close message occurred while a test context closed; the completed pages and browser assertions passed. None was a waived content/checker failure. No application production build was run for these explanation-only changes.

The audit's original 48-item score table remains a historical snapshot. These 38 IDs were rewritten, not retrospectively re-scored. Personalized feedback and animated explainers remain pending the learner-history export and topic approval.
