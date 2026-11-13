# Python Class 13 — NumPy Arrays for Data-Powered Agents

**Recording:** Class 13 video | **Runtime:** ~117 min | **Instructor:** Ameya (TA/lead)

## Context — where this class fits

The last five classes built agents that handled names, emails, requests, and routing words — all text. This class adds the other half: numbers. Real agent data is numerical (a week of workouts, daily sales, lead scores, sensor readings), and the core skill is turning a pile of numbers into one or two facts an agent can act on. NumPy is the foundation of the Python data stack (under Pandas, under scikit-learn), and the class ends by packaging the math into a `summarize_leads` tool that plugs into Langflow and LangGraph — the same validation-and-routing shape built in Class 12, except now one node does math.

## Key concepts

### Why lists aren't enough for data
Lists are flexible — they hold anything mixed in any order, great for a shopping cart, bad for mathematics. With a list, every question is a loop:

```python
# list way: three loops for three questions
total = 0
for r in reps:            # loop 1: sum the reps
    total += r

active = 0
for r in reps:            # loop 2: count days above 0
    if r > 0:
        active += 1
```

Every loop is a place for an off-by-one error or a wrong variable name, and a mistake flows downstream. NumPy arrays are the opposite trade: one kind of number, all the same type, in one block of memory — in exchange you get whole-array operations with no loop:

```python
import numpy as np

reps = np.array([35, 40, 0, 45, 50, 0, 60])
print(reps.sum())            # total
print((reps > 0).sum())      # active days
```

`(reps > 0).sum()` is the trick worth attention: `reps > 0` gives seven booleans (one per day), and summing them counts the Trues because True counts as 1. Under the hood NumPy does the loop in C — irrelevant at 100 numbers, noticeable at a million. Today's arrays are tiny; the point is learning, not speed, but this is the code that scales.

**Rule of thumb:** if your data is a *column of numbers* and your questions are spreadsheet questions (sum, filter, average, convert) → use an array. If your data is *records* with names, emails, mixed fields → still dictionaries and lists (or Pandas, coming in a later class).

### Creating arrays: `np.array`, `type`, `dtype`
Hand `np.array()` a list:

```python
arr = np.array([1, 2, 3])
print(arr)                   # [1 2 3]   <- spaces, no commas
print(type(arr))             # <class 'numpy.ndarray'>
print(arr.dtype)             # int64
```

