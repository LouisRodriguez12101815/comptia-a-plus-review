# Network+ domain video overviews

Five narrated slide videos, one per N10-009 exam domain, about 4 to 6 minutes each. They are on the site at `/networking/videos` and linked from the Network+ page under "Study by exam domain". This file records how they were made so they can be rebuilt or changed.

## What was used

**Claude skill:** `video-making` (Anthropic skill, loaded before the first render). It set the render rules used here: draw frames at the output size and look at them before a full render, write one encoded file per scene with identical settings, join them with the ffmpeg concat demuxer and `-c copy`, write to a temporary name and rename when ffmpeg succeeds, and re-encode only the finished file when making a smaller copy.

**Agents:** none. The videos were built in one Claude session without the repo's report-only agents in `.claude/agents/`. The `AskUserQuestion` prompt was used once to settle length (about 5 minutes) and format (slides with voiceover).

**Software:**

| Tool | Used for |
| --- | --- |
| `piper-tts` (Python) | Offline text-to-speech |
| Piper voice `en_US-lessac-medium` | The narration voice (single speaker, 22,050 Hz) |
| Playwright with Chromium | Renders each HTML slide to a 1280x720 PNG |
| ffmpeg | Per-slide clips, concatenation, volume, compression |

`sherpa-onnx` was tried first for speech and failed (`phoneme_codepoints is empty ... no frontend available`), so `piper-tts` is what the scripts use. The voice file is downloaded from the sherpa-onnx GitHub release because Hugging Face is blocked in the build environment.

## Files

| Path | Purpose |
| --- | --- |
| `tools/video/scripts/d1.json` to `d5.json` | One file per domain: slides with a `kind` (`title`, `bullets`, `table`, `steps`), the on-screen text, and `say`, the narration |
| `tools/video/build.py` | Renders slides, speaks the narration, builds one clip per slide and joins them |
| `tools/video/publish.py` | Compresses a built video for the site and writes its captions |
| `public/videos/network-plus/domain-N.mp4` and `.vtt` | What the site serves |
| `app/[locale]/networking/videos/page.tsx` | The videos page |
| `app/components/NetworkPlusDomains.tsx` | "All domain videos" and "Watch the video overview" links |
| `messages/*.json`, key `networkPlusVideos` | Page text in en, es, fr, pt |

## How they were made

1. **Scope.** The five domains and their objectives come from `content/objectives.json` (1.0 Concepts 23%, 2.0 Implementation 20%, 3.0 Operations 19%, 4.0 Security 14%, 5.0 Troubleshooting 24%).
2. **Scripts.** Claude wrote each domain as 10 to 11 slides, drawing on the site's Network+ notes and the official objective titles, with corrections made earlier in the project (RAID 5 stays online during a rebuild, Cat 5e is the lowest grade rated for gigabit). Narration is about 750 to 1,000 words per video.
3. **Pronunciation.** `build.py` has a `SAY` list that rewrites acronyms before speech, for example `DNS` becomes `D N S` and `SASE` becomes `sassy`. The on-screen text is not changed.
4. **Slides.** Each slide is HTML, screenshotted at 1280x720 in the Network+ indigo. The build prints `OVERFLOW` if content runs past the bottom margin.
5. **Clips.** Each slide becomes one MP4: the still image, its narration, a 0.3 second fade in and a 0.7 second pause at the end, 30 fps, H.264 and AAC.
6. **Join.** The clips are concatenated with `-c copy`, so nothing is encoded twice.
7. **Publish.** `publish.py` lowers the volume to 80% (the narration peaked at 0 dB), re-encodes with `-tune stillimage -crf 30` and `+faststart`, and writes a WebVTT caption file. Caption times are split across each slide's sentences by length, so they are close but not frame exact.

## Rebuild a video

```
pip install piper-tts playwright
python3 -m playwright install chromium

mkdir -p tools/video/models && cd tools/video/models
curl -L -O https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-medium.tar.bz2
tar xjf vits-piper-en_US-lessac-medium.tar.bz2 && cd ../../..

python3 tools/video/build.py d5      # writes tools/video/out/d5.mp4
python3 tools/video/publish.py d5    # writes public/videos/network-plus/domain-5.mp4 and .vtt
```

Edit `tools/video/scripts/dN.json` first to change a video. Rebuild only the domain you changed. `ffmpeg` must be installed (`brew install ffmpeg`).

## Checks that were done

- Several slides from each of the five videos were looked at as images.
- Each final file was checked for one H.264 video stream, one AAC audio stream, the expected length and an audio peak below 0 dB.
- `npm run lint`, type check and tests passed. The page itself had not been viewed in a browser when it was committed.

## Known limits

- The narration is a computer voice and was not listened to by the author. Tell us about any mispronounced word and add it to `SAY`.
- Narration and captions are English only.
- The videos do not have per-chapter markers.
- The Lessac voice comes from the Blizzard 2013 dataset. Read its license (https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html) before using the videos outside personal study.
- The videos add about 31 MB to the repository. Rebuilding one adds another copy to git history.
