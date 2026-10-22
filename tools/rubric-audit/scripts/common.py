"""Shared helpers for the rubric audit. Standard library only."""
import csv
import hashlib
import json
import re
import subprocess
from datetime import date
from pathlib import Path

TOOL = Path(__file__).resolve().parents[1]      # tools/rubric-audit
ROOT = TOOL.parents[1]                          # repository root

RUBRIC_FIELDS = ["exam", "domain", "domain_weight", "objective", "objective_title",
                 "item_id", "level", "parent_id", "item_text", "path"]
EVIDENCE_FIELDS = ["evidence_id", "exam", "source_type", "source_id", "topic_id",
                   "context", "objectives", "depth", "text"]
MATCH_FIELDS = ["item_id", "evidence_id", "source_type", "match_level", "score", "mapped"]
GRADE_FIELDS = ["exam", "domain", "objective", "item_id", "level", "is_leaf", "item_text",
                "notes_grade", "material_grade", "basis", "n_note", "n_visual", "n_card",
                "n_question", "n_drill", "mapped_hit", "best_evidence", "reason", "run_id"]
SUMMARY_FIELDS = ["exam", "domain", "domain_weight", "objective", "title", "repo_status",
                  "items", "leaves", "notes_taught", "notes_mentioned", "notes_absent",
                  "material_taught", "material_mentioned", "material_absent",
                  "notes_score", "material_score"]
HISTORY_FIELDS = ["run_id", "date", "exam", "objective"] + SUMMARY_FIELDS[6:]

GRADES = ("taught", "mentioned", "absent")
SCORE = {"taught": 1.0, "mentioned": 0.5, "absent": 0.0}

STOP = set("""a an and the of to for in on or with when as is be by at from into that this these those
its it their his her your you can may also etc e g i use used using given scenario appropriate
proper based other any each such if""".split())


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path, rows, fields):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def append_csv(path, rows, fields):
    new = not Path(path).exists()
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
        if new:
            w.writeheader()
        w.writerows(rows)


def read_jsonl(path):
    p = Path(path)
    if not p.exists():
        return []
    with open(p, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def write_jsonl(path, rows):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def one_line(s):
    return re.sub(r"\s+", " ", str(s)).strip()


def norm(s):
    s = str(s).lower().replace("’", "'").replace("'s ", " ")
    return re.sub(r"[^a-z0-9+#]+", " ", s).strip()


def stem(t):
    if len(t) > 4 and t.endswith("ies"):
        return t[:-3] + "y"
    if len(t) > 3 and t.endswith("s") and not t.endswith(("ss", "us", "is")):
        return t[:-1]
    return t


def stems(s):
    return [stem(t) for t in norm(s).split()]


def sig(s):
    """Significant stemmed tokens: stop words and one-letter tokens removed."""
    return [t for t in stems(s) if t not in STOP and (len(t) > 1 or t.isdigit())]


def strip_label(text):
    """Drop the 'Step 3:' label the extractor adds to numbered procedures."""
    return re.sub(r"^Step \d+:\s*", "", text)


def item_terms(text):
    """Return (main_phrase, alternates). 'Short Message Service (SMS)' ->
    ('short message service', ['sms']). Alternates are the parenthetical parts."""
    text = strip_label(text)
    parens = re.findall(r"\(([^)]*)\)", text)
    main = re.sub(r"\([^)]*\)", " ", text)
    alts = []
    for p in parens:
        p = p.strip()
        if p.lower().startswith(("e.g.", "i.e.")):
            continue
        if p:
            alts.append(" ".join(stems(p)))
    return " ".join(stems(main)), [a for a in alts if a]


def sha(*parts):
    h = hashlib.sha1()
    for p in parts:
        h.update(str(p).encode("utf-8"))
        h.update(b"\x1f")
    return h.hexdigest()[:12]


def run_id(label=""):
    try:
        g = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT,
                           capture_output=True, text=True, timeout=10).stdout.strip() or "nogit"
    except Exception:
        g = "nogit"
    return f"{date.today().isoformat()}-{g}" + (f"-{label}" if label else "")


def paths(exam):
    return {
        "rubric": TOOL / "data" / "rubric" / f"{exam}.csv",
        "acronyms": TOOL / "data" / "rubric" / f"{exam}-acronyms.csv",
        "out": TOOL / "out" / exam,
        "results": TOOL / "results" / exam,
    }
