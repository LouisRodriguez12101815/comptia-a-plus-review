# Network+ readiness evaluation — Phase 1a — 2026-11-01

## Scope and status

Reviewed branch `network-plus-readiness-phase1a`, base commit `ade49de` (the GitHub branch with the supplied references). This is **coverage mapping and explanation-quality assessment only** for N10-009. No learner data was read. No repeat-miss ranking, personal study priority, domain readiness verdict, or pass probability is issued. Phase 1b awaits `data/primary-history.json`; that file was absent at inspection. No subagent ran.

No question, chapter, visualization, answer key, progress format or application UI was changed. The only implementation is the requested local read-only exporter and its tests, test-command integration, and ignore rules. Phase 2/3 topics remain subject to approval after the evidence is available.

Numbering follow-up: the matrix and topic IDs were already corrected on the merged Phase 1a base. The numbering PR aligns the 3.3/3.4 titles and fixes four remaining access-method explanation labels from 3.4 to 3.5; the scores and quotations below remain the original audit snapshot. See [the numbering build report](build-report-2026-11-01-n10-objective-numbering.md) for unchanged per-objective question counts.

## Reference documents followed

Read `review/README-for-agent.md` first, then all six supplied references: `feature-rollout-standard.md`, `vercel-deployment-sop.md`, `build-report-2026-10-20-learner-accounts.md`, `build-report-2026-10-17-fsrs-and-a11y.md`, `n10-009-gap-audit-2026-10-30.md`, and `objective-coverage-2026-10-17.md`. None is missing on this branch. Existing build-report format (Added / Verified / Not verified / Notes) is retained. GitHub delivery is authorized; Vercel deployment is explicitly prohibited and was not attempted.

## Evidence and limits

The local evidence ledger identifies official **CompTIA Network+ N10-009 V9, objectives document v6.0**, [official document URL](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652?download=1). Its prior source review records routing/switching 2.1/2.2 at pp8–9 and troubleshooting 5.3 at pp13–14. `docs/network-plus-ch21-verification.md` records 4.1–4.3 at p12 and a 2026-10-17 retrieval. These are **historical repository evidence**, not fresh retrievals in this assessment. The supplied gap audit calls its source **v4.0**, while the later evidence ledger identifies **v6.0**. This source-version conflict cannot be resolved by treating either local document as a newly retrieved official PDF; the mapping below follows current corrected IDs and records both historical sources. Current outbound policy does not allow the CompTIA document host, RFC Editor, NIST or Cisco source hosts; fresh external verification was unavailable. Document version/current official sub-bullet completeness therefore remains unverified in this session.

Local scope sources: `content/objectives.json` (global `reviewed: false`), `content/topics{,-network-plus}.json`, `content/questions.json`, `content/flashcards.json`, `content/track-visuals.json`, `content/network-plus/ch{9,10,11}.json`, and `lib/exam-test.mjs`. The quality scores concern what is taught after answering, not proof of technical correctness or learning retention.

## Coverage mapping

The existing objective report marks **25/25 objectives covered**, preliminary weighted inventory **100%**. That is a topic-mapping result, not verified mastery or proof every official sub-bullet is taught. The bank has **1,117 questions eligible by Network+ topic/exam tag**; **1,112 distinct questions** appear in the timed exam pool. Objective and domain totals overlap and must not be summed into a unique bank size. Only **3 eligible questions** have explicit objective tags; most inherit every objective attached to their topic.

The table below reuses the repository coverage calculation and timed exam-pool mapping. Q = actual eligible exam-pool questions for that objective; S = note sections across mapped topics; V = visualization entries after including the chapter 9–11 lists used by `lib/visuals.ts`. Q/S/V measure available resources, not distinct teaching of that objective. For example, mapping all chapter 7 content to both IPv4 addressing and modern networking inflates counts with material unrelated to a particular sub-bullet. S includes objective banners and review-key sections. Some shared-topic resources address A+; matching the topic alone is not enough to prove Network+ relevance.

