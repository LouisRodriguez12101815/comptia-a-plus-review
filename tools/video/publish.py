"""Shrink a built video for the website and write its caption file.

Usage: python3 tools/video/publish.py d5   (writes public/videos/network-plus/domain-5.mp4 and .vtt)
Run build.py for the same name first. Captions are timed from each slide's narration length.
"""
import json, os, re, subprocess, sys, wave
from pathlib import Path

BASE = Path(__file__).resolve().parent
REPO = BASE.parent.parent
name = sys.argv[1]
n = name.lstrip("d")
dest = REPO / "public" / "videos" / "network-plus"
dest.mkdir(parents=True, exist_ok=True)

def stamp(t):
    return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{t % 60:06.3f}"

mp4 = dest / f"domain-{n}.mp4"
tmp = dest / f"domain-{n}.tmp.mp4"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(BASE / "out" / f"{name}.mp4"),
                "-c:v", "libx264", "-preset", "slow", "-tune", "stillimage", "-crf", "30", "-pix_fmt", "yuv420p",
                "-r", "30", "-g", "150", "-af", "volume=0.8", "-c:a", "aac", "-b:a", "80k", "-ac", "1", "-movflags", "+faststart", str(tmp)], check=True)
os.rename(tmp, mp4)

slides = json.load(open(BASE / "scripts" / f"{name}.json"))["slides"]
cues, t = ["WEBVTT", ""], 0.0
for i, slide in enumerate(slides):
    with wave.open(str(BASE / "out" / name / f"s{i:02d}.wav")) as w:
        speech = w.getnframes() / w.getframerate()
    sentences = [x.strip() for x in re.split(r"(?<=[.!?])\s+", slide["say"]) if x.strip()]
    total, c = sum(len(x) for x in sentences), t
    for x in sentences:
        d = speech * len(x) / total
        cues += [f"{stamp(c)} --> {stamp(c + d)}", x, ""]
        c += d
    t += speech + 0.7  # build.py leaves 0.7 s after each slide
(dest / f"domain-{n}.vtt").write_text("\n".join(cues))
print("wrote", mp4)
