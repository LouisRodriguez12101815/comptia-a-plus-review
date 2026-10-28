"""Run this first. It checks the three habits: .venv active, dependencies installed, no file named after a standard library module."""

import sys
from pathlib import Path

here = Path(__file__).resolve().parent
problems = []

if ".venv" not in sys.executable:
    problems.append("the venv is not active: run  source .venv/bin/activate")

try:
    import langgraph  # noqa: F401
except ImportError:
    problems.append("langgraph is missing: run  python -m pip install -r requirements.txt")

clashes = [p.name for p in here.glob("*.py") if p.stem in sys.stdlib_module_names]
if clashes:
    problems.append(f"rename these files, they hide standard library modules: {', '.join(clashes)}")

print("python:", sys.executable)
if problems:
    for problem in problems:
        print("FAIL:", problem)
    sys.exit(1)
print("OK: venv active, langgraph installed, no shadowing files")