| Objective / paraphrased scope | Domain weight | Q | S | V | Mapped chapters/topics |
| --- | ---: | ---: | ---: | ---: | --- |
| 1.1 Explain concepts related to the OSI reference model | 23% | 43 | 15 | 4 | `n10-osi-models`, `n10-l2-l3-switching` |
| 1.2 Compare and contrast networking appliances, applications, and functions | 23% | 93 | 23 | 16 | `networking-devices`, `n10-l2-l3-switching`, `networking-fundamentals`, `networking-storage`, `n10-appliances-functions` |
| 1.3 Summarize cloud concepts and connectivity options | 23% | 31 | 2 | 0 | `n10-cloud-models-connectivity` |
| 1.4 Explain common networking ports, protocols, services, and traffic types | 23% | 127 | 29 | 14 | `n10-tcpip`, `n10-html-http`, `networking-devices`, `networking-dns-dhcp`, `n10-ports-reference` |
| 1.5 Compare and contrast transmission media and transceivers | 23% | 110 | 19 | 11 | `networking-cabling`, `n10-osi-models`, `networking-fundamentals`, `n10-transceivers-fiber` |
| 1.6 Compare and contrast network topologies, architectures, and types | 23% | 53 | 12 | 6 | `networking-devices`, `n10-topologies-architecture` |
| 1.7 Given a scenario, use appropriate IPv4 network addressing | 23% | 65 | 22 | 9 | `n10-ch7`, `n10-ch8` |
| 1.8 Summarize evolving use cases for modern network environments | 23% | 113 | 26 | 11 | `networking-devices`, `n10-ch7`, `n10-sdn-overlay`, `n10-zerotrust-iac` |
| 2.1 Explain characteristics of routing technologies | 20% | 75 | 34 | 35 | `n10-ch9`, `n10-ch10`, `n10-ch8` |
| 2.2 Given a scenario, configure switching technologies and features | 20% | 40 | 22 | 18 | `n10-ch11`, `n10-l2-l3-switching` |
| 2.3 Given a scenario, select and configure wireless devices and technologies | 20% | 61 | 7 | 0 | `n10-wireless-standards-security` |
| 2.4 Explain important factors of physical installations | 20% | 33 | 2 | 0 | `n10-physical-install-factors` |
| 3.1 Explain the purpose of organizational processes and procedures | 19% | 44 | 6 | 0 | `n10-org-documentation`, `n10-org-change-config` |
| 3.2 Given a scenario, use network monitoring technologies | 19% | 77 | 22 | 20 | `n10-ch10`, `n10-security`, `n10-monitoring-technologies` |
| 3.3 Explain disaster-recovery concepts | 19% | 34 | 6 | 4 | `networking-storage`, `n10-disaster-recovery` |
| 3.4 Implement IPv4 and IPv6 network services | 19% | 147 | 23 | 10 | `networking-dns-dhcp`, `n10-ch7`, `n10-dns-records-security`, `n10-dhcp-ipam-time` |
| 3.5 Compare and contrast network access and management methods | 19% | 33 | 3 | 0 | `n10-remote-access-methods` |
| 4.1 Explain the importance of basic network security concepts | 14% | 54 | 26 | 2 | `n10-security`, `n10-risk-compliance`, `n10-ch21` |
| 4.2 Summarize various types of attacks and their impact to the network | 14% | 44 | 19 | 2 | `n10-risk-compliance`, `n10-ch21` |
| 4.3 Given a scenario, apply network security features, defense techniques, and solutions | 14% | 65 | 30 | 18 | `n10-ch11`, `n10-ch21`, `n10-security-features-43` |
| 5.1 Explain the troubleshooting methodology | 24% | 48 | 9 | 7 | `core2-ch7`, `n10-troubleshoot-method` |
| 5.2 Given a scenario, troubleshoot common cabling and physical interface issues | 24% | 72 | 16 | 7 | `networking-cabling`, `n10-osi-models`, `n10-troubleshoot-physical` |
| 5.3 Given a scenario, troubleshoot common issues with network services | 24% | 95 | 41 | 31 | `n10-ch8`, `n10-ch9`, `n10-ch11`, `n10-troubleshoot-services` |
| 5.4 Given a scenario, troubleshoot common performance issues | 24% | 52 | 4 | 0 | `n10-performance-troubleshooting` |
| 5.5 Given a scenario, use the appropriate tool or protocol to solve networking issues | 24% | 64 | 16 | 13 | `quick-reference`, `networking-cabling`, `core2-ch7`, `n10-troubleshoot-tools` |

### Domain inventory and teaching limitations

| Domain | Weight | Distinct pool questions within domain | Evidence / limitation |
| --- | ---: | ---: | --- |
| Concepts | 23% | 462 | OSI, ports, IPv4/IPv6 and switching have substantial notes/visuals. Modern-environment, cloud and transceiver additions exist; sampled explanations mostly restate labels. |
| Implementation | 20% | 209 | Chapters 9–11 provide routing/switching detail; wireless has 7 note sections and 61 pool questions but no dedicated visualization in its topic. Configuration transfer still needs review. |
| Operations | 19% | 335 | Documentation, lifecycle, monitoring, DR, DHCP/DNS/time and remote access topics exist. Several rely on 2–5 sections and have no dedicated visual; 3.2 inherits unrelated routing questions. |
| Security | 14% | 99 | Chapter 21 has source-review evidence for attacks. Matrix itself says platform-specific enforcement and filtering implementation/validation remain incomplete under 4.3. |
| Troubleshooting | 24% | 302 | All five objectives have dedicated notes and questions. Broad shared-topic mapping imports A+ content; sampled faults often lack why-not alternatives and discriminating evidence. |

These are resource findings, with **no Ready / Close / Not ready labels**. A missing dedicated visual is a format opportunity, not automatically an exam-content omission.

### Visualization mapping and navigation

Existing location is `public/visuals/`, not a top-level `visualizations/` directory. Future implementation should preserve that convention consistent with the supplied rollout standards. The standard coverage command reads only `track-visuals.json`; it omits the additional **11 chapter-9, 20 chapter-10, and 16 chapter-11 entries** merged by `lib/visuals.ts`. These explain the higher V counts above. All mapped files were checked for existence; this does not verify their animation, accessibility or fact accuracy.

