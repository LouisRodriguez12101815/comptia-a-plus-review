# CompTIA A+ Review

Public study site for classmates: **notes**, **flashcards**, and **original practice quizzes** from the Core 1 / Core 2 study guide. Hosted on Vercel. No login. Progress stays in the browser (`localStorage`).

Questions are written from class notes. They are not official CompTIA items.

## Classmates

Open the deployed site (see **Live URL** below after Vercel finishes). Use Notes to read, Flashcards to drill, Quiz to test. Weak-area decks are linked from the home page.

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

_Pending first deploy — this README is updated when the production URL exists._
