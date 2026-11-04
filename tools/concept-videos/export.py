#!/usr/bin/env python3
"""Export rendered concept videos into the site's file layout.

  python3 export.py --renders renders --meta meta --out <repo root>

renders/ holds V01.mp4 ... V12.mp4 (from `manim -qm videos.py V01` etc.),
meta/ holds the <slug>.json files that videos.py writes while rendering.
Writes, under --out:
  public/videos/concepts/<slug>.mp4, .vtt, .jpg
  content/concept-videos.json
"""
import argparse, json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import videos as V  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--renders", default="renders")
ap.add_argument("--meta", default="meta")
ap.add_argument("--out", required=True)
ap.add_argument("--published", default="2026-11-03")
a = ap.parse_args()

dest = os.path.join(a.out, "public", "videos", "concepts")
os.makedirs(dest, exist_ok=True)
os.makedirs(os.path.join(a.out, "content"), exist_ok=True)


def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"


def vtt(cues):
    out = ["WEBVTT", ""]
    for start, end, text in cues:
        sents = re.split(r"(?<=[.?!])\s+", text.strip())
        total = sum(len(s) for s in sents) or 1
        t = start
        for s in sents:
            d = (end - start) * len(s) / total
            out += [f"{ts(t)} --> {ts(t + d)}", s, ""]
            t += d
    return "\n".join(out)


entries = []
for i in range(1, 13):
    cls = getattr(V, f"V{i:02d}")
    meta = json.load(open(os.path.join(a.meta, cls.SLUG + ".json")))
    src = os.path.join(a.renders, f"V{i:02d}.mp4")
    base = os.path.join(dest, cls.SLUG)
    shutil.copy(src, base + ".mp4")
    open(base + ".vtt", "w").write(vtt(meta["cues"]))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "7", "-i", src, "-frames:v", "1", "-q:v", "3",
                    base + ".jpg"], check=True)
    entries.append({
        "slug": meta["slug"], "title": meta["title"], "description": meta["desc"],
        "exam": "n10-009", "objective": meta["code"], "topicId": meta["topic"],
        "questionId": meta["qid"], "duration": meta["duration"], "published": a.published,
        "takeaway": meta["takeaway"], "transcript": " ".join(c[2] for c in meta["cues"]),
    })

entries.sort(key=lambda e: ([int(x) for x in e["objective"].split(".")], e["slug"]))
with open(os.path.join(a.out, "content", "concept-videos.json"), "w") as fh:
    json.dump(entries, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print("exported", len(entries))