Three tells: the array prints without commas (visual key that it's an array, not a list); `type()` says `numpy.ndarray` ("nd" = n-dimensional, arrays can have rows and columns — ours is 1-D); and `dtype` is the data type of the *contents* (`int64` = 64-bit integers). The rule: **one array, one dtype.** A list can hold a number next to a string next to a dictionary; an array holds one kind of thing — and that restriction is exactly what makes the math possible. The integer size varies by platform (Windows sometimes reports `int32`); pass `dtype=np.int64` explicitly if you need a specific one.

**Interview question:** `type` vs `dtype`. `type` tells you what the container is (an `ndarray`); `dtype` tells you what's inside (integers, decimals, booleans).

Why this matters for an agent: the data you receive is messy. If one sensor sends `21` and the next sends `21.5`, your array silently becomes floats, and a function expecting whole numbers may behave differently. Checking the dtype is the first thing you do when NumPy output looks odd.

### `list * 2` vs `array * 2` — same symbol, different meaning

```python
lst = [1, 2, 3]
print(lst * 2)               # [1, 2, 3, 1, 2, 3]   <- repeats the sequence

arr = np.array([1, 2, 3])
print(arr * 2)               # [2 4 6]              <- doubles every value
```

The list got longer, the values didn't change; the array kept its length and every value doubled. The habit to form: **check the container before you interpret the operator.** Second trap in the same family: adding two lists concatenates them into one longer list; adding two arrays adds element by element. The operator means what the container says it means.

This is the most common NumPy bug for people coming from lists: you think you have an array but you actually have a list, you multiply, and nothing crashes — you silently get a list twice as long with nothing doubled, and the problem shows up three steps later when an average comes out half of what it should be.

### Vectorized arithmetic and broadcasting
**Vectorized** means the operation applies to every element without you writing a loop. **Broadcasting** means NumPy stretches a single number across the whole array:

```python
prices = np.array([100, 200])
print(prices * 1.10)         # [110. 220.]          # +10% to every price

celsius = np.array([0, 25, 100])
print(celsius * 9 / 5 + 32)  # [ 32.  77. 212.]     # C -> F in one line

a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
print(a + b)                 # [11 22 33]           # element-wise
```

Element-wise is **not** concatenation: two arrays of length 3 added give one array of length 3, not 6. The dtype rule shows up immediately: `prices` started as integers, but multiplying by the float `1.10` makes the whole result floats — an array can't hold an integer next to a float. `a + b` stayed integer because everything was an integer. Note how the Celsius formula reads exactly like the whiteboard math — no multiply-append loop. That's the real positive of vectorized code: the expression looks like the idea.

Broadcasting has a rule: a single number broadcasts against any array; two arrays must be compatible — for 1-D arrays that means the same length (3 elements + 2 elements fails; we see that error in the edge cases). Where this shows up in agents: unit conversion, currency conversion, discounts, tax rates, normalizing scores to a 300-point scale — all "one scalar times one array," all one line of NumPy, all things you connect as a *tool* rather than asking an LLM to do through tokens.

### Aggregations — many numbers in, one number out
The table maps them to SQL (most of the class knew SQL from the first half of the course):

| Question | SQL | NumPy (function style) | NumPy (method style) | Example result |
|---|---|---|---|---|
| total sales | `SUM` | `np.sum(sales)` | `sales.sum()` | 640 |
| average | `AVG` | `np.mean(sales)` | `sales.mean()` | 128.0 |
| lowest day | `MIN` | `np.min(sales)` | `sales.min()` | 80 |
| highest day | `MAX` | `np.max(sales)` | `sales.max()` | 200 |
| how many | `COUNT(*)` | `sales.size` | `sales.size` | 5 |

The names are nearly identical on purpose — `mean` instead of `avg` is the only difference. Mental model: a 1-D array is one column of a SQL table; anything you'd ask a column with an aggregate function, you ask an array with these four. The caveat: SQL's `AVG` skips NULLs; NumPy's `mean` does not skip anything — an array has no nulls, only numbers (handled in the edge-cases section).

Two styles exist and you'll see both everywhere: `np.sum(sales)` (function style) and `sales.sum()` (method style). They're the same operation; the instructor leans method style because it reads left to right — "the data, then the question."

The agent-tool angle: an LLM is bad at arithmetic. You don't hand a model 200 sales figures and ask what happened this week — you hand it four numbers (total, average, best day, worst day) and it writes the sentence. **The array does the math; the model does the words.** That's how production systems do it, and knowing this puts you ahead of people who let LLMs do the arithmetic — it works surprisingly well at small scale and breaks at scale.

### Boolean masks and selection
Compare the whole array to a threshold; you get one boolean per position — a **mask**. Index with the mask to keep only the True positions:

```python
scores = np.array([55, 82, 70, 91, 64])

mask = scores >= 70          # [False  True  True  True False]
kept = scores[mask]          # [82 70 91]
print(mask.sum())            # 3   <- True counts as 1
```

The SQL connection: the comparison is the `WHERE` clause, indexing with the mask is the `SELECT`, and `mask.sum()` is your count of matches. You'll use that count constantly — how many qualified leads, how many active days, how many readings over the limit.

**Boundary rule:** 70 itself is kept because the comparison is `>=`. If the business rule is "70 and above" you need the equal sign; if it's "above 70" you don't. This is exactly where bugs live — the class wrote a boundary test for it: a list of 69 and 70 should give a qualified count of 1.

Combining conditions uses `&` (NumPy's "and"), and each comparison needs its own parentheses — that's the **number one syntax error** people hit with masks:

```python
kept = scores[(scores >= 70) & (scores < 90)]
```

Masks are also how you fix missing-data zeros, and they're positional — more on both below.

### Scenario 1 — fitness week: filter first
A fitness app logs seven days of reps and workout minutes; day six is a rest day, so it has zeros in both. Three questions:

```python
reps = np.array([35, 40, 0, 45, 50, 0, 58])       # 7 days, day 6 = rest
durations = np.array([42, 45, 0, 38, 50, 0, 74])

print(reps.sum())                     # 228           total reps
print(round(durations.mean(), 1))     # 41.4          average duration
print((reps > 0).sum())               # 6             active days
```

The interesting part: **41.4 includes the 0-minute rest day.** If the question is "how long are the workouts?", the rest day shouldn't count. The fix is a mask — average only the durations where the reps were above zero:

```python
active_mask = reps > 0
print(round(durations[active_mask].mean(), 1))   # 48.3  (6 days, no rest day)
```

Same data, two answers, both technically an average — a 7-minute gap from one rest day. **Filter first.** The fourth line is also the pattern to reuse: the mask comes from one array (`reps`) and is applied to a different array (`durations`). That works because the arrays are the same length and aligned by position — position three in one is position three in the other (same day). For an agent this is the difference between a tool that says "you average 41 minutes" and one that says "48 minutes" — a small discrepancy that compounds as data scales. The try-it block changes the week to three rest days and the gap gets more dramatic; the code doesn't care how many zeros there are.

### Scenario 2 — daily sales: strong days, best day, discount what-if
A week of daily sales (120, 80, 200, 150, 310, 150, 260):

```python
sales = np.array([120, 80, 200, 150, 310, 150, 260])

print(sales[sales > 150])            # [200 310 260]        strong days
print(round(sales.mean(), 1))        # 172.9                average
print(sales.max())                   # 310                  best day
print(sales * 0.90)                  # 10% discount what-if (floats)
```

Every line is one of the four moves — mask, mean, max, scalar-times-array. The scenarios aren't new tools, they're the same four moves on different data.

Two caveats from this slide:

- **A discount what-if is not a forecast.** Multiplying by `0.90` models what the amounts *would be* at a discount; it doesn't predict demand (a discount might sell more units — an array can't know that). When you build a tool that says "projected revenue," be clear which is math (NumPy) and which is a model plus assumptions (a forecast).
- **dtypes from the same source differ.** The strong days print as integers (selected) and the discounted amounts print as floats (multiplied by a decimal). Two arrays from one source, two dtypes — the one-dtype rule doing its job.

The try-it block makes the cutoff a variable and prints the *count* of strong days next to the selection — a small but real improvement: a tool that returns a count is easier for a downstream step to use than a list that makes the next step count it.

### Scenario 3 — lead scores: the one that becomes the agent tool
Five lead scores with a business rule:

```python
scores = np.array([45, 82, 67, 91, 74])
THRESHOLD = 70                                   # business rule, in ONE place

qualified = scores[scores >= THRESHOLD]          # [82 91 74]
print(qualified)                                 # the list
print(qualified.size)                            # 3      count
print(round(qualified.mean(), 1))                # 82.3   average

call_order = np.sort(qualified)[::-1]            # [91 82 74]  highest first
```

The added line sorts highest-first: `np.sort` gives ascending, and the reversing slice `[::-1]` flips it to descending. "Which leads should sales call first?" → 91, then 82, then 74. That last line is the kind of output a sales agent actually wants — not the raw data, just the order to work it in.

**The slide's warning — keep IDs alongside scores.** We just filtered an array of numbers and lost track of *whose* numbers they were. 91 is great, but 91 *who*? In a real CRM you carry a second parallel array of names or IDs and apply the same mask to both:

```python
names = np.array(["Ana", "Bo", "Cy", "Dee", "Eli"])
print(names[scores >= 70])           # ['Bo' 'Dee' 'Eli']  (82, 91, 74)
```

Masks are positional, so the same mask on two parallel arrays keeps them lined up.

**The threshold is a business rule, not a NumPy rule.** Marketing might say 60 next quarter. If 70 is hard-coded in five places, that's five edits — and as the codebase grows you'll miss one. Put it in one variable or one function argument so a single change propagates everywhere.

### Scenario 4 — sensor temperatures: `~` inverts a mask
Sensor readings in Celsius (floats from the start). Four things: convert to Fahrenheit, flag anomalies, print max and overall mean, then the new move — tilde:

```python
temps = np.array([21.1, 21.5, 22.0, 35.2, 21.8])

fahrenheit = temps * 9 / 5 + 32      # [70.   70.7  71.6  95.36 71.24]
anomaly = temps > 30                 # flag readings above 30
print(fahrenheit.max())              # 95.36 -> the flagged 35.2 C spike
print(round(temps.mean(), 2))        # 25.12  overall mean (pulled up by spike)
print(round(temps[~anomaly].mean(), 2))  # 21.77  clean mean
```

`~` (tilde) **inverts the mask** — every True becomes False and back. If `anomaly` says which readings are suspicious, `~anomaly` says which readings are fine. One character, no second comparison needed. It's the not-operator for masks (don't use Python's plain `not` here; if you remember electronics, it's the inverter of AND/OR/NOT).

