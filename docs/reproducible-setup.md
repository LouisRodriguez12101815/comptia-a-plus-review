# Reproducible setup

Two projects live in this repo. Each one can be rebuilt from its lock or pin files.

## The study site (Node)

```bash
npm ci          # installs exactly the versions in package-lock.json
npm run dev
```

Use `npm ci`, not `npm install`, so the lockfile is not changed.

## The agent starter (Python)

Folder: `agent-starter/`. Python version: `.python-version` (3.13).

```bash
cd agent-starter
python3 -m venv .venv                      # create the environment inside the project
source .venv/bin/activate                  # activate it (prompt shows (.venv))
python -m pip install -r requirements.txt  # install the pinned versions
python check_env.py                        # checks venv, dependencies and file names
python main.py                             # runs three sample leads
```

Expected output of `main.py`:

```
Lead A: valid; sales
Lead B: invalid; missing email
Lead C: valid; support
```

### Habits

1. **`.venv` inside the project, never committed.** It is listed in `.gitignore`.
2. **Install with `python -m pip`.** This uses the pip that belongs to the active interpreter.
3. **Never name a file after a library you import.** A file called `random.py` hides the standard library module. `check_env.py` flags these.

### Updating dependencies

```bash
source .venv/bin/activate
python -m pip install --upgrade langgraph
python -m pip freeze > requirements.txt
```

Commit the new `requirements.txt` with the code that needs it.
