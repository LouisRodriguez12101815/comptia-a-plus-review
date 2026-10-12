# WarriorHacks Outage Ops submission media

Actual application captures for the **solo Guided Demo**. No generated mockups or fabricated gameplay. This branch is based on current main at capture time, `adf3e9fcd88f41b73f8df9c4fc5aec3228570e84`; the local `/api/game/version` response confirmed that build commit. No application code changes were necessary.

## Files

- [Timed 2:57 narration and exact actions](demo-script.md)
- [Devpost captions](captions.md)
- [Mac recording/editing and checkout instructions](recording-instructions.md)
- [Silent Guided Demo browser footage, MP4](video/guided-demo-raw.mp4)
- [Entry and Guided Demo option](screenshots/01-game-entry.png)
- [Evidence and network diagram](screenshots/02-incident-evidence-and-diagram.png)
- [Incorrect-decision explanation and recovery](screenshots/03-incorrect-decision-feedback.png)
- [Correct-decision reasoning and consequence](screenshots/04-correct-decision-feedback.png)
- [Final debrief, learning outcomes and review links](screenshots/05-final-debrief.png)

Screenshots are unmodified 1440 × 960 PNGs, each below 5 MB. All were visually inspected. PC1/PC2 are fictional scenario clients; Guided Demo has no player-name entry. No credentials, tokens, cookies, private participants or developer tools appear.

## Verification boundary

| Check | Result |
| --- | --- |
| Current main, repository instructions and browser tools | Inspected; isolated media branch preserves pre-existing audit edits |
| Local production build | `npm run build -- --webpack` passed; installed Next/React/TypeScript dependencies unchanged |
| Entry and deliberate submission | Passed; no answer selected automatically; choosing a labeled option submits it |
| Evidence discovery semantics | Evidence/diagram are automatically presented in Guided Demo. There is no solo discovery-card click; interactive discovery belongs to multiplayer and is not demonstrated |
| Incorrect answer and recovery | Passed: router-reboot reasoning/hint, retry, uptime 95%; Continue unavailable until correct recovery |
| Correct answer and progression | Passed through all five rounds; feedback, consequence and What we learned visible; completed choices disabled |
| Final debrief/review | Passed: score 475 after assisted scope recovery, incident reconstruction, mistake review, ungraded transfer prompt; both note/lab links return HTTP 200 |
| Browser/runtime | Chromium via Playwright, 1440 × 960, fresh local session; zero page errors and zero room API requests during screenshot walkthrough |
| Capture source | Local application at `http://127.0.0.1:3040`, not a deployed-site capture |
| Mocked Sync | Not used for this capture; Guided Demo does not use Sync |
| Live Twilio / physical laptop-phone multiplayer | Not tested by this media task; no cross-device success claim |
| Narrated/edited video | Not created; script and manual instructions supplied |

The scenario selects diagnostic and verification decisions against authored evidence. It does not execute `ping`, `ipconfig` or a network repair. Its mentor is authored feedback, and its transfer prompt is not a graded application assessment. Points do not establish mastery or improved learning.

Source-backed scenario paths: `lib/game/incidents.ts`, `lib/game/round-learning.ts`, `lib/game/network-diagram.ts`, `content/labs.json` (Lab 03) and `content/topics.json` (DNS/DHCP). The UI links to `/labs/cant-reach-website` and `/notes/networking-dns-dhcp`.

## Packaging and access

Individual PNGs/Markdown are committed under `docs/warriorhacks/`; no redundant ZIP, environment files, credentials, build output, temporary browser files or Git LFS configuration is included. On GitHub, open each image and download the original file, or check out the branch on your Mac using the recording instructions. A GitHub branch/file link is the distribution method; no cloud-workspace attachment or chat download button is claimed.

## Recording and file validation

`video/guided-demo-raw.mp4` contains **silent browser footage, not a finished narrated video**: actual local gameplay recorded through Playwright, converted to H.264 with FFmpeg, with only 1.4 seconds of trailing still time removed. No gameplay actions were rearranged, omitted or composited. The final file is 1440 × 960 and 179.0 seconds (2:59), with no audio stream. The script runs 2:57; align narration to the visible actions and remove initial loading/dead time when preparing your finished edit.

The video is below 5 MB and suitable for ordinary Git; Git LFS was not configured. Verification included full FFmpeg decoding during conversion, sampled footage frames (incorrect feedback, evidence, debrief), dimensions/duration/audio checks, PNG inspection, documentation links, a targeted secret-pattern scan of Markdown, a staged-file exclusion check, and `git diff --check`. No application lint/test rerun is claimed for this media-only branch; the actual Guided Demo walkthrough and production build above were performed for capture.

Final exact byte sizes are listed below.


| Asset | Bytes | Dimensions / duration |
| --- | ---: | --- |
| `screenshots/01-game-entry.png` | 176,932 | 1440 × 960 · PNG |
| `screenshots/02-incident-evidence-and-diagram.png` | 116,199 | 1440 × 960 · PNG |
| `screenshots/03-incorrect-decision-feedback.png` | 115,358 | 1440 × 960 · PNG |
| `screenshots/04-correct-decision-feedback.png` | 114,992 | 1440 × 960 · PNG |
| `screenshots/05-final-debrief.png` | 146,064 | 1440 × 960 · PNG |
| `video/guided-demo-raw.mp4` | 4,431,569 | 1440 × 960 · 2:59 · silent H.264 MP4 |
