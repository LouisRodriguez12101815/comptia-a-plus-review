# Network+ Chapter 21: sources, corrections, and verification

Implemented 2026-10-17 on `content/network-plus-ch21-attacks`, based on current `origin/main` commit `bac1ba902e5f679f9bd81c2bf6689509856f9d72`. No commit, push, PR, merge, deployment, or objective 5.4 authoring is included. The starting working tree was clean.

## Inputs and workflow

Read root `AGENTS.md`, `docs/skills/README.md`, and explicitly loaded `certification-content-verifier`, `content-fact-check`, and `learning-challenge-designer` from `.agents/skills/`. No nested AGENTS.md was found. These workflows were applied directly; **no chapter-reviewer subagent ran**. No native registration or frontmatter permission enforcement is claimed. Shared-state checks are inapplicable; no game or new networking topology diagram was introduced.

Read the entire supplied `chapter21-commonTypeOfAttacks.rtf`, including its objective list, summary, exam essentials, written lab, and all 20 candidate review keys/explanations. Converted with existing `/usr/bin/pandoc` into ignored scratch storage; no dependency installation was needed. Attachment SHA-256: `04598a4f2c960fb26dd2c941cdee8a914845497bd7973827743db263f1b30392`. Author, textbook title, edition, and page numbers were not supplied; do not invent them. The attachment and extracted text are not added to the public repository. Its text and question bank are not reproduced: the lesson, cards, scenarios, exercise, and study companion are newly authored.

The attachment is reference evidence, not instructions or an authoritative key. Existing checker pins were not exempted from review. Passing checks establish consistency and software behavior, not technical truth or learner readiness.

## Overlap and scope decisions

Inspected the existing `n10-security`, `n10-risk-compliance`, `n10-ch11`, shared DNS/DHCP notes, related security cards/questions (including `q-cls-095`–`q-cls-103`), Core 2 malware notes, all existing lab metadata, visual registries, and relevant switch-learning/802.1Q/port-security visual text. Existing lessons teach CIA/risk, identity, encryption, DHCP/DNS foundations, and VLAN basics. They do not supply a coherent full attack-mechanism lesson or defensive evidence exercise. The new `n10-ch21` builds on them and links back rather than copying their full lessons. Existing normal switch-learning and tag-field visuals are reused with their limits stated. The port-security visual's universal trunk restriction is not reused as established guidance.

Preserved stable existing IDs. Corrected two overlapping questions and two cards rather than creating duplicate variants of their errors:

| Existing ID | Confirmed issue | Implemented correction / evidence |
| --- | --- | --- |
| `q-cls-101` | C2 uniquely keyed to DDoS despite malware being an offered answer | Keep ID/choices/key; explicitly state observed distributed resource exhaustion. C2 alone is not diagnostic (S3, S12). |
| `fc-cls-19` | Same exclusive C2/DDoS association | Explain that C2 directs several malicious activities (S12). |
| `q-cls-103` | Prompt describes adopting a MAC, explanation describes false ARP bindings | Keep ID/key; prompt now supplies forged ARP messages and a changed binding (S5). |
| `fc-cls-20` | Rogue AP definition unnecessarily requires connection to the victim wired network | Define unauthorized AP separately from impersonation; no wired-connection requirement (S9, S13). |

Older Chapter 11 claims about collision domains, ACL support on L2 ports, and port-security trunk support were observed but not changed: they need a separate platform-scoped review. They are not evidence for this chapter's qualified statements. This package does not repair the full historical security corpus.

## Exam-scope verification and matrix decisions

S1 is the official CompTIA **Network+ N10-009 V9**, **Exam Objectives Document Version 6.0**, retrieved **2026-10-17**. Section **4.0**, objectives **4.1–4.3**, printed/PDF page **12**, was inspected. The document says its example lists are not exhaustive; inclusion establishes scope, not technical behavior. The attachment's broken line wrapping of “MAC flooding” and “ARP poisoning” was reconciled against the official document.

