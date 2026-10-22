#!/usr/bin/env python3
"""Turn judgments into the numbers: grades.csv, summary.csv, todo.csv, history.csv, report.md.

Everything numeric is a CSV so a change between two runs is a join on item_id
or objective. Only report.md is prose.

Scores
    taught = 1, mentioned = 0.5, absent = 0, averaged over the LEAF items of an
    objective (an item with no children). Group labels such as "Features" are
    graded and listed, but they would double-count their own children.
    Each objective counts equally inside its domain, and each domain counts by
    its exam weight, the same rule the repo's objective coverage report uses.
    notes_score counts only what the chapter notes teach. material_score also
    counts visuals, flashcards, questions and drill decks.
"""
import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (GRADE_FIELDS, HISTORY_FIELDS, ROOT, SCORE, SUMMARY_FIELDS, TOOL, paths,  # noqa: E402
                    read_csv, read_jsonl, run_id as make_run_id, write_csv)

TODO_FIELDS = ["priority", "exam", "domain_weight", "objective", "item_id", "path", "item_text",
               "gap", "notes_grade", "material_grade", "best_evidence"]
GAP_ORDER = {"absent-everywhere": 0, "mentioned-only": 1, "no-note": 2, "wrong-objective": 3}


GRADE_RANK = {"absent": 0, "mentioned": 1, "taught": 2}


def key(oid):
    return [int(x) for x in str(oid).split(".")]


def pct(x):
    return round(100 * x, 1)


def build_grades(exam, rid):
    P = paths(exam)
    rubric = read_csv(P["rubric"])
    evidence = {e["evidence_id"]: e for e in read_csv(P["out"] / "evidence.csv")}
    matches = read_csv(P["out"] / "matches.csv")
    judged = {j["item_id"]: j for j in read_jsonl(P["results"] / "judgments.jsonl")}
    recheck = {j["item_id"]: j for j in read_jsonl(P["results"] / "notes-recheck.jsonl")}
    counts = defaultdict(Counter)
    for m in matches:
        counts[m["item_id"]][m["source_type"]] += 1
    parents = {r["parent_id"] for r in rubric if r["parent_id"]}
    rows = []
    for r in rubric:
        iid = r["item_id"]
        j = judged.get(iid)
        if j:
            ng, mg = j["notes_grade"], j["material_grade"]
            basis = "recall-check" if j.get("recall_check") else "judged"
            reason, ids = j["reason"], j["evidence_ids"]
        else:
            ng = mg = "absent"
            basis, reason, ids = "fast-absent", "No evidence unit matched the item's wording.", []
        mapped = ""
        if ids:
            mapped = "1" if any(r["objective"] in evidence[i]["objectives"].split("|") for i in ids if i in evidence) else "0"
        rc = recheck.get(iid)
        if rc and GRADE_RANK[rc["notes_grade"]] > GRADE_RANK[ng]:
            ng = rc["notes_grade"]                       # a recheck can only raise the notes grade
            reason = rc["reason"] + " (notes recheck)"
            ids = rc["evidence_ids"] or ids
            basis = "notes-recheck"
            if GRADE_RANK[mg] < GRADE_RANK[ng]:
                mg = ng                                  # material is never weaker than notes
            mapped = ""
            if ids:
                mapped = "1" if any(r["objective"] in evidence[i]["objectives"].split("|") for i in ids if i in evidence) else "0"
        c = counts[iid]
        rows.append({
            "exam": exam, "domain": r["domain"], "objective": r["objective"], "item_id": iid,
            "level": r["level"], "is_leaf": "0" if iid in parents else "1", "item_text": r["item_text"],
            "notes_grade": ng, "material_grade": mg, "basis": basis,
            "n_note": c["note"], "n_visual": c["visual"], "n_card": c["card"],
            "n_question": c["question"], "n_drill": c["drill"],
            "mapped_hit": mapped, "best_evidence": ids[0] if ids else "", "reason": reason, "run_id": rid})
    return rubric, rows


