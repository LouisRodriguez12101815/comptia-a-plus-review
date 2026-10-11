# Practice Games source audit

Inspected before authoring: `content/topics.json`, `content/topics-network-plus.json`, `content/labs.json`, `content/source.md`, certification navigation in `lib/tracks.ts`, and the Outage Ops client/shared-room architecture. Main at branch creation: `65fea90` (includes PRs #17 and #19).

Existing material supports PCIe expansion, storage form factors, AC-to-DC power, NICs, memory diagnostics, ARP, frames/packets, subnet comparison and route selection. Chapter 9's written lab provides Host_C/Host_D's local subnet and Host_A-to-Host_C's routed topology. The original notes' statement that a packet is entirely unchanged at routers is too broad: with no NAT its IP endpoints stay the same, while TTL and IPv4 header checksum change.

Gaps found before questions were created:
- RAM function/volatile data and DDR generation/module compatibility are not covered adequately in the Core 1 notes.
- ARP cache-state variants and precise TTL/header-checksum behavior need explicit assumptions and supporting standards.
- Complete hardware coverage (CPU sockets, chipsets, cooling, firmware, connector power budgets, ECC/registered RAM) is absent from this focused release. No unsupported questions on those topics are added.

Additional primary references inspected on October 11, 2026:
- [Kingston: What is computer memory?](https://www.kingston.com/unitedkingdom/en/blog/pc-performance/what-is-computer-memory): temporary RAM data, volatility, module compatibility; used for RAM identification/compatibility. Original paraphrased questions and schematic artwork, no product images copied.
- [Kingston DDR5 overview](https://www.kingston.com/en/blog/pc-performance/ddr5-overview): supplementary DDR generation context. No generic claim that a similar-looking module fits a different generation.
- [RFC 826](https://www.rfc-editor.org/rfc/rfc826.html): Ethernet address resolution, used alongside Chapter 9's ARP notes.
- [RFC 1812](https://www.rfc-editor.org/rfc/rfc1812.html), sections 5.2.1.2, 5.2.4.3 and 5.3.1: forwarding, longest match, TTL reduction and checksum update. IPv4 source/destination preservation is explicitly conditional on the scenario's no-NAT assumption.
- A Crucial RAM page rejected access and is **not** treated as an inspected source or used as evidence.

`content/practice-games.json` records stable source IDs, local paths/sections, review URLs, question/answer IDs, learning objectives and exam-version/domain mappings. Exam mappings describe curriculum areas for A+ 220-1201 and Network+ N10-009, not exhaustive official exam coverage or licensed exam questions. Constructed transfer networks and hardware specification cards are authored scenario assumptions, not claimed observations from the labs.