The point of the slide: **one bad reading moved the entire average by more than 3 degrees** (25.12 vs 21.77). Anomaly detection comes *before* averaging — for sensors, for sales, anywhere one outlier can swing the summary. The try-it block lowers the threshold to 22 and adds a fifth reading; the flag set and the clean mean move together with no code changes.

### Edge cases: empty arrays and shape mismatches
Two failures every tool must survive:

```python
empty = np.array([])
empty.mean()     # nan + RuntimeWarning  ("not a number") — no crash!
empty.max()      # ValueError: zero-size array to reduction operation
                 #   maximum which has no identity

three = np.array([1, 2, 3])
two = np.array([1, 2])
three + two      # ValueError: operands could not be broadcast together
                 #   with shapes (3,) (2,)
```

The asymmetry is the lesson. The max **crashed loudly** — good; "there is no maximum of nothing." The mean **didn't crash** — it returned `nan` and kept going, and that's the dangerous one: every comparison with `nan` is False, so a downstream step comparing it to a threshold yields a qualified count of zero and *nobody knows why*. If you've ever seen a report that keeps returning zero instead of a number, this is the most likely culprit. **Silent failures are worse than loud ones.** The guards:

```python
if empty.size == 0:
    print("no data")          # guard BEFORE calling mean
else:
    print(empty.mean())
```

