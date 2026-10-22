#!/usr/bin/env python3
"""Fast pass: find the evidence units that mention each rubric item.

Output is a long "join table" (matches.csv): one line per (rubric item, evidence
unit) pair with a match level and score. That shape makes every later count a
simple group-by, in Excel, pandas or the report script.

Match levels, strongest first
    phrase   the item's wording (or its parenthetical acronym) appears as a phrase
    tokens   every significant word appears in the unit, in any order
    partial  at least 60% of the significant words appear (3+ word items only)
    generic  a common one-word item ("Full", "Keys", "app") found without a word
             from its nearest descriptive ancestor ("Backup" for "Full"); kept at
             the bottom of the ranking so the grader can still rescue true hits
"""
import argparse
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import MATCH_FIELDS, item_terms, paths, read_csv, sig, stems, strip_label, write_csv  # noqa: E402

PER_SOURCE_CAP = {"note": 4, "visual": 2, "card": 2, "question": 2, "drill": 2}
GENERIC_DOCS = 8         # a single-word item found in more distinct sources than this is "generic"
TRUNC = 7                # tokens are also compared by their first 7 letters ("cultural" ~ "culturally")
PARTIAL_MIN = 0.6


def literal_of(text):
    """File types and paths (.app, /Applications, /etc/shadow) are matched as written."""
    t = strip_label(text).strip().lower()
    if len(t) >= 3 and " " not in t and re.search(r"[./\\]", t):
        return t
    return ""


def unit_index(evidence):
    out = []
    for e in evidence:
        text = f"{e['text']} {e['context']}"
        st = stems(text)
        out.append({
            "row": e,
            "padded": " " + " ".join(st) + " ",
            "set": set(st),
            "trunc": {t[:TRUNC] for t in st},
            "lower": text.lower(),
        })
    return out


def ancestor_tokens(item, by_id):
    """Significant words from the nearest ancestor that has at least two of them."""
    pid = item["parent_id"]
    while pid:
        p = by_id[pid]
        s = sig(p["item_text"])
        if len(s) >= 2 or (len(s) == 1 and not p["parent_id"]):
            return set(s)
        pid = p["parent_id"]
    return set()


def match_item(item, units, by_id, df_cache):
    main, alts = item_terms(item["item_text"])
    toks = sig(strip_label(item["item_text"]))
    toks_main = sig(main)
    phrases = [p for p in [main] + alts if p]
    generic = False
    anc = set()
    if len(toks_main) <= 1:
        key = " ".join(toks_main)
        if key not in df_cache:
            df_cache[key] = len({u["row"]["source_id"] for u in units if key and key[:TRUNC] in u["trunc"]})
        generic = df_cache[key] > GENERIC_DOCS
        if generic:
            anc = ancestor_tokens(item, by_id)
    out = []
    literal = literal_of(item["item_text"])
    for u in units:
        level, score = None, 0.0
        lit_hit = bool(literal and literal in u["lower"])
        if lit_hit:
            level, score = "phrase", 1.0
        for ph in phrases:
            if level:
                break
            if f" {ph} " in u["padded"]:
                level, score = "phrase", 1.0
                break
        if level is None and len(toks_main) >= 2 and all(t[:TRUNC] in u["trunc"] for t in toks_main):
            level, score = "tokens", 0.8
        if level is None and len(toks) >= 3:
            frac = sum(1 for t in toks if t[:TRUNC] in u["trunc"]) / len(toks)
            if frac >= PARTIAL_MIN:
                level, score = "partial", round(0.6 * frac, 2)
        if level is None:
            continue
        if generic and anc and not lit_hit and not ({t[:TRUNC] for t in anc} & u["trunc"]):
            # A common word without its parent's context: keep it, ranked low, and let the grader decide.
            level, score = "generic", 0.3
        out.append((level, score, u))
    return out


def run(exam):
    P = paths(exam)
    rubric = read_csv(P["rubric"])
    evidence = read_csv(P["out"] / "evidence.csv")
    units = unit_index(evidence)
    by_id = {r["item_id"]: r for r in rubric}
    df_cache = {}
    rows = []
    for item in rubric:
        hits = match_item(item, units, by_id, df_cache)
        hits.sort(key=lambda h: (-h[1], h[2]["row"]["source_type"] != "note"))
        taken = Counter()
        for level, score, u in hits:
            e = u["row"]
            kind = e["source_type"]
            if taken[kind] >= PER_SOURCE_CAP[kind]:
                continue
            taken[kind] += 1
            mapped = item["objective"] in e["objectives"].split("|")
            rows.append({"item_id": item["item_id"], "evidence_id": e["evidence_id"],
                         "source_type": kind, "match_level": level, "score": score,
                         "mapped": "1" if mapped else "0"})
    out = P["out"] / "matches.csv"
    write_csv(out, rows, MATCH_FIELDS)
    with_hit = len({r["item_id"] for r in rows})
    print(f"{exam}: {len(rubric)} items, {with_hit} with at least one candidate, "
          f"{len(rows)} candidate pairs -> {out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--exam", required=True)
    run(ap.parse_args().exam)