| Topic/chapter | Objective associations | Existing visualization filenames (under public/visuals/) |
| --- | --- | --- |
| `core2-ch7` | 5.1, 5.5 | `core2-ch7-overview.html`, `core2-ch7-method-safemode.html`, `core2-ch7-boot-bsod.html`, `core2-ch7-cli-network.html`, `core2-ch7-malware-taskmgr.html`, `core2-pbq-mobile-troubleshooting.html`, `core2-pbq-pc-security-issues.html` |
| `networking-dns-dhcp` | 1.4, 3.4 | `networking-dns-dhcp-overview.html`, `networking-dns-dhcp-dora.html`, `networking-dns-dhcp-records.html`, `networking-dns-dhcp-forwarder-failure.html`, `core1-vlan-vpn-dhcp-pbq.html` |
| `networking-storage` | 1.2, 3.3 | `networking-storage-overview.html`, `networking-storage-raid-builder.html`, `networking-storage-nas-san.html`, `networking-storage-321.html` |
| `networking-cabling` | 1.5, 5.2, 5.5 | `networking-cabling-overview.html`, `networking-cabling-pick-cable.html`, `networking-cabling-connectors.html`, `networking-cabling-poe.html`, `networking-cabling-tools.html` |
| `networking-fundamentals` | 1.2, 1.5 | `networking-fundamentals-overview.html`, `networking-fundamentals-devices.html`, `networking-fundamentals-media.html`, `networking-fundamentals-san.html` |
| `networking-devices` | 1.2, 1.4, 1.6, 1.8 | `networking-devices-overview.html`, `networking-devices-workgroup-domain.html`, `networking-devices-switching.html`, `networking-devices-tcp-udp.html`, `networking-devices-wan.html`, `networking-devices-topologies.html` |
| `n10-ch7` | 1.7, 1.8, 3.4 | `n10-ch7-chapter-map.html`, `n10-ch7-address-identifier.html`, `n10-ch7-ipv6-types.html`, `n10-ch7-eui64.html`, `n10-ch7-written-labs.html` |
| `n10-ch8` | 1.7, 2.1, 5.3 | `n10-ch8-chapter-map.html`, `n10-ch8-subnet-calculator.html`, `n10-ch8-wan-30.html`, `n10-ch8-nat-pat.html` |
| `n10-osi-models` | 1.1, 1.5, 5.2 | `n10-osi-dod-stack.html`, `n10-osi-cable-picker.html` |
| `n10-l2-l3-switching` | 1.1, 1.2, 2.2 | `n10-l2l3-packet-walk.html`, `n10-l2l3-forwarding-game.html` |
| `n10-tcpip` | 1.4 | `n10-tcpip-handshake.html`, `n10-tcpip-port-rush.html` |
| `n10-html-http` | 1.4 | `n10-html-http-lab.html` |
| `n10-ch21` | 4.1, 4.2, 4.3 | `ch21-defensive-study-guide.html`, `ch11-switch-learning.html` |
| `quick-reference` | 5.5 | `core2-ch7-cli-network.html` |
| `n10-ch9` | 2.1, 5.3 | `ch9-36-steps.html`, `ch9-36-swimlane.html`, `ch9-receive-checklist.html`, `ch9-frame-vs-packet.html`, `ch9-arp-chase.html`, `ch9-frame-anatomy.html`, `ch9-route-table.html`, `ch9-no-route.html`, `ch9-as-route-selection.html`, `ch9-static-dynamic.html`, `ch9-written-lab.html` |
| `n10-ch10` | 2.1, 3.2 | `ch10-protocol-map.html`, `ch10-routing-tree.html`, `ch10-split-horizon.html`, `ch10-concept-visuals.html`, `ch10-autonomous-systems.html`, `ch10-rip-hop-limit.html`, `ch10-ripv2-updates.html`, `ch10-static-ad.html`, `ch10-admin-distance.html`, `ch10-ospf-metric.html`, `ch10-default-route-choice.html`, `ch10-distance-vector.html`, `ch10-routing-loop.html`, `ch10-rip-ad.html`, `ch10-link-state.html`, `ch10-dynamic-failover.html`, `ch10-dynamic-tradeoffs.html`, `ch10-route-selection.html`, `ch10-hybrid-spectrum.html`, `ch10-rumor-routing.html` |
| `n10-ch11` | 2.2, 4.3, 5.3 | `ch11-chapter-map.html`, `ch11-device-compare.html`, `ch11-switch-learning.html`, `ch11-domain-counts.html`, `ch11-vlan-broadcast-domains.html`, `ch11-static-dynamic-vlans.html`, `ch11-svi-acl.html`, `ch11-vtp-vlan1.html`, `ch11-access-trunk.html`, `ch11-dot1q-tag.html`, `ch11-trunk-standards.html`, `ch11-stp-root.html`, `ch11-stp-states.html`, `ch11-port-security.html`, `ch11-qos-layers.html`, `ch11-poe-budget.html` |

Some chapter entries cross-link another chapter's file. Count entries as navigation resources, not unique explainers or guaranteed objective-specific lessons. Existing split-horizon, routing, STP and DHCP animations should be evaluated for reuse before creating duplicates.

### Changes since the supplied coverage and gap audits

