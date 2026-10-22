#!/usr/bin/env python3
"""Does the site use the exam's acronym list? Pure keyword check, no judgment.

CompTIA publishes the acronyms that may appear on the exam. An acronym counts
as present when the acronym itself, or its expansion, appears in a unit. The
answer is split into notes and all material, matching the rubric audit.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import norm, paths, read_csv, stems, write_csv  # noqa: E402

FIELDS = ["exam", "acronym", "definition", "in_notes", "in_material", "first_evidence"]


def run(exam):
    P = paths(exam)
    acr = read_csv(P["acronyms"])
    ev = read_csv(P["out"] / "evidence.csv")
    prepared = []
    for e in ev:
        text = f"{e['text']} {e['context']}"
        prepared.append((e, " " + norm(text) + " ", " " + " ".join(stems(text)) + " "))
    rows = []
    for a in acr:
        short = norm(a["acronym"])
        expansion = " ".join(stems(a["definition"].replace("[", " ").replace("]", " ")))
        in_notes = in_any = ""
        first = ""
        for e, plain, stem_text in prepared:
            if f" {short} " in plain or (len(expansion) > 6 and f" {expansion} " in stem_text):
                in_any = "1"
                first = first or e["evidence_id"]
                if e["source_type"] == "note":
                    in_notes = "1"
                    break
        rows.append({"exam": exam, "acronym": a["acronym"], "definition": a["definition"],
                     "in_notes": in_notes or "0", "in_material": in_any or "0",
                     "first_evidence": first})
    write_csv(P["results"] / "acronyms.csv", rows, FIELDS)
    n = len(rows)
    notes = sum(r["in_notes"] == "1" for r in rows)
    mat = sum(r["in_material"] == "1" for r in rows)
    print(f"{exam}: {n} acronyms; {notes} appear in notes, {mat} anywhere in the study material")
    return n, notes, mat


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--exam", required=True)
    run(ap.parse_args().exam)