def summarize(exam, rubric, grades):
    obj = json.loads((ROOT / "content" / "objectives.json").read_text(encoding="utf-8"))
    status = {o["id"]: o["status"] for e in obj["exams"] if e["code"] == exam
              for d in e["domains"] for o in d["objectives"]}
    meta = {}
    for r in rubric:
        meta[r["objective"]] = (r["domain"], r["domain_weight"], r["objective_title"])
    by = defaultdict(list)
    for g in grades:
        by[g["objective"]].append(g)
    out = []
    for oid in sorted(by, key=key):
        gs = by[oid]
        leaves = [g for g in gs if g["is_leaf"] == "1"]
        n = Counter(g["notes_grade"] for g in leaves)
        m = Counter(g["material_grade"] for g in leaves)
        L = max(len(leaves), 1)
        d, w, t = meta[oid]
        out.append({
            "exam": exam, "domain": d, "domain_weight": w, "objective": oid, "title": t,
            "repo_status": status.get(oid, ""), "items": len(gs), "leaves": len(leaves),
            "notes_taught": n["taught"], "notes_mentioned": n["mentioned"], "notes_absent": n["absent"],
            "material_taught": m["taught"], "material_mentioned": m["mentioned"], "material_absent": m["absent"],
            "notes_score": pct((n["taught"] + 0.5 * n["mentioned"]) / L),
            "material_score": pct((m["taught"] + 0.5 * m["mentioned"]) / L)})
    return out


def rollups(summary):
    """Domain rows and one overall row: equal weight per objective inside a domain, exam weight across domains."""
    doms = defaultdict(list)
    for s in summary:
        doms[s["domain"]].append(s)
    rows, tot_n, tot_m, tot_w = [], 0.0, 0.0, 0.0
    for d in sorted(doms, key=key):
        ss = doms[d]
        w = float(ss[0]["domain_weight"] or 0)
        n = sum(s["notes_score"] for s in ss) / len(ss)
        m = sum(s["material_score"] for s in ss) / len(ss)
        tot_n += w * n
        tot_m += w * m
        tot_w += w
        rows.append((d, w, round(n, 1), round(m, 1), len(ss)))
    overall = (round(tot_n / tot_w, 1), round(tot_m / tot_w, 1)) if tot_w else (0, 0)
    return rows, overall


def todo(exam, grades, summary):
    weight = {s["objective"]: float(s["domain_weight"] or 0) for s in summary}
    nobj = Counter(s["domain"] for s in summary)
    dom = {s["objective"]: s["domain"] for s in summary}
    rows = []
    for g in grades:
        if g["is_leaf"] != "1" or g["notes_grade"] == "taught":
            continue
        if g["material_grade"] == "absent":
            gap = "absent-everywhere"
        elif g["material_grade"] == "mentioned":
            gap = "mentioned-only"
        elif g["notes_grade"] == "mentioned":
            gap = "mentioned-only"
        else:
            gap = "no-note"
        pr = round(weight[g["objective"]] / nobj[dom[g["objective"]]], 2)
        rows.append({"priority": pr, "exam": exam, "domain_weight": weight[g["objective"]],
                     "objective": g["objective"], "item_id": g["item_id"], "path": "",
                     "item_text": g["item_text"], "gap": gap, "notes_grade": g["notes_grade"],
                     "material_grade": g["material_grade"], "best_evidence": g["best_evidence"]})
    paths_by_id = {r["item_id"]: r["path"] for r in read_csv(paths(exam)["rubric"])}
    for r in rows:
        r["path"] = paths_by_id[r["item_id"]]
    rows.sort(key=lambda r: (-r["priority"], GAP_ORDER[r["gap"]], key(r["item_id"])))
    return rows