Reuse baseline: [2026-10-17 coverage report](objective-coverage-2026-10-17.md) records **6 covered / 13 partial / 6 missing**, preliminary weighted inventory **49%**. Current regenerated report records **25 covered / 0 partial / 0 missing**, **100%**, an inventory change of +19 covered objectives and +51 percentage points. Both calculations use broad topic membership; neither is a readiness score. The [2026-10-30 gap audit](n10-009-gap-audit-2026-10-30.md) counted **24 topics / 385 questions / 223 cards**, with **88/404 leaf bullets unmatched** by keyword. Current eligibility is **41 topics / 1,117 questions / 518 cards** (recomputed from current Network+ tags); changing scope and question tags may affect comparability. The 404-pattern source inventory is not present, so the old 88 gaps cannot be truthfully called all closed or rerun exactly.

Current `content/objectives.json` corrects the old 3.3/3.4/3.5 numbering to **3.3 disaster recovery, 3.4 IPv4/IPv6 services, 3.5 access/management**. Old rows must be matched by concept, not just ID. Evidence addressing the prior gap families:

| Prior gap family | Current local teaching evidence | Assessment limit |
| --- | --- | --- |
| 1.1 Session / 1.4 SFTP | `n10-osi-models#osi-layers`; `n10-ports-reference#1-4-ports-secure` | Present in notes; not full sub-bullet verification. |
| 1.5 transceivers/DAC/fiber | `n10-transceivers-fiber#1-5-transceivers`, `#1-5-dac`, `#1-5-fiber` | Current note contradicts stale matrix “not found” text. |
| 1.6 architecture / 1.8 modern networks | `n10-topologies-architecture#1-6-architecture`; `n10-sdn-overlay`, `n10-zerotrust-iac` | New dedicated teaching exists; full 12-bullet 1.8 closure not certified. |
| 2.1 FHRP / 2.2 link aggregation | `n10-ch10#fhrp-virtual-ip`; `n10-ch11#link-aggregation` | Compare candidate routing/switching explainers with these sections. |
| 2.3 wireless / 2.4 installation | `n10-wireless-standards-security`; `n10-physical-install-factors` | Formerly missing topics now have notes/questions; configuration transfer needs review. |
| 3.1 process/documentation | `n10-org-documentation`; `n10-org-change-config` | Cable maps, IPAM and lifecycle teaching present. |
| 3.2 monitoring / 3.3 DR | `n10-monitoring-technologies`; `n10-disaster-recovery` | Dedicated notes replace former shared-track-only reliance. |
| 3.4 services/time / 3.5 access | `n10-dns-records-security`, `n10-dhcp-ipam-time#3-4-time`; `n10-remote-access-methods` | Corrected mapping; some explanation labels remain stale. |
| 4.1–4.3 security | `n10-security`, `n10-risk-compliance`, `n10-ch21`, `n10-security-features-43` | 4.3 platform implementation/validation remains incomplete per current matrix. |
| 5.1–5.5 troubleshooting | `n10-troubleshoot-method`, `n10-troubleshoot-physical`, `n10-troubleshoot-services`, `n10-performance-troubleshooting`, `n10-troubleshoot-tools` | All formerly missing/partial families have dedicated topics; sampled feedback still thin. |

The matrix retains outdated omission notes for 1.2/1.5/1.6/1.8/3.2/3.3/3.4. Those are historical notes, not fresh absence findings. No statuses or content were changed. The highest-weight former missing objective is **5.4**, now present; it remains the first feedback-depth review target because of the supplied gap ordering and ambiguous sampled voice symptom, not because of inferred learner misses.

Verified from current files and the available 2026-11-01 tranche report: VLAN broadcast versus collision domains; platform-dependent voice tagging; classic-STP startup versus BPDU-aging recovery; EIGRP default K terms; CoS values versus hardware queues; and separation of protocol selection, same-prefix Cisco administrative distance, and forwarding longest-prefix match were revised. Questions `q-n10c11-04/12/15` keep their IDs, and `q-n10c10-24/25` were pinned without adding questions. Two know-cold sheets now cover bounded 2.1/2.2 material. These are documented current changes, not a claim they postdate every supplied audit.

## Explanation-quality audit (48 samples)

Sampling: 32 breadth items from 29 topic groups spanning all 25 objectives, plus **16 deliberately selected additions**: three more each from the historical high-weight weak areas 5.4, 5.3, 5.1 and 5.5, and four editorial `weak: true` DNS/addressing questions. These are bank/editorial and supplied-audit weakness signals, **not the primary learner profile's history**. No personal miss frequency was used. All 48 prompts, keyed answers, distractors and explanations were read. The added 12 troubleshooting items overweight the highest-weight 24% domain rather than simply treating every topic equally. Reproduce by the stable IDs below in `content/questions.json`; this is a deliberate sample, not a random bank estimate.

Each dimension scores 0–2: **R** why right (0 absent/wrong; 1 restatement/partial; 2 causal/scenario explanation); **W** why wrong (0 absent; 1 some alternatives or generic dismissal; 2 each distractor accounted for); **H** memory hook (0 absent; 1 partial verbal picture/acronym/calculation; 2 concrete, reusable analogy/mnemonic/mini-picture); **T** trap (0 absent; 1 implied distinction; 2 specific confusion explicitly contrasted); **L** related concepts (0 absent; 1 names a useful related concept/path without navigation; 2 usable related chapter/explainer link). An objective number alone is not a related-concept link. Choice definitions and headings elsewhere in the UI do not earn explanation points. Arithmetic counts as H=1 only when it exposes structure, rather than just a result.

