#!/usr/bin/env python3
"""Turn a CompTIA exam-objectives PDF into one CSV row per rubric item.

The objectives PDF lays each objective out in two or three columns of nested
bullets (level 1 "•", level 2 "−", level 3 "գ" glyph). Plain text extraction
interleaves the columns, so this reads word positions with pdfplumber, rebuilds
the columns inside each objective block, and walks the bullets to recover the
parent/child tree.

Usage:
    python3 extract_rubric.py <objectives.pdf> <exam-code> <out.csv> [<acronyms.csv>]

Output columns (see ../docs/schema.md):
    exam, domain, domain_weight, objective, objective_title, item_id,
    level, parent_id, item_text, path

Pass -I to the interpreter when reading an untrusted PDF:
    python3 -I extract_rubric.py ...
"""
import csv
import re
import sys

import pdfplumber

BULLETS = {"•": 1, "−": 2, "գ": 3}
FOOTER_TOP = 745       # copyright block starts at about y=758
TITLE_MIN_SIZE = 11    # objective titles are 12 pt, bullets are 9 pt
LABEL_MAX_X = 45       # the "4.2" label sits in the left margin (x about 30)
LABEL_LEAD = 6         # a wrapped title can start a few points above its margin label
ROW_TOL = 2.5          # words on one text line differ by less than this in y


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("’", "'")


def page_words(page):
    words = page.extract_words(extra_attrs=["size"], keep_blank_chars=False)
    return [w for w in words if w["top"] < FOOTER_TOP]


def domain_weights(pdf):
    """Read '1.0 Operating Systems 28%' from the exam summary page."""
    weights = {}
    for page in pdf.pages[:4]:
        text = page.extract_text() or ""
        for m in re.finditer(r"^(\d)\.0\s+([A-Za-z &]+?)\s+(\d{1,2})%", text, re.M):
            weights[m.group(1)] = (m.group(2).strip(), int(m.group(3)))
    return weights


def find_headers(words):
    """Objective label words: 'N.M' (M not 0) in the left margin."""
    out = []
    for w in words:
        m = re.fullmatch(r"(\d{1,2})\.(\d{1,2})", w["text"])
        if m and int(m.group(2)) != 0 and w["x0"] < LABEL_MAX_X and w["size"] < TITLE_MIN_SIZE:
            out.append(w)
    return sorted(out, key=lambda w: w["top"])


def lines_of(words):
    words = sorted(words, key=lambda w: (round(w["top"] / ROW_TOL), w["x0"]))
    lines, cur, cur_top = [], [], None
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if cur_top is None or abs(w["top"] - cur_top) <= ROW_TOL:
            cur.append(w)
            cur_top = w["top"] if cur_top is None else cur_top
        else:
            lines.append(cur)
            cur, cur_top = [w], w["top"]
    if cur:
        lines.append(cur)
    return lines


def parse_block(words):
    """Return (title, items) for the words below one objective header.
    items is a list of (level, text) in true reading order."""
    title_words = [w for w in words if w["size"] >= TITLE_MIN_SIZE]
    body = [w for w in words if w["size"] < TITLE_MIN_SIZE]
    title = clean(" ".join(w["text"] for w in sorted(title_words, key=lambda w: (round(w["top"] / ROW_TOL), w["x0"]))))
    title = re.sub(r"\.\s+\.$", ".", title)   # dot leader after 1.10 and 1.11
    bullets = [w for w in body if w["text"] in BULLETS]
    if not bullets:
        return title, numbered_steps(body)

    # Column anchors = x of level 1 and 2 bullets (they share an x). Level 3 sits further right.
    xs = sorted({round(b["x0"]) for b in bullets if BULLETS[b["text"]] in (1, 2)})
    anchors = []
    for x in xs:
        if not anchors or x - anchors[-1] > 25:
            anchors.append(x)
    if not anchors:
        anchors = [min(round(b["x0"]) for b in bullets)]

    def col_of(w):
        idx = 0
        for i, a in enumerate(anchors):
            if w["x0"] >= a - 3:
                idx = i
        return idx

    columns = [[] for _ in anchors]
    for w in body:
        columns[col_of(w)].append(w)

    items = []
    for col in columns:
        cur = None
        for line in lines_of(col):
            line = sorted(line, key=lambda w: w["x0"])
            head = line[0]
            if head["text"] in BULLETS:
                if cur:
                    items.append(cur)
                cur = [BULLETS[head["text"]], " ".join(w["text"] for w in line[1:])]
            elif cur is not None:
                cur[1] += " " + " ".join(w["text"] for w in line)
            elif items:
                # an item that wraps across a column break: its tail opens the next column
                items[-1][1] += " " + " ".join(w["text"] for w in line)
        if cur:
            items.append(cur)
    return title, [(lvl, clean(txt)) for lvl, txt in items]


