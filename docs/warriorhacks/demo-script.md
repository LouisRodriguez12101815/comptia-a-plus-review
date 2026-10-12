# Outage Ops Guided Demo — 2:57 walkthrough

This script describes current main `adf3e9fcd88f41b73f8df9c4fc5aec3228570e84`. It follows the actual solo Guided Demo, not a live room. Selecting an answer submits it; there is no additional Submit button. Evidence is automatically presented, not unlocked by a discovery click. Diagnostic commands and repairs are scenario choices/supplied results, not commands executed against a real network. The transfer question is an ungraded discussion prompt.

The included footage, when present, is a **silent raw browser recording**, not a finished narrated submission. Read this narration over it or record your own take using [the recording instructions](recording-instructions.md). Answer order is randomized: select by text, never screen position.

| Time | Exact on-screen actions | Suggested narration |
| --- | --- | --- |
| 0:00–0:12 | Show the CompTIA Review homepage. | “Knowing a networking definition is different from applying it when a user cannot connect. Outage Ops lets learners practice the reasoning behind troubleshooting decisions.” |
| 0:12–0:25 | Open `/game`; show the Guided Demo card and Begin training button. | “This lives inside CompTIA Review, alongside notes, flashcards, quizzes and labs. I’m demonstrating the solo Guided Demo; the separate room modes are not part of this recording.” |
| 0:25–0:38 | Click **Begin training**. Show **Find the blast radius**, the PC1 ticket and objective; scroll normally as needed. | “PC1 cannot open the site, while PC2 can. The first objective is scope: establish who is affected before changing shared equipment.” |
| 0:38–0:53 | Click **Reboot the router immediately**. Scroll to **Not the best next move**; keep the explanation and Try again visible. | “I’ll deliberately choose a weak response. The feedback explains that rebooting shared equipment could disrupt working users without identifying the cause. Uptime falls, but the mistake is recoverable.” |
| 0:53–1:08 | Click **Try again**, then **Test the site from a second workstation**. Show **Correct diagnostic move**, consequence, What we learned and Continue. | “Now I compare workstations. The explanation connects the working client to a likely PC1-specific fault. The assisted answer earns less credit; points are practice contributions, not proof of mastery.” |
| 1:08–1:21 | Click **Continue →**. Show **Check the local foundation**, “PC1 link light: green” and the network path. | “The next round asks what to inspect before changing settings. The local link is up, so IP configuration is a useful next check.” |
| 1:21–1:28 | Click **Run ipconfig /all on PC1**. Scroll to the reasoning and consequence. | “Choosing this test reveals configuration context in the scenario. It does not run a terminal command.” |
| 1:28–1:50 | Click **Continue →**. Show **Read the test results**: gateway/server pings reply, hostname lookup fails. Scroll so the evidence and PC1 → SW1 → R1 → SW2 → SRV1 diagram are readable. | “Here we gather and interpret the supplied evidence. IP connectivity succeeds, but the hostname fails. The diagram shows the client, switches, router and DNS server. Guided Demo presents these clues automatically; a solo player does not click multiplayer discovery cards.” |
| 1:50–2:03 | Click **The IP path works, but name resolution fails**. Show the explanation, consequence and What we learned. | “This decision fits the observed results. A routing failure is weaker because the server responds by IP. The next question examines the resolver setting.” |
| 2:03–2:12 | Click **Continue →**. Show PC1 DNS `192.168.20.100` versus known DNS `192.168.20.10`. | “The configured resolver differs from the approved server. We can now justify a targeted diagnosis instead of restarting unrelated equipment.” |
| 2:12–2:18 | Click **PC1 points to a nonexistent DNS server**. Show the feedback. | “The mismatch supports this scenario’s diagnosis and explains the hostname-only failure.” |
| 2:18–2:31 | Click **Continue →**, then **Set DNS to 192.168.20.10, repeat the name test, then open the site**. Show the correct reasoning and consequence. | “A repair needs verification. I choose the DNS correction plus repeated lookup and website tests. This game selects a verification plan; the source lab executes it.” |
| 2:31–2:42 | Click **Continue →**. Show **Ticket closed. The site is back.**, Incident reconstruction, the recorded misconception and review links. | “The debrief reconstructs the incident and records my earlier mistake. It links the reasoning back to source notes and a lab. The transfer question is an ungraded prompt.” |
| 2:42–2:49 | Keep source-linked debrief visible. | “Next.js, React and TypeScript power the interface. Separate cooperative rooms use Twilio Sync and server-authoritative scoring.” |
| 2:49–2:57 | Click **Lab 03 — Troubleshooting Speed Run: “I Can’t Reach the Website”** and show the source lab. | “Reliable retries and reconnects were development challenges. Next are real-device acceptance and learner testing. This recording demonstrates solo practice, not verified cross-device multiplayer.” |

## Accuracy notes for the presenter

- The mentor text is authored feedback, not an AI chat service.
- Guided Demo keeps its score/state in the client during the run. Multiplayer scoring/authorization is a separate server-controlled implementation and is not demonstrated here.
- A wrong scope answer lowers uptime to 95% and reveals a hint. Recovering correctly earns 75 rather than 100; four subsequent unhinted correct decisions bring this take to 475.
- The normal choice click is the deliberate submission. Incorrect feedback blocks Continue until a correct recovery. Do not invent an additional test-selection interface, live command execution, graded transfer assessment or mastery measurement.
- The menu advertises multiplayer because it also links to room modes. Label the captured gameplay **solo Guided Demo**, not multiplayer footage.
- Claims about better learning need learner evidence; a successful demo only verifies the interaction loop.