| Question ID / objective | R | W | H | T | L | /10 | Reason for score / next rewrite focus |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `q-n10osi-01` / 1.1, 1.5, 5.2 | 1 | 2 | 0 | 1 | 0 | 4 | Gives layer numbers for all alternatives; no model for what Transport does. |
| `q-n10ap-01` / 1.2 | 1 | 0 | 0 | 0 | 0 | 1 | Repeats passive IDS; never contrasts blocking IPS, load balancing or reverse proxying. |
| `q-n10cloud-connectivity-01` / 1.3 | 2 | 0 | 0 | 0 | 0 | 2 | Explains the combination; does not distinguish public, private or community deployment. |
| `q-n10pt-01` / 1.4 | 1 | 0 | 0 | 0 | 0 | 1 | Restates port 21; does not identify TFTP 69, SSH 22 or Telnet 23. |
| `q-n10tx-01` / 1.5 | 1 | 0 | 0 | 0 | 0 | 1 | Restates size/rate; omits the other form factors and the compatibility trap. |
| `q-n10top-01` / 1.6 | 1 | 0 | 0 | 0 | 0 | 1 | Restates star; no bus/ring/mesh contrast or picture. |
| `q-n10c7-01` / 1.7, 1.8, 3.4 | 1 | 2 | 0 | 1 | 0 | 4 | Accounts for every range; historical class labels need explicit separation from CIDR. |
| `q-n10c8-01` / 1.7, 2.1, 5.3 | 2 | 1 | 1 | 2 | 0 | 6 | Shows host-bit calculation and reserved addresses; 127 is unexplained. Arithmetic is a partial mini-picture. |
| `q-n10sdn-01` / 1.8 | 1 | 0 | 0 | 0 | 0 | 1 | Names forwarding plane; does not contrast control, management or application roles. |
| `q-n10zt-01` / 1.8 | 2 | 0 | 0 | 1 | 0 | 3 | Explains the internal-trust assumption; does not address each alternative. |
| `q-n10c9-01` / 2.1, 5.3 | 2 | 2 | 0 | 2 | 0 | 6 | Explains destination lookup and all distractors, calling out tempting extras. Blanket never wording needs scope. |
| `q-n10c10-01` / 2.1, 3.2 | 2 | 1 | 0 | 2 | 0 | 5 | Explains RIP boundary and backup trap; preference and TTL alternatives unaddressed. |
| `q-n10c11-01` / 2.2, 4.3, 5.3 | 2 | 1 | 0 | 1 | 0 | 4 | Contrasts hub and software bridge; omits per-hop decapsulation option and overgeneralizes forwarding/latency. |
| `q-n10wireless-devices-01` / 2.3 | 1 | 0 | 0 | 0 | 0 | 1 | States US channels; does not explain 20 MHz spacing/overlap or why other sets overlap. |
| `q-n10physical-installation-01` / 2.4 | 2 | 1 | 0 | 1 | 0 | 4 | Battery backup versus distribution is useful; patch panel/MDF are unexplained. |
| `q-n10org-01` / 3.1 | 2 | 1 | 0 | 1 | 0 | 4 | Explains wall-jack trace; other document types are dismissed collectively. |
| `q-n10chg-01` / 3.1 | 2 | 1 | 0 | 2 | 0 | 5 | Names the sales/support distinction; baseline and decommissioning are absent. Vendor terms need scope. |
| `q-n10mon-01` / 3.2 | 1 | 0 | 0 | 0 | 0 | 1 | Restates manager role. Definitions in the choices do not count as post-answer teaching. |
| `q-n10dr-01` / 3.3 | 2 | 0 | 1 | 0 | 0 | 3 | Backward-from-failure is a useful time picture; RTO/MTTR/MTBF remain undefined. |
| `q-n10dhcp-01` / 3.4 | 1 | 0 | 1 | 0 | 0 | 2 | Provides DORA mnemonic but repeats the sequence; no role or ordering explanation. |
| `q-n10access-management-01` / 3.5 | 2 | 0 | 0 | 1 | 0 | 3 | Useful SSH/Telnet contrast but Telnet is not a distractor; RDP/VNC/FTP are omitted. Label says 3.4; local map is 3.5. |
| `q-n10sec-01` / 3.2, 4.1 | 1 | 1 | 0 | 1 | 0 | 3 | Contrasts authorization and nonrepudiation; accounting omitted. |
| `q-n10c21-01` / 4.1, 4.2, 4.3 | 2 | 2 | 0 | 2 | 0 | 6 | Connects distributed sources to availability; addresses each distractor and evidence threshold. |
| `q-n10sf-01` / 4.3 | 1 | 0 | 0 | 0 | 0 | 1 | Restates port security; no DAI, private VLAN or snooping distinctions. |
| `q-n10m-01` / 5.1 | 2 | 0 | 0 | 0 | 0 | 2 | Explains evidence collection; no boundary with theory, testing or planning. |
| `q-n10p-01` / 5.2 | 2 | 0 | 0 | 0 | 0 | 2 | Connects mismatch with loss/no link; does not explain other fault categories. |
| `q-n10s-01` / 5.3 | 2 | 0 | 1 | 1 | 0 | 4 | Circling frames supplies a partial picture; omits mask, duplicate-IP and pool distinctions. |
| `q-n10performance-01` / 5.4 | 2 | 0 | 0 | 0 | 0 | 2 | Defines jitter; packet loss can also cause choppy voice, so the stem needs discriminating evidence. |
| `q-n10t-01` / 5.5 | 2 | 0 | 1 | 0 | 0 | 3 | Describes signal-and-probe action; does not explain why other tools fail this task. |
| `q-n10c11-12` / 2.2 | 2 | 2 | 1 | 2 | 0 | 7 | Shows 15+15 versus 20+15+15 and distinguishes classic STP/RSTP; strongest contrast, no navigation. |
| `q-n10c10-24` / 2.1, 3.2 | 2 | 1 | 1 | 1 | 0 | 5 | Directional back-out-the-interface picture; poisoned reverse and route deletion not explained. |
| `q-41` / 1.4, 3.4 | 1 | 0 | 0 | 0 | 0 | 1 | APIPA label is repeated; missing DHCP lease does not isolate the root cause. Other options unaddressed. |
| `q-n10performance-02` / 5.4 | 2 | 0 | 0 | 1 | 0 | 3 | Connects path throughput to its bottleneck, without explaining averaging or faster-link distractors. |
| `q-n10performance-03` / 5.4 | 1 | 1 | 0 | 1 | 0 | 3 | Defines RSSI and contrasts SNR; BSSID and channel width remain unexplained. |
| `q-n10performance-04` / 5.4 | 1 | 1 | 0 | 1 | 0 | 3 | Contrasts absent versus late packets, but does not explain jitter or contention. |
| `q-n10s-02` / 5.3 | 2 | 0 | 0 | 1 | 0 | 3 | Explains STP blocking redundant paths; VTP, security and PoE roles are omitted. |
| `q-n10s-03` / 5.3 | 2 | 1 | 0 | 1 | 0 | 4 | Shows priority/MAC tie-break; most-ports and first-powered distractors are omitted. |
| `q-n10s-04` / 5.3 | 1 | 0 | 0 | 0 | 0 | 1 | Restates root-port direction; no designated/alternate/disabled distinction. |
| `q-n10m-02` / 5.1 | 1 | 0 | 0 | 0 | 0 | 1 | Repeats the ordered list without why testing precedes changing or verifying precedes closing. |
| `q-n10m-03` / 5.1 | 1 | 0 | 0 | 0 | 0 | 1 | Restates change inquiry as identification; no boundaries with other stages. |
| `q-n10m-04` / 5.1 | 2 | 0 | 0 | 1 | 0 | 3 | Gives reason to separate unrelated faults; other alternatives remain unexplained. |
| `q-n10t-02` / 5.5 | 1 | 0 | 0 | 0 | 0 | 1 | Restates cable-tester task; no toner or analyzer contrast. |
| `q-n10t-03` / 5.5 | 2 | 0 | 1 | 0 | 0 | 3 | Escaping visible light is a partial picture; other tools unaddressed. |
| `q-n10t-04` / 5.5 | 2 | 0 | 0 | 1 | 1 | 4 | Explains copying to analyzer and names related port mirroring; no usable link or distractor coverage. |
| `q-42` / 1.4, 3.4 | 1 | 1 | 2 | 1 | 0 | 5 | Four As for larger address is a concrete recall hook; MX/CNAME remain unexplained. |
| `q-43` / 1.4, 3.4 | 2 | 0 | 1 | 2 | 0 | 5 | IP-versus-name symptom picture gives a trap distinction; hardware distractors not explained. |
| `q-44` / 1.4, 3.4 | 2 | 0 | 0 | 2 | 0 | 4 | Explains why failure is not DNS-only; other wrong alternatives absent. |
| `q-n10c7-34` / 1.7, 1.8, 3.4 | 2 | 2 | 1 | 2 | 0 | 7 | Accounts for all four addresses with private-range boundaries; no related navigation. |