def update_history(exam, rid, summary, dom_rows, overall):
    P = paths(exam)
    hist_path = P["results"] / "history.csv"
    old = read_csv(hist_path) if hist_path.exists() else []
    old = [h for h in old if h["run_id"] != rid]
    today = date.today().isoformat()
    new = []
    for s in summary:
        new.append({"run_id": rid, "date": today, "exam": exam, "objective": s["objective"],
                    **{k: s[k] for k in SUMMARY_FIELDS[6:]}})
    for d, w, n, m, k in dom_rows:
        new.append({"run_id": rid, "date": today, "exam": exam, "objective": f"domain {d}",
                    "items": k, "leaves": k, "notes_taught": "", "notes_mentioned": "", "notes_absent": "",
                    "material_taught": "", "material_mentioned": "", "material_absent": "",
                    "notes_score": n, "material_score": m})
    new.append({"run_id": rid, "date": today, "exam": exam, "objective": "ALL",
                "items": sum(s["items"] for s in summary), "leaves": sum(s["leaves"] for s in summary),
                "notes_taught": sum(s["notes_taught"] for s in summary),
                "notes_mentioned": sum(s["notes_mentioned"] for s in summary),
                "notes_absent": sum(s["notes_absent"] for s in summary),
                "material_taught": sum(s["material_taught"] for s in summary),
                "material_mentioned": sum(s["material_mentioned"] for s in summary),
                "material_absent": sum(s["material_absent"] for s in summary),
                "notes_score": overall[0], "material_score": overall[1]})
    write_csv(hist_path, old + new, HISTORY_FIELDS)
    prev_runs = []
    for h in old:
        if h["run_id"] not in prev_runs:
            prev_runs.append(h["run_id"])
    prev = {}
    if prev_runs:
        last = prev_runs[-1]
        prev = {h["objective"]: h for h in old if h["run_id"] == last}
        prev["_run"] = last
    return prev


def delta(now, before):
    if before in (None, ""):
        return ""
    d = round(float(now) - float(before), 1)
    return f"{d:+.1f}"


