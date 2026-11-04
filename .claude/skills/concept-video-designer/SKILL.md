---
name: concept-video-designer
description: Make a short narrated Manim explainer video for one missed exam concept and wire it into the review site as an indexable page tied to its objective. Use for weak-concept or objective-gap video requests.
---

# Concept Video Designer

Before applying this workflow, read the [workflow contract](../../WORKFLOW.md) for authorization, source authority and tool fallbacks. Work on a branch. Never push to `main`. Commit, push, open a pull request or deploy only when the current session asks for it. Never reproduce exam dumps or paste CompTIA objective PDFs.

## What this produces

One video per concept, 45 to 90 seconds, with a synthetic English voice-over. Each video opens with the exam, domain and domain weight, teaches one idea, and closes by tying back to the objective, the site's study notes and a practice question. Each video gets its own page with search-engine metadata, captions, a poster and a transcript.

## Inputs

1. A weak-concept report (the site's "Copy weak-concept report" text) or an objective gap from `objective-gap-auditor`. Use `weak-concept-coach` to rank and explain the concepts first if the user has only a raw report.
2. For each concept: the question id, the topic id, and the notes section that teaches it.

## Quality bar (read before writing a scene)

The reference for quality is `tools/concept-videos/reference/routing_explained.py`, the hand-built routing scene. It earns its quality from bespoke animation, not from the template. A concept video meets the bar only if it does all of this:

- Shows the mechanism, not a slide. Every key claim in the narration is drawn: a packet moves, a link breaks, a value changes, a path is highlighted.
- Uses at least six distinct animated beats (Transform, ReplacementTransform, FadeIn, GrowArrow, Create, Indicate), each followed by a pause long enough to read.
- Holds a before-and-after contrast for the misconception being fixed (for example a straight-through cable that fails next to the crossover that works).
- Uses MathTex whenever a number or formula carries the idea (distances, bit counts, 2^n - 2, percentages), and morphs it alongside the shapes.
- Keeps one idea per scene, at most five objects on screen at once, and the same colors for the same meaning throughout (blue for the normal path, teal for correct, yellow for focus, coral for the fault).
- Never lets text overlap shapes, borders or other text. Labels sit beside objects, not on top of them.
- Leaves two seconds of stillness on the final takeaway card.

Beyond the template, add bespoke geometry for each concept in `body()`. If the same shapes recur (router, switch, host, cable, packet, cloud), move them into `tools/concept-videos/components.py` so the next video reuses them instead of redrawing them badly.

## Steps

1. **Map each concept to a real objective.** Read `content/objectives.json` (`exams[].domains[].objectives[]`). Use its ids and titles, not the ones in a report, which can be wrong. Confirm the topic id is listed in that objective's `topics` and that the question's `topicId` matches.
2. **Verify the facts before writing narration.** Read the site's own notes for the topic. Where the notes are silent, cite an external standard (RFC, IEEE, TIA). Record anything that conflicts with the question's answer key and stop to ask the user.
3. **Write the lesson as a subclass of the base `CV` scene** in `tools/concept-videos/videos.py`. Set `SLUG, TITLE, CODE, TOPIC, QID, NOTES, DESC, INTRO, OUTRO, TAKEAWAY` and implement `body()`. Keep narration sentences short and spoken-friendly. Spell out symbols and dotted numbers (the base class turns `4.3` into "4 point 3").
4. **Style.** 3Blue1Brown-like: smooth animations, a clean canvas, blue, teal, yellow and coral accents. Narrate with `say()` and wait with `hold()` so animation and audio stay in sync.
5. **Draft render.** `manim -ql --disable_caching -v ERROR --media_dir media_<ID> tools/concept-videos/videos.py <ID>` for fast iteration. Give each parallel job its own `--media_dir`, because shared text caches race. Needs Manim Community, LaTeX with dvisvgm, ffmpeg and Piper. The voice is Piper `en-us-lessac-medium` (download from the Piper v0.0.2 GitHub release if Hugging Face is blocked).
6. **Check frames.** Extract frames at roughly every five seconds and look for overlapping labels, clipped shapes and text over borders. Fix and re-render until clean. Pick the poster frame after animations settle (about 7 seconds).
7. **Final render.** Use `-qh` (1080p60) when the video will be shown large or reviewed for quality, `-qm` (720p30) for bulk runs. Say which one you used.
8. **Export.** Run `tools/concept-videos/export.py --renders renders --meta meta --out <repo>`. It writes `public/videos/concepts/<slug>.{mp4,vtt,jpg}` and `content/concept-videos.json`.
9. **Site wiring** already exists: `lib/concept-videos.ts`, `app/[locale]/networking/videos/[slug]/page.tsx`, the index section on `/networking/videos`, `app/sitemap.ts` video entries, and `conceptVideos` messages in en, fr, es and pt. Add message keys in all four locales if you add labels.
10. **Run the gate.** `npm run test:concept-videos`, `npm run check:content`, `npm run lint`, `npm run typecheck`, `npm run build`, then `npm test`.
11. **Independent review before publishing.** Run `chapter-fact-reviewer` and `answer-key-verifier` on the new videos' claims, and `visual-fact-auditor` for what the animation shows. Do not describe the facts as verified until they have run. Say plainly in `docs/concept-videos.md` which checks were done and which were not.

## Limits to state to the user

- The voice is synthetic and neutral. Local text-to-speech cannot produce a specific regional accent. Offer to re-render if the user supplies a Piper voice model or recordings.
- Narration and captions are English only. Page chrome is translated.
- Videos are self-hosted in `public/videos/`. Around 1.7 MB each is fine. At hundreds of videos, move to YouTube or Blob storage with embeds.
- Videos teach a concept. They do not establish exam readiness or mastery.
- Production deploys are manual (`vercel.json` disables Git deploys). Follow `review/vercel-deployment-sop.md`: switch to `main`, pull with `--ff-only`, and chain every step with `&&` so a failure stops the release. If Deployment Protection is on, search engines cannot index the pages.

## Authorization

If the user asks to commit, push or deploy, give zsh-safe commands from the repo root with no inline comments or placeholders, chained with `&&`, and deploy only from an up-to-date `main`.
