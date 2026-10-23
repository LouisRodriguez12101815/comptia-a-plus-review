"""Deterministic CSV reports; unresolved labels retain their denominator."""
from __future__ import annotations

import html
import json
from collections import Counter, defaultdict
from pathlib import Path

from .util import atomic_text, item_order, read_csv, write_csv, write_json, write_jsonl

SCORE = {"absent": 0.0, "mentioned": 0.5, "taught": 1.0}
GRADE_FIELDS = ["exam", "domain", "objective", "item_id", "is_leaf", "item_text", "path",
                "notes_grade", "material_grade", "notes_observed", "material_observed",
                "notes_reason", "material_reason", "notes_evidence", "material_evidence", "status", "run_id"]
SUMMARY_FIELDS = ["exam", "domain", "domain_weight", "objective", "title", "items", "leaves",
                  "notes_taught", "notes_mentioned", "notes_absent", "notes_unresolved",
                  "material_taught", "material_mentioned", "material_absent", "material_unresolved",
                  "notes_score", "notes_lower", "notes_upper", "material_score", "material_lower", "material_upper"]


def _pct(value):
    return f"{100 * value:.4f}"


def summarize(rubric, decisions):
    groups = defaultdict(list)
    for row in rubric:
        groups[row["objective"]].append(row)
    summary = []
    for oid in sorted(groups, key=item_order):
        rows = groups[oid]
        leaves = [r for r in rows if r["is_leaf"] is True or r["is_leaf"] == "1"]
        if not leaves:
            raise ValueError(f"Objective {oid} has no score-bearing leaves")
        first = rows[0]
        result = {"exam": first["exam"], "domain": first["domain"], "domain_weight": first["domain_weight"],
                  "objective": oid, "title": first["objective_title"], "items": len(rows), "leaves": len(leaves)}
        for view in ("notes", "material"):
            labels = [decisions[r["item_id"]][f"{view}_grade"] for r in leaves]
            counts = Counter(labels)
            if set(counts) - set(SCORE) - {"unresolved"}:
                raise ValueError("Unknown final grade")
            for grade in (*SCORE, "unresolved"):
                result[f"{view}_{grade}"] = counts[grade]
            known = sum(SCORE.get(label, 0) for label in labels)
            lower = known / len(leaves)
            upper = (known + counts["unresolved"]) / len(leaves)
            result[f"{view}_score"] = _pct(lower) if not counts["unresolved"] else ""
            result[f"{view}_lower"] = _pct(lower)
            result[f"{view}_upper"] = _pct(upper)
        summary.append(result)
    return summary


def rollups(summary):
    domains = defaultdict(list)
    for row in summary:
        domains[row["domain"]].append(row)
    output = []
    for domain in sorted(domains, key=item_order):
        rows = domains[domain]
        record = {"domain": domain, "weight": float(rows[0]["domain_weight"]), "objectives": len(rows)}
        for view in ("notes", "material"):
            for bound in ("lower", "upper"):
                record[f"{view}_{bound}"] = sum(float(r[f"{view}_{bound}"]) for r in rows) / len(rows)
            record[f"{view}_unresolved"] = sum(int(r[f"{view}_unresolved"]) for r in rows)
        output.append(record)
    overall = {}
    weight = sum(row["weight"] for row in output)
    for view in ("notes", "material"):
        for bound in ("lower", "upper"):
            overall[f"{view}_{bound}"] = sum(r["weight"] * r[f"{view}_{bound}"] for r in output) / weight
        overall[f"{view}_unresolved"] = sum(r[f"{view}_unresolved"] for r in output)
    return output, overall


def _display(row, view):
    low, high = float(row[f"{view}_lower"]), float(row[f"{view}_upper"])
    return f"{low:.1f}%" if not int(row[f"{view}_unresolved"]) else f"{low:.1f}–{high:.1f}% ({row[f'{view}_unresolved']} unresolved)"