Shape mismatch is usually a *data* bug, not a code bug — you expected seven days of reps and seven days of durations and one of them has six. The guard catches it at the door. For the real agent tool we go further: check the array is **one-dimensional, non-empty, and all finite** (no `nan`, no infinity) before any math.

### Hands-on: five exercises, five moves
The notebook lab runs the same five ideas as exercises — create, convert, aggregate, mask, guard — which are exactly the five moves the final tool uses.

1. **Create** — list `* 2` repeats (6 items), array `* 2` doubles (3 items). Checkpoint: three questions to ask before moving on — *what's the container? what's the operation? what's the output?* If you can answer those, you got the core idea of the night. Changing the multiplier to 4 keeps the rule (12 items vs `[4 8 12]`); a multiplier of 0 gives an empty list on one side and three zeros on the other.
2. **Convert** — Celsius→Fahrenheit with `* 9 / 5 + 32` gives 32, 77, 212 with decimals even though the inputs were whole numbers, because 9/5 is 1.8 — a float — and the moment a float enters the arithmetic, the one-dtype rule turns everything into floats. Sanity checks: 0 C → 32 F, 100 C → 212 F. Fahrenheit→Celsius is `(f - 32) * 5 / 9` — **the parentheses matter**: subtract first, then scale.
3. **Aggregate** — a loop over two arrays (sales, durations) printing mean/max/sum of each: six aggregations in two lines. The loop is over *datasets*, not numbers, so it's fine. The try-it block runs the same question in SQL — Python ships with SQLite built in, so it builds a tiny in-memory table and runs `SELECT AVG, MAX, SUM`, getting the same numbers with completely different syntax. NumPy aggregations and SQL aggregations are the same math; if you know what `AVG` does to a column, you know what `np.mean` does to an array.
4. **Mask** — type the mask first, inspect it, then select. Look at the Trues and Falses before you trust the selection. Two traps: convert each new input to `np.array` before applying its condition (if `sales` is still a plain list, `sales > 150` is a `TypeError` — the mask only exists because the container is an array); and if no score qualifies, `scores[mask]` returns an *empty array* (printed as `[]`) — not an error, a valid result meaning "nothing qualified." Your tool should say that in words, because it won't crash.
5. **Guard** — `if scores.size == 0: print("no scores") else: print(scores.mean())`, and `if len(a) == len(b): print(a + b) else: print("lengths must match")`. A notebook cell can crash; a *function* that another system calls has to survive bad input. And a subtlety: use matching lengths only when positions genuinely correspond — two arrays of length 7 still don't belong together if one is Monday-first and the other Sunday-first. The length check catches a mistake but doesn't guarantee the data lines up; that's a question of where the data came from, and no code check answers it.

