#!/usr/bin/env python3
"""Check the rubric CSV against the PDF it came from.

For each objective, the words in the PDF block (title and bullets, without
bullet glyphs and page footers) must equal the words in the CSV rows. A word
that was dropped, duplicated or moved to another objective shows up as a
difference. This catches column-reading mistakes without a human re-reading
795 rows.

    python3 -I verify_rubric.py <objectives.pdf> <rubric.csv>
Exit status 0 when every objective matches.
"""
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import read_csv  # noqa: E402
import extract_rubric as E  # noqa: E402


def words(text):
    return [w for w in re.split(r"\s+", text.replace("’", "'")) if w]


def main(pdf, csv_path):
    order, _ = E.extract(pdf)
    rows = read_csv(csv_path)
    by_obj = defaultdict(list)
    for r in rows:
        by_obj[r["objective"]].append(r)
    problems = 0
    for _, oid, block in order:
        pdf_words = [w["text"] for w in block if w["text"] not in E.BULLETS]
        if oid == "2.6":
            pdf_words = [w for w in pdf_words if not re.fullmatch(r"\d{1,2}\.", w)]
        csv_words = []
        for r in by_obj.get(oid, []):
            t = re.sub(r"^Step \d+:\s*", "", r["item_text"]) if oid == "2.6" else r["item_text"]
            csv_words += words(t)
        if by_obj.get(oid):
            title = by_obj[oid][0]["objective_title"]
            csv_words += words(title)
        a, b = Counter(w.replace("’", "'") for w in pdf_words), Counter(csv_words)
        # the 1.10 and 1.11 titles end in a dot leader that the CSV drops on purpose
        if oid in ("1.10", "1.11"):
            a.pop(".", None)
        extra, lost = a - b, b - a
        if extra or lost:
            problems += 1
            print(f"{oid}: in PDF only {dict(extra)} | in CSV only {dict(lost)}")
    n = len(order)
    print(f"checked {n} objectives, {problems} with differences")
    return 0 if problems == 0 and n == len(by_obj) else 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
