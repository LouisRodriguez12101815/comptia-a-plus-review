#!/usr/bin/env python3
"""Hand the judgment pass to grader agents, and take their answers back.

Why JSONL here and CSV everywhere else
    A judgment request is one rubric item plus a short, variable-length list of
    evidence snippets. That is nested data. JSONL (one JSON object per line)
    keeps it nested, streams in small batches, and a malformed line damages only
    itself. The answers go into a cache file in the same shape, and the cache is
    also JSONL, so a re-run only judges what changed.

    prepare  -> out/<exam>/batches/batch-NN.jsonl   (requests)
    (agents) -> out/<exam>/judged/batch-NN.jsonl    (answers)
    merge    -> results/<exam>/judgments.jsonl      (cache, committed)
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (GRADES, ROOT, item_terms, one_line, paths, read_csv, read_jsonl, sha,  # noqa: E402
                    sig, stems, strip_label, write_jsonl)

BATCH_SIZE = 45
SNIP = 260
TRUNC = 7
KINDS_ORDER = ["note", "visual", "card", "drill", "question"]


def snippet(text, terms):
    """Clip long text around the first term that appears in it."""
    text = one_line(text)
    if len(text) <= SNIP:
        return text
    low = text.lower()
    pos = -1
    for t in terms:
        p = low.find(t.lower())
        if p >= 0:
            pos = p
            break
    start = max(0, (pos if pos >= 0 else 0) - SNIP // 3)
    end = min(len(text), start + SNIP)
    return ("…" if start else "") + text[start:end] + ("…" if end < len(text) else "")


def load_state(exam):
    P = paths(exam)
    rubric = read_csv(P["rubric"])
    evidence = {e["evidence_id"]: e for e in read_csv(P["out"] / "evidence.csv")}
    matches = read_csv(P["out"] / "matches.csv")
    return P, rubric, evidence, matches


def near_evidence(item, evidence_rows, k=3):
    """Loosest possible search, used only to double-check items the strict pass found nowhere."""
    toks = {t[:TRUNC] for t in sig(strip_label(item["item_text"])) if len(t) >= 4}
    if not toks:
        return []
    scored = []
    for e in evidence_rows:
        have = {t[:TRUNC] for t in stems(e["text"])}
        n = len(toks & have)
        if n:
            scored.append((n, e["source_type"] == "note", e))
    scored.sort(key=lambda x: (-x[0], not x[1]))
    return [e for _, _, e in scored[:k]]


def build_requests(exam, objective_status=None, ignore_cache=False):
    P, rubric, evidence, matches = load_state(exam)
    cache = set() if ignore_cache else {j["key"] for j in read_jsonl(P["results"] / "judgments.jsonl")}
    by_item = {}
    for m in matches:
        by_item.setdefault(m["item_id"], []).append(m)
    children = {r["parent_id"] for r in rubric if r["parent_id"]}
    ev_rows = list(evidence.values())
    reqs, skipped_cached = [], 0
    for item in rubric:
        iid = item["item_id"]
        hits = by_item.get(iid, [])
        ev, recall_check = [], False
        if hits:
            order = sorted(hits, key=lambda m: (-float(m["score"]), KINDS_ORDER.index(m["source_type"])))
            ev = [evidence[m["evidence_id"]] for m in order][:7]
        else:
            ev = near_evidence(item, ev_rows)      # the strict pass found nothing: look for a synonym
            recall_check = True
            if not ev:
                continue
        main, alts = item_terms(item["item_text"])
        terms = [item["item_text"].split("(")[0].strip()] + alts
        key = sha(item["item_text"], item["path"], *[f"{e['evidence_id']}:{sha(e['text'])}" for e in ev])
        if key in cache:
            skipped_cached += 1
            continue
        reqs.append({
            "key": key, "item_id": iid, "objective": item["objective"],
            "objective_title": item["objective_title"], "path": item["path"],
            "is_group": iid in children, "recall_check": recall_check,
            "item_text": item["item_text"],
            "evidence": [{"id": e["evidence_id"], "source": e["source_type"], "depth": e["depth"],
                          "mapped": item["objective"] in e["objectives"].split("|"),
                          "context": e["context"], "text": snippet(e["text"], terms)} for e in ev],
        })
    return P, reqs, skipped_cached


def prepare(exam):
    obj = json.loads((ROOT / "content" / "objectives.json").read_text(encoding="utf-8"))
    status = {o["id"]: o["status"] for e in obj["exams"] if e["code"] == exam
              for d in e["domains"] for o in d["objectives"]}
    P, reqs, cached = build_requests(exam, status)
    out = P["out"] / "batches"
    if out.exists():
        for f in out.glob("batch-*.jsonl"):
            f.unlink()
    # keep an objective's items together; fill batches in objective order
    batches, cur = [], []
    for r in reqs:
        if len(cur) >= BATCH_SIZE:
            batches.append(cur)
            cur = []
        cur.append(r)
    if cur:
        batches.append(cur)
    for i, b in enumerate(batches, 1):
        write_jsonl(out / f"batch-{i:02d}.jsonl", b)
    print(f"{exam}: {len(reqs)} items to judge in {len(batches)} batches "
          f"({cached} already cached) -> {out}")
    return len(batches)


def merge(exam):
    P = paths(exam)
    reqs = {}
    for f in sorted((P["out"] / "batches").glob("batch-*.jsonl")):
        for r in read_jsonl(f):
            reqs[r["item_id"]] = r
    cache_path = P["results"] / "judgments.jsonl"
    cache = {j["item_id"]: j for j in read_jsonl(cache_path)}
    added, bad = 0, []
    answer_files = [f for f in sorted((P["out"] / "judged").glob("batch-*.jsonl"))
                    if (P["out"] / "batches" / f.name).exists()]
    for f in answer_files:
        for line_no, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                j = json.loads(line)
                req = reqs[j["item_id"]]
                ng, mg = j["notes_grade"], j["material_grade"]
                if ng not in GRADES or mg not in GRADES:
                    raise ValueError(f"grade must be one of {GRADES}")
                if GRADES.index(mg) > GRADES.index(ng):
                    pass  # material is the wider view: material 'taught' with notes 'absent' is fine
                if GRADES.index(ng) < GRADES.index(mg):
                    raise ValueError("notes_grade is stronger than material_grade")
                ids = {e["id"] for e in req["evidence"]}
                keep = [e for e in j.get("evidence_ids", []) if e in ids]
            except Exception as exc:       # noqa: BLE001 - report every bad line, keep going
                bad.append(f"{f.name}:{line_no}: {exc}")
                continue
            cache[j["item_id"]] = {
                "key": req["key"], "item_id": j["item_id"], "notes_grade": ng, "material_grade": mg,
                "evidence_ids": keep, "reason": one_line(j.get("reason", ""))[:220],
                "recall_check": req["recall_check"]}
            added += 1
    # Quality gate: a grader that reused one sentence for many items did not read them.
    for f in answer_files:
        rs = [json.loads(x)["reason"] for x in f.read_text(encoding="utf-8").splitlines() if x.strip()]
        if len(rs) >= 10 and len(set(rs)) / len(rs) < 0.7:
            bad.append(f"{f.name}: only {len(set(rs))} distinct reasons for {len(rs)} items (templated)")
    write_jsonl(cache_path, sorted(cache.values(), key=lambda j: [int(x) for x in j["item_id"].split(".")]))
    missing = [i for i in reqs if i not in {j["item_id"] for j in cache.values()}]
    print(f"{exam}: merged {added} judgments, {len(bad)} rejected lines, "
          f"{len(missing)} requested items still without an answer")
    for b in bad[:15]:
        print("  rejected:", b)
    if not bad:
        archive(P["out"] / "judged", answer_files)
    return len(missing) == 0 and not bad


def note_candidates(item, notes, df, shown, k=3, floor=0.34):
    """Notes the strict pass did not show the grader: rank by rare-word overlap."""
    toks = {t[:TRUNC] for t in sig(strip_label(item["item_text"])) if len(t) >= 4}
    scored = []
    for e, have in notes:
        if e["evidence_id"] in shown:
            continue
        hit = toks & have
        score = sum(1.0 / max(df.get(t, 1), 1) for t in hit)
        if hit and score >= floor:
            scored.append((score, e))
    scored.sort(key=lambda x: -x[0])
    return [e for _, e in scored[:k]]


def prepare_recheck(exam):
    """Second look at the notes only. The first pass shows the grader the best 7 snippets
    from every source, so a weakly worded note can be crowded out by a drill. Any item the
    notes were not graded 'taught' for gets up to 3 more note units it has not seen yet."""
    P, rubric, evidence, matches = load_state(exam)
    judged = {j["item_id"]: j for j in read_jsonl(P["results"] / "judgments.jsonl")}
    recheck_cache = {j["key"] for j in read_jsonl(P["results"] / "notes-recheck.jsonl")}
    obj = json.loads((ROOT / "content" / "objectives.json").read_text(encoding="utf-8"))
    status = {o["id"]: o["status"] for e in obj["exams"] if e["code"] == exam
              for d in e["domains"] for o in d["objectives"]}
    _, all_reqs, _ = build_requests(exam, status, ignore_cache=True)
    shown = {r["item_id"]: {e["id"] for e in r["evidence"]} for r in all_reqs}
    notes = []
    df = Counter()
    for e in evidence.values():
        if e["source_type"] != "note":
            continue
        have = {t[:TRUNC] for t in stems(e["text"])}
        notes.append((e, have))
        df.update(have)
    children = {r["parent_id"] for r in rubric if r["parent_id"]}
    reqs = []
    for item in rubric:
        iid = item["item_id"]
        if iid in children:
            continue                      # leaves only: they carry the score
        if judged.get(iid, {}).get("notes_grade") == "taught":
            continue
        cands = note_candidates(item, notes, df, shown.get(iid, set()))
        if not cands:
            continue
        key = sha(item["item_text"], item["path"], *[f"{e['evidence_id']}:{sha(e['text'])}" for e in cands])
        if key in recheck_cache:
            continue
        terms = [strip_label(item["item_text"]).split("(")[0].strip()]
        reqs.append({
            "key": key, "item_id": iid, "objective": item["objective"],
            "objective_title": item["objective_title"], "path": item["path"], "mode": "notes-recheck",
            "item_text": item["item_text"], "previous_notes_grade": judged.get(iid, {}).get("notes_grade", "absent"),
            "evidence": [{"id": e["evidence_id"], "source": "note", "depth": e["depth"],
                          "mapped": item["objective"] in e["objectives"].split("|"),
                          "context": e["context"], "text": snippet(e["text"], terms)} for e in cands]})
    out = P["out"] / "recheck"
    if out.exists():
        for f in out.glob("batch-*.jsonl"):
            f.unlink()
    size = 60
    batches = [reqs[i:i + size] for i in range(0, len(reqs), size)]
    for i, b in enumerate(batches, 1):
        write_jsonl(out / f"batch-{i:02d}.jsonl", b)
    print(f"{exam}: {len(reqs)} items get a notes recheck in {len(batches)} batches -> {out}")


def archive(folder, files):
    """Merged answers are in the cache; move the files aside so they are not read twice."""
    done = Path(folder) / "merged"
    done.mkdir(parents=True, exist_ok=True)
    for f in files:
        f.replace(done / f.name)


def merge_recheck(exam):
    P = paths(exam)
    reqs = {}
    for f in sorted((P["out"] / "recheck").glob("batch-*.jsonl")):
        for r in read_jsonl(f):
            reqs[r["item_id"]] = r
    cache_path = P["results"] / "notes-recheck.jsonl"
    cache = {j["item_id"]: j for j in read_jsonl(cache_path)}
    added, bad = 0, []
    answer_files = [f for f in sorted((P["out"] / "rechecked").glob("batch-*.jsonl"))
                    if (P["out"] / "recheck" / f.name).exists()]
    for f in answer_files:
        for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                j = json.loads(line)
                req = reqs[j["item_id"]]
                if j["notes_grade"] not in GRADES:
                    raise ValueError(f"grade must be one of {GRADES}")
                ids = {e["id"] for e in req["evidence"]}
                keep = [e for e in j.get("evidence_ids", []) if e in ids]
            except Exception as exc:       # noqa: BLE001
                bad.append(f"{f.name}:{n}: {exc}")
                continue
            cache[j["item_id"]] = {"key": req["key"], "item_id": j["item_id"],
                                   "notes_grade": j["notes_grade"], "evidence_ids": keep,
                                   "reason": one_line(j.get("reason", ""))[:220]}
            added += 1
    for f in answer_files:
        rs = [json.loads(x)["reason"] for x in f.read_text(encoding="utf-8").splitlines() if x.strip()]
        if len(rs) >= 10 and len(set(rs)) / len(rs) < 0.7:
            bad.append(f"{f.name}: only {len(set(rs))} distinct reasons for {len(rs)} items (templated)")
    write_jsonl(cache_path, sorted(cache.values(), key=lambda j: [int(x) for x in j["item_id"].split(".")]))
    missing = [i for i in reqs if i not in cache]
    print(f"{exam}: merged {added} rechecks, {len(bad)} rejected, {len(missing)} requested items unanswered")
    for b in bad[:15]:
        print("  rejected:", b)
    if not bad:
        archive(P["out"] / "rechecked", answer_files)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["prepare", "merge", "prepare-recheck", "merge-recheck"])
    ap.add_argument("--exam", required=True)
    a = ap.parse_args()
    {"prepare": prepare, "merge": merge, "prepare-recheck": prepare_recheck,
     "merge-recheck": merge_recheck}[a.command](a.exam)
