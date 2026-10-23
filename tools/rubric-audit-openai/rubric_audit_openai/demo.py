"""Small, wholly synthetic fixture. It is never presented as exam evidence."""
from pathlib import Path

from .util import write_csv, write_json, write_jsonl


def write_demo(directory):
    directory = Path(directory)
    fields = ["exam", "domain", "domain_weight", "objective", "objective_title", "item_id", "level", "parent_id", "item_text", "path"]
    specs = [("1", "1.1", "1.1.01", "Source versions"), ("1", "1.1", "1.1.02", "Restore checks"),
             ("2", "2.1", "2.1.01", "Review receipt"), ("2", "2.1", "2.1.02", "Simulated handoff")]
    rows = [{"exam": "DEMO", "domain": d, "domain_weight": "50", "objective": o,
             "objective_title": "Synthetic workflow example " + o, "item_id": iid, "level": "1", "parent_id": "", "item_text": term, "path": term}
            for d, o, iid, term in specs]
    evidence = [
        {"evidence_id": "note:demo/versions", "source_type": "note", "source_path": "synthetic-notes.txt", "locator": "versions", "text": "Source versions identify which saved content a review examined.", "objectives": ["1.1"]},
        {"evidence_id": "note:demo/restore", "source_type": "note", "source_path": "synthetic-notes.txt", "locator": "restore", "text": "Restore checks", "objectives": ["1.1"]},
        {"evidence_id": "card:demo/restore", "source_type": "card", "source_path": "synthetic-cards.json", "locator": "/restore", "text": "Restore checks confirm that a saved practice file can be opened again.", "objectives": ["1.1"]},
        {"evidence_id": "question:demo/receipt", "source_type": "question", "source_path": "synthetic-questions.json", "locator": "/receipt", "text": "A review receipt records which request produced an assessment answer.", "objectives": ["2.1"]},
    ]
    def citation(eid, quote):
        return [{"evidence_id": eid, "quote": quote}]
    def judgment(iid, ng, mg, nc, mc, nr, mr):
        return {"item_id": iid, "notes_grade": ng, "material_grade": mg, "notes_citations": nc, "material_citations": mc,
                "notes_reason": nr, "material_reason": mr, "retrieval_uncertain": False}
    answers = {
        "1.1.01": judgment("1.1.01", "taught", "taught", citation(evidence[0]["evidence_id"], evidence[0]["text"]), citation(evidence[0]["evidence_id"], evidence[0]["text"]), "The note explains why source versions identify reviewed content.", "The source-version note explains the function of the record."),
        "1.1.02": judgment("1.1.02", "mentioned", "taught", citation(evidence[1]["evidence_id"], evidence[1]["text"]), citation(evidence[2]["evidence_id"], evidence[2]["text"]), "Restore checks appear only as a bare note heading.", "The card defines restore checks as reopening a saved practice file."),
        "2.1.01": judgment("2.1.01", "absent", "taught", [], citation(evidence[3]["evidence_id"], evidence[3]["text"]), "Neither synthetic note describes a review receipt.", "The question explanation defines the request-to-answer record."),
        "2.1.02": judgment("2.1.02", "absent", "absent", [], [], "The synthetic notes do not discuss a simulated handoff.", "None of the four synthetic evidence units describes a simulated handoff."),
    }
    write_csv(directory / "rubric.csv", rows, fields)
    write_jsonl(directory / "evidence.jsonl", evidence)
    write_json(directory / "answers.json", answers)
    return {"rubric": str(directory / "rubric.csv"), "evidence": str(directory / "evidence.jsonl"), "answers": answers}
