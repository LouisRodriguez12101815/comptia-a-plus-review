# Python Class 15 — Capstone: Data Analysis to a Working Agent

**Recording:** Class 15 video | **Runtime:** ~120 min | **Instructor:** Ameya (TA/lead; main instructor dropped in briefly at the end)

## Context — where this class fits

This is the final class of the Python fundamentals course. Every class since Class 8 built one piece of tonight: functions (8), exceptions (10), strings (9), modules (12), NumPy (13), and pandas (14). Class 15 assembles them into a single 7-step pipeline that turns a messy retail CSV into a grounded report and a safe agent. Nothing new is introduced — the skill is composition: putting known pieces in the right order, with tests. The course next moves into machine learning, where this pipeline is "the first half of every ML project."

## Key concepts

### The 7-step pipeline (the map for the whole night)

Load → inspect → clean → validate → aggregate → report → suggest. Two structural points the instructor stressed:

- **The agent is step 7 and it only suggests.** Steps 1–6 are deterministic Python that produce the same answer every time. An agent that says "Denver is the top city because the groupby said so" is **grounded**; an agent without that deterministic pipeline underneath is guessing.
- **Validate comes after clean, not before.** You can't count invalid amounts until you've tried to convert them to numbers. Clean first, count what failed, then decide what to do with the failures — you can't compute with invalid numbers.

### Where each piece came from (the "nothing is new" slide)

- **Loops** — walking through rows (the first thing learned)
- **Functions (Class 8)** — `report_sales(path) -> text`
- **Exceptions (Class 10)** — `try`/`except` around missing files and bad columns
- **Modules (Class 12)** — `import pandas as pd`, `pathlib`, plus writing/importing your own module
- **NumPy (Class 13)** — hidden inside pandas: every column is an array underneath, which is why `sum` and `idxmax` are fast
- **Pandas (Class 14)** — `read_csv`, `to_numeric`, `groupby`

The whole pipeline is one function of about 25 lines, and every line is something run in a previous class. What's new is the order and the tests. (TS parallel: this is like composing small utilities into a `pipeline()` function in TypeScript rather than a one-off script.)

### The messy CSV — Cedar and Company

Six orders, columns: `order_id, product, city, amount, order_date`. Four kinds of mess, all visible at once:

- `$45` — dollar sign in the amount
- blank amount — row 3 has two commas in a row where the amount should be
- `abc` — a word where a number should be (row 6)
- `austin` lowercase vs `Austin` — inconsistent capitalization
- (headers) stray spaces — the try-it adds a trailing-space header

It's small on purpose so every number can be checked by hand. Hand predictions before touching code: **Austin 45, Boston 22, Denver 110.5 (30 + 80.5), 2 invalid rows** (the blank and `abc`). If the code gets those numbers, it's right.

Try-it: add a seventh row with a trailing-space city and an amount with a comma in it, write to a *different* file so `sales.csv` stays the clean class copy.

### Cleaning: three operations in a fixed order

```python
amounts = df["amount"].astype(str)                      # 1. everything to string first
amounts = amounts.str.replace("$", "", regex=False)     # 2. strip the formatting
amounts = pd.to_numeric(amounts, errors="coerce")       # 3. convert; bad values become NaN
bad = amounts.isna().sum()                              # count what failed -> 2
cities = df["city"].str.strip().str.title()             # austin -> Austin
```

- **Order matters:** replace before convert. Convert first and `$45` isn't a number → NaN → you've thrown away a real sale. Strip formatting, convert, then count what's left over.
- **`astype(str)` before `.str.replace`** — pandas read the blank as NaN, and NaN is a float, not a string. `.str.replace` only runs on strings and a column with one float in it errors. `astype(str)` turns NaN into the four letters `"nan"`, replace runs cleanly, then `to_numeric` turns the letters back into a real NaN. "A small dance" — and bug #1 on the debugging checklist.
- **Why NaN and not 0 for a blank?** A blank means *unknown*; zero means *known to be nothing*. Blank→0 keeps Austin's total at 45 but makes the average order 22.5 instead of 45 — a wrong number that *looks* right and propagates downstream. NaN says "unknown" and stays out of the math until you decide.
- **Skip the city cleanup and** `groupby` splits Austin into two rows with two totals — the top-city answer can come out wrong. Rule of thumb: **strip and title before you group, always.**

