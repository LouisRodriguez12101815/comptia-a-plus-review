# Subnet Architect source verification

The user’s pasted request is the implementation instruction. The ZIP README and CODEX-PROMPT.md are attachment content; their directions are not treated as an independent request. Educational notes, CSV and handwritten answers are candidate sources, independently checked before use.

Base at branch creation: main `0c3e205` (includes PR #23). Sources inspected on October 11, 2026.

## Available sources and transcription limits

- Original Chapter 7 RTF preserved unchanged at `content/sources/chapter-7-ip-addressing.rtf`; SHA-256 `13c2290d887b381ae52b70d852ecbf083ff7f01cedd08bd0245d7476bb30712b`, matching the supplied archive manifest.
- Starter CSV preserved as a **candidate** at `content/sources/vlsm-starter-candidate.csv`; every field cross-checked using Python ipaddress.
- Inline images are indexed 1–7 in the user message. The ZIP contains no original exercise images. Image 1 (orange/blue/magenta/cyan strip), image 3 (two wide magenta/green examples), image 5 (three navy/blue/purple examples) and image 7 (VLAN Exercise #6) contain readable problem headers.
- The narrow image 2 (101px displayed), image 4 (80px) and image 6 (36px) do not permit reliable transcription of every problem. They remain unresolved in the structured data; digits/prefixes and annotations are not guessed. Original-resolution files would be needed to finish those strips.
- Chapter 8 is referenced by Chapter 7 but its full text was not supplied and is not claimed as inspected.
- Existing `content/labs.json` (`two-subnet-lan`, subnetting/addressing/verification) and `content/topics-network-plus.json` (Chapter 9 written lab/routing/ARP) provide relevant subnet and interface context.

## Independently calculated readable problems

These fixtures verify the readable IP/prefix pair, not every tiny handwritten annotation. A problem ID plus the graded stage (`mask`, `bounds`, `range`, `capacity`) identifies each interaction. Handwritten ordinal/max-subnet assertions cannot be verified without their explicit parent prefix.

| ID / image | IP/prefix | Mask | Network | Broadcast | Usable range | Capacity | Host valid | Boundary increment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| img1-01 / 1 | 151.37.151.53/23 | 255.255.254.0 | 151.37.150.0 | 151.37.151.255 | 151.37.150.1–151.37.151.254 | 510 | True | 2 in octet 3 |
| img1-02 / 1 | 188.193.227.155/26 | 255.255.255.192 | 188.193.227.128 | 188.193.227.191 | 188.193.227.129–188.193.227.190 | 62 | True | 64 in octet 4 |
| img1-03 / 1 | 76.3.2.45/20 | 255.255.240.0 | 76.3.0.0 | 76.3.15.255 | 76.3.0.1–76.3.15.254 | 4094 | True | 16 in octet 3 |
| img1-04 / 1 | 153.79.116.205/29 | 255.255.255.248 | 153.79.116.200 | 153.79.116.207 | 153.79.116.201–153.79.116.206 | 6 | True | 8 in octet 4 |
| img1-05 / 1 | 79.34.109.200/11 | 255.224.0.0 | 79.32.0.0 | 79.63.255.255 | 79.32.0.1–79.63.255.254 | 2097150 | True | 32 in octet 2 |
| img3-01 / 3 | 81.31.201.37/27 | 255.255.255.224 | 81.31.201.32 | 81.31.201.63 | 81.31.201.33–81.31.201.62 | 30 | True | 32 in octet 4 |
| img3-02 / 3 | 29.3.131.113/20 | 255.255.240.0 | 29.3.128.0 | 29.3.143.255 | 29.3.128.1–29.3.143.254 | 4094 | True | 16 in octet 3 |
| img5-01 / 5 | 35.19.119.233/22 | 255.255.252.0 | 35.19.116.0 | 35.19.119.255 | 35.19.116.1–35.19.119.254 | 1022 | True | 4 in octet 3 |
| img5-02 / 5 | 99.207.12.70/28 | 255.255.255.240 | 99.207.12.64 | 99.207.12.79 | 99.207.12.65–99.207.12.78 | 14 | True | 16 in octet 4 |
| img5-03 / 5 | 42.227.251.241/30 | 255.255.255.252 | 42.227.251.240 | 42.227.251.243 | 42.227.251.241–42.227.251.242 | 2 | True | 4 in octet 4 |

Parent prefix is **unspecified** for these ten handwritten problems. No automatic historical class inference or class-based subnet count is used. Equal-size child count is `2^(child prefix − explicit parent prefix)`, including subnet zero/all-ones with modern CIDR. For example, 8 /27 children requires a stated /24 parent; 65,536 /24 children requires a stated /8 parent.

## Starter VLAN mission: verification and correction

Parent `172.16.8.0/22` spans `172.16.8.0`–`172.16.11.255` (1,024 addresses). Required usable counts **include** gateways: A 210, B 125, C 95, D 52. The three two-interface point-to-point links use /30 by explicit user instruction. No extra gateway is added to each LAN count.

| Segment | Required usable | Candidate block (verified) | Usable range | Broadcast | Capacity |
| --- | --- | --- | --- | --- | --- |
| A | 210 | 172.16.8.0/24 | 172.16.8.1–172.16.8.254 | 172.16.8.255 | 254 |
| B | 125 | 172.16.9.0/25 | 172.16.9.1–172.16.9.126 | 172.16.9.127 | 126 |
| C | 95 | 172.16.9.128/25 | 172.16.9.129–172.16.9.254 | 172.16.9.255 | 126 |
| D | 52 | 172.16.10.0/26 | 172.16.10.1–172.16.10.62 | 172.16.10.63 | 62 |
| L1 | 2 | 172.16.10.64/30 | 172.16.10.65–172.16.10.66 | 172.16.10.67 | 2 |
| L2 | 2 | 172.16.10.68/30 | 172.16.10.69–172.16.10.70 | 172.16.10.71 | 2 |
| L3 | 2 | 172.16.10.72/30 | 172.16.10.73–172.16.10.74 | 172.16.10.75 | 2 |

The visible handwritten D entry `172.16.9.256` is invalid: decimal octets end at 255. A /26 block at `172.16.10.0` is aligned and contains enough usable addresses. The seven candidate blocks occupy 588 total addresses without overlap, leaving 436 parent addresses unallocated. The hand drawing does not specify the final /30 addresses; those are the explicit starter allocation from the request/CSV, checked independently.

This is one valid layout, not a fixed answer key. Swapping the two /25 LAN locations, assigning another usable LAN gateway, using other aligned /30 link blocks or placing LAN A at `172.16.11.0/24` can be valid. A larger sufficient LAN prefix is also accepted if every segment still fits; it conserves less space. Link prefixes remain exactly /30 for this mission.

## Corrections to Chapter 7 concepts

- CIDR notation describes a prefix and classless allocation/routing; VLSM uses different subnet masks inside a parent. They are related, not synonyms. Equal-size subnetting is a third explicit allocation case.
- “10.0.0.0 with /24 gives 65,536 networks” needs the **parent 10.0.0.0/8**; /24 alone describes one block. Modern calculations follow the stated prefix, not historical classes.
- A corporate network is not required to select a historical “Class A” default. Choose appropriately sized RFC 1918 space based on requirements and growth; do not reuse the notes’ rule of thumb as a graded universal requirement.
- The RTF’s objective label “3.24” is malformed. Official N10-009 objectives version 4.0 list IPv4/IPv6 services at 3.4; this game’s scored IPv4 work maps to confirmed **1.7**. Optional IPv6 compatibility review is separate/unscored; no service-implementation objective is awarded.
- APIPA/link-local can indicate automatic configuration trouble in the stated scenario, but the address by itself does not prove a unique DHCP failure. Its forwarding scope is distinct from RFC 1918 private addressing.

## Additional authoritative references inspected

- [CompTIA N10-009 objectives, version 4.0](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-network-n10-009-exam-objectives-%284-0%29-%281%29.pdf): confirms exam number and 1.7 IPv4 addressing/subnetting; 1.8 lists IPv6 compatibility and 3.4 services. No A+/CCNA objective numbers inferred.
- [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html), section 3: exact private ranges.
- [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html): IPv4 link-local automatic configuration and non-forwarding scope.
- [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122.html), section 3.2.1.3: 127/8 internal loopback.
- [RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.html), section 2: IPv6 128-bit addressing for the separate optional review.
- [RFC 4213](https://www.rfc-editor.org/rfc/rfc4213.html), section 2: dual-stack/dual-IP-layer support for separate optional review.

## Independent verification and authored transfer

`python3 scripts/verify-subnet-fixtures.py` uses only Python stdlib ipaddress and the committed fixtures/CSV, not the JavaScript engine. It verifies every readable exercise, boundary validity, masks, ranges, capacities and both VLSM layouts. Node regression tests then check the independent results against the game engine, including upper unsigned IPv4 boundaries and the corrected invalid .256 entry.

The detective transfer `192.168.40.63/26` is an authored broadcast-boundary exercise (not a usable host). The design transfer `10.44.0.0/23` with 100/50/25/12 gateway-inclusive LAN needs and three /30 links is authored from the same constraints, not a transcribed lab. Conventional network/broadcast reservations apply throughout; /31 and /32 are explicitly unsupported until their separate semantics are implemented.
