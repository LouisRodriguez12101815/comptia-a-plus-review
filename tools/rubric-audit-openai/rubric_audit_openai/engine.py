"""Plain Python audit stages. LangGraph is an optional control-flow layer.

No stage writes to the source repository or reads Claude judgment caches.
Only structurally valid, request-bound model responses enter the accepted cache.
"""
from __future__ import annotations

import copy
import csv
import io
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from .inputs import collect_evidence, load_evidence_jsonl, verify_rubric
from .provider import PROMPT, PROMPT_VERSION, SCHEMA
from .util import canonical, digest, file_digest, item_order, source_code_hash, write_json, write_jsonl

SCORE = {"absent": 0.0, "mentioned": 0.5, "taught": 1.0}
DEFAULTS = {
    "exam": "220-1202", "batch_size": 4, "max_attempts": 3,
    "max_context_chars": 60000, "candidate_limit": 24, "recheck": "all",
    "model": "", "provider": "openai", "sample_size": 40,
    "sample_seed": "core2-openai-validation-v1", "synonyms": {},
    "max_output_tokens": 6000, "reasoning_effort": None,
}


class InvalidResponse(ValueError):
    pass


def validate_response(job, envelope):
    """Validate the complete batch before promoting any item to the cache."""
    if not isinstance(envelope, dict) or envelope.get("status") != "ok":
        raise InvalidResponse("No successful structured response for this job")
    if envelope.get("job_id") != job["job_id"] or envelope.get("request_hash") != job["request_hash"]:
        raise InvalidResponse("Response belongs to a different job or request fingerprint")
    judgments = envelope.get("judgments")
    if not isinstance(judgments, list) or not all(isinstance(j, dict) for j in judgments):
        raise InvalidResponse("judgments must be a list of objects")
    expected = {item["item_id"] for item in job["items"]}
    ids = [j.get("item_id") for j in judgments]
    if any(not isinstance(i, str) for i in ids) or len(ids) != len(set(ids)) or set(ids) != expected:
        raise InvalidResponse("Batch contains duplicate, missing, or unknown item IDs")
    evidence = {e["evidence_id"]: e for e in job["evidence"]}
    reasons = []
    required = {"item_id", "notes_grade", "material_grade", "notes_citations", "material_citations",
                "notes_reason", "material_reason", "retrieval_uncertain"}
    for judgment in judgments:
        if set(judgment) != required:
            raise InvalidResponse("Judgment fields do not match the required schema")
        ng, mg = judgment["notes_grade"], judgment["material_grade"]
        if ng not in SCORE or mg not in SCORE or SCORE[mg] < SCORE[ng]:
            raise InvalidResponse("Invalid grades or material grade below notes grade")
        if not isinstance(judgment["retrieval_uncertain"], bool):
            raise InvalidResponse("retrieval_uncertain must be a boolean")
        for view in ("notes", "material"):
            reason = judgment[f"{view}_reason"]
            if not isinstance(reason, str) or len(reason.strip()) < 8:
                raise InvalidResponse("A specific nonempty reason is required for each view")
            reasons.append(reason.strip())
            citations = judgment[f"{view}_citations"]
            if not isinstance(citations, list):
                raise InvalidResponse("Citations must be a list")
            if judgment[f"{view}_grade"] != "absent" and not citations:
                raise InvalidResponse("Positive grades require verifiable evidence citations")
            if judgment[f"{view}_grade"] == "absent" and citations:
                raise InvalidResponse("An absent grade cannot carry positive supporting citations")
            for citation in citations:
                if not isinstance(citation, dict) or set(citation) != {"evidence_id", "quote"}:
                    raise InvalidResponse("Malformed citation")
                unit = evidence.get(citation["evidence_id"])
                quote = citation["quote"]
                if unit is None or (view == "notes" and unit["source_type"] != "note"):
                    raise InvalidResponse("Citation is unavailable or outside the notes scope")
                if not isinstance(quote, str) or not quote.strip() or quote not in unit["text"]:
                    raise InvalidResponse("Citation quote is not an exact substring of its evidence")
    # Avoid the old flaw: rejection occurs before *any* write to the accepted cache.
    # Notes/material reasons may legitimately coincide for one item; only compare across items.
    for view in ("notes", "material"):
        counts = Counter(j[f"{view}_reason"].strip().casefold() for j in judgments)
        if len(judgments) >= 3 and max(counts.values(), default=0) / len(judgments) > 0.5:
            raise InvalidResponse("A majority of the batch repeats an identical reason")
    return sorted(copy.deepcopy(judgments), key=lambda j: item_order(j["item_id"]))