```ts
// TS equivalents
s.trim();                          // Python str.strip()
s.toLowerCase();                   // Python str.lower()
s.replaceAll("$", "");             // Python str.replace("$", "", regex=False)
String(x);                         // Python astype(str)
Number("abc");                     // -> NaN, like to_numeric(errors="coerce")
arr.filter(v => Number.isNaN(v)).length;  // Python isna().sum()
```

### Challenge 1 — load and inspect

Read `sales.csv`, print shape, columns, dtypes, head (about five lines):

```python
import pandas as pd
df = pd.read_csv("sales.csv")
print(df.shape)        # (6, 5)
print(df.columns)      # 5 names, spelled exactly as the header
print(df.dtypes)       # order_id int64; the rest object (text)
print(df.head())       # first 5 of 6 rows
```

- The dollar signs and `abc` force pandas to keep the whole `amount` column as `object` (text). One bad cell poisons the column's type.
- Row 3's blank is already NaN — pandas read it as missing on the way in. That's the *other* kind of missing (just nothing, not bad text); both end up NaN and both count as invalid.
- **Head can lie to you:** amounts print right-aligned like numbers, and `$45` looks like a number with a sign. It's a 5-character string. Pandas prints strings and numbers the same way in a table — you can't tell type by looking at head; you tell from `dtypes`. Head shows you the values, dtype tells you what they are, and the two can disagree.
- `df.info()` shows `amount` with 5 non-null of 6 → the blank.

```ts
// TS parallel: there's no dtypes — typeof per value; JSON columns are "stringly typed"
// the same way. Inspect, don't assume.
```

### Challenge 2 — clean the amounts

The flow: `.astype(str)` → `.str.replace("$", "", regex=False)` → `pd.to_numeric(errors="coerce")` → `bad = .isna().sum()`. Before: `$45`, blank, `abc`. After: `45.0` with two NaNs; dtype `float64`. Rows 3 and 6 are the invalid ones.

Key principles:

- **The two values that couldn't be numbers are marked, not deleted.** Nothing is dropped yet; the count (2) lives in a variable called `bad`.
- **A report that says "Boston made $22" is true; "Boston made $22 and one Boston order had an unreadable amount" is useful.** In ETL/error reporting, everything filtered must be recorded somewhere. (Extreme edge case: sensor data at millions of rows may justify something more creative.)
- Try-it: print the invalid *rows* themselves, not just the count — order 3 (mug, austin) and order 6 (lamp, Boston). In a real pipeline you'd write those to a file for someone to fix at the source. **The count tells you how bad; the rows tell you where.**

### Challenge 3 — clean the cities, find the top city

```python
cities = df["city"].str.strip().str.title()
by_city = df.groupby(cities)["amount"].sum()   # Austin 45, Boston 22, Denver 110.5
top_city = by_city.idxmax()                    # Denver
```

- `str.strip()` removes the spaces; `str.title()` capitalizes the first letter and lowercases the rest.
- **`idxmax` returns the name (which city); `max` returns the number (how much).** The business question was "which city?" — print `max` and you've answered a completely different question.
- **Sum skips NaN by default.** Austin is 45, not 45 + NaN. Convenient — and exactly why you must count invalid rows separately: the total looks clean even with orders silently left out. That's why the invalid count gets its own line in the report.
- Try-it: group the *raw* city column and you get four rows — Austin 45, Boston 22, Denver 110.5, and a second lowercase `austin` at 0 (its amount happens to be invalid). With real data you'd split real revenue between two spellings of one city and `idxmax` could pick the wrong winner.