Sample mean **3.10/10** (149/480); **38/48 score ≤4**. No sample provides a usable related-concept link. The AAAA question supplies a concrete recall hook, while most other items supply none. This is evidence for the reported lack of context, not a bank-wide defect rate.

### Exact explanation evidence: lowest-scoring examples

- `q-n10ap-01`: “Objective 1.2. An IDS is passive and alerts. The answer is IDS.”
- `q-n10pt-01`: “Objective 1.4. FTP control connection uses port 21 by default.”
- `q-n10tx-01`: “Objective 1.5. SFP+ is the same size as SFP but supports 10 Gbps.”
- `q-n10top-01`: “Objective 1.6. A star topology connects every device to a central device, typically a switch.”
- `q-n10sdn-01`: “Objective 1.8. The data plane, also called the infrastructure layer, does the forwarding.”
- `q-n10wireless-devices-01`: “Objective 2.3. 1, 6 and 11 are the non-overlapping 2.4 GHz channels in the US.”
- `q-n10mon-01`: “Objective 3.2. The manager, or network management station, polls devices and shows the data.”
- `q-n10sf-01`: “Objective 4.3. Port security caps and tracks MACs per port. The answer is Port security.”
- `q-41`: “169.254.x.x is APIPA. The client could not get a real DHCP address.”