def _tokens(text):
    stop = {"the", "and", "for", "with", "use", "given", "scenario", "common", "of", "a", "to"}
    return {token for token in re.findall(r"[a-z0-9]+", text.casefold()) if len(token) > 1 and token not in stop}


def select_evidence(items, evidence, config, expanded=False):
    """Full note units first; bounded candidates elsewhere; never clip a unit."""
    notes = [e for e in evidence if e["source_type"] == "note"]
    others = [e for e in evidence if e["source_type"] != "note"]
    queries = []
    for item in items:
        text = item["item_text"]
        aliases = config.get("synonyms", {}).get(text, [])
        if not isinstance(aliases, list) or not all(isinstance(a, str) for a in aliases):
            raise ValueError("Synonyms must map item text to a list of strings")
        literal = text if re.fullmatch(r"(?:[./\\][^\s]+|[^\s]+\.[a-zA-Z]{2,5})", text) else None
        queries.append((item, _tokens(" ".join([text, item.get("path", "")] + aliases)), literal, aliases))
    def relevance(unit):
        score = 0.0
        have = _tokens(unit["text"])
        low = unit["text"].casefold()
        for item, wanted, literal, aliases in queries:
            if literal:
                # A path or file extension never becomes a loose normalized token match.
                if not any(term.casefold() in low for term in [literal] + aliases):
                    continue
                score += 10
            else:
                score += len(wanted & have) / max(1, len(wanted))
            if item["objective"] in unit.get("objectives", []):
                score += 0.25
        return score
    ranked = sorted(others, key=lambda e: (-relevance(e), e["evidence_id"]))
    if not expanded:
        ranked = [e for e in ranked if relevance(e) > 0][:config["candidate_limit"]]
    selected, used = [], 0
    ranked_notes = sorted(notes, key=lambda e: (-relevance(e), e["evidence_id"]))
    for unit in ranked_notes + ranked:
        size = len(canonical(unit))
        if used + size <= config["max_context_chars"]:
            selected.append(unit)
            used += size
    have = {e["evidence_id"] for e in selected}
    return selected, {
        "notes_complete": all(e["evidence_id"] in have for e in notes),
        "material_complete": len(selected) == len(evidence),
        "selected_units": len(selected), "available_units": len(evidence),
        "context_chars": used, "expanded": expanded,
    }