def write_heatmap(path, summary, state):
    body = []
    for row in summary:
        cells = []
        for view in ("notes", "material"):
            unknown = int(row[f"{view}_unresolved"])
            score = float(row[f"{view}_lower"])
            hue = 160 if score >= 80 else (42 if score >= 40 else 7)
            color = "#edf0f2" if unknown else f"hsl({hue} 65% 88%)"
            cells.append(f'<td style="background:{color}">{html.escape(_display(row, view))}</td>')
        body.append(f'<tr><td>{html.escape(row["domain"])}</td><th scope="row">{html.escape(row["objective"])}</th>'
                    f'<td>{html.escape(row["title"])}</td>{"".join(cells)}<td>{row["leaves"]}</td></tr>')
    exam = html.escape(state["config"]["exam"])
    label = "SYNTHETIC FIXTURE — not certification coverage" if state["config"]["provider"] == "fixture" else "Local assessment — all scanned material"
    markup = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rubric coverage — ''' + exam + '''</title><style>
:root{font-family:system-ui,sans-serif;color:#162c3a;background:#f5f4ed}body{max-width:1200px;margin:0 auto;padding:32px 20px}h1{font-size:clamp(1.7rem,4vw,2.6rem);margin:.3em 0}.tag{font-weight:750;color:#00645b}.muted{color:#445e69;max-width:80ch;line-height:1.6}input{font:inherit;padding:12px;border:1px solid #82949d;border-radius:8px;width:min(400px,90%)}.scroll{overflow:auto;margin-top:24px;background:white;border:1px solid #c8d1d4;border-radius:10px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:14px;border-bottom:1px solid #d6dedf;min-width:5em}thead{background:#153d4d;color:white}tbody td:nth-child(3){min-width:260px}caption{text-align:left;padding:16px;font-weight:650}button{min-height:44px;font:inherit;padding:8px 16px}@media print{input,label,button{display:none}body{padding:0}.scroll{overflow:visible}}
</style><p class="tag">''' + html.escape(label) + '''</p><h1>Coverage by objective · ''' + exam + '''</h1>
<p class="muted">Notes and all scanned material are separate views. Taught = 1, mentioned = 0.5, absent = 0. Grey cells contain unresolved judgments: the displayed range keeps those items in the denominator. These ranges describe missing labels, not statistical confidence or exam readiness.</p>
<p class="muted">Analysis ''' + html.escape(state["run_id"]) + ''' · Status: <strong>''' + html.escape(state["status"]) + '''</strong>. Model accuracy has not been measured. Inspect inventory.csv for unsupported or missing source types. PDF wording verification was not repeated.</p>
<label for="q">Filter objectives </label><input id="q" type="search" placeholder="Objective, domain, or topic" aria-controls="coverage"><button type="button" onclick="window.print()">Print</button>
<div class="scroll"><table id="coverage"><caption>Every objective in this input rubric</caption><thead><tr><th>Domain</th><th>Objective</th><th>Topic</th><th>Notes</th><th>All scanned material</th><th>Leaves</th></tr></thead><tbody>''' + "".join(body) + '''</tbody></table></div>
<script>document.getElementById('q').addEventListener('input',function(){const q=this.value.trim().toLowerCase();document.querySelectorAll('tbody tr').forEach(r=>{r.hidden=!r.textContent.toLowerCase().includes(q)})});</script></html>'''
    atomic_text(path, markup)


def export_reports(state, output):
    run_dir = Path(state["run_dir"])
    rubric, decisions = state["rubric"], state["decisions"]
    if {r["item_id"] for r in rubric} != set(decisions):
        raise ValueError("Every rubric row must have exactly one final status")
    grades = []
    for row in sorted(rubric, key=lambda r: item_order(r["item_id"])):
        decision = decisions[row["item_id"]]
        record = {k: row.get(k, "") for k in ("exam", "domain", "objective", "item_id", "item_text", "path")}
        record.update({"is_leaf": "1" if row["is_leaf"] else "0", "status": decision["status"], "run_id": state["run_id"]})
        for view in ("notes", "material"):
            for suffix in ("grade", "observed", "reason"):
                record[f"{view}_{suffix}"] = decision[f"{view}_{suffix}"]
            record[f"{view}_evidence"] = "|".join(c["evidence_id"] for c in decision[f"{view}_citations"])
        grades.append(record)
    summary = summarize(rubric, decisions)
    domain_rows, overall = rollups(summary)
    objective_meta = {s["objective"]: s for s in summary}
    domain_counts = Counter(s["domain"] for s in summary)
    todo = []
    for row in grades:
        if row["is_leaf"] != "1" or (row["notes_grade"] == "taught" and row["material_grade"] != "unresolved"):
            continue
        meta = objective_meta[row["objective"]]
        gap = "needs-review" if row["status"] != "resolved" else (
            "absent-in-scanned-material" if row["material_grade"] == "absent" else
            "notes-gap" if row["material_grade"] == "taught" else "mentioned-only")
        weight = float(meta["domain_weight"]) / domain_counts[meta["domain"]] / int(meta["leaves"])
        gain = weight * (1 - SCORE.get(row["notes_grade"], 0))
        todo.append({"priority_points": f"{gain:.6f}", "exam": row["exam"], "objective": row["objective"],
                     "item_id": row["item_id"], "item_text": row["item_text"], "path": row["path"], "gap": gap,
                     "notes_grade": row["notes_grade"], "material_grade": row["material_grade"]})
    todo.sort(key=lambda r: (-float(r["priority_points"]), item_order(r["item_id"])))
    todo_fields = ["priority_points", "exam", "objective", "item_id", "item_text", "path", "gap", "notes_grade", "material_grade"]
    files = {name: str(run_dir / name) for name in ("grades.csv", "summary.csv", "todo.csv", "inventory.csv", "report.md", "coverage.html", "judgments.jsonl")}
    write_csv(files["grades.csv"], grades, GRADE_FIELDS)
    write_csv(files["summary.csv"], summary, SUMMARY_FIELDS)
    write_csv(files["todo.csv"], todo, todo_fields)
    write_csv(files["inventory.csv"], state["inventory"], ["source_path", "status", "detail", "units"])
    write_jsonl(files["judgments.jsonl"], [{"item_id": iid, "passes": state["outcomes"].get(iid, {}), "final": decisions[iid]} for iid in sorted(decisions, key=item_order)])
    write_json(run_dir / "rollups.json", {"domains": domain_rows, "overall": overall, "analysis_id": state["run_id"]})
    # Rebuild the history view from authoritative per-analysis outputs. Replays do not duplicate runs.
    history = []
    for path in sorted(Path(output).glob("runs/*/summary.csv")):
        history.extend({"run_id": path.parent.name, **row} for row in read_csv(path))
    write_csv(Path(output) / "history.csv", history, ["run_id", *SUMMARY_FIELDS])
    files["history.csv"] = str(Path(output) / "history.csv")
    lines = [f"# OpenAI rubric assessment: {state['config']['exam']}", "",
             f"Analysis `{state['run_id']}`. Status: **{state['status']}**.", "",
             "This is an independent assessment. No Claude grades or reasons were supplied to the grader.", ""]
    if state["config"]["provider"] == "fixture":
        lines += ["**Synthetic fixture replay only. These are not certification coverage results and no language model was called.**", ""]
    lines += ["## Coverage of the supplied material", "", f"Notes: **{_display(overall, 'notes')}**.",
              f"All scanned material: **{_display(overall, 'material')}**.", "",
              "Scores average leaf grades within each objective, objectives equally within each domain, and domains by their exam weights. Unresolved rows stay in the denominator; their 0–1 range produces the reported bounds. These are not confidence intervals.", "",
              "| Domain | Weight | Notes | All scanned material |", "| --- | ---: | --- | --- |"]
    for row in domain_rows:
        lines.append(f"| {row['domain']} | {row['weight']:g}% | {_display(row, 'notes')} | {_display(row, 'material')} |")
    lines += ["", "## Verification status", "",
              "- Rubric hierarchy and weights were checked structurally. Wording was not compared with the official PDF in this workflow.",
              "- Response validation checks request identity, exact item membership, grade ordering, citation existence, and verbatim quotes. It does not prove that the cited text warrants the grade.",
              f"- Blinded review sheet: `validation/blinded-review.csv`. **Review not performed; judge agreement and error rate remain unmeasured.**",
              "- Initial and recheck disagreements remain unresolved. The recheck cannot silently choose the higher grade.",
              "- Inspect `inventory.csv` for missing files and material requiring a structured export, including dynamic visuals, drills, labs, or PBQs.",
              "- A coverage score is an estimate of teaching coverage, not a predicted exam score or proof of technical correctness.", "",
              "## Reproducibility", "",
              "The analysis ID binds input hashes, the complete evidence corpus, model configuration, prompt, schema, and implementation. Execution time is kept outside deterministic grade tables. Re-exporting cached judgments should reproduce grades.csv and summary.csv byte for byte; fresh model calls are not promised to return identical judgments.", ""]
    atomic_text(files["report.md"], "\n".join(lines))
    write_heatmap(files["coverage.html"], summary, state)
    return files