def write_report(exam, rid, summary, grades, dom_rows, overall, prev, todo_rows):
    P = paths(exam)
    meta = read_csv(P["rubric"])
    lines = []
    A = lines.append
    A(f"# Rubric audit: {exam}")
    A("")
    A(f"Run `{rid}`. Rubric: {len(meta)} items in {len(summary)} objectives, from the official objectives "
      f"document (see `data/rubric/{exam}.csv`). Scores count leaf items only: taught = 1, mentioned = 0.5, absent = 0.")
    A("")
    po = prev.get("ALL")
    A("## Overall")
    A("")
    A("| View | Score | Change since last run |")
    A("| --- | --- | --- |")
    A(f"| Notes only (what the chapter notes teach) | {overall[0]}% | {delta(overall[0], po['notes_score']) if po else 'first run'} |")
    A(f"| All study material (notes, visuals, cards, questions, drills) | {overall[1]}% | {delta(overall[1], po['material_score']) if po else 'first run'} |")
    A("")
    A("## Domains")
    A("")
    A("| Domain | Exam weight | Objectives | Notes | All material |")
    A("| --- | --- | --- | --- | --- |")
    for d, w, n, m, k in dom_rows:
        A(f"| {d} | {w:.0f}% | {k} | {n}% | {m}% |")
    A("")
    A("## Objectives")
    A("")
    A("| Objective | Repo status | Leaves | Notes (T/M/A) | Notes score | Material (T/M/A) | Material score |")
    A("| --- | --- | --- | --- | --- | --- | --- |")
    for s in summary:
        A(f"| {s['objective']} {s['title'][:58]} | {s['repo_status']} | {s['leaves']} | "
          f"{s['notes_taught']}/{s['notes_mentioned']}/{s['notes_absent']} | {s['notes_score']}% | "
          f"{s['material_taught']}/{s['material_mentioned']}/{s['material_absent']} | {s['material_score']}% |")
    A("")
    # status vs measured
    A("## Where the repo's own status disagrees with the measurement")
    A("")
    flags = []
    for s in summary:
        if s["repo_status"] == "covered" and s["notes_score"] < 60:
            flags.append(f"- **{s['objective']}** is marked covered, but notes teach {s['notes_score']}% of its items ({s['material_score']}% with all material).")
        if s["repo_status"] == "missing" and s["material_score"] >= 50:
            flags.append(f"- **{s['objective']}** is marked missing, but {s['material_score']}% of its items are taught somewhere (drills, cards or visuals); only {s['notes_score']}% in notes.")
        if s["repo_status"] == "partial" and s["notes_score"] >= 80:
            flags.append(f"- **{s['objective']}** is marked partial, but notes teach {s['notes_score']}% of its items.")
    A("\n".join(flags) if flags else "None.")
    A("")
    # gap type counts
    gc = Counter(r["gap"] for r in todo_rows)
    A("## What is left to teach in the notes")
    A("")
    A(f"`results/{exam}/todo.csv` lists {len(todo_rows)} leaf items the notes do not yet teach, ranked by exam weight.")
    A("")
    A("| Gap type | Items | Meaning |")
    A("| --- | --- | --- |")
    A(f"| absent-everywhere | {gc['absent-everywhere']} | Nothing on the site covers it. Write notes first. |")
    A(f"| mentioned-only | {gc['mentioned-only']} | Named but never explained. Add a sentence or a table row. |")
    A(f"| no-note | {gc['no-note']} | Taught in a drill, card, visual or question but not in the notes. Add it to the notes. |")
    A("")
    by_obj = defaultdict(list)
    for r in todo_rows:
        if r["gap"] == "absent-everywhere":
            by_obj[r["objective"]].append(r["item_text"])
    A("### Absent everywhere, by objective (largest first)")
    A("")
    for oid, items in sorted(by_obj.items(), key=lambda kv: (-len(kv[1]), key(kv[0])))[:14]:
        shown = "; ".join(i.rstrip(".") for i in items[:12])
        more = f" (+{len(items) - 12} more)" if len(items) > 12 else ""
        A(f"- **{oid}** ({len(items)}): {shown}{more}")
    A("")
    wrong = [g for g in grades if g["is_leaf"] == "1" and g["notes_grade"] == "taught" and g["mapped_hit"] == "0"]
    A("## Taught, but under a different objective in the repo's map")
    A("")
    if wrong:
        A(f"{len(wrong)} items are taught in a topic the map does not link to their objective. Linking the topic fixes the count without writing anything:")
        A("")
        for g in wrong[:12]:
            A(f"- {g['item_id']} {g['item_text'][:60]} → {g['best_evidence']}")
    else:
        A("None.")
    A("")
    A("## How the numbers were made")
    A("")
    basis = Counter(g["basis"] for g in grades)
    A(f"Keyword pass found candidates for {len(grades) - basis['fast-absent']} of {len(grades)} items; "
      f"{basis['fast-absent']} had no candidate and are absent. "
      f"Grader agents judged {basis['judged']} items with candidates and {basis['recall-check']} items the keyword pass missed "
      f"in objectives the repo marks covered or partial (a synonym check); a second look at the notes raised "
      f"{basis['notes-recheck']} more. "
      "The rubric lists are examples inside each objective, so a high score means nothing listed is missing, not that every possible exam question is covered.")
    (P["results"] / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def run(exam, label=""):
    rid = make_run_id(label)
    P = paths(exam)
    rubric, grades = build_grades(exam, rid)
    summary = summarize(exam, rubric, grades)
    dom_rows, overall = rollups(summary)
    todo_rows = todo(exam, grades, summary)
    write_csv(P["results"] / "grades.csv", grades, GRADE_FIELDS)
    write_csv(P["results"] / "summary.csv", summary, SUMMARY_FIELDS)
    write_csv(P["results"] / "todo.csv", todo_rows, TODO_FIELDS)
    prev = update_history(exam, rid, summary, dom_rows, overall)
    write_report(exam, rid, summary, grades, dom_rows, overall, prev, todo_rows)
    print(f"{exam}: notes {overall[0]}% | all material {overall[1]}% | {len(todo_rows)} leaf items to teach "
          f"-> {P['results']}")
    return overall


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--exam", required=True)
    ap.add_argument("--label", default="")
    a = ap.parse_args()
    run(a.exam, a.label)