Game day is homework — the class covered everything needed; email the instructor or message Sean with questions.

### The `summarize_leads` tool
The deliverable: a function that takes a list of scores and returns a dictionary — the five moves (aggregate, mask, guard) in one function with a clear return shape:

```python
def summarize_leads(scores):
    arr = np.array(scores, dtype=float)      # whatever came in, consistent math
    if arr.size == 0:
        return {"status": "human_review"}    # stop before any math
    qualified = arr[arr >= 70]
    return {
        "mean": float(arr.mean()),           # <- wrappers!
        "max": float(arr.max()),
        "qualified": int(qualified.size),
    }
```

- `dtype=float` forces consistent math whether the input was ints or decimals.
- The empty guard returns `status: "human_review"` instead of crashing or returning `nan`.
- **The `float()` / `int()` wrappers matter.** NumPy returns its own types (`np.float64`, `np.int64`) which print fine — but hand them to a JSON response, a Langflow component, or a database and they can fail to serialize. Wrapping them turns them into plain Python numbers that go anywhere.

Zero API cost, no model inside — it runs in a microsecond and gives the same answer every time for the same input, so it can be tested with a list of inputs. Design principle for every data tool you'll ever build: **deterministic math inside, language outside.** When an agent calls this tool, the model's job is deciding *when* to call it and phrasing the result; the arithmetic is not the model's job, nor should it be. (Same reason LLMs in databases were always paired with a semantic layer of SQL queries rather than reading raw tables.)

The try-it block builds `summarize_week` for the fitness data (total, best, active days) — different field names, same four lines. "Build your own variant" means: pick a data set, decide which three numbers matter, keep the empty guard. Note the tool at this stage is the *minimum*: a list containing the word `"bad"` would crash the conversion, and a `nan` would poison the mean — the next slide adds those checks.

### Langflow: the tool on a canvas
Left to right: scores input (mock lead scores) → `summarize_leads` → summary (mean, max, qualified) → recommendation (agent or local rules read the summary) → output (recommendation plus the numbers that justify it). Only one box has any intelligence in it — the LLM — and even that can be plain rules with no API call. The rules version:

```python
def recommend(summary):
    if summary["status"] == "human_review":
        return "review the input"
    elif summary["qualified"] > 0:
        return "call qualified leads first"
    else:
        return "nurture the leads"
```

Three branches, never calls a model. The key line on the slide: **NumPy arrays are not LLM agents themselves — they are the tools' math.** In Langflow every box is a component you drop on the canvas and wire; the `summarize_leads` box is a Python component with the function pasted in, and the recommendation box can be a prompt to a model or these rules — Langflow doesn't care, it just moves the dictionary from box to box.

A rounding note: a mean like `51.666…` is a real float. If it's going to a *person*, round it; if it's going program-to-program or tool-to-tool, leave it raw — rounding mid-pipeline can break a calculation downstream and hunting that down later is a needle in a haystack, especially with sensor data.

**Rule order matters, same as Class 12 routing.** The `human_review` check goes *first* because a human-review summary has no `qualified` key — checking it would crash. Guard conditions first, happy path after. The try-it block adds a fourth rule (escalate if the mean is above 85) and slots it in as another guard before the others — like LEGO: big blocks before the little one.