def numbered_steps(body):
    """Objective 2.6 lists numbered steps ("1." ... "10.") in columns, not bullets.
    A step starts at a word like "4." and runs to the next step in the same column;
    wrapped lines in the same column are joined."""
    marks = [w for w in body if re.fullmatch(r"\d{1,2}\.", w["text"])]
    if not marks:
        return []
    xs = sorted({round(m["x0"]) for m in marks})
    anchors = []
    for x in xs:
        if not anchors or x - anchors[-1] > 25:
            anchors.append(x)

    def col_of(w):
        idx = 0
        for i, a in enumerate(anchors):
            if w["x0"] >= a - 3:
                idx = i
        return idx

    steps = []
    for ci in range(len(anchors)):
        col = [w for w in body if col_of(w) == ci]
        cur = None
        for line in lines_of(col):
            line = sorted(line, key=lambda w: w["x0"])
            if re.fullmatch(r"\d{1,2}\.", line[0]["text"]):
                if cur:
                    steps.append(cur)
                cur = [int(line[0]["text"][:-1]), " ".join(w["text"] for w in line[1:])]
            elif cur is not None:
                cur[1] += " " + " ".join(w["text"] for w in line)
        if cur:
            steps.append(cur)
    steps.sort()
    return [(1, f"Step {n}: {clean(t)}") for n, t in steps]


def extract(pdf_path):
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        weights = domain_weights(pdf)
        order = []   # (page, header_word, words_in_block)
        for pn, page in enumerate(pdf.pages):
            words = page_words(page)
            headers = find_headers(words)
            for i, h in enumerate(headers):
                top = h["top"] - LABEL_LEAD
                bottom = headers[i + 1]["top"] - LABEL_LEAD if i + 1 < len(headers) else FOOTER_TOP
                block = [w for w in words if top <= w["top"] < bottom and w is not h]
                order.append((pn, h["text"], block))
    return order, weights


def tree(exam, domain, weight, obj_id, title, items):
    rows, stack, counter = [], [], 0
    for lvl, text in items:
        counter += 1
        item_id = f"{obj_id}.{counter:02d}"
        while stack and stack[-1][0] >= lvl:
            stack.pop()
        parent = stack[-1][1] if stack else ""
        path = " > ".join([s[2] for s in stack] + [text])
        stack.append((lvl, item_id, text))
        rows.append({
            "exam": exam, "domain": domain, "domain_weight": weight,
            "objective": obj_id, "objective_title": title,
            "item_id": item_id, "level": lvl, "parent_id": parent,
            "item_text": text, "path": path,
        })
    return rows


def extract_acronyms(pdf_path, exam):
    """The exam objectives end with the list of acronyms that may appear on the exam."""
    rows, on, done = [], False, False
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            if done:
                break
            words = [w for w in page.extract_words() if w["top"] < FOOTER_TOP]
            cur = None
            for line in lines_of(words):
                line = sorted(line, key=lambda w: w["x0"])
                text = " ".join(w["text"] for w in line)
                if on and re.search(r"\) Hardware and\b", text):
                    done = True
                    break
                if line[0]["text"] == "ACRONYM":
                    on = True
                    continue
                if not on:
                    continue
                if line[0]["x0"] < 100 and len(line) > 1 and line[1]["x0"] > 100:
                    if cur:
                        rows.append(cur)
                    cur = {"exam": exam, "acronym": line[0]["text"],
                           "definition": " ".join(w["text"] for w in line[1:])}
                elif cur and line[0]["x0"] >= 100:
                    cur["definition"] += " " + " ".join(w["text"] for w in line)
            if cur:
                rows.append(cur)
    return rows


def main(argv):
    if len(argv) not in (4, 5):
        print(__doc__)
        return 2
    pdf_path, exam, out = argv[1:4]
    if len(argv) == 5:
        acr = extract_acronyms(pdf_path, exam)
        with open(argv[4], "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["exam", "acronym", "definition"], lineterminator="\n")
            w.writeheader()
            w.writerows({**r, "definition": clean(r["definition"])} for r in acr)
        print(f"{exam}: {len(acr)} acronyms -> {argv[4]}")
    order, weights = extract(pdf_path)
    rows = []
    for pn, obj_id, block in order:
        title, items = parse_block(block)
        domain = obj_id.split(".")[0]
        weight = weights.get(domain, ("", ""))[1]
        rows += tree(exam, f"{domain}.0", weight, obj_id, title, items)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, lineterminator="\n", fieldnames=[
            "exam", "domain", "domain_weight", "objective", "objective_title",
            "item_id", "level", "parent_id", "item_text", "path"])
        w.writeheader()
        w.writerows(rows)
    objs = sorted({r["objective"] for r in rows}, key=lambda s: [int(x) for x in s.split(".")])
    print(f"{exam}: {len(rows)} items across {len(objs)} objectives -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
