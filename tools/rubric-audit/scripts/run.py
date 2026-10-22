#!/usr/bin/env python3
"""One entry point for the rubric audit.

    python3 tools/rubric-audit/scripts/run.py <stage> --exam 220-1202

Stages, in order
    extract   PDF -> data/rubric/<exam>.csv (needs pdfplumber and --pdf)
    verify    check that CSV against the PDF, word for word (needs --pdf)
    prepare   evidence -> match -> judge batches    (deterministic)
    merge     read grader answers into the cache    (deterministic)
    recheck   prepare notes-recheck batches
    finish    merge answers, merge rechecks, acronyms, report
    status    show where the run stands and what to do next
    all       prepare, then finish when no batches are waiting

The only non-deterministic step is the judgment pass, done by the rubric-grader
agent between `prepare` and `merge`. See .claude/skills/rubric-audit/SKILL.md.
"""
import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import acronyms  # noqa: E402
import build_evidence  # noqa: E402
import judge_io  # noqa: E402
import match  # noqa: E402
import report  # noqa: E402
from common import paths, read_csv, read_jsonl  # noqa: E402

HERE = Path(__file__).resolve().parent


def status(exam):
    P = paths(exam)
    print(f"Exam {exam}")
    def have(p):
        return "yes" if Path(p).exists() else "NO"
    print(f"  rubric CSV          {have(P['rubric'])}   ({P['rubric']})")
    print(f"  evidence table      {have(P['out'] / 'evidence.csv')}")
    print(f"  candidate matches   {have(P['out'] / 'matches.csv')}")
    judged = {j["item_id"] for j in read_jsonl(P["results"] / "judgments.jsonl")}
    rechecked = {j["item_id"] for j in read_jsonl(P["results"] / "notes-recheck.jsonl")}

    def waiting(folder, answered):
        out = []
        for f in sorted((P["out"] / folder).glob("batch-*.jsonl")) if (P["out"] / folder).exists() else []:
            if any(r["item_id"] not in answered for r in read_jsonl(f)):
                out.append(f.name)
        return out

    wait_j, wait_r = waiting("batches", judged), waiting("recheck", rechecked)
    print(f"  judge batches       {len(wait_j)} waiting for a grader {wait_j}")
    print(f"  recheck batches     {len(wait_r)} waiting for a grader {wait_r}")
    print(f"  judgments cached    {len(judged)}")
    print(f"  rechecks cached     {len(rechecked)}")
    if wait_j:
        print("Next: send each waiting batch to a rubric-grader agent, then run `finish`.")
    elif wait_r:
        print("Next: send the recheck batches to a rubric-grader agent, then run `finish`.")
    else:
        print("Next: run `finish` to rebuild the report, or edit the site and run `prepare` again.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("stage", choices=["extract", "verify", "prepare", "merge", "recheck", "finish", "status", "all"])
    ap.add_argument("--exam", required=True)
    ap.add_argument("--pdf")
    ap.add_argument("--label", default="")
    a = ap.parse_args()
    P = paths(a.exam)

    if a.stage in ("extract", "verify"):
        if not a.pdf:
            raise SystemExit("--pdf is required for this stage")
        script = HERE / ("extract_rubric.py" if a.stage == "extract" else "verify_rubric.py")
        args = [sys.executable, "-I", str(script), a.pdf]
        if a.stage == "extract":
            args += [a.exam, str(P["rubric"]), str(P["acronyms"])]
        else:
            args += [str(P["rubric"])]
        sys.exit(subprocess.run(args).returncode)

    if a.stage in ("prepare", "all"):
        rows = build_evidence.build(a.exam)
        from common import EVIDENCE_FIELDS, write_csv
        write_csv(P["out"] / "evidence.csv", rows, EVIDENCE_FIELDS)
        print(f"{a.exam}: {len(rows)} evidence units")
        match.run(a.exam)
        judge_io.prepare(a.exam)
        judge_io.prepare_recheck(a.exam)
        if a.stage == "prepare":
            return
    if a.stage == "merge":
        judge_io.merge(a.exam)
        judge_io.merge_recheck(a.exam)
        return
    if a.stage == "recheck":
        judge_io.prepare_recheck(a.exam)
        return
    if a.stage in ("finish", "all"):
        judge_io.merge(a.exam)
        judge_io.merge_recheck(a.exam)
        acronyms.run(a.exam)
        report.run(a.exam, a.label)
        return
    if a.stage == "status":
        status(a.exam)


if __name__ == "__main__":
    main()