### LangGraph: the same flow in code
Same shape as Class 12 (validation and routing); the only new thing is that one node now does math. Structure: a state holding raw scores and summary; a NumPy node that validates and computes; a conditional router with three exits (empty/invalid → human review; valid with qualified > 0 → high priority; valid with zero qualified → normal); every branch reaches END.

The NumPy node validates harder than the slide-21 tool:

```python
def numpy_node(state):
    try:
        arr = np.array(state["scores"], dtype=float)
    except ValueError:
        return {"summary": {"status": "human_review", "reason": "not numeric"}}

    if arr.ndim != 1 or arr.size == 0 or not np.isfinite(arr).all():
        return {"summary": {"status": "human_review", "reason": "empty or invalid"}}

    qualified = arr[arr >= 70]
    return {"summary": {
        "mean": float(arr.mean()),
        "max": float(arr.max()),
        "qualified": int(qualified.size),
    }}
```

The router is four lines: human-review status → `"human_review"`; qualified > 0 → `"high_priority"`; otherwise `"normal"`. The names it returns are looked up in a mapping dictionary, with the same conditional edges from Class 12; a loop adds an edge from each node to END; then `compile()` and `app.invoke()` run it. Five test inputs, not three, because the edge cases matter: five good scores (high priority — mean 71.8, max 91, qualified 3), three low scores (normal, qualified 0), an empty list, a list containing `"bad"`, and a list with NaN — every branch reaches END without crashing.

The takeaway block: **the graph never does the arithmetic.** The node calls NumPy, the router reads a dictionary, and the terminal nodes write a string. If marketing changes the threshold to 60, you change one number inside the node and nothing else moves. If you add a fourth rule, you add one node, one entry in the mapping dictionary, and one edge to END. Structure and math are separate — and that separation is what makes it maintainable.

**Boundary tests:** the try-it block runs `[70]` and `[69]` alone. 70 is qualified (high priority, qualified 1); 69 is not (normal, qualified 0). The N−1/N boundary test is the cheapest insurance in any project — whenever you ship anything with a threshold, test exactly the edge to confirm the rule is where you say it is. LLMs writing end-to-end tests will generate these too; they're standard in the industry.

### The final build: `summarize_leads_v2` with per-guard reasons
The last slide ties it together: pick fitness, sales, or lead data; rename the tool and its metrics to match the question; test it *before* connecting it to a workflow. The test-plan table becomes a cell with seven cases:

