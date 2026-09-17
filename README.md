# CompTIA A+ Review

Public study site for classmates: **notes**, **flashcards**, and **original practice quizzes** from the Core 1 / Core 2 study guide. Hosted on Vercel. No login. Progress stays in the browser (`localStorage`).

Questions are written from class notes. They are not official CompTIA items.

## Classmates

Open **https://comptia-a-plus-review.vercel.app** — no login. Use Notes to read, Flashcards to drill, Quiz to test. Weak-area decks are linked from the home page. Progress is saved only in that browser.

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
| `content/topics.json` | Chapter notes |
| `content/flashcards.json` | Flashcards |
| `content/questions.json` | Original MCQs |
| `TODO.md` | Project checklist |

## Deploy

This app is a standard Next.js project. Connect the GitHub repo to [Vercel](https://vercel.com) (framework preset: Next.js). No environment variables are required.

## Live URL

- Site: https://comptia-a-plus-review.vercel.app
- Repo: https://github.com/LouisRodriguez12101815/comptia-a-plus-review

If later `git push` does not auto-deploy, connect this GitHub repo to the Vercel project in the Vercel dashboard (Git integration). The first production deploy was uploaded with the Vercel CLI.
