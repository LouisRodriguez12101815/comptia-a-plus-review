"""Offline tests: no network, no real YouTube calls."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

from ingest import load_caption_file, load_notes, load_youtube  # noqa: E402
from matcher import load_objectives, match_objectives  # noqa: E402
from report import main, summarize  # noqa: E402

FIXTURE = HERE / "tests" / "fixtures" / "objectives-sample.json"


def write(tmp_path: Path, name: str, text: str) -> Path:
    path = tmp_path / name
    path.write_text(text, encoding="utf-8")
    return path


def test_notes_split_by_heading(tmp_path):
    path = write(tmp_path, "notes.md", "# Intro\nHello there.\n\n## Printers\nLaser uses a fuser.\n")
    chunks = load_notes(path)
    assert [c.label for c in chunks] == ["Intro", "Printers"]
    assert chunks[1].text == "Laser uses a fuser."
    assert all(c.kind == "notes" for c in chunks)


def test_empty_notes_produce_no_chunks(tmp_path):
    path = write(tmp_path, "empty.md", "# Only a heading\n")
    assert load_notes(path) == []


def test_caption_file_is_windowed(tmp_path):
    lines = "\n".join(f"line {n}" for n in range(1, 46))
    chunks = load_caption_file(write(tmp_path, "captions.txt", lines))
    assert len(chunks) == 3
    assert chunks[0].label == "lines 1-20"
    assert chunks[-1].label == "lines 41-45"


def test_youtube_uses_injected_client():
    class FakeClient:
        def fetch(self, video_id, languages=("en",), preserve_formatting=False):
            assert video_id == "abc123"
            assert languages == ("en",)
            return [
                SimpleNamespace(text="Hard drives spin.", start=5.0),
                SimpleNamespace(text="SSDs have no moving parts.", start=9.0),
            ]

    chunks = load_youtube("abc123", client=FakeClient())
    assert len(chunks) == 1
    assert chunks[0].label == "00:00:05 window"
    assert "SSDs have no moving parts." in chunks[0].text


def test_objectives_load_for_one_exam():
    objectives = load_objectives(FIXTURE, "220-1202")
    assert [o.id for o in objectives] == ["1.1", "1.2"]
    assert objectives[0].domain_title == "Operating systems"


def test_unknown_exam_code_is_a_clear_error():
    with pytest.raises(KeyError, match="known codes"):
        load_objectives(FIXTURE, "nope")


def test_matching_finds_the_right_objective(tmp_path):
    objectives = load_objectives(FIXTURE, "220-1202")
    notes = load_notes(
        write(
            tmp_path,
            "os.md",
            "# Operating systems\nExplain common operating-system types and their purposes. "
            "Windows, macOS, Linux and mobile OS types each serve a purpose.\n",
        )
    )
    results = match_objectives(objectives, notes, threshold=70)
    by_id = {r.objective.id: r for r in results}
    assert by_id["1.1"].matches, "objective 1.1 should match the OS notes"
    assert not by_id["1.2"].matches, "objective 1.2 should be a gap"


def test_summary_counts_gaps(tmp_path):
    objectives = load_objectives(FIXTURE, "220-1202")
    results = match_objectives(objectives, [], threshold=70)
    report = summarize(results)
    assert report["covered"] == 0
    assert report["gap_ids"] == ["1.1", "1.2"]


def test_cli_writes_json(tmp_path, capsys):
    notes = write(tmp_path, "n.md", "# Operating systems\nExplain common operating-system types and their purposes.\n")
    out = tmp_path / "report.json"
    code = main(
        ["--exam", "220-1202", "--objectives", str(FIXTURE), "--notes", str(notes), "--json", str(out)]
    )
    assert code == 0
    data = json.loads(out.read_text(encoding="utf-8"))
    assert data["objectives"] == 2
    assert "Objectives: 2" in capsys.readouterr().out


def test_cli_needs_a_source(capsys):
    assert main(["--exam", "220-1202", "--objectives", str(FIXTURE)]) == 2
    assert "Give at least one source" in capsys.readouterr().err