- valid data → mean 71.8, max 91, qualified 3
- boundary (69 and 70) → qualified 1 (70 counts, 69 doesn't)
- empty array → human review, no reduction attempted
- `"bad"` / NaN / infinity → rejected → human review
- a score of 140 → human review, "score out of range" (the v2 tool also enforces an allowed 0–100 range)

`summarize_leads_v2` adds all the checks — conversion, one-dimensional shape, `np.isfinite`, range — each returning a **different reason**: `not numeric`, `empty`, `empty or invalid`, `out of range`. Run through the seven cases, the first two rows return numbers and the other five return human review with five different reasons. **Why reasons matter:** when a graph routes something to human review, the person (often future you) needs to know why at a glance — these are structurally different errors, and without labels you'd go digging for each one. Get in the habit: whenever you write a guard, write *why* it exists.

The closing box is the whole course in two lines: SQL `AVG`/`SUM` map directly to `np.mean`/`np.sum`, and SQL `WHERE` maps to a boolean mask. If you can write the query, you can write the array code — and the other way around. The try-it block is the sales variant (`summarize_sales`: total, best day, count of strong days above a cutoff) with the same validation and the same three test calls: change the numbers and field names to your data, keep the checks and the shape, add rather than remove.

## Best practices

- **Predict before you run.** Say the expected output out loud before each cell. Half the surprises in NumPy come from assuming it behaves like a list when it doesn't.
- **Check the container before interpreting the operator.** Same symbol (`*`, `+`), completely different meaning on a list vs an array.
- **Check the dtype first** when NumPy output looks odd — messy inputs (21 next to 21.5) silently promote arrays to floats.
- **Filter first.** If the question is about "active" days/readings, mask out the zeros before averaging. Same data, two averages — only one answers the question.
- **Keep business rules in one place.** The 70 threshold is a marketing decision, not a NumPy constant — one variable or one function argument, so a change propagates instead of needing five edits.
- **Carry IDs in a parallel array** and apply the same mask to both, so "91" never becomes "91 who?"
- **Guard before computing:** check size == 0, matching lengths, 1-D shape, and `np.isfinite` before any math. A notebook cell can crash; a tool other systems call must survive bad input.
- **Put guard conditions first, happy path after** — the human-review branch must be checked before any code touches a `qualified` key that doesn't exist in that state.
- **Deterministic math inside, language outside.** The array does the math; the model does the words. Never hand raw numbers to an LLM and ask what happened.
- **Wrap NumPy scalars in `float()` / `int()`** before returning them from a tool, so they serialize to JSON, Langflow, and databases.
- **Don't round between programs.** Round only what goes in front of a person; mid-pipeline rounding can break downstream calculations.
- **Write the "why" on every guard.** Human reviewers (including future you) need the reason at a glance.
- **Run N−1/N boundary tests on every threshold** — 69 and 70, every time. Cheapest insurance in any project.
- **Repeat imports inside notebook cells** if you want them runnable standalone — Python loads the module once, so it costs nothing.
- **Install NumPy inside your venv** on your own machine to avoid multiple conflicting versions; in Colab it's pre-installed.

## Common mistakes & gotchas

- **Copy-paste drift:** you think you have an array but you actually have a list — `list * 2` quietly returns a doubled-length list, nothing crashes, and the bug surfaces three steps later as an average that's half of what it should be.
- **`list + list` vs `array + array`:** concatenation vs element-wise addition. The operator means what the container says.
- **Mask syntax:** forgetting parentheses around each comparison with `&` — the number one mask syntax error. Write `(scores >= 70) & (scores < 90)`, not `scores >= 70 & scores < 90`.
- **Boundary bugs:** `>` vs `>=`. If the rule is "70 and above," the equal sign is required — a 69/70 boundary test catches this.
- **NaN propagation:** `mean` of an empty array returns `nan` with only a warning; every comparison against `nan` is False, so downstream qualified counts silently become zero. Silent failures are worse than loud ones.
- **`max` of nothing:** `ValueError: zero-size array to reduction operation maximum which has no identity` — guard size before calling reductions.
- **Shape mismatches:** adding a 3-element array to a 2-element array → `operands could not be broadcast together`. Usually a data bug (7 days expected, 6 arrived), not a code bug.
- **dtype surprises:** integers multiplied by a float (`1.10`, `9/5`) become floats — even `32.0`. One array, one dtype; the result can't hold an int next to a float. Two arrays from the same source can legitimately have different dtypes after selection vs scaling.
- **Filtering loses identity:** selecting scores with a mask orphans them from their lead IDs. Apply the mask to the names/IDs array too.
- **Equal length ≠ aligned:** two length-7 arrays don't belong together if one is Monday-first and the other Sunday-first. The length check catches a mistake but doesn't guarantee correspondence — that comes from knowing where the data came from.
- **Traps in mask workflows:** applying `> 150` to a plain list raises `TypeError` — convert to `np.array` first; and an empty selection (`[]`) is a valid result meaning "nothing qualified," not an error — say it in words.
- **Forgetting the parentheses in F→C:** `(f - 32) * 5 / 9` — subtract first, then scale.
- **Discount math ≠ forecast:** `sales * 0.90` projects amounts at a discount; it says nothing about demand. Label the tool output accordingly.
- **Returning `np.float64` from a tool:** prints fine, fails to serialize to JSON/databases. Wrap in `float()`/`int()`.
- **Cell errors in multi-array code:** missing comma between arrays in a loop or a parenthesis closed one too early — check those three things first when a cell errors.
- **Checking `qualified` before checking `status`:** crashes when the summary is a human-review dict. Guards first.

## Q&A / discussion worth keeping

- **"What's the difference between `type` and `dtype`?"** (an interview question the instructor has been asked) — `type` is the container (`numpy.ndarray`); `dtype` is what's inside it (integers, decimals, booleans).
- **"Why does this matter for an agent?"** (also asked in forward-deployed ML engineer interviews) — because agent data is messy; a mixed int/float input silently changes the array's dtype, and a function expecting whole numbers may behave differently. Check dtype first when output looks odd.
- **Why not just let the LLM do the arithmetic?** Even a 3-trillion-parameter model compresses data into a small vector space — there's a scale at which its arithmetic breaks. Production pattern: the array computes, the model writes the sentence. Same reason LLMs in databases were always paired with a semantic layer of SQL queries.
- **Is the loop-over-arrays okay?** Yes — the loop is over two *datasets*, not over numbers. Asking three questions of two datasets is six aggregations in two lines.
- **Why learn both function style and method style?** They're identical operations; method style reads left-to-right ("data, then the question"). Pick one taste and be able to read both.
- **Career note:** these skills transfer directly to data analysis and SQL — NumPy aggregations are SQL aggregations with different syntax, and the mask is the WHERE clause. If you know SQL you already know what `np.mean` does, and vice versa. The instructor: the material is axioms, not syntax — like learning "two plus two is four" in French once you know it in English. He disliked this material the first time (Fundamentals of Programming), and it later carried him into a data analyst role.
- **On tooling advice:** try Langflow to visualize the pipeline, but start with raw code first, then visualize — so your brain maps code → flowchart, not flowchart → code (advice from his professor, which he now agrees with).
- **On testing:** when you have LLMs write end-to-end tests, expect boundary tests like the 69/70 pair among them — they're industry standard for threshold logic.
- Extra help with variations: message Sean and the instructor can put together more practice material.

## Applying this to the capstone website

- **Score aggregation for practice data:** when the study site tracks quiz/practice-exam scores per domain, store them as a numeric array and summarize with `mean`/`max`/`count` — the `summarize_leads` shape. In TypeScript the same idea is `arr.reduce()` for sums, or `d3.mean(arr)` / `Math.max(...arr)` — but note TS has no vectorized broadcasting; every op is an explicit loop or higher-order function, which is exactly the boilerplate NumPy exists to remove.
- **Boolean masks → `filter()`:** Python's `scores[scores >= 70]` is TypeScript's `scores.filter(s => s >= 70)`, and `mask.sum()` is `.filter(...).length`. One-to-one mapping for "count of qualified questions" or "flag questions below a mastery threshold."
- **Thresholds as named constants:** put the passing-score cutoff (and any mastery thresholds) in one exported TS constant (e.g. `export const PASSING_SCORE = 70`) — the same "business rule in one place" habit, so the study dashboard and the practice logic never drift.
- **Guard clauses before computing stats:** every API route or server component that aggregates scores should check for empty arrays and non-numeric input first and return a clear `{ status: "human_review" }`-style object instead of `NaN` — in TS, `Number.isFinite(x)` plays the role of `np.isfinite`, and an empty-array `.reduce()` without an initial value throws (the loud-crash equivalent of NumPy's max-on-empty).
- **Per-reason error labels in dashboards:** the v2 tool's distinct human-review reasons map to distinct, readable banner messages on the study site ("no attempts yet" vs "invalid score data") rather than one generic failure — same guard-reasoning habit.
- **Deterministic math inside, LLM outside (if any):** if a study bot ever narrates progress, feed it pre-computed numbers (count, average, best domain) rather than raw attempt logs — the array does the math, the model does the words; in TS that's a stats utility returning a typed `Summary` object the prompt interpolates.

## Homework / what's next

- **Game Day** notebook — left as homework; everything needed was covered in class. Questions go to the instructor by email or to Sean.
- **Try-it blocks to actually do:** change the multiplier and predict again (and try `* 0` at home); Fahrenheit→Celsius conversion; the mask exercise with your own exceptions; flip both guards; the `summarize_week`/fitness variant; the recommender's fourth "escalate" rule; the LangGraph boundary runs `[70]` and `[69]`; and the build-your-own variant (`summarize_sales` or your own data — change the numbers, keep the checks and the shape).
- **Next up:** Pandas is on the horizon (the instructor flagged it as the next layer above NumPy in the data stack), and the course continues building these tools into agent workflows on the Langflow/LangGraph pattern established here.
