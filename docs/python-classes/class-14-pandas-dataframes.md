# Python Class 14 — Pandas DataFrames for Agent Data

**Recording:** Class 14 video | **Runtime:** ~142 min | **Instructor:** Ameya (TA/lead)

## Context — where this class fits

Last class gave agents one column of numbers with NumPy (math over a whole column at once). Tonight adds the other half of the data stack: **Pandas DataFrames** — full labeled tables with names next to cities next to scores, many records at once, with column names. Pandas is the library almost every data job in Python runs on, and it's built directly on NumPy. The class ends by building a lead-analysis tool (load → validate → clean → analyze → flag for human review) in plain Python, then wiring the same logic into Langflow and LangGraph with a **human-in-the-loop pause** — the exact pipeline the Class 15 capstone assembles into a full agent.

## Key concepts

### Why agents need tables, not just lists
A **list** holds values in order with no labels. A **dict** holds labeled values — but only for **one record** (one lead: name, city, score). Agents deal with hundreds of leads, a month of workouts, a week of orders, hundreds of sensors. Until now that was handled as a **list of dicts**, which works, but "every question becomes a loop" — loop over the leads, check the city, collect the names. More loops = more places for off-by-one errors and wrong-variable bugs that flow downstream.

A **DataFrame is just a labeled table**: rows are records, columns are fields. The big change: you ask questions of the **whole table in one expression**, and the lines read like the question. Side-by-side from the notebook:

```python
# List-of-dicts way: a loop for every question
leads = [
    {"name": "Ava",  "city": "Austin", "score": 91},
    {"name": "Kara", "city": "Austin", "score": 85},
    {"name": "Dev",  "city": "Reno",   "score": 88},
]
austin_names = [lead["name"] for lead in leads if lead["city"] == "Austin"]
# ['Ava', 'Kara']

# DataFrame way: one line
import pandas as pd
df = pd.DataFrame(leads)
df[df["city"] == "Austin"]["name"]
```