| Verified objective scope (paraphrased) | New notes section(s) | Practice evidence | Decision |
| --- | --- | --- | --- |
| 4.2 DoS/DDoS | `availability` | Q01–02; cards 01–03 | Mechanism, impact, reflection/amplification distinctions taught. |
| 4.2 VLAN hopping; MAC flooding | `switching-attacks` | Q03–04; cards 04–05 | Mechanism, conditional behavior, impact, mitigation limits taught. |
| 4.2 ARP poisoning and spoofing | `arp` | Q05–06; cards 06; exercise transfer | False bindings distinguished from interface MAC spoofing. |
| 4.2 DNS poisoning and spoofing | `dns` | Q07–08; cards 07–08; exercise phase 2 | Forged answers versus stored false data and impact taught. |
| 4.2 rogue DHCP/AP; evil twin | `rogue-services` | Q09–11; cards 09–11; exercise phase 1 | Unauthorized services versus impersonation taught. |
| 4.2 on-path | `on-path` | Q12; card 12 | Position/impact distinguished from unsupported credential-theft inference. |
| 4.2 social engineering: phishing, dumpster diving, shoulder surfing, tailgating | `social-engineering` | Q13–16; card 13 | Each method, exposed information/access, impact, and response taught. |
| 4.2 malware | `malware` | Q01, Q13; cards 03/14 | Categories, C2, ransomware, network blast radius, layered response taught in notes, not inferred from question count. |
| 4.1 selected physical security, deception, segmentation | `social-engineering`, `rules-zones`, `deception` | Q14/19/20; cards 18–20 | Add topic mapping; preserve existing preliminary **covered**. This chapter alone is not the complete 4.1. |
| 4.3 hardening, NAC/port security/802.1X/MAC filtering, key management, ACL/URL/content rules, trusted/untrusted/screened zones | `admission`, `rules-zones` | Q17–19; cards 15–18; written decisions | Add mapping; preserve **partial**. Operational enforcement/filtering deployment and platform verification remain incomplete. |

**Only N10-009 4.2 changes status, from partial to covered**: the notes teach the main task, all listed attack families, impact, and important evidence distinctions. It is not marked covered merely because terms or questions exist. Only N10-009 4.1/4.2/4.3 mappings/notes are touched. Global **`reviewed: false` stays unchanged**, as do all A+ statuses and all other objective records. Domain weights apply to whole domains, mapped-topic counts include supporting material, and weighted content coverage remains a preliminary planning estimate, not exam readiness.

## Source register and supported claims

All successful source reads below used the available web open/find tools on 2026-10-17. No exam dumps were used. No objective PDF or source question bank is copied into the site. Technical references are scoped; historical guides are not universal current configuration recipes.

