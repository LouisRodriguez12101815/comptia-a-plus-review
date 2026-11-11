# Python Class 12 — Modules (short clip)

**Recording:** "Python Class 12" video | **Runtime:** ~2 minutes | **Content type:** post-class chat fragment, not a lesson

## Context — where this class fits

The Class 12 upload in this set is only about two minutes of end-of-class conversation — it contains no lesson instruction. Per the course structure (visible from Class 15's "nothing is new" recap), Class 12's actual topic was **modules**: `import` statements, using standard-library modules like `pathlib`, and writing/importing your own `.py` files. The full Class 12 lesson recording was not included in this upload batch.

## What the clip does cover

The two minutes are instructor and students wrapping up a session: confirming everyone has access to classroom materials and recordings, pointing to the WhatsApp channel for questions between sessions, and general logistics. No Python concepts are taught in this fragment.

## Key concepts (from the course arc, not this clip)

Because Class 15 leans directly on Class 12 material, here is the module content the course expects you to have:

```python
import pandas as pd        # third-party module, imported with an alias
from pathlib import Path   # one specific name from the standard library

# Your own file, e.g. validate.py, holding your functions:
from validate import check_amounts   # import from your own module
```

- A **module** is any `.py` file. Importing it gives you its functions and constants.
- **Standard library** modules (`pathlib`, `json`, `csv`) ship with Python; third-party modules (`pandas`, `numpy`) are installed with `pip`.
- Splitting a growing capstone script into modules keeps each file small and testable — by Class 15 the pipeline imports its own validation helpers this way.

## Capstone relevance

When the capstone website work reaches the point where a Python script (data pipeline, scoring script, content generator) grows past one screen, split it into modules the same way the course does: one file for loading/cleaning, one for validation, one for reporting. Importing your own module also makes the functions unit-testable in isolation.

## Related notes

- Class 15 (`class-15-capstone-agent.md`) shows `import pandas as pd` and `from pathlib import Path` in the working pipeline.
- The repo's `docs/python-class-catchup.md` tracks which classes are implemented in the site's games.