Reading the printed table: the numbers on the left are the **index** (Pandas' row labels), the header row is the column names, and every cell under a column holds the same kind of thing. That structure is what makes filtering and grouping possible.

Why this matters for an agent specifically: agent data comes from somewhere else (a CSV export, a database, an API) and arrives as many records. A tool that receives a list of dicts and loops it works, but gets slower and buggier as questions pile up. Load it into a DataFrame and every question is one line. For simple tasks, stick to lists — DataFrames are for the more complicated, multi-record jobs.

**Try-it:** add a fourth lead, filter on Reno instead — same code, different values. And note: **filtering keeps the original index** (the row numbers in the output are the original positions, not renumbered). That index becomes a source of truth for how the data arrived.

### DataFrame vs list, dict, and NumPy array
The whole hierarchy on one slide:

| Structure | What it holds | Best for |
|---|---|---|
| List | Ordered values, no field labels | A sequence of items |
| Dict | Labeled values for **one record** | One lead |
| NumPy array | Fast numbers, **one dtype** | Calculations |
| DataFrame | Named columns, **each column can be a different type** | Many records to analyze |

Pandas is built on NumPy. There is **no reason to use a DataFrame where a list or dict will do** — earlier classes never needed one because the examples had one record and one type per column.

`import pandas as pd` is the near-universal convention (like `import numpy as np`). You can spell it out, but you'll see `pd` in every code review — know what it means.

The "four structures in one cell" demo shows the print signatures: the list prints with commas and brackets; the dict prints with its labels; the array prints **without commas** plus `dtype: int64` (one type for everything); the DataFrame prints as a table plus `dtypes` (with an **s**) listing each column's type separately — text columns show `object` (or `string`, depending on Pandas version), score shows `int64` (64-bit integer; you may also see `int32`). The score is an integer because whole numbers are stored as ints — `91.0` would make it a float. Mixed column types in one table is what none of the other three structures can do.

**Try-it:** add `budget` (decimals → `float64`) and `is_active` (boolean flag) columns and watch `dtypes` change.

**Mental model:** a DataFrame is a **set of NumPy-style columns that share an index**.

**Practical pick rule:** would you put it in a spreadsheet with column headers? Whole spreadsheet → DataFrame. One row of it → dict. One column of pure numbers you'll do math on → array. Just ordered things → list.

### Creating and reading a DataFrame — two ways
```python
# 1. The constructor: keys are column names, values are the column's values
df = pd.DataFrame({
    "name":  ["Ava", "Kara", "Dev"],
    "city":  ["Austin", "Austin", "Reno"],
    "score": [91, 85, 88],
})

# 2. Read a file: the header row becomes the column names
df = pd.read_csv("leads.csv")
```
The constructor turns **column lists into rows** — first name goes with the first city and first score. In practice `read_csv` is used **95%+ of the time**; the constructor is mainly for mock data and quick unit tests, when you don't want to upload a CSV just to exercise a function.

The notebook does a roundabout on purpose: build with the constructor → `to_csv("leads.csv")` → `read_csv` back. Ameya's homework suggestion: strip that out, upload/import a real CSV directly, and parse it — that's how production actually works.

**Type inference is a double-edged sword.** When `read_csv` saw digits in the score column it made them `int64` automatically. Two weeks ago with `csv.DictReader`, every value came back as a string and you converted by hand. Pandas guesses types for you — convenient, but sometimes it guesses text when you wanted numbers, and that's the source of a lot of debugging tonight.

### Inspect before you trust — four tools on every DataFrame
Run these four **before you believe anything about the data**:

```python
df.head()      # first 5 rows — do the records look plausible?
df.shape       # (rows, columns) — an ATTRIBUTE, no parentheses
df.info()      # every column: its type + how many non-null values
df.describe()  # count, mean, std, min, max, quartiles per numeric column
```

- `head()` catches problems immediately: data that didn't load, or an index starting at 2, 3, 4 instead of 0, 1, 2.
- `shape` is an attribute with no parentheses — a repeated warning.
- `info()` is how you **spot missing data** (the non-null count) and wrong types in one glance.
- `describe()` results generally always come back as floats.

Read it **like a doctor reads a chart**: the non-null count is the first thing (a column showing 5 non-null out of 7 means values are missing — decide what to do before any average), the dtype is the second (a score column showing `object` means your numbers are text — every comparison after that breaks). On the demo: `head()` showed only 5 of 7 rows (Fay and Gus hidden — head shows 5 by default); `describe()` gave count 7, mean 82, min 64, max 95, plus the 25/50/75 quartiles.

`describe()` only shows numeric columns by default — name and city correctly aren't there. The try-it passes `include="all"` and the text columns appear with their own stats: unique count, most common value, and how often it appears (Austin four times).

Why build the habit on a 7-row toy table: real CSVs are 100,000–2,000,000 rows now, often AI-generated and full of nulls. Surface-skim first (first five rows, shape, types, summary) — it catches a lot before you compute anything.

### Select, filter, groupby — the three main moves
```python
# 1. Select one column by name → a Series (a single labeled column)
df["score"]

# 2. Filter rows with a condition inside the brackets (last week's boolean mask, applied to whole rows)
df[df["score"] >= 80]

# 3. Group and aggregate
df.groupby("city")["score"].mean()
```

- A **Series is one column**; a DataFrame is a collection of them. The Series prints the scores with their row numbers and `dtype: int64` underneath.
- The filter keeps rows at 80 or above — Ava 91, Kara 85, Dev 88 — **with their original row numbers** (the index isn't renumbered).
- The groupby gives Austin 80.0 and Reno 80.0 — floats because of the decimal point from averaging.

**KeyError warning:** column names are **case-sensitive**. `df["Score"]` with a capital S is a `KeyError`; `score` lowercase is the column. (Triggered on purpose in the debug clinic.)

**int64 note:** it's just an integer with 64 bits; you might see `int32` on some platforms.

### groupby = split, apply, combine (and it maps to SQL)
Read the groupby left to right: **split** the table by city, **take** the score column from each group, **average** each group — three steps in one line.

It maps exactly to SQL: `SELECT city, AVG(score) FROM leads GROUP BY city` is `df.groupby("city")["score"].mean()`. Ameya's opinion: SQL is easier, but the concept is transferable across languages — learn it here and SQL gets easier too.

The demo numbers were chosen so both cities **tie** (Austin: 91+85+64 = 240/3 = 80; Reno: 72+88 = 160/2 = 80) — on purpose, as a reminder that **the average hides the spread**. Two cities can look identical in a groupby while containing completely different data. Little gremlins like this bite; keep an eye out.

**Gotcha: the groupby result isn't a normal table.** It's a Series whose *index is the city names* — that's why it prints with city on the left and no row numbers. To get city back as a regular column (before saving to CSV or handing to a chart), add `.reset_index()` at the end.

### Missing values: `dropna` vs `fillna`
Real data has holes — a score that never arrived, a blank field. Pandas represents them as **NaN** ("not a number"). You have two honest choices:

```python
df.dropna(subset=["score"])          # remove rows where score is missing
df["score"].fillna(df["score"].mean())  # replace missing with something (here: the column mean)
```

- **dropna** is clean, but you lose those records — including their names and cities. Production war stories exist ("someone panicked: I dropped the tables"). This is the "Claude dropped all my data" meme made real.
- **fillna** keeps every row, but fills in **estimates, not observations**.
- There's **no simple answer** — it's case by case. A sales rep forgot to log an amount? Filling with 0 is fine. A sensor malfunctioned and emitted NaN? Filling with 0 poisons the data, because 0 is itself a meaningful measurement — the fake zeros carry forward into later averages, throw them off, and now you have to find where you did the fillna. A real gremlin.

The demo: a table where Ben and Eli have NaN scores.
- The score column **became `float64`** the moment NaN entered — the whole column had to become float to hold it (pandas is built on NumPy; same one-dtype-per-column rule as last week). **Instructor's rule of thumb from sensor work:** an int column that suddenly turns float means an error happened or malformed data arrived.
- `dropna`: 5 rows → 3 (Ava, Kara, Dev), original row numbers kept.
- `fillna` with the mean: the mean of the original scores is 88, and both NaNs become 88.0 — rows kept, but two values are **invented**.
- Both results are correct; they answer **different questions**. "What's the average score of the leads we actually scored?" → dropna. "I need a complete table to feed a system that can't handle blanks" → fillna — **and you must tell them which rows were filled**. Data loss vs invented number: no free lunches.

**The third option is the trap:** ignore the NaNs and compute anyway. `mean()` **skips NaN silently** — you'd get 88 and never know two of the five were missing. That silence is the dangerous part. **Run `isna().sum()` before any statistic** to catch it early. (Ameya's own sensor pipeline used the int→float dtype flip as the tripwire.)

For practice data: **Kaggle** — Ameya has used it a lot to get datasets of all kinds. Don't try to build practice data yourself; you'll build it without the issues. Try-it: fill with 0 (drags the average down hard) vs fill each **city's own mean** (the smarter policy) — explore this one yourself.

### Coding task 1 — the five-lead fixture
Five mock leads: **Eva** (Austin), **Ben** (Reno), **Kiara** (Austin), **Dev** (Reno), **Eli** (Austin) — this is the fixture for the rest of the night; every later cell uses these five. Build with the constructor, run the three inspection calls (`head`, `shape`, `info`), then `to_csv("leads.csv")` for the agent tool.

Predictions (all confirmed): `head` shows all 5 (only 5 rows exist); `shape` is (5, 3); `info` shows name/city as text and score as `int64`, 5 non-null everywhere, no gaps. The `leads.csv` file now exists in the Colab workspace — **run this cell first**, everything downstream reads that file.

### Coding task 2 — filter by score
```python
high = df[df["score"] >= 80]
print(len(high))          # 3 — Ava 91, Kara 85, Dev 88
```
Discussion question: how many rows are missing and why? Ben (72) and Eli (64) — the mask was False for them. Ameya added a second print showing exactly those two rows (`df[df["score"] < 80]`).

Notes from this cell:
- It **reads `leads.csv`** — "this is how any real tool is going to begin."
- **Double brackets** select multiple columns: `df[["name", "score"]]`. One set of brackets with one name → a **Series**; one set of brackets with a **list** of names → a **DataFrame** with those columns.
- **Keep the threshold in a variable** you change in one place — not a number repeated through the code. (It becomes a function argument two slides later.) Try-it: threshold 70 (brings Ben in) and a fitness version filtering workouts by `minutes >= 30`.

### Coding task 3 — groupby with mean, sum, and agg
```python
df.groupby("city")["score"].mean()   # Austin 80.0, Reno 80.0
```
Predict by hand first (the slide does): Austin 240/3 = 80, Reno 160/2 = 80.

E-commerce variant: orders grouped by **category** with revenue **summed** — the same shape of line with a different verb at the end. **groupby doesn't care what you're summarizing** — the column and the final function decide (`mean` for scores, `sum` for revenue).

**`agg` with a list** — multiple statistics in one call:
```python
df.groupby("city")["score"].agg(["mean", "max", "count"])
```
One row per city, one column per statistic — "this is the shape you hand to a dashboard or a report." Interview aside: this is the table you'd visualize in Tableau — "make the table and just say *Kimball* and they'll hire you" (a data-warehouse-modeling joke, but the point stands: this aggregate table is what analysts actually ship).

### Coding task 4 — damage the data on purpose
```python
df.loc[[1, 4], "score"] = None   # Ben and Eli lose their scores
df.info()                        # see the damage: 3 non-null of 5, dtype flipped to float64
```
Then run **both** policies from the missing-values slide and ask: which choice changes the city average by the most?

- **dropna** → shape 3; city means stay 88 / 88 (honest average of the scores you actually have).
- **fillna(0)** → Ben and Eli become 0.0; Austin's mean falls 88 → 58, **Reno's falls 88 → 44**. Filling with zero **halved a city's average**.

**Warning:** damage a **copy** — keep this experiment separate from your original CSV. (The notebook writes the damage to a different DataFrame, so the original file is untouched.)

**Try-it:** blank a different row (Ava) and fill with the mean instead of zero — and observe the silent-skip again: `groupby.mean()` on a column with NaN simply **skips the NaN**, so Austin's average comes out 74.5 from the two remaining scores, and you'd never know one was missing unless you checked.

### Debug clinic — the two biggest Pandas errors (plus the sneakiest)
**KeyError** — asking for a column that doesn't exist under that name:
```python
df["Score"]        # KeyError — the column is "score", lowercase
print(df.columns)  # THE FIX: read the exact spelling, capitalization, and spaces
```

**TypeError** — numbers that arrived as text:
```python
df["score"] >= 80          # TypeError: '>=' not supported between 'str' and 'int'
# In plain English: you can't ask whether a word is greater than 80.
df["score"] = pd.to_numeric(df["score"], errors="coerce")  # convert what it can, rest → NaN
# df["score"].astype(int) also works — but ONLY if every value is valid and nothing is missing
```
Both errors were put in one notebook cell, each in its own `try`/`except`, so you see the message and the cell keeps going.

**Footnote warning: conversion can create missing values.** `errors="coerce"` never crashes — good for a pipeline that has to keep moving — but it silently turns unconvertible text into NaN. **After any conversion, run `isna().sum()` again** and decide what to do with the new holes. Small tables hide it; on large ones, checks after every conversion genuinely save you — something silently wrong pushed downstream is expensive.

**The sneakiest error: a header with a trailing space** (`"score "`). It looks identical on screen and is a different column name. The fix fixes every header at once:
```python
df.columns = df.columns.str.strip()
```
Rule: **if a column you can see in `head()` gives you a KeyError, it's a space.** Ameya recommends having an AI generate variants of this bug and quizzing yourself on catching them — it's the sneaky error that becomes a much bigger problem later.

### The agent: a lead-analysis tool (load → validate → clean → analyze → review)
Four steps, no paid API, mock data only: **read** (load mock leads from a CSV) → **validate** (required columns present; score is numeric) → **summarize** (city means) → **mark** high-priority leads **for a human to review**.

This is the same shape as every agent built so far — **validate, then do work, then route the result** — with two things new tonight: the work is **table work**, and the routing **ends at a person** instead of "send." The deck is strict about this because a tool that **flags** leads and a tool that **emails** leads are literally one line apart, and the consequences are heaven and earth. That's "human in the loop."

Real-world parallel: this is what data analysts do — flag missing data, grab insights, push to Tableau/Power BI, hand the dashboard to whoever you work for. Filtering data alone isn't enough.

### `load_leads(path)` — validate the schema with set subtraction
```python
def load_leads(path):
    df = pd.read_csv(path)
    required = {"name", "city", "score"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")
    return df
```
Blue line: **read → check required columns → return the table.** Two leads tests: `leads.csv` passes; `leads_bad.csv` **opens fine and `read_csv` is perfectly happy** with two columns — yet the ValueError fires naming exactly which column is missing (`score`). **A successful file read does not prove the schema is right.** A file can open and still have wrong headers; the **set subtraction** is what caught it.

Why set subtraction instead of a loop: `required - present` is one expression that produces **all** the missing names at once. If three columns are missing, the user sees all three in one message — instead of fixing one, rerunning, finding the next. A small thing stakeholders notice.

**Why `raise` instead of returning None:** a missing column is a situation a tool **can't recover from** — there's no sensible average for a column that doesn't exist. Raising a clear error stops the pipeline in the right place with the right message, and **the caller** (here `analyze_leads`) decides whether to catch it. A bad schema is loud by its nature, so here we let it through.

**Try-it:** add `"email"` to the required set and `leads.csv` fails — this is the test you'd run when **the business adds a required field**. Change one word in the set and every file without it is rejected with a message that names it.

### Clean and analyze — six lines, and the order matters
```python
df["score"] = pd.to_numeric(df["score"], errors="coerce")  # text → NaN instead of crashing
before = len(df)
df = df.dropna(subset=["score"]).copy()                    # drop NaN scores
dropped = before - len(df)                                 # count what you dropped
summary = df.groupby("city")["score"].mean()               # city means
df["priority"] = df["score"] >= 80                         # flag: new True/False column
```

- **Record your cleaning policy.** This version drops and records how many (`dropped`). If you fill instead, you must record that policy and **which rows are affected** — those are now **invented data**. In an organization, recording it means the burden of proof isn't on you when something breaks. The reviewer sees the result **and** the number of records that didn't make it.
- **`.copy()` after `dropna`:** without it, Pandas sometimes warns when you add the `priority` column — `dropna` returns a view-ish slice of the original, and adding a column to a slice is ambiguous. `.copy()` says "this is a new table now, I'm going to modify it." **Rule: put `.copy()` after any filter you're going to add columns to**, and the warning never appears.
- **The order of the lines is a pipeline and it matters:** **convert first** (so the last comparison is numeric) → **count before dropping** (so you can compute the difference) → **drop before grouping** (so means use only real scores) → **flag last** (on the clean table). Swap any two and you either crash or report a wrong number.
- **Try-it:** blank Ben and raise the priority threshold to 85 — Dev (88) stays flagged, Kara (85) stays. The threshold is a single number changed in one place; the next slide makes it a function argument.

### `analyze_leads(path)` — wrap it in a function with a fallback
```python
def analyze_leads(path):
    try:
        df = load_leads(path)
    except FileNotFoundError:
        df = pd.DataFrame({"name": ["Ava"], "city": ["Austin"], "score": [91]})  # 1-row mock

    # ... clean/analyze/flag exactly as before ...

    return {
        "summary": summary.to_dict(),                            # plain dict: city → number
        "flagged": df[df["priority"]].to_dict(orient="records"), # list of dicts, one per lead
        "dropped_count": int(dropped),                           # plain Python int, not numpy int64
    }
```
- **Only a missing file triggers the fallback.** A missing column still raises — that's a different problem with a different fix.
- The tool returns something valid even when the file isn't there: the missing-file run gives a one-row-mock result (Austin 91, Ava flagged, dropped 0), correctly shaped instead of crashing. Anyone reading it can see it's the mock.
- **Look at the shape of the return value** — that's what other systems care about. `to_dict()` turns the groupby Series into a plain dict; `to_dict(orient="records")` turns the flagged rows into a list of dicts; `int()` turns the NumPy integer into a plain Python one.
- **The function receives a file and returns plain Python data** — something JSON, Langflow, or a LangGraph state can all hold. **No DataFrame leaks out.** A DataFrame is a great thing to compute with and a bad thing to pass between systems. **Tools should take simple inputs, return simple outputs, and do the heavy lifting in the middle** — the same principle as `summarize_leads` last week, now with a table instead of an array.
- **Try-it:** call with threshold 70 — Ben joins the flag list.

### Langflow wiring — build the function first, wire it in second
Three components left to right:

1. **File/CSV input** — the mock data: a local path or an uploaded file, adapted into the function's input.
2. **Python tool component** — paste the `analyze_leads` code **unchanged** and connect its callable entry point (you tell Langflow which function to run).
3. **Chat output** — formats the returned dictionary as text you can read in the output panel.

Caveat: component names and ports vary by Langflow version. What doesn't vary is the **shape**: data in on the left, your function in the middle, result out on the right. (First in, first out.)

**Why the dropped_count must travel through:** if the chat output shows the summary and flagged leads but not the dropped count, a reviewer **can't tell whether 2 leads are missing or 20** — they have no access to the backend, even if they notice a discrepancy in what they expected. Every piece of evidence has to make it to the output.

**The rule:** we didn't write `analyze_leads` *for* Langflow — we wrote it as plain Python with simple inputs and outputs and tested it, and that's exactly what makes it droppable into a visual tool like a Lego brick. **Always build the function first, wire it in second.**

### LangGraph — the same logic as five nodes on a line
Five nodes: **load → clean → analyze → human review → end**, with a straight-line edge chain — **no conditional branch tonight, because the decision isn't made by the graph; it's made by a person.**

The state is a typed dict with six fields: `path`, `dataframe`, `summary`, `flagged`, `dropped_count`, `decision`. Each node is a plain Python function that takes the state and **returns only the part it changed** (same LangGraph model as previous classes):

- **load** reads the path, writes the dataframe
- **clean** reads the dataframe, converts/drops, writes back with `dropped_count`
- **analyze** reads the dataframe, writes `summary` and `flagged`
- **human review** reads summary/flagged/dropped_count, **prints them as evidence**, and writes a `decision`

Output of the full run: summary Austin 80.0 / Reno 80.0, flagged Ava/Kara/Dev, dropped 0, and decision **"pending human approval"** — the pipeline ran load through review, stopped at the right place with the evidence printed, and a person hasn't decided yet.

**Why bother splitting one function into nodes?** Now each step is **visible, testable, and replaceable**. Swap the clean node for one that fills instead of drops and nothing else changes (try it). Add a node between analyze and review that writes an audit table (have Gemini whip one up and slot it in). **The graph is the shape; the nodes are interchangeable.**

**Try-it:** run the same graph on a missing file — the one-row mock fallback flows through every node (summary Austin 91, Ava flagged, dropped 0). The graph doesn't know or care the data was a fallback; that was the load node's decision.

### Human review — the most important slide of the night
- **Show the evidence.** The review node shows the flagged leads and the dropped rows. **Preserve a drop/audit table before removing or dropping records** — in practice another CSV or DataFrame holding everything you removed, so it's easy to trace back where data came from. This is hygiene that serves your career: when something goes wrong, you always want an audit trail.
- **Wait for a decision.** A person approves or rejects **before the graph ends** — implemented as an **interrupt and resume**. And the standing rule: **"analysis only, no messages sent"** — the priority flag is an analysis result, **not permission to contact anyone**.
- **The LLM angle (not on the slides):** LLMs are trained by RLHF — humans reviewing outputs yes/no — which produces **sycophancy**: the model will be very confidently wrong if you're not paying close attention. That's one more reason you don't drop an LLM raw into a data pipeline. For data, human review is standard ETL practice anyway; with AI it's **triple-underlined important**.

### LangGraph interrupt + resume, and the plain-data checkpoint rule
Compile the graph **with a checkpointer**, which saves state between runs, and set an **interrupt before the human review node**:

1. `graph.invoke(...)` → runs load, clean, analyze → **stops and waits** (flagged 3 leads, decision None).
2. A person updates the state with their decision.
3. `graph.invoke(...)` again → resumes; the review node prints the evidence; final decision **"approved by reviewer."**

The pause is the safety valve between the analysis and anything it can act on — **a stop only a human can release**. In production it can be a **Slack message with the flag list and two buttons** — Ameya has built exactly this and calls it the best way to send pipeline errors in Slack teams. The code shape is identical: interrupt before the review node, resume with the decision. **Interview answer:** "How do you keep an AI agent from doing something stupid with customer data? It can't get past the review node without a person."

**Why plain data matters here:** the checkpointer **serializes** the state so it can restore it later — possibly in a different process, possibly days later. **A DataFrame doesn't serialize cleanly; a list of dictionaries does.** This version of the graph keeps rows as a list of records and each node does `pd.DataFrame(rows)` on the way in and `.to_dict("records")` on the way out. If you're reading CSVs you won't hit this — it matters when writing unit tests or end-to-end tests with constructor data. Same rule as before: **compute with DataFrames, pass plain data between systems** — and a checkpointer is one of those systems. Ameya recommends letting this bite you in mock trials now, not on a real workday.

**Try-it:** invert it — the reviewer **rejects**. Same pause, same resume, final decision "rejected by reviewer" with a reason. The graph completes either way; what differs is the decision field, which any downstream step would read **before doing anything**.

### Adapt it to your own app — fitness and e-commerce
Two adaptations, same pipeline skeleton:

- **Fitness:** read `workouts.csv`, group by **member**, flag **streaks**. Honest caveat from the slide: streaks need **dates and consecutive-day logic** — more than one line. (Counting sessions per member is a groupby; "did they work out on consecutive days?" is a different question — it needs real dates sorted per member and a function computing the gap to the previous session. **Try-it:** convert the date column with `pd.to_datetime`, sort by member and date, `groupby("member")` + `.diff()` gives days between sessions — 1 means consecutive — and counting a streak is a small loop or a cumulative sum. "A great weekend exercise.")
- **E-commerce:** read the orders CSV, group by **category**, flag **big carts** over a threshold you choose (the demo used 150+; revenue dtype is float because of the `.0`).

The notebook runs both: fitness — 6 sessions, 3 members, one missing value dropped and counted, `agg` giving count + mean minutes per member, long sessions (50+ minutes) recorded as member/date/minutes rows; orders — bags/hats/shoes, revenue summed per category.

**Look at how little changed between the two halves and the leads tool:** different file, different group column, different flag column, different threshold — but the **same** `read_csv`, `to_numeric`, `dropna(subset=...)`, `groupby`, filter, and `to_dict("records")` on the way out. **The pipeline is the product; the column names inside it are the configuration.**

### The capstone bridge and the four final tests
For Class 15 (capstone), pick **one** of the three apps — leads, fitness, or e-commerce — with **columns and thresholds you'll actually use**. The pipeline is already written; your job is to point it at your data and make the four tests pass for your columns.

The four tests, written as `assert` statements:

1. **Good file** — `analyze_leads` on the original mock CSV: `assert result["dropped_count"] == 0`.
2. **Missing file** — the fallback returns the one-row mock (Austin, 91).
3. **Missing column** — a clear ValueError that **names the field** (`score`).
4. **Missing scores** — `dropped_count` matches the number of blank rows (2), and the city means only use the retained scores.

All four pass in the notebook run.

**Why `assert` instead of `print`:** a print shows you a number and *you* have to know whether it's right. An assert **knows** — it either passes silently or stops the cell with a red line. Rerun after every change: four OK lines means nothing broke; one red line tells you exactly what you broke. That's what "fully tested" means — and it's what tools like Claude Code are doing when they generate a ton of unit and end-to-end tests.

**Tests 3 and 4 are the important ones — they test failures.** A tool that only works on good data isn't tested, it's **demoed** — and AIs do this a lot. The really valuable tests are the ones that feed a bad file and check it fails **the right way — loudly, with the correct reason**. Something that fails silently either doesn't matter downstream or is going to cause an issue downstream.

**Try-it (test 5):** a CSV where a score is the text `"N/A"` — the tool should coerce it to NaN, drop it, count exactly one drop, and **not crash**. This is the slide-14 conversion bug, caught by a test forever. Reuse this test on your own pipelines with minimal editing.

## Best practices

- **Inspect before you trust:** run `head()`, `shape`, `info()`, `describe()` on every DataFrame before computing anything. Read `info()` like a doctor reads a chart — non-null counts first, dtypes second.
- **Keep thresholds in one place** — a variable you can change in one spot, later promoted to a function argument. Never repeat the number through the code.
- **Name the business rules in the schema check:** the required-columns set *is* the business rule. When the business adds a required field, you change one word in the set and every file without it is rejected with a message naming it.
- **Fail loud, not silent:** `raise ValueError` naming all missing columns at once (set subtraction gives them all in one message) instead of returning None from an unrecoverable situation. The caller decides whether to catch.
- **Keep try blocks narrow** — each risky operation in its own try/except so you see exactly which one failed and the cell keeps going.
- **Run `isna().sum()` after every conversion** — `errors="coerce"` silently manufactures NaNs; re-check after every type change, especially on large data.
- **Count before you drop, drop before you group, flag last, convert first** — the pipeline order is load-bearing; swapping steps crashes or corrupts the numbers.
- **Record your cleaning policy** — if you fill instead of drop, log which rows were filled; those are invented data. The dropped count must reach the reviewer.
- **Preserve an audit table before dropping records** — another CSV/DataFrame of everything removed, traceable later. Career-saving hygiene.
- **Compute with DataFrames, pass plain data between systems** — `to_dict` / `to_dict(orient="records")` / `int()` at every boundary (JSON, Langflow, LangGraph state, checkpointers). Tools take simple inputs and return simple outputs.
- **Build the function first, wire the visual tool second** — plain, tested functions drop into Langflow like Lego bricks; tool-first thinking gets you nothing to wire.
- **Always test the failure paths** — a tool that only works on good data is demoed, not tested. Use asserts, not prints, so reruns prove nothing broke.

## Common mistakes & gotchas

- **`df.shape` with parentheses** — it's an attribute, not a method. No `()`.
- **KeyError from case or spaces** — column names are case-sensitive, and a **trailing space in a header** (`"score "`) looks identical on screen but is a different name. If a column you can *see* in `head()` throws KeyError, it's a space. Fix all headers at once with `df.columns = df.columns.str.strip()`.
- **Numbers that arrived as text** — `"91" >= 80` is a TypeError. Convert with `pd.to_numeric(..., errors="coerce")`; `astype(int)` only works if every value is valid and nothing is missing.
- **Conversion manufactures NaNs silently** — coerce turns unconvertible text into NaN without crashing; re-run `isna().sum()` after every conversion.
- **`mean()` skips NaN silently** — the third missing-value policy (ignore and compute anyway) gives you a number with no sign that data was missing. Always check NaN counts before any statistic.
- **NaN forces the whole column to float** — an int column flipping to `float64` is often the first visible symptom of missing or malformed data (Ameya's sensor-data tripwire). `describe()` outputs are always floats too.
- **fillna(0) can halve an average** — Ben/Eli at 0 dragged Reno from 88 to 44. Zero is a real measurement, not a placeholder, in most data. Prefer per-group means or dropna — and say which rows you filled.
- **The average hides the spread** — two cities both averaging 80.0 can contain completely different distributions (the demo numbers tie on purpose).
- **Groupby output isn't a normal table** — it's a Series indexed by the group key; add `.reset_index()` before saving to CSV or charting.
- **Filtering keeps the original index** — filtered rows keep their original row numbers (not renumbered 0,1,2). Useful as provenance, confusing if you expect clean numbering.
- **Adding a column to a filtered slice warns** — `dropna`/filters return view-ish slices; add `.copy()` after any filter you'll extend.
- **Trusting a successful file read** — `read_csv` being happy doesn't mean the schema is right; validate the columns explicitly.
- **Letting a DataFrame cross a system boundary** — it won't serialize cleanly (checkpointers, JSON, chat output). Convert to plain dicts/lists/ints at every edge.
- **Flag ≠ permission** — a "high priority" boolean one line away from "send the email" is exactly the line you must not cross without a human.

## Q&A / discussion worth keeping

- **Missing recordings:** two class recordings were lost; Ameya offered to cover them in office hours and is building an **interactive slide-by-slide script** students can follow alongside the Python files.
- **Why raise instead of return None on a missing column?** (paraphrased from the flow) Because a missing column isn't recoverable — there's no sensible average for a column that doesn't exist. Raising stops the pipeline at the right place with the right message and lets the caller decide whether to catch it.
- **The SQL connection:** `df.groupby("city")["score"].mean()` ≡ `SELECT city, AVG(score) FROM leads GROUP BY city`. Ameya: "My personal opinion, SQL is easier — but this is very transferable" across languages. Learning one makes the other easier.
- **Kaggle for practice data:** don't build your own practice datasets — "you'll build it without the issues." Kaggle has real, messy data of all kinds; Ameya has used it heavily.
- **Capstone logistics (Class 15):** bring three things you can explain — a tested function (working Python with validation and missing-score handling, in your chosen app), a screenshot of the test cells showing what the tool returns and which tests pass, and your chosen app with columns/thresholds you'll actually use. Share the notebook (Colab Jupyter preferred, but a `.py` from VS Code is fine) **before class** so Ameya can review it; there may not be time to walk everyone's notebook live. He agreed to post a short **framework/instructions note in Google Classroom before Thursday** (students asked for a goal statement, not a full document). He'll also provide starter frameworks for all three app variants.
- **Career/interview advice (the big one):** LLMs now write functions near-perfectly, so the role shifts from bricklayer to **architect** — think of the code's shape as a flowchart first (sketch it in Langflow), then build the functions. "Functions are a given; you work on the edge cases where it errors." For the capstone specifically: **do not write the code by hand** — have AI generate the functions, then verify them; if something breaks, determine whether the *function* broke or the *flow* broke (two distinct errors with two distinct fixes). He referenced interview prep at Anthropic-level companies: what they're really testing is **can you read tests** — "the test suite is what matters." His own bias as a data engineer: **lists, dicts, and DataFrames are where things break**, so focus there.
- **Problem-solving method (any task, not just this class):** decompose to the **highest level of abstraction** first — what's the task? It becomes: an input, a set of functions/flow, an output — with a cleaning step, calculations, and a human review step — then decompose down from there. Works from "build a lead tool" up to "refactor my entire codebase in Rust."
- **Sycophancy warning:** LLMs are RLHF-trained to please, so they'll be **confidently wrong** when unattended — a core reason data pipelines keep a human review node.

## Applying this to the capstone website

- **CSV/table ingestion → typed parsing.** Pandas' `read_csv` with type inference ≈ **Papa Parse** (or `csv-parse`) in the Next.js app. Lesson to port: don't trust inference — validate column presence and types after load, exactly like `load_leads`'s set subtraction (`required - set(df.columns)` ≈ checking keys of a parsed row against a `string[]` of required fields, or better, a Zod schema).
- **Filtering and aggregation → plain TS array methods.** `df[df["score"] >= 80]` ≈ `rows.filter(r => r.score >= 80)`; `df.groupby("city")["score"].mean()` ≈ a `reduce()` into a `Map<string, number[]>` then averaging (or `d3.group`/`lodash.groupBy`). The **single-threshold-in-one-place** rule maps directly to a typed `const`/config object your study-site quiz and progress features share.
- **Silent NaN skipping → guard your stats.** Pandas `mean()` skipping NaN ≈ JS `[].reduce` and `NaN` propagation through `average()` helpers — write reducers that count excluded items and surface the count in the UI (the `dropped_count` pattern) rather than silently averaging fewer entries.
- **Plain-data boundaries → JSON everywhere.** `to_dict(orient="records")` / `int(dropped)` ≈ serializing to plain JSON objects at every API route boundary (Route Handlers → `Response.json()`). Never pass a rich server-side structure across the client boundary; convert, then ship — same rule, TS accent.
- **Human-in-the-loop → review states in the app.** The LangGraph interrupt-before-review maps to a `decision: "pending" | "approved" | "rejected"` field on any content-moderation or flagging feature: the pipeline computes and stops, the UI shows evidence (flagged items + dropped count), and a person's decision is the only edge that releases the next step. Keep an **audit table** (a `review_log` table or JSONL append) before anything is deleted.
- **Assert-based regression checks → Vitest/Jest.** The four assert tests (good file, missing file, missing column, bad scores) ≈ `expect()` suites in the repo — including the failure-path tests ("feed it a bad file and check it fails loudly with the correct reason"). A tool that only works on good data is demoed, not tested.

## Homework / what's next

- **Try-it blocks tonight:** add/extend the leads table; read a real CSV directly instead of the constructor roundabout; `describe(include="all")`; filter variants (threshold 70, fitness `minutes >= 30`); `.reset_index()` on a groupby; fill-with-zero vs fill-each-city's-own-mean; blank a different row and fill with the mean; call `analyze_leads` with threshold 70; run the LangGraph on a missing file; invert the review (reject instead of approve); and the **streak weekend exercise** (`pd.to_datetime` → sort → `groupby().diff()` → count consecutive days).
- **Office hours (same day):** Ameya covers the Python Quest (skipped in class for time) and the two missing recordings; an interactive slide-by-slide script is coming.
- **Before Thursday:** Ameya will post a short framework/instructions note in Google Classroom for the capstone, plus starter frameworks for the leads/fitness/e-commerce variants.
- **Class 15 — capstone:** bring a **tested function** (your working Python with validation and missing-score handling — the `analyze_leads` pattern adapted to leads, fitness, or e-commerce with columns and thresholds you'll actually use) and a **screenshot of your passing test cells**. Share the notebook with Ameya before class. The capstone combines the data pipeline into a full agent — everything needed is in tonight's notebook.