| ID | Primary reference / version / section | Supported use and applicability |
| --- | --- | --- |
| S1 | [CompTIA N10-009 V9, objectives v6.0](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652), §4.0, 4.1–4.3, PDF p12; non-exhaustive notice p2 | Exam mapping only. |
| S2 | [RFC 4732](https://www.rfc-editor.org/rfc/rfc4732.html), §§2–4, 2006 | DoS/DDoS mechanisms, amplification/reflection, resource and mitigation limits. |
| S3 | [NIST SP 800-83 Rev.1](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf), §§2.1–2.3, 3, 4 | Malware/tool categories, phishing distinction, C2 examples, layered prevention and response; historical 2013 desktop guidance, not a product capability guarantee. |
| S4 | [Cisco unicast flooding guide](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/23563-143.html), Problem Definition; Cause 3 | Source learning, VLAN-scoped unknown unicast, table exhaustion and fabricated sources; Catalyst example, not guaranteed behavior of every switch. |
| S5 | [Cisco DAI/IPSG troubleshooting](https://www.cisco.com/c/en/us/support/docs/switches/lan-switch-software/222274-troubleshoot-dynamic-arp-inspection-dai.html), ARP Poisoning; DHCP Snooping; Dynamic ARP Inspection | False ARP replies and IP/MAC bindings; DAI uses trusted information. Static hosts/trusted ports need applicable platform planning. |
| S6 | [RFC 5452](https://www.rfc-editor.org/rfc/rfc5452.html), §§2–5, 9 | Forged DNS answers/cache risks; does not establish where a particular incident's bad data came from. |
| S7 | [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html), §§3–5 | DNSSEC authenticity/integrity and confidentiality limits. |
| S8 | [RFC 2132](https://www.rfc-editor.org/rfc/rfc2132.html), §§3.5, 3.8 | DHCP router option 3 and DNS-server option 6. |
| S9 | [NIST SP 800-153](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-153.pdf), §§2–3 | WLAN policy, unauthorized devices, impersonation, monitoring; 2012 architectural guidance, not a current cipher selection guide. |
| S10 | [Cisco classic IOS 15.1 IP ACL overview](https://www.cisco.com/en/US/docs/ios-xml/ios/sec_data_acl/configuration/15-1mt/IP_Access_List_Overview.html), Access List Rules; [Configure IP ACLs](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html), Inbound/Outbound | Interface/protocol/direction-qualified limit, reuse, ordering and application. Not universal across platforms/ACL types. |
| S11 | [Cisco ISE 3.1 Compliance](https://www.cisco.com/c/en/us/td/docs/security/ise/3-1/admin_guide/b_ise_admin_3_1/b_ISE_admin_31_compliance.html), Posture; Antivirus/Antispyware Conditions | Endpoint posture and remediation separate from identity; exact support depends on agent/OS/product. |
| S12 | [MITRE ATT&CK TA0011](https://attack.mitre.org/tactics/TA0011/), Command and Control | C2 is a malicious communication tactic, not a DDoS-exclusive mechanism. |
| S13 | [MITRE ATT&CK T1557.004](https://attack.mitre.org/techniques/T1557/004/), Evil Twin; [T1557.003](https://attack.mitre.org/techniques/T1557/003/), DHCP Spoofing | Wireless impersonation and service-based path manipulation. These threat descriptions supplement primary protocol/vendor behavior evidence. |
| S14 | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), §1, §4.4, §9 | TLS confidentiality, integrity, authentication assumptions; not endpoint safety or universal availability. |
| S15 | [RFC 8952](https://www.rfc-editor.org/rfc/rfc8952.html), §§2–3, Appendix A | Captive-portal policy/notification versus interception; no promise to transparently redirect arbitrary HTTPS. |
| S16 | [RFC 2827 / BCP 38](https://www.rfc-editor.org/rfc/rfc2827.html), §§3–4 | Source-address filtering at appropriate boundaries; topology determines valid source ranges. |
| S17 | [Cisco Catalyst 6500/4500 IOS best practices](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/24330-185.html), 802.1Q native VLAN/security discussion | Conditional native-VLAN cross-boundary behavior and unused native VLAN for user access. Historical platform advice elsewhere on this page is not adopted wholesale. |
| S18 | [NIST SP 800-82 Rev.3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf), §§2, 5.2.2–5.2.3 | OT/ICS/SCADA context, safety constraints, physical protection, segmentation and controlled boundaries. |
| S19 | [NIST SP 800-94](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf), §8.3.4 | Monitored decoys/honeypots and supporting detection role; historical architecture, not a recommendation to deploy an unmaintained product. |
| S20 | [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), §§3.1.1, 3.2.2 | Password and online-guessing controls; changing a default credential is not a brute-force immunity guarantee. |
| S21 | [NIST SP 800-57 Part 1 Rev.5](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf), §§7–8 | Key states and management lifecycle; algorithm/deployment details remain platform-specific. |
| S22 | [NIST SP 800-53 Rev.5](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf), AT-2(3), PE-3, MP-6, SC-7 | Social-engineering awareness, individual physical access, media sanitization, boundary controls; tailgating/piggybacking terminology overlaps. |
| S23 | [RFC 8633 / BCP 223](https://www.rfc-editor.org/rfc/rfc8633.html), §§2.1, 3.4, Security Considerations | NTP abuse/operational hardening; no fixed amplification size promised. |

Attempted CISA DDoS/amplification/phishing pages/PDFs returned forbidden/internal errors on full open. Search snippets were **not** treated as inspected technical proof; accessible RFC/NIST material supplies the relevant evidence. NIST glossary endpoint requests returned generic/error pages; they were not used as definition evidence. Some initial NIST URLs failed; the successful Legacy PDF URLs above were read instead. Book edition/page provenance remains unresolved; it is not needed to adjudicate settled protocol behavior.

## Candidate answer-key audit (not a reproduced question bank)

The letters below identify the supplied candidates only; the public scenarios have new wording, assumptions, choices, IDs, and balanced positions. Every source key was reviewed, including apparently straightforward items.

| Source question / candidate | Finding | Treatment |
| --- | --- | --- |
| 1 C | Supported social-versus-technical distinction, though attacks can combine both (S1, S22) | Teach mechanisms rather than rigid mutually exclusive categories. |
| 2 A | **Ambiguous key**: malware is also a defensible C2 answer (S3, S12) | Do not publish original question; correct existing C2 items as described above. |
| 3 A | On-path supported by explicit interception/relay; explanation overstates deauthentication as inherently hijacking (S9, S14) | Teach position; do not equate disconnection with successful hijack. |
| 4 D | Rogue DHCP supported by supplied malicious router option (S8, S13) | Preserve mechanism; qualify VLAN hopping as broader than double tagging and deauthentication as not necessarily hijacking. |
| 5 B | NTP amplification is plausible, but reflection/distribution can also describe it; fixed megabyte language unsupported (S2, S23) | Teach overlapping dimensions without a fixed response size. |
| 6 B | On-path terminology supported; passive reading alone does not establish impersonation/relay (S9, S14) | Require evidence of position and state protection assumptions. |
| 7 A | Double tagging is a VLAN-hopping mechanism (S17) | Add prerequisites, behavior variability, and non-universal success. |
| 8 B | **Incorrect/ambiguous definition**: adopting a MAC describes MAC spoofing, not necessarily ARP poisoning (S5) | New lesson distinction and corrected `q-cls-103`; no reuse of the candidate wording/key. |
| 9 A | Unauthorized AP is supported; wired victim-network attachment is not universal (S9, S13) | Broaden the definition. |
| 10 C | Impersonation supports evil twin; a different channel is not required, duplicate SSID alone insufficient (S9, S13) | Remove channel requirement, require distinguishing evidence. |
| 11 D | DHCP/DNS/wireless manipulation can facilitate interception, but redirection does not necessarily demonstrate on-path relaying (S8, S13, S14) | No unconditional “all services prove on-path” question. |
| 12 A | Native-VLAN double tagging conditional on switch/path behavior (S17) | No guarantee all tagged frames cross arbitrary VLANs. |
| 13 A | Shoulder observation supported; the explanation's phishing definition is too narrow and whaling is a targeted subtype (S3, S22) | Teach broader deceptive-message/site definition, avoid copied question. |
| 14 C | **No uniquely reliable product-label answer**; modern antivirus/antimalware capabilities overlap and phishing can be malware-free (S3, S11) | Do not publish this key as fact; use layered defenses and explicit credential-phishing case. MFA needs distinct factor types, not merely two credentials. |
| 15 A | Boundary source validation/ACL supported under correct direction/topology; TLS explanation conflates certificate signatures and record protection (S10, S14, S16) | Qualify boundary filtering; describe authenticated TLS protection separately. |
| 16 C | Captive portal can support AUP acceptance, but “first page” redirection is not universal for HTTPS (S15) | No transparent-HTTPS interception claim. Portal is supplemental, not a standalone objective-4.3 coverage claim. |
| 17 A | Posture checking fits; 802.1X authenticates admission but does not alone prove health (S11) | State agent/product and policy assumptions. |
| 18 D | **Overgeneralized/unsupported as written**. Classic IOS limit is per interface, protocol, **and direction**; lists can be reused, cover multiple ports, and apply in both directions (S10) | New platform-qualified Q18; do not publish the supplied absolute key. |
| 19 A | Human manipulation/social engineering supported; perimeter security is not synonymous only with physical security (S22) | Teach social engineering without adopting the narrow distractor explanation. |
| 20 A | **Underdetermined key**: a single affected computer does not prove on-path; explanation repeats MAC/ARP confusion (S3, S5, S14) | Public Q12 explicitly grades “undetermined; investigate,” not an invented cause. |

Also corrected the source summary's implication that changing defaults thwarts brute force outright (S20). Deception topics absent from the short source narrative were independently developed for the selected 4.1 scope. Physical/permanent DoS terms are supplemental mechanisms, not separate required 4.2 bullets. Password attacks and captive portals are supporting context, not added objective mappings just because they are mentioned.

## Authored assumptions and acceptance criteria

New IDs: `n10-ch21`; `fc-n10c21-01`–`20`; `q-n10c21-01`–`20`; lab `defensive-evidence-triage`; companion `ch21-defensive-study-guide.html`. All new cards/questions are explicitly tagged `n10-009`. Correct choices occur five times at each position. Source-to-scenario associations: Q01–02 S2/S12; Q03 S4; Q04 S17; Q05–06 S5; Q07–08 S6/S7; Q09 S8/S13; Q10–11 S9/S13; Q12 S3/S14; Q13 S3; Q14–16 S22; Q17 S11; Q18 S10; Q19 S18/S22; Q20 S19. Notes teach the facts independently of quiz items.

All scenario actors, captured observations, confirmations, authorization, addresses, ordering, and outcomes are authored assumptions, not reports of real incidents. C2-driven distributed requests, nested-tag behavior, deliberately impersonating APs, and forged-message evidence are explicitly stipulated where needed to make answers determinate. The lab uses fictional records in 10.21.10.0/24, requires no tools or live changes, and supplies a paper alternative.

The written learning loop is evidence → decision → additional evidence → feedback → hints/retry → debrief → different transfer case. Hints do not erase the first attempt. The learner can:

- Explain the mechanism and network impact of every listed 4.2 family, and distinguish MAC spoofing from ARP poisoning, response spoofing from persisted cache poisoning, and unauthorized APs from impersonation.
- Select the closest supported theory from multiple symptoms and explicitly withhold conclusions the evidence cannot support.
- Choose a mechanism-specific defense, state deployment assumptions/limits, and validate both permitted and denied behavior.
- Explain why authenticated identity, endpoint posture, VLAN membership, and enforced authorization are different controls.
- Complete an unaided changed ARP-binding case after the guided DHCP/DNS case, recording first attempt and assistance separately.

Software checks do not establish these learner outcomes; observation with learners remains pending. No automated lab grading is claimed.

## Actual validation

Results are recorded below after execution. Local production rendering, automated checks, deployed checks, and physical-device checks are separate.

| Check actually run | Result |
| --- | --- |
| `npm run report:objectives` (before and after) | Pass. N10-009 4.2 is covered with 19 mapped sections, 29 cards, 44 questions, 1 lab, 2 visuals, counting the existing supporting topic as well as the new chapter. New chapter itself: 13 sections, 20 cards, 20 questions, 1 written lab, 2 registered visual entries (one new companion and one reused simulation). Counts are derived, not readiness measures. |
| `npm run check:content` | 0 errors, 25 warnings, matching the baseline warning set. |
| `npm run check:content -- --topic n10-ch21,n10-risk-compliance` | 0 errors, 0 warnings. |
| `npm run test:content` | 2/2 pass, including seeded checker errors. |
| `npm run test:objectives` | 11/11 pass, including matrix consistency and dashboard/CLI agreement. |
| `npm test` | All 155 tests pass: game 95, practice 18, subnet 23 (including independent Python fixture oracle), content 2, report 6, objectives 11. No multiplayer/browser-deployment result is inferred from these tests. |
| `npm run lint` | Pass, 0 errors and the 3 existing Next image warnings in `SectionBlocks` and lab pages. An initial attempt also linted an old ignored `work/skill-fixes/validate.cjs` scratch script and reported 5 require-import errors; preserved it as `.cjs.txt` and reran successfully. No tracked lint configuration or application file changed. |
| `npm run typecheck` | Pass (`next typegen` and `tsc --noEmit`). |
| `NODE_USE_ENV_PROXY=1 npm run build` | Pass, optimized Next 16.3.5 production build, including the new notes and lab routes. Proxy setting was needed for the environment's external font access. |
| `git diff --check` | Pass. |
| Scratch structural audit (`work/ch21/audit.mjs`) | Pass: JSON parse, global and section ID uniqueness, answer-index bounds, all new exact answer-key pins, equal 5/5/5/5 correct positions, explicit exam tags, topic/lab/visual links, matrix and unrelated-record preservation against base commit. Initial restricted Node-to-git subprocess returned `spawnSync git EPERM`; rerun with authorized execution permissions passed. |
| Scratch pin regression (`work/ch21/pin-regression.py`) | Pass: reintroducing the old ARP definition in a scratch content copy is rejected by `ch21-arp-binding`. Live content was not mutated by the regression experiment. Pins document verified assertions but remain reviewable evidence. |
| Local production Chromium (`/usr/bin/chromium`), 1280×900 desktop and 390×900 touch/mobile emulation | Both layouts: all 20 new cards flipped and verified; all 20 new quiz keys exercised through shuffled 15-question sittings; deliberate wrong-answer runs verified every new explanation and displayed correct answer. Exam picker excludes this chapter from Core 1 and includes it in Network+ for both cards and quiz. Notes/labs catalogs and Network+ visuals expose the new entries; all 10 companion internal links return success. No page errors in those walkthroughs. |
| Axe WCAG 2 A/AA and 2.1 AA, both requested color schemes at both widths | 20 audits (notes, cards, quiz setup, written lab, standalone companion × 2 widths × 2 schemes), zero violations. Existing application pages retain their existing dark design under either system color scheme; the new standalone companion supports light and dark. This is automated accessibility evidence, not a screen-reader usability certification. |

Browser harness selector failures (a hidden report-dialog heading and duplicate visual title) were harness issues, corrected before claiming interaction results. The existing quiz advances immediately after checking; explanations are verified in its missed-question summary. Sittings use up to 15 of the 20 questions, so repeated shuffled sittings were needed to see every key and explanation. Scratch scripts/logs/screenshots remain ignored and are not deliverables or repository dependencies.

Additional local production walkthroughs passed at both widths: the notes' Visuals link selects the new companion; its embedded exercise link navigates the top-level page to the lab; both reused switch-learning and 802.1Q visuals render and their controls work; both corrected existing questions show their revised explanations after deliberate wrong answers. Screenshots were inspected for desktop/mobile notes, cards, the lab, and study companion. Primary-reference links open separate tabs to avoid third-party iframe restrictions; external source content was verified through the web tools, not claimed as a successful deployed/browser-network test.

The full suite was repeated with an explicit shell exit check after the first host process reported a nonzero completion despite passing summaries. The final `npm test` run reports **exit 0**, all 155 passing.

## Remaining limitations and separate follow-up backlog

These existing UI issues were reproduced or traced to unchanged code; no application code, styling, dependencies, agent instructions, or configuration was edited in this package:

1. **Mobile lab overflow:** at a requested 390px mobile viewport, open `/labs/defensive-evidence-triage`; the main content fits 390px, but the document/inner layout expands to 409px. Open existing `/labs/display-path-isolation` and `/labs/two-subnet-lan`: the same 409px result occurs. The overflowing absolutely positioned `span.sr-only` contains `: coming soon` in the existing track bar (`app/components/TrackBar.tsx`). Follow-up: fix the shared navigation overflow, then check all lab tracks at 320/390px. This was not introduced by the chapter tables.
2. **Labs are globally presented as CCNA:** open any `/labs/...` page, including existing display-isolation content. `trackFromPath` in `lib/tracks.ts` unconditionally chooses CCNA for `/labs`; the catalog has no exam filter. New lab subtitle and related notes correctly identify Network+, and the companion provides a direct working entry, but track-aware lab metadata/navigation needs a separate application change.
3. **Notes marked “Coming soon” on practice strips:** open `/flashcards?topic=n10-ch21` or its quiz. `lib/chapter.ts` gives the Notes tool a null href for every topic; `ChapterStrip` therefore labels it unavailable off the notes page. The chapter notes and companion's lesson link work. Follow-up: restore real notes URLs generically and verify existing chapters, without changing content IDs.
4. **Historical technical assertions:** review the Chapter 11 collision-domain/VLAN, L2 ACL, native-VLAN/tagging and port-security trunk assertions against current, specified platforms. Reproduce by reading `n10-ch11` sections `VLANs and broadcast domains`, `Routed VLANs and segmentation`, `Access ports and trunk ports`, and `public/visuals/ch11-port-security.html`. This package does not adopt their universal claims. Separately review other historical security definitions (for example the complete zero-day/PKI/EDR corpus) before treating it as a fully verified security course.
5. **Existing checker/lint warnings:** reproduce with `npm run check:content` (the same 25 baseline warnings, including old explanation/key heuristics, answer imbalance, and two unpinned Chapter 10 answers) and `npm run lint` (3 existing image warnings). They remain outside this chapter's corrections. Legacy book-authority wording in checker data/comments does not override the revised evidence workflow; pin truth remains reviewable.

No critical unresolved claim is used as a uniquely graded new answer. Unresolved source provenance: textbook author/title/edition/pages were absent from the supplied file. Product capabilities, switch overflow/native-tag behavior, static-host inspection, NAC support, and filtering visibility require deployment-specific verification; the chapter explicitly states those limits rather than promising universal behavior.

Deployment/preview, production-dashboard checks from the separate dashboard task, physical-device testing, screen-reader user testing, and observed learner outcomes remain **pending**. Local Chromium mobile/touch emulation does not establish behavior on a physical iPhone/Android device or mobile network. No live defensive control was deployed or tested against real attack traffic. The paper lab is an authored exercise, not an observed incident or implementation test.

Final companion-link hardening was followed by four additional desktop/mobile light/dark axe audits (zero violations), keyboard disclosure checks, and verification of all nine external link targets (`_blank` with `noopener noreferrer`). The final production build, regenerated coverage report/content check, and diff check passed. External destinations were not opened by the browser harness; supporting passages were inspected through web tools as recorded above.