### Challenge 4 — wrap it in a reusable function

```python
def revenue_by_city(path):
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip().str.lower()   # normalize headers ONCE, up front
    amounts = pd.to_numeric(
        df["amount"].astype(str).str.replace("$", "", regex=False),
        errors="coerce",
    )
    cities = df["city"].str.strip().str.title()
    return df.groupby(cities)[amounts.name or "amount"].sum()
```

- Same function, zero edits, on the week-2 file: Austin 95, Boston 60, Denver 15. Different data, different totals — that's reusability. A function with the path as a parameter is the only version you can run on next week's file without touching it. (Hard-coded scripts "work once but need editing every week — and rerunning cells by hand with pasted file names is how you get last week's variable by mistake.")
- **It returns a Series; it doesn't print, doesn't find the top city, doesn't count invalid rows. One job.** Small functions that do one thing get tested individually and composed into bigger ones — if something breaks inside one giant function where everything depends on everything, it's much harder to debug.
- **A function that prints is hard to test** (you'd have to capture the screen); a function that returns is easy — call it, compare the result. Every function tonight returns; printing happens in the cells that call them. That habit is what lets asserts check return values directly.
- Try-it: return both the Series and the top city as a pair — two return values in one call, one line, because `revenue_by_city` already exists. **Build the small piece, then build on top of it.**

```ts
// TS parallel: pure function in, value out — no console.log side effects.
// Same reason Vitest tests `expect(revenueByCity(path))` instead of spying on console.
```

### Failure case — KeyError and header normalization

Change the header to `" Amount "` (capital + spaces) and `df["amount"]` throws `KeyError: 'amount'` — the exact column label wasn't found. Three steps: break → diagnose (read the error, print `df.columns`, see the ugly label) → fix by normalizing:

```python
df.columns = df.columns.str.strip().str.lower()
```

- You won't see these spaces in a spreadsheet. One line after `read_csv`, before anything touches a column, and the KeyError is gone — same file, `amount` prints 45.
- **The fix isn't typing `" Amount "` in your code to match this week's file** (next week it'll be lowercase again). **Fix the class of the bug, not the individual instance.**
- Normalize at **every entry point** — `revenue_by_city`, `report_sales`, and the LangGraph validate node all do it. Nothing downstream ever sees a capital letter or stray space in a header. (SQL parallel: this is the first cleaning step before data enters any pipeline.)
- Try-it: a file where every header is wrong in a *different* way — capitals, trailing spaces, underscores in odd places — and one normalize line fixes all five at once. That's the payoff of normalizing the whole `columns` list instead of renaming one column at a time.

### `report_sales(path) -> text` — the full report function

```python
def report_sales(path):
    try:
        df = pd.read_csv(path)
    except FileNotFoundError:
        return f"File not found: {path}"
    for col in ["amount", "city", "order_date"]:      # guard: check every column
        if col not in df.columns:                      # the function NEEDS
            return f"Missing column: {col}"
    df.columns = df.columns.str.strip().str.lower()
    # clean the amount, clean the city, count the invalid, drop the invalid rows
    ...
    if df.empty:
        return f"No valid amounts in file ({bad} invalid rows)"
    by_city = ...   # groupby sum
    # return text: one line per city (1 decimal), top city from idxmax,
    # invalid count, date range earliest->latest valid order
```

- **Every bad path returns a readable string, not a crash.** The function sits inside an agent that has to say something sensible — "File not found" is a message a mock agent can show a person; a traceback is not.
- **Error messages are designed to be read by the next step:** the mock agent checks whether the text starts with `File` or `Missing` and passes it straight through instead of adding a recommendation.
- **Validate only what you need, not everything you can think of.** The loop checks `amount`, `city`, `order_date` — not `order_id`/`product`, which the report doesn't use. If next week's export drops `product`, the report still runs; if it drops `amount`, the report says so in two words.
- **Date range says Oct 26–30 but the file goes to the 31st — not a bug.** The 31st order had amount `abc` and was dropped as invalid; the date range describes the orders actually in the totals. If the report said the 31st, it would be claiming a day that didn't count. **State the period the numbers cover and say what you dropped.**
- Try-it: call `report_sales`, then append an average-order line to its text — **composition: you don't rewrite the function to add a line, you wrap it.**

### Expected outputs and the test suite

Four tests, run in order, paste the output as evidence:

```python
good = report_sales("sales.csv")
assert "Top city: Denver" in good and "Invalid rows: 2" in good and "110.5" in good

assert report_sales("nope.csv").startswith("File not found")
assert report_sales("no_city.csv") == "Missing column: city"
assert report_sales("empty_amounts.csv").startswith("No valid amounts")
```

- **Three of the four tests are failure cases — deliberate.** "A function that works on a good file is a demo. A function you can see handle the wrong path, wrong columns, and an empty file is a tool." Always test edge cases to find where your function breaks.
- The asserts are **claims the function makes**: if you change the function tomorrow and rerun the cell, any claim that stops being true is flagged by name. That's the test log the deliverable asks for (submit it as the screenshot).
- Fifth test (try-it): the bad-header file from the KeyError slide now *passes* — the normalize line makes the KeyError impossible inside the function, and `assert "Top city: Austin"` proves it.
- **Why write tests yourself when LLMs write code? LLMs are prone to sycophancy — they believe their own work, they're confidently wrong, they ignore edge cases and keep going.** They don't know what they did wrong; your tests do.

### Debugging checklist (the four classic bugs)

1. Missing `.astype(str)` → column isn't all strings → the `.str` accessor errors.
2. Dollar-sign replace without `regex=False` → in regex, `$` means end-of-line, so **nothing gets replaced** (amount stays text, sum is 0).
3. Grouping before cleaning → Austin splits into two rows.
4. `idxmax` on a column that's still `object` → there's no maximum to find (text has no max).

**Three-step way to use an AI when stuck:** (1) inspect your attempt — find the line and output that failed; (2) paste the error *and* the code, ask for a line-by-line explanation; (3) **verify the fix — compare the AI's version with yours before accepting it, then rerun your tests.** People skip the last step; don't. The tests are how you know the AI's fix is an actual fix. The class notebook is the answer key: each bug maps to a slide/cell.

### Money and precision — why `Decimal` exists

Binary floats can't represent most decimal fractions exactly, so arithmetic is approximate:

```python
0.1 + 0.2                       # 0.30000000000000004
Decimal("0.1") + Decimal("0.2") # Decimal("0.3") — exact
# integer cents: 4500 + 3000 + ... = 17750 — always exact
```

- The cell shows all three for tonight's four valid amounts: float is wrong in the 16th decimal (`== 0.3` is False), Decimal is exactly 0.3 (True), integer cents sum to exactly 17,750.
- **Why not Decimal tonight?** Pandas works in floats, and for a report saying "Denver made 110.5" a float is fine — an error in the 16th digit doesn't matter for a summary. But in a finance system where a ledger must balance to zero, 10,000 of these errors can add up to a cent that isn't there, and the reconciliation throws.
- **Rule of thumb: anything that must balance to zero — use `Decimal` or whole cents as integers.** Any tool that *touches* money (rather than just reporting on it) especially.
- **The trap: construct Decimal from strings, never from floats.** `Decimal(0.1)` carries the float's error with it (prints a 50-digit mess); `Decimal("0.1")` prints 0.1.

```ts
// TS parallel: 0.1 + 0.2 === 0.30000000000000004 in JS too.
// Use integer cents or a decimal library (decimal.js / BigInt) for money.
```

### The capstone brief — four boxes

Build a weekly retail sales agent, or adapt the pipeline to your own app:

1. **Input** — a CSV loaded and validated by our own code.
2. **Grounded output** — revenue per city, best city, invalid row count, date range, one recommendation. `report_sales` already gives four of the five; the recommendation is the mock agent's job.
3. **Evidence boundary** — never invent facts. Every sentence traces to a number the code calculated. If the agent says Denver, it's because `idxmax` said Denver, not because the agent *thinks* Denver.
4. **Approval boundary** — no external writes without human approval. The agent can draft an email, Slack post, or recommendation, but it must not send any of it. A person reads the draft and the evidence, then says yes or no.

Three starter notebooks from Tuesday (Leads, Fitness, E-commerce) are this same pipeline with different column names, each with a walkthrough guide.

### The same pipeline as a LangFlow canvas

Read left to right: upload CSV → **Python tool** (paste the `report_sales` function into the Python component) → optional **LLM summary grounded in the tool output** → **human review**.

- "Grounded" means the LLM only *receives* computed numbers — it doesn't do the computation.
- Give the LLM guardrails beyond "write two sentences, nothing else": structured sentence templates it fills in the blanks of. **Watch for prompt injection attacks** — the instructor flagged this after "three weeks of hell in cybersecurity."
- No paid model? Skip the LLM and use the template summary — that's exactly the mock agent. The recommendation is a fixed sentence that quotes the computed numbers. Without an LLM the sentence is plainer; the numbers are identical.
- **The model is optional. Evidence and approval are not.**

### The agent in code — LangGraph

Same pipeline as a graph. State has five fields: `path`, `df`, `stats`, `error`, `report`. Nodes: `load`, `validate`, `analyze`, `report` → `end`.

- **The state carries data between nodes; each node only returns what it changes.** Initialize `error` to `""`.
- **The empty string is the whole routing trick:** `""` is falsey, a message is truthy. The router is four lines and used three times:

```python
def route(state):
    return "end" if state["error"] else "analyze"
```

- After `load`, an error means file-not-found → end. After `validate`, a missing column → end. After `analyze`, no valid amounts → end. Otherwise continue. Same outcomes as `report_sales`, but **the routing is visible in the graph structure instead of hidden in return statements.**
- **Bound the run:** pass `recursion_limit=5` to `invoke`. Ours takes at most 4 nodes, so the limit never fires — but you put it there so a future edit can't accidentally create an endless loop. **Enforcing limits matters because compute isn't free:** the instructor's friend wrote a SQL query that just kept going and cost his company a few thousand dollars in AWS bills.
- Tracing the four files: `nope.csv` → load sets error → router → end; validate/analyze/report never ran. No-city file → load OK, validate sets error → end. Empty-amounts file → load and validate pass, analyze sets error → end. Only the good file ran all four nodes. **A node that fails stops everything downstream — nothing runs on bad data.**
- Compare to a plain script: the groupby on a missing column gives you a traceback from inside pandas; here the validate node catches it in plain words and the graph ends. Same four tests apply unchanged. Try-it: point the graph at the week-2 file — no code changes. Reusability, applied to the entire agent.

```ts
// TS parallel: the state is a reducer's accumulator; the router is a switch
// on state.error returning "end" | "analyze". recursion_limit = a max-iterations guard.
```

### Zero-cost fallback — the mock agent

```python
def mock_agent(path):
    stats = report_sales(path)
    if stats.startswith("File") or stats.startswith("Missing"):
        return stats                      # an error is the whole answer
    return stats + "\nRecommendation: promote the top city..."  # quotes the numbers
```

- **It drafts text; it does not send anything.** It prints a yes/no question but does not read the answer — and even if it did, sending would be a separate step a person triggers. **The question is the draft of the decision, not the decision itself.** An approval question is definitely not permission to perform an external write. The instructor: agent swarms are getting better by the day, and cybersecurity is now intrinsically part of coding — put a stop before external writes.
- Reading it as an agent: **an agent is a loop of observe → decide → act.** Observe = `report_sales` looked at the file. Decide = is there an error; if not, what to recommend. Act = draft text ending in a question. Add a model and the decision gets smarter and the text gets nicer, but **the shape doesn't change, and neither does the stop-before-sending.**
- Try-it: pull the top city out of the report and write "next week's promotion in Denver." Still a template, still fully grounded — just more useful. **Direction for your own version: more computed evidence in the sentence, the better. Never write a sentence the evidence doesn't support.**
- Industry note: companies (Apple, Microsoft — a friend there) are cutting back on raw AI use; managers check that engineers use LLMs to *write functions*, not "do this whole task for me."

### Deliverables and evidence

Four deliverables, produced by the last two cells:

1. **Code file** — `report_sales` + the agent, written into `sales_agent.py` (the Class 12 write-a-file pattern).
2. **Test log** — good file / wrong path / missing column / empty amounts.
3. **Sample output** — city revenue, best city, invalid count, date range, recommendation.
4. **Safety statement** — one line, in your own words, naming what the agent must never do without approval. Sales agent: *send*. CRM agent: *update a record*. Fitness agent: *message a member*.

The second cell *imports* `sales_agent.py` and prints the test log, sample output, and safety statement — the import proves the file works on its own, outside the cells that built it (the Class 12 import test). A notebook is where you build and test; **a `.py` file is what you hand to someone** (or load into LangFlow). Small hygiene note: the write-file cell never printed a "file written ✓" confirmation — mildly useful, worth the habit.

### Student demo — the fitness agent

A classmate walked through the fitness starter notebook: reads `workouts.csv`, groups by member, flags sessions of 50+ minutes, and a person reviews before anything happens. Four tests pass (mock file, missing-line fallback, missing column, and a threshold that flags nothing). `load_workout` raises `ValueError` naming the missing column, and `analyze_workout` deliberately *lets* a bad schema through loud instead of silently working around it. The LangGraph version runs load → clean → analyze → stop and waits for human review. Stated improvement (starter cells provided): **streak logic** — sort by member and date, find consecutive days, instead of only flagging long sessions.

### Course quiz (the wrap-up game)

- **Correct order:** `read_csv` → `head` → `info` → clean → `groupby("city").sum()`. You can't decide how to clean until you've looked, and you can't sum until you've cleaned — each step consumes the previous step's output.
- **`amount` loaded as object because of dollar signs — what before summing?** Strip the `$` and convert to float. Summing text doesn't work; deleting the column throws away the sales; renaming changes nothing inside it.
- **Which expression answers "which city had the most revenue"?** `df.groupby("city")["amount"].sum().idxmax()` → Denver. `city.max()` gives the alphabetically-last city; `amount.max()` gives the biggest single *order*, not the biggest city; sorting by city just reorders rows.
- **Same report every week on a fresh file — why the function?** `revenue_by_city(path)` reads the path and returns totals. The hard-coded script works once and needs editing every week, and hand-editing is how you get last week's variable by mistake.
- **This week's file throws `KeyError` on the sum line — why?** The column label `amount` doesn't exist this week (probably a naming difference — a KeyError is a label that wasn't found). The fix is one normalize line after load, not hardcoding this week's capitalization.
- **What belongs in a summary handed to leadership?** State how many rows were dropped and why; round dollar figures to a sensible precision; clearly state the time period the data covers. Rejected options: hiding the code so nobody questions the numbers, and never mentioning missing data — you don't pass bad numbers downstream.

## Best practices

- Write code yourself first; use the LLM to explain or debug afterward. If the AI generates it, make sure you understand every block — "writing your own functions is the mental workout; if someone else does the workout, you can critique it, but you still need the muscle memory."
- Normalize headers once at every entry point (`columns.str.strip().str.lower()`) — fix the class of the bug, not the individual instance.
- `.astype(str)` before `.str.replace`; `regex=False` on literal replaces; replace before `to_numeric`.
- Always `strip().title()` text keys before `groupby` — "strip and title before you group, always."
- Keep NaN for unknowns; never fill blanks with 0 (it silently corrupts averages).
- Count invalid rows before dropping them, and keep the count in the report ("invalid rows: 2") — record everything a filter removes; in real pipelines, write the rejected rows to a file for fixing at the source.
- Count tells you *how bad*; rejected rows tell you *where*.
- Functions: one job, take a path/data parameter, **return — never print** (printers are untestable; returners are assert-able). Build small pieces first, then compose on top.
- Validate only the columns the function actually needs — a file missing an unused column should still work.
- Every bad path returns a readable string, not a traceback — errors are designed to be read by the *next step* in the pipeline.
- State the time period the numbers cover and what you dropped; the date range describes only orders actually in the totals.
- Test failure cases on purpose (3 of the 4 tests were failure cases) — a function that works on good input is a demo; one that survives bad input is a tool.
- Money that must balance to zero: `Decimal` from **strings** or integer cents — never `Decimal(float)`.
- Bound every loop/graph (`recursion_limit`) — compute isn't free, and a runaway query can cost real money.
- Ground every agent sentence in a computed number; structure LLM output with templates and guardrails (prompt-injection hygiene).
- Agents draft, humans approve — printing a yes/no question is not permission to act; sending is always a separate, human-triggered step.
- Add small confirmations ("file written ✓") to side-effect cells.

## Common mistakes & gotchas

- **`.str.replace("$", "")` without `regex=False`** — `$` is end-of-line in regex; nothing gets replaced, the column stays text, and the sum is 0 (the instructor's own "one bug I beat").
- **Missing `.astype(str)`** — a column holding a real NaN (a float) errors on `.str` methods.
- **Converting before stripping** — `$45` → NaN and a real sale is silently discarded.
- **Grouping before cleaning** — `austin`/`Austin` become two cities; `idxmax` can pick the wrong winner.
- **`idxmax` on an object (text) column** — no maximum exists to find.
- **Trusting `head()` for types** — `$45` prints right-aligned like a number but is a 5-char string; dtype `object` is the ground truth. Head shows values; dtypes tell you what they are; they can disagree.
- **Blank → 0** — totals survive but averages lie (Austin average becomes 22.5 instead of 45), and the wrong number flows downstream looking right.
- **`sum()` skipping NaN silently** — clean-looking totals with orders quietly omitted; that's why the invalid count is its own report line.
- **Hardcoding this week's header capitalization** to silence a KeyError — next week it flips back; normalize instead.
- **`Decimal(0.1)` built from a float** — carries the float's error (50-digit mess); construct from the *string* `"0.1"`.
- **Float equality checks** — `0.1 + 0.2 == 0.3` is False; in JS too (`0.1 + 0.2 !== 0.3`).
- **LLM sycophancy** — confidently wrong, ignores edge cases, doesn't know what it got wrong; accepting an AI fix without rerunning your own tests is the skipped step that bites.
- **Unbounded graphs/queries** — one future edit away from an endless loop or a four-figure cloud bill.
- Copy-paste drift between the class file and your notebook — keep `sales.csv` as the untouched class copy; write experiment files separately.

## Q&A / discussion worth keeping

- **Student: why does the blank become NaN instead of 0?** Because blank = unknown, 0 = known-nothing. The average betrays the difference (45 vs 22.5 for Austin) even when the total doesn't.
- **Student: why `astype(str)` when the column is already text?** Because the blank was read as NaN — a float — and `.str.replace` won't run on a column containing a float.
- **Why return strings instead of raising?** The function lives inside an agent that must say something a human can read; "File not found" is showable, a traceback is not. The mock agent keys off the message prefixes.
- **Student demo (fitness agent)** — see above; instructor's feedback: keep the same four tests plus a louder schema failure, and add the streak logic.
- **AI tooling discussion (with the main instructor):** the starter notebooks include paste-ready prompts for NotebookLM/Colab/Claude Code. Use the provided files as the source of truth for "what works." Deliberately let Colab's Gemini write some code and *catch its mistakes* — one of the best ways to learn. VS Code/Cursor unlock stronger models; he "softly recommends" Anthropic (Opus) for explaining code, having used it for sklearn. NotebookLM is great too — "find your own tools; there's no hard-and-fast." His own workflow: open the file, open a terminal, ask the LLM to edit one function at a time.
- **On testing:** every class test was deliberately fed something that breaks it — keep testing the edges of the Class 15 demo's large report/output file to learn where your code breaks; LLMs are also excellent at telling you exactly what broke and where.
- **Career/community:** a student asked about sharing a personal repo — the instructor invited him to drop it in the main class chat (invite if private) so everyone benefits; students are encouraged to share links, meetups, and hackathons.

## Applying this to the capstone website

- **Port `report_sales` to TypeScript as the site's data-lesson engine.** `str.strip().str.title()` → `.trim()` + a small `titleCase()` helper; `.str.replace("$","",regex=False)` → `.replaceAll("$","")`; `pd.to_numeric(errors="coerce")` → `Number(x)` (which also yields `NaN` for junk); `isna().sum()` → `rows.filter(r => Number.isNaN(r.amount)).length`. The same 7-step shape (load → inspect → clean → validate → aggregate → report → suggest) can be a documented pattern in the site's source or a live demo page.
- **Groupby + idxmax in TS** for any "top city / top category" widget: `const totals = new Map(); rows.reduce(...)` to sum per key, then `Object.entries(totals).sort((a,b) => b[1]-a[1])[0][0]` for `idxmax`. Remember `max` vs `idxmax` is "how much" vs "which" — label the UI accordingly.
- **The four-test suite maps 1:1 to Vitest/Jest** in the Next.js repo: good file, wrong path, missing column, empty data — three failure-path tests per success test, with `expect(output).toMatch(...)`/`startsWith(...)` mirroring the Python asserts. Wrap the pure functions (no `console.log` inside) so asserts check return values, exactly the class habit.
- **Money handling is directly reusable:** the 0.1+0.2 demo is a great interactive widget for the study site, and the rule "integer cents or a decimal library, never float" applies to any pricing/quiz-scoring logic you write in TS (`BigInt` cents or `decimal.js`).
- **Agent design for the site's agentic-ML roadmap:** reuse the observe → decide → act shape and the two boundaries. Any AI-generated study content on the site should be *grounded* (generated from computed data, e.g. your exam-objective telemetry) and *approval-gated* (drafts saved for your review, never auto-pushed) — the LangGraph error-string routing translates to a TS reducer + switch returning `"end" | "continue"`, with a max-iterations guard.
- **Header normalization as a JSON-ingestion rule:** site data imports (CSV/JSON practice sets) should `.trim().toLowerCase()` keys at the entry point and return readable error strings (`Missing column: ...`) the UI can render, instead of throwing raw exceptions at the page.

## Homework / what's next

- **Deliverables this week:** the four-item capstone package — `sales_agent.py` (code file), the four-test log (screenshot the passing cell), a sample output, and a one-line safety statement. Post "one thing I built, one bug I beat" (two lines) in the class channel, and a link if you built a flow from the starter notebooks; paste red-line errors and the instructor will point to the failing step. Try the try-it cells: 7th messy row, invalid-row listing, average-order wrapper, bad-header fifth test, Decimal traps.
- **Optional stretch:** adapt the pipeline to your own app using the Leads/Fitness/E-commerce starters (with prompt blocks for AI pair-programming), and add streak logic to the fitness agent.
- **Next course: machine learning.** The ML course turns clean tables into predictions; load → clean → validate → group is the first half of every ML project — "the model is the last 10%, the clean table is the other 90." Expect sklearn, where data cleaning quality decides everything.
