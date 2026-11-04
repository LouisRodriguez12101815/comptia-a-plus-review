# Concept videos

One narrated Manim video per missed Network+ N10-009 concept (12 so far). Each video opens with its exam domain and weight, teaches one idea, and ends by tying back to the objective, the site's study notes and a practice question.

## Where things live

| Path | Purpose |
|------|---------|
| `content/concept-videos.json` | Metadata and transcripts (source of truth for pages and sitemap) |
| `public/videos/concepts/` | `.mp4`, `.vtt` captions, `.jpg` poster per video |
| `lib/concept-videos.ts` | Loader, objective lookup, paths |
| `app/[locale]/networking/videos/[slug]/page.tsx` | Per-video page with VideoObject JSON-LD, captions, transcript |
| `app/sitemap.ts` | Sitemap entries with video fields |
| `tools/concept-videos/` | Generator (see its README) |

## Search indexing

Each video has its own URL with canonical and hreflang links, OpenGraph video tags, VideoObject structured data including the transcript, WebVTT captions, a poster and a sitemap video entry. Sitemap URLs use `NEXT_PUBLIC_SITE_URL`, defaulting to the vercel.app domain.

## Verification record

Facts were cross-checked by the author of the videos against the site's own `n10-*` notes and the objective mapping in `content/objectives.json`. External references: RFC 8484 / RFC 7858 (DoH/DoT), IEEE 802.3 10GBASE-SR (OM3/OM4 reach), TIA 568 channel model (90 m + up to 10 m).
The repo's `chapter-fact-reviewer` and `answer-key-verifier` agents have NOT been run on these videos. Run them before publishing.

## Limitations

- Narration is a synthetic neutral US-English voice (Piper, Lessac). No Southern accent. Swap in another Piper voice or recordings later.
- Narration and captions are English only; page chrome is translated in en/fr/es/pt.
- Videos are self-hosted (about 20 MB total). Move to YouTube or Blob storage with embeds if the library grows to hundreds.
- Videos teach the concept; they do not establish exam readiness.
