# CompTIA A+ Review

Public study site for classmates: **notes**, **flashcards**, and **original practice quizzes** for A+ Core 1, A+ Core 2, and Network+. Hosted on Vercel. No login. Study focus and progress stay in the browser (`localStorage`).

Questions are written from class notes. They are not official CompTIA items.

## Classmates

Open **https://comptia-a-plus-review.vercel.app** — no login. Choose Core 1, Core 2, Network+, or All, then use Notes to read, Flashcards to drill, and Quiz to test. The default for new visitors is Core 1 (220-1201); the chosen focus and progress are saved only in that browser.

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
| `TODO.md` | Project checklist |

## Deploy

This app is a standard Next.js project. Connect the GitHub repo to [Vercel](https://vercel.com) (framework preset: Next.js). No environment variables are required.

## Live URL

- Site: https://comptia-a-plus-review.vercel.app
- Repo: https://github.com/LouisRodriguez12101815/comptia-a-plus-review

If later `git push` does not auto-deploy, connect this GitHub repo to the Vercel project in the Vercel dashboard (Git integration). The first production deploy was uploaded with the Vercel CLI.
