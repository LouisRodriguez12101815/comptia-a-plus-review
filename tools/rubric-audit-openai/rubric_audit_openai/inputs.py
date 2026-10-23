"""Read-only, deterministic rubric and study-material input adapters.

Rubric verification here checks structure, never equivalence to an objectives
PDF. Evidence extraction does not run site code. Its inventory states what was
read, missing, partially extracted, or requires a supplied structured export.
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from typing import Any


RUBRIC_FIELDS = (
    "exam", "domain", "domain_weight", "objective", "objective_title",
    "item_id", "level", "parent_id", "item_text", "path",
)
SOURCE_TYPES = frozenset({"note", "card", "question", "visual", "drill", "lab", "pbq"})


def _string(value: Any, label: str, *, empty: bool = False) -> str:
    if not isinstance(value, str) or (not empty and not value.strip()):
        raise ValueError(f"{label} must be {'a string' if empty else 'a nonempty string'}")
    if "\x00" in value:
        raise ValueError(f"{label} contains a null character")
    return value


def _strings(value: Any, label: str) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"{label} must be a list of strings")
    return [_string(v, label) for v in value]


def _pointer(value: str) -> str:
    return value.replace("~", "~0").replace("/", "~1")


def load_rubric(path: Path, exam: str) -> list[dict]:
    """Load the legacy CSV without renumbering or altering rubric item IDs."""
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None or len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ValueError("Rubric CSV has missing or duplicate column names")
        if not set(RUBRIC_FIELDS).issubset(reader.fieldnames):
            raise ValueError("Rubric CSV is missing required columns")
        rows = list(reader)
    if any(None in row or any(v is None for v in row.values()) for row in rows):
        raise ValueError("Rubric CSV contains a row with the wrong number of fields")
    verify_rubric(rows, exam)
    parents = {row["parent_id"] for row in rows if row["parent_id"]}
    for row in rows:
        row["is_leaf"] = row["item_id"] not in parents
    return rows


def verify_rubric(rows: list[dict], exam: str) -> dict:
    """Check outline invariants; this is explicitly NOT PDF wording verification."""
    _string(exam, "exam")
    if not rows:
        raise ValueError("Rubric must contain at least one item")
    by_id: dict[str, dict] = {}
    weights: dict[str, Decimal] = {}
    objectives: dict[str, tuple[str, str]] = {}
    domain_aliases: dict[int, str] = {}
    for row in rows:
        if not isinstance(row, dict) or not set(RUBRIC_FIELDS).issubset(row):
            raise ValueError("Rubric item is missing required fields")
        for field in RUBRIC_FIELDS:
            _string(row[field], f"rubric {field}", empty=field == "parent_id")
        iid = row["item_id"]
        if iid in by_id:
            raise ValueError(f"Duplicate rubric item ID: {iid}")
        by_id[iid] = row
        if row["exam"] != exam:
            raise ValueError(f"Rubric item {iid} belongs to a different exam")
        try:
            weight = Decimal(row["domain_weight"])
        except InvalidOperation as exc:
            raise ValueError(f"Invalid domain weight for {iid}") from exc
        if not weight.is_finite() or weight <= 0:
            raise ValueError(f"Domain weight must be finite and positive: {iid}")
        domain = row["domain"]
        if not re.fullmatch(r"[1-9]\d*(?:\.0)?", domain):
            raise ValueError(f"Invalid domain identifier for {iid}")
        domain_number = int(domain.split(".")[0])
        if domain_number in domain_aliases and domain_aliases[domain_number] != domain:
            raise ValueError(f"Mixed aliases for domain {domain_number}; use one spelling throughout the rubric")
        domain_aliases[domain_number] = domain
        if domain in weights and weights[domain] != weight:
            raise ValueError(f"Inconsistent domain weight for {domain}")
        weights[domain] = weight
        oid = row["objective"]
        meta = (domain, row["objective_title"])
        if oid in objectives and objectives[oid] != meta:
            raise ValueError(f"Inconsistent domain or title for objective {oid}")
        objectives[oid] = meta
        if not re.fullmatch(r"\d+\.\d+", oid):
            raise ValueError(f"Invalid objective identifier for {iid}")
        if int(oid.split(".")[0]) != domain_number:
            raise ValueError(f"Objective {oid} is outside domain {domain}")
        if not row["level"].isdigit():
            raise ValueError(f"Invalid outline level for {iid}")
    if sum(weights.values()) != Decimal(100):
        raise ValueError("Distinct domain weights must sum to 100")
    for iid, row in by_id.items():
        parent = row["parent_id"]
        if parent:
            if parent not in by_id:
                raise ValueError(f"Missing parent {parent} for {iid}")
            if by_id[parent]["objective"] != row["objective"]:
                raise ValueError(f"Parent of {iid} belongs to another objective")
    complete: set[str] = set()
    for iid in by_id:
        current, chain = iid, set()
        while current and current not in complete:
            if current in chain:
                raise ValueError(f"Cycle in rubric parents involving {current}")
            chain.add(current)
            current = by_id[current]["parent_id"]
        complete.update(chain)
    parents = {r["parent_id"] for r in rows if r["parent_id"]}
    leaf_counts = Counter(r["objective"] for r in rows if r["item_id"] not in parents)
    for row in rows:
        is_leaf = row["item_id"] not in parents
        if "is_leaf" in row and (not isinstance(row["is_leaf"], bool) or row["is_leaf"] != is_leaf):
            raise ValueError(f"Incorrect is_leaf flag for {row['item_id']}")
        if row["parent_id"] and int(by_id[row["parent_id"]]["level"]) >= int(row["level"]):
            raise ValueError(f"Child outline level must exceed its parent: {row['item_id']}")
    if set(leaf_counts) != set(objectives):
        raise ValueError("Every objective must have a leaf item")
    return {
        "exam": exam, "verification": "structural_only", "pdf_wording_verified": False,
        "items": len(rows), "leaves": sum(leaf_counts.values()),
        "objectives": len(objectives), "domains": len(weights),
        "domain_weights": {k: float(weights[k]) for k in sorted(weights)},
        "objective_leaf_counts": dict(sorted(leaf_counts.items())),
    }


def _in_exam(row: dict, exam: str, topic_exams: dict[str, list[str]] | None = None) -> bool:
    if "examCodes" in row:
        return exam in _strings(row["examCodes"], "examCodes")
    if "exam" in row:
        return _string(row["exam"], "exam") == exam
    if topic_exams is None:
        return True
    return any(exam in topic_exams.get(tid, []) for tid in _topic_ids(row))


def _topic_ids(row: dict) -> list[str]:
    tids = row.get("topicId", [])
    return [_string(tids, "topicId")] if isinstance(tids, str) else _strings(tids, "topicId")


def _validated_unit(row: dict, exam: str) -> dict:
    if not isinstance(row, dict):
        raise ValueError("Evidence row must be an object")
    required = ("evidence_id", "source_type", "source_path", "locator", "text")
    for field in required:
        _string(row.get(field), f"evidence {field}")
    if row["source_type"] not in SOURCE_TYPES:
        raise ValueError(f"Unsupported evidence source_type: {row['source_type']}")
    objectives = _strings(row.get("objectives", []), "evidence objectives")
    result = {field: row[field] for field in required}
    result.update(exam=exam, objectives=sorted(set(objectives)))
    for field in ("source_id", "topic_id", "context"):
        if field in row:
            result[field] = _string(row[field], f"evidence {field}", empty=True)
    result.setdefault("source_id", row["evidence_id"])
    return result


def _parse_evidence_jsonl(raw: bytes, exam: str) -> list[dict]:
    result, seen = [], set()
    for n, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            unit = _validated_unit(row, exam)
            if unit["evidence_id"] in seen:
                raise ValueError(f"Duplicate evidence ID: {unit['evidence_id']}")
            seen.add(unit["evidence_id"])
            if _in_exam(row, exam):
                result.append(unit)
        except (ValueError, TypeError) as exc:
            raise ValueError(f"Invalid evidence JSONL line {n}: {exc}") from exc
    return sorted(result, key=lambda unit: unit["evidence_id"])


def load_evidence_jsonl(path: Path, exam: str) -> list[dict]:
    """Read only the supplied export; this does not establish all-site coverage."""
    return _parse_evidence_jsonl(Path(path).read_bytes(), exam)


def _safe_path(repo: Path, relative: str) -> Path:
    if "\\" in relative or "\x00" in relative:
        raise ValueError(f"Unsafe repository path: {relative}")
    pure = PurePosixPath(relative)
    if pure.is_absolute() or ".." in pure.parts or ":" in relative:
        raise ValueError(f"Unsafe repository path: {relative}")
    target = (repo / relative).resolve()
    if not target.is_relative_to(repo):
        raise ValueError(f"Repository path escapes its root: {relative}")
    return target


class _StaticHTML(HTMLParser):
    """Extract static text, including SVG text, without interpreting JavaScript."""
    SKIP = frozenset({"script", "style", "head", "template"})
    VOID = frozenset({"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"})

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool]] = []
        self.parts: list[str] = []
        self.dynamic = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        style = re.sub(r"\s+", "", attr.get("style") or "").lower()
        hidden = tag in self.SKIP or "hidden" in attr or "display:none" in style or "visibility:hidden" in style
        if tag in {"script", "template", "canvas", "iframe"}:
            self.dynamic = True
        if tag not in self.VOID:
            self.stack.append((tag, hidden))
        self.parts.append(" ")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break
        self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not any(hidden for _, hidden in self.stack):
            self.parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", "".join(self.parts)).strip()


def _section_text(section: dict) -> tuple[str, list[str]]:
    title = _string(section.get("title"), "section title")
    parts, unsupported = [title], []
    blocks = section.get("blocks", [])
    if not isinstance(blocks, list):
        raise ValueError("Section blocks must be a list")
    for index, block in enumerate(blocks):
        if not isinstance(block, dict):
            raise ValueError("Section block must be an object")
        kind = block.get("type")
        if kind in {"paragraph", "callout", "code"}:
            parts.append(_string(block.get("text"), f"{kind} text", empty=True))
        elif kind == "bullets":
            parts.extend("- " + item for item in _strings(block.get("items"), "bullet items"))
        elif kind == "table":
            headers = _strings(block.get("headers"), "table headers")
            rows = block.get("rows")
            if not isinstance(rows, list) or not headers:
                raise ValueError("Table must have headers and a list of rows")
            for row in rows:
                if not isinstance(row, list) or len(row) != len(headers):
                    raise ValueError("Table row must match the header count")
                if any(not isinstance(cell, (str, int, float, bool)) and cell is not None for cell in row):
                    raise ValueError("Unsupported nested table cell")
                parts.append(" | ".join(f"{header}: {'' if cell is None else cell}" for header, cell in zip(headers, row)))
        else:
            unsupported.append(f"blocks/{index} ({kind!r})")
    return "\n\n".join(parts), unsupported


def collect_evidence(repo: Path, exam: str, extra_path: Path | None = None) -> tuple[list[dict], list[dict], dict]:
    """Collect declared study sources without running or importing repository code."""
    repo = Path(repo).resolve()
    if not repo.is_dir():
        raise ValueError("Repository source directory does not exist")
    units: dict[str, dict] = {}
    inventory: dict[str, dict] = {}
    source_hashes: dict[str, str] = {}

    def record(relative: str, status: str, detail: str, count: int = 0) -> None:
        inventory[relative] = {"source_path": relative, "status": status, "detail": detail, "units": count}

    def read_bytes(relative: str, *, required: bool = False) -> bytes | None:
        path = _safe_path(repo, relative)
        if not path.is_file():
            if required:
                raise ValueError(f"Required source file is missing: {relative}")
            record(relative, "missing", "Source file is unavailable; its content was not scanned.")
            return None
        raw = path.read_bytes()
        source_hashes[relative] = hashlib.sha256(raw).hexdigest()
        return raw

    def read_json(relative: str, *, required: bool = False) -> Any:
        raw = read_bytes(relative, required=required)
        if raw is None:
            return None
        try:
            return json.loads(raw.decode("utf-8-sig"))
        except (ValueError, UnicodeError) as exc:
            raise ValueError(f"Invalid JSON source: {relative}") from exc

    def add(kind: str, sid: str, relative: str, locator: str, text: str, objectives: list[str], **extra: str) -> None:
        if not text.strip():
            return
        unit = _validated_unit({"evidence_id": f"{kind}:{sid}", "source_id": sid,
                               "source_type": kind, "source_path": relative, "locator": locator,
                               "text": text, "objectives": objectives, **extra}, exam)
        if unit["evidence_id"] in units:
            raise ValueError(f"Duplicate evidence ID: {unit['evidence_id']}")
        units[unit["evidence_id"]] = unit

    objective_map: dict[str, list[str]] = {}
    objective_file = "content/objectives.json"
    objective_data = read_json(objective_file)
    if objective_data is not None:
        if not isinstance(objective_data, dict) or not isinstance(objective_data.get("exams"), list):
            raise ValueError("Unknown objectives.json schema")
        for exam_row in objective_data["exams"]:
            if exam_row.get("code") != exam:
                continue
            for domain in exam_row.get("domains", []):
                for objective in domain.get("objectives", []):
                    oid = _string(objective.get("id"), "objective id")
                    for tid in _strings(objective.get("topics", []), "objective topics"):
                        objective_map.setdefault(tid, []).append(oid)
        record(objective_file, "scanned", "Topic-to-objective mapping only; mapping is not teaching evidence.")

    topic_exams: dict[str, list[str]] = {}
    for relative in ("content/topics.json", "content/topics-network-plus.json"):
        topics = read_json(relative, required=relative == "content/topics.json")
        if topics is None:
            continue
        if not isinstance(topics, list):
            raise ValueError(f"Unknown topic list schema: {relative}")
        before, warnings = len(units), []
        for index, topic in enumerate(topics):
            if not isinstance(topic, dict):
                raise ValueError("Topic must be an object")
            tid = _string(topic.get("id"), "topic id")
            if tid in topic_exams:
                raise ValueError(f"Duplicate topic ID: {tid}")
            topic_exams[tid] = _strings(topic.get("examCodes", []), "topic examCodes")
            if exam not in topic_exams[tid]:
                continue
            title = _string(topic.get("title"), "topic title")
            objs = objective_map.get(tid, [])
            for name in ("summary", "concept"):
                if name in topic and topic[name] is not None:
                    text = _string(topic[name], f"topic {name}", empty=True)
                    add("note", f"{tid}/{name}", relative, f"/{index}/{name}", text, objs, topic_id=tid, context=title)
            sections = topic.get("sections", [])
            if not isinstance(sections, list):
                raise ValueError("Topic sections must be a list")
            for section_index, section in enumerate(sections):
                if not isinstance(section, dict):
                    raise ValueError("Section must be an object")
                sid = _string(section.get("id"), "section id")
                text, unsupported = _section_text(section)
                locator = f"/{index}/sections/{section_index}"
                add("note", f"{tid}/{sid}", relative, locator, text, objs, topic_id=tid, context=title)
                warnings.extend(f"{locator}/{item}" for item in unsupported)
        record(relative, "partial" if warnings else "scanned",
               "Unsupported section blocks: " + "; ".join(warnings) if warnings else "Full in-scope summaries, concepts, and supported section blocks; no snippet truncation.", len(units) - before)

    def objectives_for(tids: list[str]) -> list[str]:
        return sorted({oid for tid in tids for oid in objective_map.get(tid, [])})

    for relative, kind in (("content/flashcards.json", "card"), ("content/questions.json", "question")):
        rows = read_json(relative)
        if rows is None:
            continue
        if not isinstance(rows, list):
            raise ValueError(f"Unknown source list schema: {relative}")
        before = len(units)
        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                raise ValueError(f"{kind} must be an object")
            if not _in_exam(row, exam, topic_exams):
                continue
            sid = _string(row.get("id"), f"{kind} id")
            tids = _topic_ids(row)
            if kind == "card":
                text = _string(row.get("front"), "card front") + "\n\n" + _string(row.get("back"), "card back")
            else:
                choices = _strings(row.get("choices"), "question choices")
                answers = row.get("answer")
                answers = answers if isinstance(answers, list) else [answers]
                if not answers or any(type(answer) is not int or not 0 <= answer < len(choices) for answer in answers):
                    raise ValueError(f"Invalid correct-answer index for question {sid}")
                text = (_string(row.get("prompt"), "question prompt") + "\n\nCorrect answer: "
                        + "; ".join(choices[answer] for answer in answers) + "\n\n"
                        + _string(row.get("explanation"), "question explanation", empty=True))
            add(kind, sid, relative, f"/{index}", text, objectives_for(tids))
        record(relative, "scanned", "In-scope material; question distractor options are excluded.", len(units) - before)

    mapping_file = "content/track-visuals.json"
    mapping = read_json(mapping_file)
    if mapping is not None:
        if not isinstance(mapping, dict):
            raise ValueError("Unknown visual mapping schema")
        visual_refs: dict[str, set[str]] = {}
        for tid, entries in mapping.items():
            if exam not in topic_exams.get(tid, []):
                continue
            if not isinstance(entries, list):
                raise ValueError("Visual mapping entries must be a list")
            for entry in entries:
                if not isinstance(entry, dict):
                    raise ValueError("Visual mapping entry must be an object")
                name = _string(entry.get("file"), "visual filename")
                if PurePosixPath(name).is_absolute() or ".." in PurePosixPath(name).parts:
                    raise ValueError(f"Unsafe visual filename: {name}")
                relative = "public/visuals/" + name
                _safe_path(repo, relative)
                visual_refs.setdefault(relative, set()).update(objective_map.get(tid, []))
        record(mapping_file, "scanned", "In-scope visual references only; mapping is not teaching evidence.")
        for relative, objs in sorted(visual_refs.items()):
            raw = read_bytes(relative)
            if raw is None:
                inventory[relative]["detail"] = "A mapped visual is missing; no evidence was extracted."
                continue
            parser = _StaticHTML()
            parser.feed(raw.decode("utf-8-sig"))
            parser.close()
            text = parser.text()
            name = relative.removeprefix("public/visuals/")
            add("visual", name, relative, "html:static-text", text, sorted(objs))
            partial = parser.dynamic or not text
            record(relative, "partial" if partial else "scanned",
                   "Static HTML/SVG text only; script-generated or embedded material was not extracted."
                   if partial else "Static HTML text including SVG text; no JavaScript executed.", int(bool(text)))

    excluded: set[str] = set()
    content_dir = _safe_path(repo, "content")
    for path in content_dir.glob("*.json"):
        if re.search(r"(^|[-_])(labs?|pbqs?)([-_.]|$)", path.name, re.I):
            excluded.add(path.relative_to(repo).as_posix())
    lib_dir = _safe_path(repo, "lib")
    if lib_dir.is_dir():
        for path in lib_dir.rglob("*"):
            if path.suffix not in {".ts", ".tsx"} or not path.is_file():
                continue
            relative = path.relative_to(repo).as_posix()
            if relative.startswith("lib/practice/") or re.search(r"(^|[/_-])(labs?|pbqs?)([/_.-]|$)", relative, re.I):
                _safe_path(repo, relative)
                excluded.add(relative)
    for relative in sorted(excluded):
        _safe_path(repo, relative)
        record(relative, "requires_structured_export", "Not executed or inferred from source; supply in-scope drill/lab/PBQ evidence as structured JSONL.")

    if extra_path is not None:
        raw = Path(extra_path).read_bytes()
        extra = _parse_evidence_jsonl(raw, exam)
        source_hashes["extra-evidence.jsonl"] = hashlib.sha256(raw).hexdigest()
        for unit in extra:
            if unit["evidence_id"] in units:
                raise ValueError(f"Duplicate evidence ID across sources: {unit['evidence_id']}")
            units[unit["evidence_id"]] = unit
        record("extra-evidence.jsonl", "scanned", "Supplied structured export only; its completeness and correspondence to excluded sources are not independently verified.", len(extra))
    return (sorted(units.values(), key=lambda unit: unit["evidence_id"]),
            [inventory[path] for path in sorted(inventory)], dict(sorted(source_hashes.items())))