Compare `q-n10c11-12` (9/10): its 15 s + 15 s path, separate 20 s MaxAge scenario and RSTP contrast show the kind of distinction missing from the shortest explanations. It still lacks a related link. `q-n10c21-01` (8/10) explains distributed sources and every distractor instead of repeating DDoS.

### Correctness/scope findings for a later rewrite

- **Confirmed local mapping inconsistency:** `q-n10access-management-01` begins “Objective 3.4,” while its topic is mapped to 3.5 and its `3-5-methods` section covers management access. Verify against the official document before replacing the label; no change made.
- **Ambiguity requiring review:** `q-n10performance-01` says choppy voice on a fast link, but both jitter and packet loss are offered. Explanation defines jitter without providing evidence that rules out loss. Add delay-variation measurements in Phase 2 rather than imply symptom alone proves jitter.
- **Scope caveats requiring source review:** `q-n10c9-01` says the router “never consults” origin/return path; restrict to ordinary destination-based forwarding, with policy/routing validation outside the question assumptions. `q-n10c11-01` treats software bridges and hardware switching/lowest latency as universal and frames forwarding as only where needed; clarify platform and flooding behavior. `q-41` should distinguish an observed IPv4 link-local address from proof of a particular DHCP root cause. `q-n10wireless-devices-01` should state channel width and regulatory assumptions. `q-n10chg-01` needs vendor lifecycle terminology caveats.
- **Coverage omission in feedback:** no sampled explanation links to the matching chapter or visualization. `QuizRunner.tsx` and `ExamTest.tsx` display explanation strings (test review strips the leading objective label); neither supplies the requested five-part explanation structure. This was code inspection, not a browser walkthrough.

The deterministic checker passes existing pins but is not fresh external fact verification. No unverified claim was corrected, no answer key was changed, and no source correctness or accessibility certification is implied.

## Proposed work pending Phase 1b and topic approval

First rewrite all **38 sampled items scoring ≤4**, then every question in the approved repeat-miss concepts after the export is assessed. Their exact stable IDs are:

`q-n10osi-01`, `q-n10ap-01`, `q-n10cloud-connectivity-01`, `q-n10pt-01`, `q-n10tx-01`, `q-n10top-01`, `q-n10c7-01`, `q-n10sdn-01`, `q-n10zt-01`, `q-n10c11-01`, `q-n10wireless-devices-01`, `q-n10physical-installation-01`, `q-n10org-01`, `q-n10mon-01`, `q-n10dr-01`, `q-n10dhcp-01`, `q-n10access-management-01`, `q-n10sec-01`, `q-n10sf-01`, `q-n10m-01`, `q-n10p-01`, `q-n10s-01`, `q-n10performance-01`, `q-n10t-01`, `q-41`, `q-n10performance-02`, `q-n10performance-03`, `q-n10performance-04`, `q-n10s-02`, `q-n10s-03`, `q-n10s-04`, `q-n10m-02`, `q-n10m-03`, `q-n10m-04`, `q-n10t-02`, `q-n10t-03`, `q-n10t-04`, `q-44`.

Budget roughly 15–25 minutes per bounded rewrite including distractor/source review and related-link selection; roughly 10–16 hours for these 38 samples plus integration/checking. All remaining questions need either a full-bank audit or concept-based selection; the sample does not justify an automatic rewrite of all 1,117 questions.

At most six **candidate** explainers below, ordered by **expected repeat-confusion proxy × exam-domain weight**. This is an editorial planning estimate, not observed repeat-miss frequency. Proxy 3 means repeated near-neighbor distinctions plus thin/ambiguous sampled feedback; 2 means a multistep distinction supported by better existing examples. Use the highest applicable domain weight once, without summing weights across objectives. Ties follow the supplied audit's 5.4-then-5.3 order and practical reuse. Replace this ordering with observed repeat-miss frequency after Phase 1b; do not build before topic approval.

| Rank / candidate | Objective / weight | Expected-confusion proxy × weight | Evidence and resource to reuse | Effort |
| --- | --- | ---: | --- | --- |
| 1. Jitter versus latency versus loss | 5.4 / 24% | 3 × 24 = 72 | Prior highest-weight missing objective; `q-n10performance-01/03/04` leave the distinctions thin. Reuse `n10-performance-troubleshooting#5-4-terms`. | 4–6 h |
| 2. VLAN boundaries and STP roles/timers | 2.2, 5.3 / 24% | 3 × 24 = 72 | Root-role definitions and loop distractors omitted in `q-n10s-02/03/04`; contrast the strong 30 s/50 s item. Reuse `ch11-switch-learning.html` and existing chapter-11 STP visuals. | 5–7 h |
| 3. DHCP DORA, DNS reachability and APIPA | 3.4, 5.3 / 24% | 3 × 24 = 72 | `q-41/43/44` are editorial weak items; `q-n10dhcp-01` gives sequence without message roles. Reuse `networking-dns-dhcp-dora.html`. | 4–6 h |
| 4. Route installation versus forwarding | 2.1, 5.3 / 24% | 2 × 24 = 48 | Recent bounded corrections show terminology risk; `q-n10c9-01` has better contrast but scope caveats. Reuse `ch10-route-selection.html`, `ch10-admin-distance.html`. | 4–6 h |
| 5. Subnet capacity and private-range boundaries | 1.7 / 23% | 2 × 23 = 46 | `q-n10c8-01` omits 127 distinction; `q-n10c7-34` is editorial weak but already gives all range contrasts. Reuse `n10-ch8-subnet-calculator.html`. | 4–6 h |
| 6. RPO versus RTO | 3.3 / 19% | 2 × 19 = 38 | Former gap; `q-n10dr-01` lacks alternative metric meanings. Reuse `n10-disaster-recovery#3-3-metrics`. | 4–6 h |

