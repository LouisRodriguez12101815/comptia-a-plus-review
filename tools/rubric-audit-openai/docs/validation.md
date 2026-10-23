# Verification record and remaining gates

This record distinguishes executed checks from implementation that still requires its actual runtime. Nothing here measures real certification coverage or grader accuracy.

## Executed checks

Runtime: Python 3.12.14, standard-library execution of the new standalone package.

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
```

**75 tests discovered: 69 passed, 6 skipped, 0 failed.** The complete console record is in [test-results.txt](test-results.txt).

| Test file | Passed | Skipped | Scope |
| --- | ---: | ---: | --- |
| `test_inputs.py` | 17 | 0 | Legacy CSV/domain compatibility, hierarchy/weights, evidence extraction, source locators, source scope, invalid inputs and path traversal. |
| `test_provider.py` | 11 | 0 | Real adapter logic with injected fake clients: strict request schema, blinding, refusal/incomplete/error handling, metadata, invalid JSON. |
| `test_evaluation.py` | 8 | 0 | Reproducible sampling, excluded population counts, blinded fields, exact ID sets, synthetic agreement calculations. |
| `test_graph.py` | 14 | 3 | Reference routing, immutable worker IDs, deterministic fan-in, bounded retry, terminal needs-review handling; real runtime tests skipped. |
| `test_pipeline.py` | 19 | 0 | End-to-end reference execution, reporting, cache invalidation, complete-batch rejection, unresolved denominators, both recheck disagreement directions, citation checks, note retrieval ordering, preservation of human annotations and verified manifests. |
| `test_langgraph_pipeline.py` | 0 | 3 | Actual SQLite/LangGraph execution, fresh-thread cached rerun, completed resume, and interrupted recovery; all skipped here. |
| **Total** | **69** | **6** | |

The tests use original synthetic data. They did not execute the legacy repository or contact a language model.

## Independent rerun check

The final source was also run twice through the CLI in a fresh temporary output directory:

```bash
python3 -m rubric_audit_openai demo --out /temporary/output
python3 -m rubric_audit_openai demo --out /temporary/output
```

Both runs completed using the **sequential reference executor**. The first made **2 explicit fixture calls**. The second made **0 fixture calls**. Both made **0 live model calls**. The analysis ID was `oa-7c0fa5270fa99ebc0a5e` on both runs.

| Output | Bytes | Byte-identical on cached rerun |
| --- | ---: | --- |
| `grades.csv` | 1,234 | Yes |
| `summary.csv` | 492 | Yes |
| `todo.csv` | 351 | Yes |
| `history.csv` | 547 | Yes |

[verification.json](../examples/demo/verification.json) records the SHA-256 hashes. The corresponding CSVs and a clearly labelled synthetic heatmap are in `examples/demo/`.

This proves deterministic export and cache behavior for this fixture through the reference executor. It does **not** prove real LangGraph execution, provider determinism, or byte equivalence to the historical Claude CSVs. The OpenAI version has a different assessment identity and uncertainty-aware schema. Fresh model calls can change the labels; cached export determinism is a narrower guarantee.

## Workflow page checks

`docs/workflow.html` is self-contained with no external asset loads. Static checks covered JavaScript syntax, SVG XML, unique IDs, simulated route completion, bounded navigation, reset, selected-stage state, and SVG Space-key interaction through a minimal DOM stub. Browser rendering and screen-reader behavior were not exercised because a browser binary was unavailable. The page labels its walkthroughs as simulations and displays no new certification scores.

## What remains unverified

1. **Real LangGraph and SQLite operation.** LangGraph, `langgraph-checkpoint-sqlite`, and the OpenAI SDK were unavailable, and installation failed through the configured proxy. The six runtime tests deliberately skip rather than substituting a fake implementation. Install the extras in an authorized environment, rerun the suite, and confirm these tests execute.
2. **Live OpenAI operation and selected-model compatibility.** Provider tests injected fake responses. There were no live requests, no checked API-project model access, and no billing/latency measurements. Choose a model with the required API features and run a small inspected pilot before a full assessment.
3. **Legacy reproduction.** The old code was inspected read-only through the authorized GitHub connector. Its 16-test suite and `run.py finish` were not executed. The historical CSVs were not compared byte for byte with a rerun. The stated old coverage percentages remain unvalidated here.
4. **Official PDF wording.** The new tool imports the CSV and verifies structure. It does not independently compare that text to the official PDF. A prior handoff assertion of zero differences is not a fresh verification.
5. **Real source extraction and complete corpus coverage.** The adapters were checked against supported schemas and synthetic fixtures, not an executed checkout of the entire study site. Dynamic visuals, images without text, undiscovered content, and unexported drills/labs/PBQs remain limitations. Inspect the generated inventory on the real source snapshot.
6. **Semantic grading quality.** Request/citation validation cannot establish that the quoted text teaches the objective. The reference review has not been performed. There is no measured agreement, accuracy, or error rate.

## Release gate for a real assessment

Keep these checks separate from the offline evidence above:

1. Obtain the authorized local source snapshot and confirm the intended official rubric/version.
2. Install `.[live]`, run the full suite, and require the real runtime tests to execute successfully.
3. Run the synthetic demo through `--engine langgraph` twice and compare its CSV bytes.
4. Use the chosen OpenAI model on a small batch, inspect the model-visible evidence and returned citations, and check source inventory limitations.
5. Run the independent assessment. Any incomplete or disputed rows must remain unresolved.
6. Complete the blinded reference sample, compute agreement, and inspect disagreements before treating the coverage index as reliable enough for study prioritization.

No repository commit, push, publication, or site-content edit is part of this package or this verification record.