class AuditPipeline:
    def __init__(self, config, grader):
        self.config = {**DEFAULTS, **config}
        self.grader = grader
        for name in ("batch_size", "max_attempts", "max_context_chars", "candidate_limit", "sample_size"):
            value = self.config[name]
            if isinstance(value, bool) or not isinstance(value, int) or value < 1:
                raise ValueError(f"{name} must be a positive integer")
        if not self.config["model"]:
            raise ValueError("Choose an explicit model identifier; the tool does not assume account access")
        if self.config["recheck"] not in {"all", "gaps", "none"}:
            raise ValueError("recheck must be all, gaps, or none")
        self.output = Path(self.config["output"]).resolve()
        repo = self.config.get("repo")
        if repo and self.output.is_relative_to(Path(repo).resolve()):
            raise ValueError("Output must be outside the source repository; assessment is read-only")

    def stages(self):
        return {name: getattr(self, name) for name in (
            "snapshot", "extract", "verify", "prepare", "grade_batch", "merge", "recheck", "finish", "evaluate", "report")}

    def initial_state(self):
        return {"attempt": 0, "max_attempts": self.config["max_attempts"], "config": self.config,
                "batch_results": {}, "outcomes": {}, "errors": [], "status": "preparing"}

    def snapshot(self, state, *, persist=True):
        rubric_path = Path(self.config["rubric"]).resolve()
        rubric_bytes = rubric_path.read_bytes()
        import hashlib
        source_hashes = {"rubric.csv": hashlib.sha256(rubric_bytes).hexdigest()}
        extra = Path(self.config["evidence"]).resolve() if self.config.get("evidence") else None
        if self.config.get("repo"):
            evidence, inventory, files = collect_evidence(Path(self.config["repo"]).resolve(), self.config["exam"], extra)
            source_hashes.update(files)
        elif extra:
            evidence = load_evidence_jsonl(extra, self.config["exam"])
            source_hashes["evidence.jsonl"] = file_digest(extra)
            inventory = [{"source_path": "evidence.jsonl", "status": "scanned", "detail": "Explicit supplied evidence export; whole-site completeness is not established", "units": len(evidence)}]
        else:
            raise ValueError("Provide a local repository or a structured evidence JSONL export")
        if not evidence:
            raise ValueError("No eligible evidence was loaded; this is an input problem, not zero coverage")
        options = {k: v for k, v in self.config.items() if k not in {"output", "repo", "rubric", "evidence"}}
        identity = {"source_hashes": source_hashes, "evidence_hash": digest(evidence),
                    "inventory_hash": digest(inventory), "options": options,
                    "prompt_hash": digest(PROMPT), "prompt_version": PROMPT_VERSION,
                    "schema_hash": digest(SCHEMA), "implementation_hash": source_code_hash()}
        run_id = "oa-" + digest(identity)[:20]
        run_dir = self.output / "runs" / run_id
        # Environment credentials are never copied into config, manifests, requests or checkpoints.
        manifest = {"analysis_id": run_id, "identity": identity, "provider": self.config["provider"],
                    "model_requested": self.config["model"], "legacy_grades_used": False,
                    "rubric_verification": "Structural validation only; PDF wording verification has not been repeated",
                    "score_scope": "notes and all scanned material", "judge_agreement": "not measured"}
        frozen = {"run_id": run_id, "run_dir": str(run_dir), "manifest": manifest, "input_identity": identity,
                  "source_hashes": source_hashes, "evidence": evidence, "inventory": inventory,
                  "raw_rubric": rubric_bytes.decode("utf-8-sig"), "config": self.config}
        return self.persist_snapshot(frozen) if persist else frozen

    def persist_snapshot(self, frozen):
        """Write provenance only when an execution actually enters snapshot."""
        run_dir = Path(frozen["run_dir"])
        write_json(run_dir / "manifest.json", frozen["manifest"])
        write_json(run_dir / "execution.json", {"started_utc": datetime.now(timezone.utc).isoformat(),
                                                "analysis_id": frozen["run_id"]})
        write_jsonl(run_dir / "evidence.jsonl", frozen["evidence"])
        return frozen

    def extract(self, state):
        reader = csv.DictReader(io.StringIO(state["raw_rubric"]))
        if reader.fieldnames is None or len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ValueError("Rubric CSV has missing or duplicate column names")
        rows = list(reader)
        if any(None in row or any(v is None for v in row.values()) for row in rows):
            raise ValueError("Rubric CSV contains a row with the wrong number of fields")
        parents = {r.get("parent_id") for r in rows if r.get("parent_id")}
        for row in rows:
            row["is_leaf"] = row.get("item_id") not in parents
        return {"rubric": sorted(rows, key=lambda r: item_order(r.get("item_id", "")))}

    def verify(self, state):
        findings = verify_rubric(state["rubric"], self.config["exam"])
        manifest = {**state["manifest"], "rubric_structure": findings}
        write_json(Path(state["run_dir"]) / "manifest.json", manifest)
        return {"manifest": manifest, "status": "grading"}

    def _job(self, items, phase, state, attempt):
        evidence, scope = select_evidence(items, state["evidence"], self.config, expanded=phase == "recheck")
        # Scope, rubric metadata, provenance, model and exact prompt/schema all bind the answer.
        request = {"analysis_id": state["run_id"], "phase": phase,
                   "items": [{k: row.get(k, "") for k in ("item_id", "objective", "objective_title", "path", "item_text")} for row in items],
                   "evidence": evidence, "scope": scope, "identity": state["input_identity"]}
        request_hash = digest(request)
        return {**request, "request_hash": request_hash, "job_id": f"{request_hash[:24]}-a{attempt}",
                "attempt": attempt, "run_dir": state["run_dir"]}

    def prepare(self, state):
        attempt = state.get("attempt", 0) + 1
        desired = state.get("pending_jobs") if attempt > 1 else [
            {"phase": "initial", "item_id": row["item_id"]} for row in state["rubric"]]
        by_id = {r["item_id"]: r for r in state["rubric"]}
        jobs = []
        for phase in ("initial", "recheck"):
            rows = [by_id[entry["item_id"]] for entry in (desired or []) if entry["phase"] == phase]
            rows.sort(key=lambda r: item_order(r["item_id"]))
            # A batch is accepted or rejected atomically, so all members retry together.
            for start in range(0, len(rows), self.config["batch_size"]):
                job = self._job(rows[start:start + self.config["batch_size"]], phase, state, attempt)
                write_json(Path(state["run_dir"]) / "requests" / (job["job_id"] + ".json"), job)
                jobs.append(job)
        return {"attempt": attempt, "jobs": jobs, "pending_jobs": [], "needs_retry": False}

    def grade_batch(self, state):
        job = state["job"]
        cache = self.output / "cache" / "accepted" / (job["request_hash"] + ".json")
        receipt = Path(job["run_dir"]) / "responses" / (job["job_id"] + ".json")
        envelope = None
        if cache.exists():
            try:
                saved = json.loads(cache.read_text(encoding="utf-8"))
                # Reuse is permitted only for the exact complete request hash, never item ID alone.
                candidate = {**saved, "job_id": job["job_id"], "origin_job_id": saved.get("job_id"), "cache_hit": True}
                validate_response(job, candidate)
                envelope = candidate
            except (ValueError, TypeError, KeyError):
                envelope = None
        if envelope is None and receipt.exists():
            try:
                saved = json.loads(receipt.read_text(encoding="utf-8"))
                validate_response(job, saved)
                envelope = saved
            except (ValueError, TypeError, KeyError):
                envelope = None
        if envelope is None:
            try:
                envelope = self.grader(job)
            except Exception as exc:
                # A network failure must not be translated into an educational absence.
                envelope = {"job_id": job["job_id"], "request_hash": job["request_hash"],
                            "status": "error", "error": f"Grader raised {type(exc).__name__}"}
        write_json(receipt, envelope)
        return {"batch_results": {job["job_id"]: envelope}}

    def merge(self, state):
        outcomes = copy.deepcopy(state.get("outcomes", {}))
        errors = list(state.get("errors", []))
        for job in state["jobs"]:
            envelope = state.get("batch_results", {}).get(job["job_id"])
            try:
                judgments = validate_response(job, envelope)
            except (ValueError, TypeError, KeyError) as exc:
                rejection = {"job_id": job["job_id"], "request_hash": job["request_hash"], "reason": str(exc), "attempt": state["attempt"]}
                errors.append(rejection)
                write_json(Path(state["run_dir"]) / "rejected" / (job["job_id"] + ".json"), rejection)
                continue
            accepted = {k: v for k, v in envelope.items() if k not in {"cache_hit", "origin_job_id"}}
            accepted["judgments"] = judgments
            write_json(self.output / "cache" / "accepted" / (job["request_hash"] + ".json"), accepted)
            for judgment in judgments:
                outcomes.setdefault(judgment["item_id"], {})[job["phase"]] = {
                    "judgment": judgment, "scope": job["scope"], "request_hash": job["request_hash"],
                    "response_id": envelope.get("response_id", ""), "returned_model": envelope.get("returned_model", ""),
                }
        return {"outcomes": outcomes, "errors": errors}

    def _needs_recheck(self, initial):
        if self.config["recheck"] == "none":
            return False
        if self.config["recheck"] == "all":
            return True
        return initial["judgment"]["retrieval_uncertain"] or any(
            initial["judgment"][f"{view}_grade"] != "taught" for view in ("notes", "material"))

    def recheck(self, state):
        pending = []
        for row in state["rubric"]:
            result = state.get("outcomes", {}).get(row["item_id"], {})
            if "initial" not in result:
                pending.append({"item_id": row["item_id"], "phase": "initial"})
            elif self._needs_recheck(result["initial"]) and "recheck" not in result:
                pending.append({"item_id": row["item_id"], "phase": "recheck"})
        return {"pending_jobs": pending, "recheck_done": not pending}

    def finish(self, state):
        decisions = {}
        for row in state["rubric"]:
            iid = row["item_id"]
            passes = state.get("outcomes", {}).get(iid, {})
            result = {"item_id": iid}
            initial = passes.get("initial")
            required_recheck = bool(initial and self._needs_recheck(initial))
            final = passes.get("recheck") or initial
            for view in ("notes", "material"):
                grade = "unresolved"
                reason = "No currently valid model response"
                citations = []
                observed = ""
                if final:
                    judgment = final["judgment"]
                    observed = judgment[f"{view}_grade"]
                    citations = judgment[f"{view}_citations"]
                    reason = judgment[f"{view}_reason"]
                    complete = final["scope"][f"{view}_complete"]
                    missing_recheck = required_recheck and "recheck" not in passes
                    conflict = bool(initial and "recheck" in passes and initial["judgment"][f"{view}_grade"] != observed)
                    if missing_recheck:
                        reason = "Required blinded recheck has not returned a valid response"
                    elif conflict:
                        reason = "Initial and blinded recheck disagree; adjudication required"
                    elif judgment["retrieval_uncertain"]:
                        reason = "Grader marked the available context uncertain"
                    elif observed != "taught" and not complete:
                        reason = "Search did not include the entire scanned corpus for this view"
                    else:
                        grade = observed
                result[f"{view}_grade"] = grade
                result[f"{view}_observed"] = observed
                result[f"{view}_reason"] = reason
                result[f"{view}_citations"] = citations
            if result["notes_grade"] in SCORE and result["material_grade"] in SCORE and SCORE[result["material_grade"]] < SCORE[result["notes_grade"]]:
                raise ValueError("Resolved material grade cannot be lower than resolved notes grade")
            result["status"] = "resolved" if all(result[f"{v}_grade"] in SCORE for v in ("notes", "material")) else "needs_review"
            decisions[iid] = result
        pending = bool(state.get("pending_jobs"))
        unresolved = any(d["status"] != "resolved" for d in decisions.values())
        return {"decisions": decisions, "needs_retry": pending,
                "status": "grading" if pending else ("needs_review" if unresolved else "complete")}

    def evaluate(self, state):
        from .evaluation import sample_rows, blinded_rows, sampling_manifest
        from .util import read_csv, write_csv
        rows = [{**row, **state["decisions"][row["item_id"]]} for row in state["rubric"]]
        sample = sample_rows(rows, count=self.config["sample_size"], seed=self.config["sample_seed"])
        blinded = blinded_rows(sample)
        fields = list(blinded[0]) if blinded else ["item_id", "objective", "path", "item_text", "reference_notes_grade", "reference_material_grade", "reason", "evidence_refs"]
        path = Path(state["run_dir"]) / "validation" / "blinded-review.csv"
        if path.exists():
            # A user may have filled the sheet. A deterministic rerun must never
            # replace those reference labels with the empty generated template.
            existing = read_csv(path)
            ids = [row.get("item_id") for row in existing]
            if len(ids) != len(set(ids)) or set(ids) != {row["item_id"] for row in blinded}:
                raise ValueError("Existing review sheet differs from the frozen sample; preserve it and use a separate output directory")
        else:
            write_csv(path, blinded, fields)
        manifest = sampling_manifest(rows, count=self.config["sample_size"], seed=self.config["sample_seed"])
        write_json(path.parent / "sampling-manifest.json", {**manifest, "analysis_id": state["run_id"], "review_status": "not performed"})
        return {"sample_path": str(path)}

    def report(self, state):
        from .reporting import export_reports
        return {"report_paths": export_reports(state, self.output)}


class ReplayGrader:
    """Offline replay of explicit fixture labels, not an automated or LLM grader."""
    def __init__(self, answers):
        self.answers = answers
        self.calls = 0

    def __call__(self, job):
        self.calls += 1
        rows = []
        for item in job["items"]:
            value = self.answers.get(item["item_id"])
            if value is None:
                return {"job_id": job["job_id"], "request_hash": job["request_hash"], "status": "error", "error": "No fixture answer"}
            if "initial" in value:
                value = value.get(job["phase"], value["initial"])
            rows.append(copy.deepcopy(value))
        return {"job_id": job["job_id"], "request_hash": job["request_hash"], "status": "ok", "judgments": rows,
                "response_id": "fixture-" + job["request_hash"][:12], "returned_model": "fixture-replay-not-a-model", "usage": {}}


class FileGrader:
    """Import explicitly authored response envelopes from a separate answers folder."""
    def __init__(self, directory):
        self.directory = Path(directory)

    def __call__(self, job):
        path = self.directory / (job["job_id"] + ".json")
        if not path.exists():
            return {"job_id": job["job_id"], "request_hash": job["request_hash"], "status": "error", "error": "Awaiting supplied answer envelope"}
        return json.loads(path.read_text(encoding="utf-8"))
