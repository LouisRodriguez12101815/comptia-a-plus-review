# CompTIA A+ Review

Public study site for classmates: **notes**, **flashcards**, **original practice quizzes**, and a **networking labs** showcase for A+ Core 1, A+ Core 2, and Network+. Hosted on Vercel. No login. Study focus and progress stay in the browser (`localStorage`).

Questions are written from class notes. They are not official CompTIA items.

## Classmates

Open **https://comptia-a-plus-review.vercel.app** — no login. Choose Core 1, Core 2, Network+, or All, then use Notes to read, Flashcards to drill, Quiz to test, and Labs for Packet Tracer builds. The default for new visitors is Core 1 (220-1201); the chosen focus and progress are saved only in that browser.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content

| Path | What it is |
|------|------------|
| `content/source.md` | Original study guide |
| `lib/exams.ts` | Exam names, descriptions, and default priority |
| `content/topics.json` | Chapter notes with exam mappings |
| `content/flashcards.json` | Flashcards with optional per-card exam mappings |
| `content/questions.json` | Original MCQs with optional per-question exam mappings |
| `content/labs.json` | Networking lab write-ups |
| `public/labs/` | Packet Tracer files and topology screenshots |
| `TODO.md` | Project checklist |

## Deploy

This app is a standard Next.js project. Connect the GitHub repo to [Vercel](https://vercel.com) (framework preset: Next.js). The study site and Guided Demo need no environment variables. Multiplayer requires the Vercel-only Twilio configuration described below.

## Live URL

- Site: https://comptia-a-plus-review.vercel.app
- Repo: https://github.com/LouisRodriguez12101815/comptia-a-plus-review

If later `git push` does not auto-deploy, connect this GitHub repo to the Vercel project in the Vercel dashboard (Git integration). The first production deploy was uploaded with the Vercel CLI.

## Outage Ops MVP

Open `/game` from the Practice Games catalog or the home-page button. The Guided Demo walks through five DNS troubleshooting decisions based on Lab 03, with mentor hints, score, uptime penalties, a debrief, and replay. Scores for this demo last only for the current session.

Each question starts unanswered with a shuffled answer order. Select an answer to submit it and see immediate answer-specific feedback plus mentor reasoning. Incorrect answers cost 5% uptime and reveal a mentor hint. Choose **Try again** to retry the same question or **Continue** to advance. Retries keep the hint and uptime penalties; each question awards points at most once (100 without a hint, 75 with one). Replaying resets the mission and shuffles again.

Run `npm test` (or `npm run test:game`) with Node.js 22.18+ (Node.js 24 is installed in this cloud environment) for answer-ID, shuffle, room, concurrency, reconnect, provisioning, and signed cost-guard regression tests.

Create Room and Join Team use server-authoritative Twilio Sync Documents. Players subscribe to room updates, with periodic API reconciliation for presence and deadlines. The cooperative session covers DNS troubleshooting and the DHCP relay routing fault recorded in Lab 02 with rotating roles and complementary evidence. A live scoreboard separates team points from evidence, answer, role-action, and resolution contributions. Clean team decisions earn a streak multiplier; mistakes cost uptime and time, and optional shared hints cost team points. The final debrief includes outcomes, contribution breakdowns, CompTIA objective areas, and review topics with links to source notes and labs. Each responder sees actionable controls for their server-assigned evidence items. Answers unlock when all valid items assigned to connected responders have been discovered; shared items need only one discovery, empty assignments are complete without points, and disconnected owners do not block. Solo responders receive all items. A visible 15-second timeout lets the host choose **Continue with current evidence** if a responder is absent or idle, without granting unearned points. Guided Demo stays fully local and never calls Twilio. Without service configuration, multiplayer reports **“Multiplayer service not configured”**; it does not substitute a local lobby.

See [Twilio setup, the $5 daily guard, and the laptop/phone acceptance test](docs/outage-ops-multiplayer.md). The implementation has automated tests; live cross-device acceptance still requires a configured Vercel deployment and actual devices.

Run `npm run check:content` to check quiz answer keys, cross-content consistency, author-confirmed facts, and worked examples (see [content fact-checking](docs/content-fact-check.md)).

Validate with `npm run lint`, `npm run typecheck`, and `npm run build`. The typecheck command runs `next typegen` before `tsc --noEmit` so it also works before the first build. The production build downloads Geist through `next/font/google` and requires HTTPS access to `fonts.googleapis.com` and `fonts.gstatic.com`.

Outage Ops cooperative practice now includes shared findings, recoverable diagnostic decisions, round objectives/consequences, and a mistake-based reconstruction. See [the learning review](docs/outage-ops-learning-review.md) for source mapping, validation, and pending live/learner checks.

## Practice Games

Open `/practice-games` for certification/topic/difficulty filters. **Computer Component Match** has eight A+ hardware identification, compatibility and symptom decisions. **Follow the Packet** has sixteen Network+ decisions across same-subnet delivery, routed delivery and a transfer network, with responsive diagrams and explicit IPv4/Ethernet assumptions. Both are solo practice with retries, priced hints, versioned browser progress and mistake-based debriefs. Outage Ops remains available with Guided Demo and Twilio room entry.

See [implementation and limitations](docs/practice-games.md) and [content sources and gaps](docs/practice-games-sources.md). Run `npm run test:practice` for framework/content regression tests and `npm run test:e2e:practice -- --browser /usr/bin/chromium` for complete rendered-UI walkthroughs. These games are not multiplayer; automated tests do not demonstrate learning gains.

## Focused topic mission

`/practice-games/next-hop-mission` connects Lab 01 next-hop troubleshooting to notes and flashcards, then checks understanding in a new application. It tracks first attempts, hints, retries and completion separately; independent fresh applications earn explained, non-repeatable achievements. Its scoped reset clears only this browser’s mission record. See [the learning-loop review and sources](docs/next-hop-learning-loop.md). Run `npm run test:e2e:learning -- --browser /usr/bin/chromium` for the complete real-UI review/return/application walkthrough.

## Subnet Architect

`/practice-games/subnet-architect` adds solo Network+ IPv4 practice: **Subnet Detective** checks masks, boundaries, usable ranges and capacity; **VLSM Architect** allocates a gateway-inclusive four-LAN/three-link topology. Both support guided or independent runs, typed answers, retries, priced hints, saved drafts, specific debriefs and new transfer problems. Alternative valid VLSM layouts are accepted. Read [implementation and validation](docs/subnet-architect.md) and [source verification and unresolved handwriting](docs/subnet-source-verification.md).

Run `npm run test:subnet` (requires Python 3 for the independent `ipaddress` oracle) and, after a production build, `npm run test:e2e:subnet -- --browser /usr/bin/chromium`. The game needs no accounts or service configuration. Only its latest run is stored in browser localStorage, with a scoped reset. It is solo practice; successful completion and software tests do not establish mastery or learning gains.
