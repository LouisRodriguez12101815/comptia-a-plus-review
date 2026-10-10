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

This app is a standard Next.js project. Connect the GitHub repo to [Vercel](https://vercel.com) (framework preset: Next.js). No environment variables are required.

## Live URL

- Site: https://comptia-a-plus-review.vercel.app
- Repo: https://github.com/LouisRodriguez12101815/comptia-a-plus-review

If later `git push` does not auto-deploy, connect this GitHub repo to the Vercel project in the Vercel dashboard (Git integration). The first production deploy was uploaded with the Vercel CLI.

## Outage Ops MVP

Open `/game` from the Game navigation link or the home-page button. The Guided Demo walks through five DNS troubleshooting decisions based on Lab 03, with mentor hints, score, uptime penalties, a debrief, and replay. Scores for this demo last only for the current session.

Each question starts unanswered with a shuffled answer order. Select an answer to submit it and see immediate answer-specific feedback plus mentor reasoning. Incorrect answers cost 5% uptime and reveal a mentor hint. Choose **Try again** to retry the same question or **Continue** to advance. Retries keep the hint and uptime penalties; each question awards points at most once (100 without a hint, 75 with one). Replaying resets the mission and shuffles again.

Run `npm run test:game` with Node.js 22.18+ (Node.js 24 is installed in this cloud environment) for answer-ID and shuffle regression tests.

Create Room and Join Team are local lobby prototypes. They do not create persistent rooms or synchronize players across devices. Mission focus is a preview control; server-authoritative state, reconnection, and host transfer remain future milestones. See [the game specification](docs/outage-ops-spec.md).

Validate with `npm run lint`, `npx next typegen && npx tsc --noEmit`, and `npm run build`. The production build downloads Geist through `next/font/google` and requires HTTPS access to `fonts.googleapis.com` and `fonts.gstatic.com`.
