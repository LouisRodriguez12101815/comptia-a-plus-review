# Concept video generator

Source for the per-concept Network+ N10-009 explainer videos in `public/videos/concepts/`.

## Requirements

- Python 3.10+, `manim` (Community 0.22), `piper-tts`, `ffmpeg`/`ffprobe`
- LaTeX with `dvisvgm` (for `MathTex`): texlive-latex-extra, texlive-science
- A Piper voice file at `voices/en-us-lessac-medium.onnx` (+ `.json`), from the Piper v0.0.2 GitHub release

## Render

```bash
cd tools/concept-videos
manim -qm --disable_caching --media_dir media_V01 videos.py V01
```

Repeat for V01 to V12 (give parallel jobs separate `--media_dir` values). Each run writes `meta/<slug>.json`.

## Export into the site

```bash
mkdir -p renders
cp media_V01/videos/videos/720p30/V01.mp4 renders/V01.mp4
python3 export.py --renders renders --meta meta --out ../..
```

This writes `public/videos/concepts/<slug>.{mp4,vtt,jpg}` and `content/concept-videos.json`.
Then run `npm run test:concept-videos`.

## Adding a concept

Subclass `CV` in `videos.py`, set `SLUG, TITLE, CODE, TOPIC, QID, NOTES, DESC, INTRO, OUTRO, TAKEAWAY`, implement `body()`, and add it to the slug map in `export.py`.
