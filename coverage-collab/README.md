# Coverage collab (first pass)

Compares your study sources (Markdown notes, PDFs with a text layer, YouTube captions or saved caption files) with the objectives in `content/objectives.json` and reports which objectives have support and which are gaps.

This is a first pass. It uses fuzzy word matching, so treat a "covered" result as a lead to read, not proof. It never edits the site content.

## Set up (Mac)

From the repository root:

```bash
cd coverage-collab
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
```

`requirements.txt` pins the runtime packages. `requirements-dev.txt` adds pytest.

## Run the tests

```bash
python -m pytest
```

The tests run offline. The YouTube path is tested with a fake client.

## Make a report

```bash
python report.py --exam 220-1202 --notes ../content/core2-notes.md
python report.py --exam clf-c02 --pdf ~/Downloads/my-notes.pdf --json clf-report.json
python report.py --exam 220-1202 --youtube dQw4w9WgXcQ --threshold 65
python report.py --exam 220-1202 --caption-file captions.txt
```

Flags can repeat. `--threshold` is the minimum score from 0 to 100 (default 70). `--json` writes the full result.

## Files

- `ingest.py` loads sources into chunks (notes split by heading, PDF pages, caption windows).
- `matcher.py` reads objectives and scores chunks with RapidFuzz `token_set_ratio`.
- `report.py` is the command-line entry point.
- `tests/` holds offline pytest tests and a small objectives fixture.

## Limits

- YouTube captions need the video to have captions. Some videos block caption access; the script then fails with the library's error.
- Scanned PDFs without a text layer return no text. OCR is out of scope for this pass.
- Fuzzy matching finds shared wording. A chunk can be relevant and still score low; lower `--threshold` and read the matches.
- Do not use this to copy third-party exam dump material into the site. Use it to see where your own notes and sources are thin.
