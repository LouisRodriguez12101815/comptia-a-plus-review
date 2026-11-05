#!/usr/bin/env python3
"""Export the W-series concept videos and merge them into content/concept-videos.json.
  python3 export_weak.py --existing <old concept-videos.json> --out <dir>
"""
import argparse, json, os, re, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import videos_weak as W
ap = argparse.ArgumentParser()
ap.add_argument("--existing", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--published", default="2026-11-05")
a = ap.parse_args()
dest = os.path.join(a.out, "public", "videos", "concepts"); os.makedirs(dest, exist_ok=True)
os.makedirs(os.path.join(a.out, "content"), exist_ok=True)

def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"
def vtt(cues):
    out = ["WEBVTT", ""]
    for start, end, text in cues:
        sents = re.split(r"(?<=[.?!])\s+", text.strip()); total = sum(len(x) for x in sents) or 1; t = start
        for x in sents:
            d = (end - start) * len(x) / total; out += [f"{ts(t)} --> {ts(t + d)}", x, ""]; t += d
    return "\n".join(out)

entries = {e["slug"]: e for e in json.load(open(a.existing))}
for i in range(1, 9):
    cls = getattr(W, f"W{i:02d}")
    meta = json.load(open(os.path.join("meta", cls.SLUG + ".json")))
    src = f"media_W{i:02d}/videos/videos_weak/720p30/W{i:02d}.mp4"
    base = os.path.join(dest, cls.SLUG)
    shutil.copy(src, base + ".mp4")
    open(base + ".vtt", "w").write(vtt(meta["cues"]))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(round(meta["duration"] * 0.5, 1)), "-i", src, "-frames:v", "1", "-q:v", "3", base + ".jpg"], check=True)
    entries[meta["slug"]] = {"slug": meta["slug"], "title": meta["title"], "description": meta["desc"], "exam": "n10-009",
        "objective": meta["code"], "topicId": meta["topic"], "questionId": meta["qid"], "duration": meta["duration"],
        "published": a.published, "takeaway": meta["takeaway"], "transcript": " ".join(c[2] for c in meta["cues"])}
out = sorted(entries.values(), key=lambda e: ([int(x) for x in e["objective"].split(".")], e["slug"]))
with open(os.path.join(a.out, "content", "concept-videos.json"), "w") as fh:
    json.dump(out, fh, indent=2, ensure_ascii=False); fh.write("\n")
print("total", len(out))
