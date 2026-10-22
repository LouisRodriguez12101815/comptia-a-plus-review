#!/usr/bin/env python3
"""Flatten the site's content into one evidence table (CSV, one line per unit).

JSON stays the source of truth for the site. This table is derived, never edited
by hand, and rebuilt on every run. Each row is one small unit a learner reads:
a note paragraph, one bullet, one table row, a flashcard, a question with its
explanation, a drill item, or a line of text from a visual page.

    python3 build_evidence.py --exam 220-1202

Units are single-line (whitespace collapsed) so the file is easy to diff, grep
and load with any CSV reader.
"""
import argparse
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, EVIDENCE_FIELDS, one_line, paths, write_csv  # noqa: E402

CONTENT = ROOT / "content"


def load(name):
    return json.loads((CONTENT / name).read_text(encoding="utf-8"))


def expand_objectives(text):
    """'4.1, 4.2' -> ['4.1', '4.2'];  '3.1–3.8' -> ['3.1' ... '3.8']."""
    out = []
    for piece in str(text).split(","):
        piece = piece.strip()
        if "–" in piece or "-" in piece and re.fullmatch(r"\d+\.\d+\s*-\s*\d+\.\d+", piece):
            a, b = re.split(r"[–-]", piece)
            d, first = a.strip().split(".")
            last = b.strip().split(".")[1]
            out += [f"{d}.{n}" for n in range(int(first), int(last) + 1)]
        elif piece:
            out.append(piece)
    return out


class TextGrabber(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head", "title"}

    def __init__(self):
        super().__init__()
        self.depth = 0
        self.chunks = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.depth:
            self.depth -= 1

    def handle_data(self, data):
        if not self.depth:
            t = one_line(data)
            if len(t) >= 12:
                self.chunks.append(t)


def visual_chunks(html):
    g = TextGrabber()
    g.feed(html)
    chunks = list(g.chunks)
    # Interactive visuals keep much of their wording in script string literals.
    for script in re.findall(r"<script[^>]*>(.*?)</script>", html, re.S | re.I):
        for lit in re.findall(r"\"([^\"\n]{30,})\"|'([^'\n]{30,})'|`([^`]{30,})`", script):
            t = one_line(next(x for x in lit if x))
            if " " in t and not t.startswith(("http", "var(", "M ", "<")):
                chunks.append(t)
    seen, out = set(), []
    for c in chunks:
        if c not in seen:
            seen.add(c)
            out.append(c)
    return out


def dump_drills(tmp):
    cmd = ["node", "--experimental-strip-types", "--import", "./tests/register.mjs",
           "tools/rubric-audit/scripts/dump_drills.mjs", str(tmp)]
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise SystemExit("dump_drills failed:\n" + r.stderr[-800:])
    return json.loads(Path(tmp).read_text(encoding="utf-8"))


def build(exam):
    topics = load("topics.json") + load("topics-network-plus.json")
    cards = load("flashcards.json")
    questions = load("questions.json")
    objectives = load("objectives.json")
    visuals = load("track-visuals.json")

    topic_exam = {t["id"]: t.get("examCodes", []) for t in topics}
    mapped = {}   # topic id -> objective ids for this exam
    for e in objectives["exams"]:
        if e["code"] != exam:
            continue
        for d in e["domains"]:
            for o in d["objectives"]:
                for t in o.get("topics", []):
                    mapped.setdefault(t, []).append(o["id"])

    rows = []

    def add(kind, sid, topic, ctx, objs, depth, text, n):
        text = one_line(text)
        if len(text) < 3:
            return
        rows.append({
            "evidence_id": f"{kind}:{sid}#{n}", "exam": exam, "source_type": kind,
            "source_id": sid, "topic_id": topic, "context": one_line(ctx),
            "objectives": "|".join(sorted(set(objs), key=lambda s: [int(x) for x in s.split('.')])),
            "depth": depth, "text": text})

    # Notes
    for t in topics:
        if exam not in t.get("examCodes", []):
            continue
        objs = mapped.get(t["id"], [])
        for s in t["sections"]:
            ctx = f"{t['title']} > {s['title']}"
            n = 0
            add("note", f"{t['id']}/{s['id']}", t["id"], ctx, objs, "heading", s["title"], 0)
            for b in s["blocks"]:
                n += 1
                bt = b["type"]
                if bt in ("paragraph", "callout", "code"):
                    prefix = f"[{b.get('kind')}] " if bt == "callout" else ""
                    add("note", f"{t['id']}/{s['id']}", t["id"], ctx, objs, bt, prefix + b["text"], f"b{n}")
                elif bt == "bullets":
                    for i, item in enumerate(b["items"], 1):
                        add("note", f"{t['id']}/{s['id']}", t["id"], ctx, objs, "bullet", item, f"b{n}.{i}")
                elif bt == "table":
                    for i, r in enumerate(b["rows"], 1):
                        cells = [f"{h}: {c}" for h, c in zip(b["headers"], r)]
                        add("note", f"{t['id']}/{s['id']}", t["id"], ctx, objs, "table-row", " | ".join(cells), f"b{n}.r{i}")

    # Visuals mapped to included topics
    for topic_id, items in visuals.items():
        if exam not in topic_exam.get(topic_id, []):
            continue
        for v in items:
            f = ROOT / "public" / "visuals" / v["file"]
            if not f.exists():
                continue
            for i, chunk in enumerate(visual_chunks(f.read_text(encoding="utf-8")), 1):
                add("visual", v["file"], topic_id, v.get("title", v["file"]), mapped.get(topic_id, []),
                    "visual-text", chunk, i)

    # Flashcards
    for c in cards:
        ex = c.get("examCodes") or topic_exam.get(c["topicId"], [])
        if exam in ex:
            add("card", c["id"], c["topicId"], "", mapped.get(c["topicId"], []), "card",
                f"{c['front']} — {c['back']}", 1)

    # Questions: stem, the correct choice(s) and the explanation. Distractors are left out on purpose.
    for q in questions:
        tid = q["topicId"][0] if isinstance(q["topicId"], list) else q["topicId"]
        ex = q.get("examCodes") or topic_exam.get(tid, [])
        if exam not in ex:
            continue
        ans = q["answer"] if isinstance(q["answer"], list) else [q["answer"]]
        correct = "; ".join(q["choices"][i] for i in ans if i < len(q["choices"]))
        tids = q["topicId"] if isinstance(q["topicId"], list) else [q["topicId"]]
        objs = [o for tt in tids for o in mapped.get(tt, [])]
        add("question", q["id"], tid, "", objs, "question",
            f"{q['prompt']} Answer: {correct}. {q['explanation']}", 1)

    # Drills
    tmp = paths(exam)["out"] / "drills.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    for d in dump_drills(tmp):
        if d["exam"] != exam:
            continue
        objs = expand_objectives(d["objective"])
        for i in d["items"]:
            vals = "; ".join(str(v) for v in i["fields"].values())
            add("drill", f"{d['id']}/{i['id']}", d["id"], f"{d['topic']}", objs, "drill",
                f"{vals} — {i['detail']} {i['hook']}", 1)

    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--exam", required=True)
    a = ap.parse_args()
    rows = build(a.exam)
    out = paths(a.exam)["out"] / "evidence.csv"
    write_csv(out, rows, EVIDENCE_FIELDS)
    by = {}
    for r in rows:
        by[r["source_type"]] = by.get(r["source_type"], 0) + 1
    print(f"{a.exam}: {len(rows)} evidence units {by} -> {out}")


if __name__ == "__main__":
    main()
