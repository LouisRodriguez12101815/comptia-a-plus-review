# Synthetic report example

`demo/` contains the output of an executed four-item fixture and its cached rerun. **It is not CompTIA coverage and no language model produced these labels.** The fixture makes the difference between notes and all scanned material visible without borrowing certification objective text.

Open `demo/coverage.html` to inspect the generated heatmap. The complete code to reproduce the inputs and answers is `rubric_audit_openai/demo.py`.

Run from the project root:

```bash
python3 -m rubric_audit_openai demo --out ../openai-demo-output
```

`demo/verification.json` records the actual SHA-256 hashes from the two-run comparison. The archived example includes only report artifacts; a fresh run creates the full requests, receipts, evidence, cache, review template, and manifest.