Each estimate includes fact review, 30–90 s captioned step sequence, controls/reduced-motion, two-question transfer check and mobile validation. Add 1–2 days shared integration for history-derived feedback, navigation/return, accessible controls and regression/browser checks. Final effort depends on existing visual reuse and the approved topics. Work ships to all accounts; personal history remains evaluation-only input. No claim is made that these are the primary learner profile's weakest concepts.

## Phase 1b input and exporter

Run locally from the repo on Node 22.6+:

```sh
node scripts/export-primary-history.mjs --help
node scripts/export-primary-history.mjs
```

Put existing deployed values for `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_SYNC_SERVICE_SID`, `LEARNER_SESSION_SECRET` and `LEARNER_ALLOWED_PHONES` in git-ignored `.env.local`. Do not send their values in chat. The session secret must match the site's existing secret; generating a new one selects a different map. If multiple numbers are allowed, set `LEARNER_PRIMARY_PHONE` locally to select the intended allowlisted number; otherwise the script refuses to choose. No SMS or sign-in is needed and no Verify service is accessed.

The script derives the same HMAC map name as `lib/learner/session.ts`, paginates only that map's items without a total-item truncation limit, validates supported progress/history shapes, and writes exclusively to git-ignored `data/primary-history.json` with owner-only file mode. It never enumerates other learner maps and contains no remote mutation calls. Existing exports are not overwritten; move the old file aside yourself to rerun. Provider errors are suppressed to avoid leaking identifiers. It does not sync, repair or truncate remote history.

Export is a JSON array with only `questionId`, `objective`, `correct`, `timestamp`, `fsrsState`. Bank question IDs are allowlisted and only Network+ eligible questions are included. Quiz correctness is reconstructed only for complete question lists with consistent totals. Timed mocks may store only visited question IDs: their complete correct/missed grading sets are validated, and only visited questions are exported; unvisited scheduled questions are omitted and counted. Incomplete legacy sittings without those grading sets are omitted rather than guessed. Older sittings lacking question IDs are omitted with a count; no guessed successful attempts. Timestamp is the **sitting completion time**, since individual response times are not stored. Identical exported rows are deduplicated. Remote retention caps are 40 quizzes / 30 mocks, so even a valid export is not lifetime history.

A mock's saved objective is used when it is valid for the current mapping. A unique explicit/topic objective is used otherwise; ambiguous multi-objective rows retain **objective: null** and are counted, never forced into a domain. FSRS is stored by flashcard ID without question linkage, so ordinary progress-derived rows have **fsrsState: null**. A history event can provide an explicit numeric question-level state (0–3); only that validated state is retained. No flashcard-to-question join is invented. Historical removed/unknown questions cannot be mapped and are excluded. All these limits must appear in Phase 1b denominator/recency reporting. The approved schema also lacks the wrong choice picked, so it cannot support a historical “usual wrong answer” analysis; future UI can read each learner's own available history where stored, without guessing from this export.


### Documented-versus-implemented storage formats

The supplied learner-accounts report lists `profile`, `progress`, `schedules-*`, `history`, `run:*`, with 100 events and 30 runs. The checked-in `lib/learner/store.ts` instead reads/writes `progress-0…N` string chunks containing the progress object; it has no loader or schema for those separate historical items. This discrepancy is recorded, not silently resolved by assuming the report or current code matches production.

Exporter supports (1) current contiguous `progress-*` chunks, (2) a single documented `progress` item holding the same validated progress object or its `{s: JSON-string}` encoding, and (3) explicit per-question `history` records in an array or `{events: [...]}`. These history encodings are compatibility adapters, **not a claim about an uninspected production payload**. Accepted event fields are the output schema; missing/invalid question evidence is never reconstructed from an aggregate activity label. Profile, separate schedules and runs are ignored; they are not question-attempt evidence. Conflicting concurrent progress layouts or contradictory same-question/same-time outcomes fail safely. Unknown history container formats fail safely and require a schema-only example before adding an adapter. Aggregate, unknown and non-Network+ history events omitted from the export are counted in the local summary. Fake Sync tests cover both progress layouts and explicit question events; real production compatibility is unverified.

Until an export exists, attempts/accuracy/repeat misses/recency/FSRS analysis and readiness verdicts remain pending. On receipt, validate schema, IDs, timestamps and completeness first; keep unknown objectives unassigned and report sparse domains. Do not turn missing rows into zero attempts or failure evidence.

## Validation

Validation results are recorded in [the Phase 1a build report](build-report-2026-11-01-network-plus-explainers.md). This phase has no new UI, animation or deployment to test. Real primary-profile reads, primary-profile progress loading, zero-history browser compatibility, mobile/reduced-motion/screen-reader walkthroughs and preview deployment remain unperformed; they are later-phase gates, not passes here.
