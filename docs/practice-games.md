# Practice Games

The catalog at `/practice-games` groups challenges by certification, topic and difficulty, with visible learning objectives. `/practice-games/component-match` and `/practice-games/follow-packet` are solo browser practice. `/game` remains Outage Ops with its existing Guided Demo and Twilio rooms.

## Content and observable goals

All scored rounds in `content/practice-games.json` have stable question/answer IDs, one correct answer, answer-specific reasoning, a hint, an objective, source IDs and exam-version/domain mappings. [Source audit](practice-games-sources.md) documents inspected local notes, gaps and supplementary primary references. The Chapter 9 JSON notes now clarify that routers update TTL/checksum while no-NAT IP endpoints remain unchanged.

| Challenge | Rounds | Observable practice |
| --- | --- | --- |
| Component Match | 8 | Identify RAM, PSU, SSD and NIC functions; distinguish DDR/module and PCIe compatibility; select a justified RAM or storage investigation from symptoms. |
| Follow the Packet | 16 | Build a justified sequence across same-subnet delivery, routed delivery and a different-network transfer: subnet comparison, next-hop choice, ARP, Ethernet framing, switching, longest-prefix routing, TTL/checksum changes, reframing and destination delivery. |

The packet diagram includes interfaces, IP/MAC addresses, subnets, route candidates and explicit IPv4/Ethernet/ARP-cache/no-NAT assumptions. Choices pair an action with a reason. Completed decisions form the journey in order; incorrect choices do not move the packet or reveal the next result. After a correct decision the diagram shows its resulting location, frame endpoints and TTL. Diagrams use a vertical phone layout, text descriptions and reduced-motion support. Original hardware illustrations describe visible features without naming the answer.

## Framework and scoring

`lib/practice/session.ts` contains pure transitions shared by both games. Answer IDs stay stable while presentation is shuffled. Only the active unsolved round accepts an answer; invalid, repeated and stale submissions do nothing. Correct completion earns 100 once, or 75 after an explicitly priced hint. Wrong answers earn zero and allow another choice. There are no speed points, timer penalties or extra retry points.

First-attempt accuracy, hint use and final completion are separate. The debrief lists unaided first attempts, actual incorrect interpretations, hint-assisted topics, source review links and exam domains. It avoids calling a score proof of mastery. Versioned local storage supports reload/resume and validates receipts rather than trusting saved scores. Storage failure does not prevent play.

Tap/click or keyboard Enter/Space selects a card; optional drag places it in the target. Packet ordering is incremental, with feedback after each position, rather than requiring a long reorder operation on a phone. The framework is ready for additional data-driven solo challenges. A future cooperative variant must move authoritative receipts/scoring into authorized shared room transactions and pass cross-device tests; these two challenges are **not multiplayer**.

## Validation and limits

Feature validation on October 11, 2026: 99 regression tests passed (89 Outage Ops, 10 practice); typecheck and production build passed; lint passed with three pre-existing image warnings. Complete browser walkthroughs passed for Component Match on a phone viewport and Follow the Packet on desktop and phone viewports, including reduced motion, wrong responses, hint recovery, duplicate prevention and debrief recommendations. Saved-session resume and optional drag-event handlers passed. The phone diagram was also visually inspected. The existing Outage Ops real-route browser walkthrough passed with explicitly mocked Sync transport: both incidents, wrong-answer recovery, shared evidence, empty/invalid-host timeout overrides, disconnected/reconnected players and duplicate protection. An initial preservation run overlapped a rebuild and failed in the shared-evidence phase; the complete rerun against the finished build passed. No live-service result is inferred from it.

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm run test:e2e:practice -- --browser /usr/bin/chromium`. The practice browser script uses rendered Next pages and real local browser storage, without route interception or a game-state bridge. Native drag-event handlers are checked separately from the primary keyboard/tap path.

Run `npm run test:e2e -- --mock-sync --browser /usr/bin/chromium` to check preserved Outage Ops through real application API routes with mocked external Sync transport. This explicitly mocked test is not a configured Twilio service or physical laptop/phone acceptance test.

This is focused coverage: eight component decisions do not cover the full A+ hardware domain. Routing examples omit NAT, IPv6, multiple-router paths, fragmentation and VLAN changes. Scenario assumptions include known-good links and stipulated hardware compatibility; symptom choices recommend investigation rather than pretending one symptom proves a unique failed part. Address/MAC examples and the transfer network are authored teaching fixtures. Domain mappings are not comprehensive exam coverage.

Automated checks establish progression and feedback behavior, not improved learning. Learner testing is still needed for illustration recognition, reading load, explanation comprehension, transfer without choices, retention and misconceptions after practice. Actual touch dragging and assistive-technology usability also need device/user testing. Production deployment and live Twilio cross-device acceptance are outside the evidence from this local feature validation.
