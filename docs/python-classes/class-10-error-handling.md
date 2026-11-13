# Python Class 10 — Error Handling & Reliability

**Recording:** Class 10 video | **Runtime:** ~90 min | **Instructor:** Ameya (TA/lead)

## Context — where this class fits

Classes so far covered functions and shaping data with comprehensions — all of it assumed the data is good. This class handles the real world, where data is bad "a lot": what happens when input can't be converted, keys are missing, or you divide by zero. The class theme in three words: **catch errors, explain what happened, keep the app running.** Everything is built hands-on in Google Colab, with Gemini prompt boxes you can use to generate or edit each code block and then compare against the instructor's version. By the end you build a lead validator tool with tests and wire it into an agent two ways — Langflow (visual) and LangGraph (code).

## Key concepts

### The problem: one bad field kills the whole app
A customer types `abc` into a budget field on a lead form. Your code tries to turn it into a number, Python raises a `ValueError`, and the program stops on that line. The next line — the one that prints "lead received" — never runs. The customer's lead is lost, and depending on how the app is built, the whole page can break.

```python
budget = int("abc")      # ValueError — red box, program stops
print("lead received")   # never runs
```

The fix pattern on the right of the slide: **catch the unexpected error, report something useful** (like "enter a number") **and continue** so the customer can try again. Catch → report → continue.

### `try` / `except` — the basic fix
Put the one risky line inside a `try` block; underneath, an `except` block says what to do if that specific error happens. There's also an `else` block that only runs if the `try` worked, and a final line outside all of it that runs either way.

```python
raw = "2500"   # try also with "abc"

try:
    budget = int(raw)
except ValueError:
    print("Enter a number")
else:
    print("Budget:", budget)

print("Ready for the next step")   # runs in BOTH cases
```

With `2500`: the else prints the budget and "ready for the next step" runs. With `abc`: except prints the message and "ready for the next step" still runs. In both cases the program keeps going.

**Keep the try block narrow** — only put the one risky line inside it. If you wrap 20 lines in a try, a real bug somewhere else gets caught and reported as "bad user input," and you'll spend an hour or two looking in the wrong place.

### The three exceptions you'll see constantly

| Exception | Cause | Safe response |
|---|---|---|
| `ValueError` | Converting something that isn't the right shape (turning `abc` into a number) | Catch it, ask the user for a number |
| `KeyError` | Asking a dictionary for a key that isn't there (a lead with no `phone` field) | Often no try needed — use `.get()`, which returns `None` instead of crashing |
| `ZeroDivisionError` | Dividing by zero (averaging budgets when there are no leads) | Check if the count is zero before dividing |

**Give each situation its own message.** Missing phone, invalid budget, and "no leads yet" are three different situations. Don't catch everything and print "something went wrong" — that tells nobody anything. Catch specific exceptions individually.

### Reading a traceback
When an error isn't caught, Python prints a traceback. Read it in three steps:

1. **Start at the bottom.** The last line names the error and the value that caused it — e.g. `ValueError` and the value `abc`.
2. **Find your line.** The line above tells you the file and line number — e.g. `app.py, line 12`.
3. **Trace upward** through the layers if there are several, to see how the program got there.

The slide also shows how to **capture the traceback as text inside an `except` block** so you can send it to a private log. The rule: **users see a clear message** ("enter a number"); **developers see the full traceback in the logs**. Never expose file paths and line numbers to users — sometimes those logs end up reachable via inspect element, which is a security flaw. AIs forget to do this too.

**Practical habit:** when you get an error, copy the **last line only** and search it — the last line is ~90% of where the answer is. Or paste the whole traceback into Claude.

### `else` and `finally`
Two more blocks:

- **`else`** runs only when the `try` finished without an error — put your success work there.
- **`finally`** runs no matter what, success or failure, when you leave the block — it's for cleanup: closing a file, closing a connection, logging an attempt that just finished.

Example with a file containing `2500` and `800`: you get "Loaded 2 leads" and then "File closed." With a file containing `abc`: "Invalid budget in file" and then "File closed." **"File closed" prints both times — that's what `finally` does.**

### Recap: everything together
One lead dictionary with a budget: `try` converts it, `except KeyError` if the budget field is missing, `except ValueError` if it's not a whole number, `else` prints "budget accepted", and `finally` prints "validation attempt finished" — which prints every time, for all three inputs.

Checklist to remember: catch **specific** exceptions; give a message the user can act on; keep success work in `else`; always use `finally` for cleanup; **never write a bare `except`** with nothing after it — it hides every bug.

### Your turn: `convert_budget()` — convert text to a number without crashing
Write a function that takes text and returns a whole number, or `None` if the text isn't a valid number — and **must never crash**. Test on four inputs: `"2500"`, `"$2,500"`, `"abc"`, and an empty string. Before running, **decide on purpose** whether the dollar-sign version counts as a number — either choice is fine, but decide it deliberately.

```python
def convert_budget(text):
    cleaned = text.replace("$", "").replace(",", "").strip()
    try:
        return int(cleaned)
    except (ValueError, AttributeError):
        return None

print(convert_budget("2500"))     # 2500
print(convert_budget("$2,500"))   # 2500 — cleaned first
print(convert_budget("abc"))      # None — no crash
print(convert_budget(""))         # None — no crash
```

The instructor's version cleans the text first (strips the dollar sign, commas, and spaces), then tries the conversion; if that fails it returns `None` instead of crashing. Gemini-generated variants differ slightly — one only catches `ValueError` where the instructor's also catches `AttributeError`, and the order of `strip()`/`lstrip()` varies — but functionally they're the same. Ask Gemini *why* it made different code.

**Why `None` and not `0`?** Returning `0` for bad input would be worse, because `0` looks like a real budget. A salesperson would see a lead with a "$0 budget" and think it's real. `None` clearly says "no value here."

### Missing dictionary key: `try/except KeyError` vs `.get()`
A lead has a name and a service but no budget. Grabbing the budget with square brackets crashes. Write it two ways:

```python
lead = {"name": "Sam", "service": "plumbing"}

# Version 1: treat a missing key as a real failure
try:
    budget = lead["budget"]
except KeyError:
    print("Budget is required")

# Version 2: .get() returns None instead of crashing
budget = lead.get("budget")
if budget is None:
    print("Budget is required")

lead["budget"] = 2500
print(lead.get("budget"))   # 2500 — success path works
```

Both versions print the same message for a missing budget and return 2500 once it's added. For **optional** data, `.get()` is shorter and reads cleaner. The `try`/`except KeyError` version is for when you'd rather treat a missing key as a real failure you want to stop and handle. Pick the one that matches what a missing key *means*.

**Slide note:** if `None` could be a *legitimate stored value*, use the `in` keyword to check whether the key exists at all. (`None` can exist as a real value — not everything missing is zero.)

### Divide by zero: `if` check vs catching `ZeroDivisionError`
Write `average_budget(total, count)` that returns the average, or the words "no leads yet" if there are zero leads. Write it twice — once with an `if` check before dividing, once by catching `ZeroDivisionError`. Test with `(5000, 2)` and `(0, 0)`.

```python
def average_budget(total, count):
    if count == 0:
        return "no leads yet"
    return total / count

print(average_budget(5000, 2))   # 2500.0
print(average_budget(0, 0))      # no leads yet
```

Both versions give 2500 for two leads and "no leads yet" for zero. **Which is easier to understand? The instructor picks the `if` version.** Zero leads isn't an error — it's a normal state for a new account. The rule of thumb: **if you can imagine the situation happening in the normal course of things, check for it with an `if` (the code reads like a sentence). Save `try`/`except` for things that are genuinely unexpected** — someone typing `abc` into a numeric field, a corrupted file, a server going down.

### Cleanup: `finally` with a file (and the `with` shortcut)
The code opens a file, prints "reading", reads it, then deliberately raises an error to simulate a parse failure. Your job: fill in the `finally` block so it closes the file and prints "file closed", then a last line checks `file.closed` and should print `True`.

```python
f = open("leads.txt")        # create leads.txt first (first two lines of the cell do it)
try:
    print("reading")
    f.read()
    raise ValueError("simulated parse failure")
except ValueError:
    print("could not parse leads")
finally:
    f.close()
    print("file closed")

print(f.closed)   # True — even though the error happened
```

Output: "reading" → the simulated failure is caught → "file closed" → `True`. Even though the error happened, `finally` still ran and closed the file.

The shortcut you'll actually use every day is the **`with` statement**: it opens the file and guarantees it's closed when the block ends, error or not — same as `finally`, just less code. `finally` remains the general tool for closing database connections, releasing locks, logging an attempt that ended.

### Wrap-up table: every problem had two reasonable approaches

| Problem | Approach A | Approach B |
|---|---|---|
| Currency text | Strict whole numbers only | Clean it (strip `$`, `,`, spaces) |
| Missing key | Catch `KeyError` | `.get()` |
| Zero leads | `if` check | Catch `ZeroDivisionError` |
| File cleanup | `finally` | `with` |

None of these is the *only* right answer. The question to ask: **which handles more bad input, and which is easier to read?** Judge code based on what it's promising to do — not on whether it ran once. You might be in a flow state, write amazing code that works once, then forget what you built — maintain readability for yourself too, not just whoever inherits it. Save your snippets; you'll use them in the second half.

### The three categories of failure (bridge to part two)
- **Expected input problems** — an empty name, a zero budget. Check for them and give a clear validation message. No exception needed.
- **Risky operations** — converting a number. Wrap them and catch the exact exception you expect.
- **Unexpected failures** — the database going down. Log the details privately, show a safe message.

And one hard rule: **never save half of a record.** The same boundary belongs in an AI agent: **validate the lead before the agent summarizes it or takes any action.**

---

## Part two: building the lead validator

### What we're building
A validator for a mock plumbing & landscaping company's leads. Raw input from an app: `{"name": "Sam", "business": "Landscaping", "budget": "abc"}`. The validator returns `{"ok": False, "lead": None, "errors": ["budget must be numeric"]}`.

Three steps along the bottom of the slide: **receive** the raw lead → **validate** it into either clean data or a list of errors → **route**: summarize it if it's good, explain the problem if it's not. No paid API needed.

**Why return a dictionary with `ok` / `lead` / `errors` instead of raising an exception?** Because a bad lead is not a crash — it's a normal outcome. The agent or app looks at `ok` and decides what to do. Same idea as the zero-leads example: expected situations get checked, not thrown.

### Why a validator matters (the business case)
A plumbing company gets ~50 web leads a day. Some have no name, some put "call me" and their phone number instead of a budget, and a lot are bots. Without a validator, every one of those goes to a real person or your AI — the AI first **burns your tokens**, then tries to **summarize garbage**, and worse, if you have a semantic layer connected to a database, it starts **gunking up your database** and you have to clean it later. The validator is the **filter valve**: junk gets a rejection, clean data goes through.

### The scaffolding and the contract
Start with an empty `errors` list, check each field, and only build the clean lead if there were no errors. The rules (the contract):

- Reject anything that isn't a dictionary.
- Require a name that isn't blank.
- Allow only `plumbing` or `landscaping` as the service.
- Convert the budget into a real number above zero — and **reject `True`/`False`**, which Python counts as numbers.
- On failure, return `lead: None` with an error list.

```python
def validate_lead(raw):
    errors = []

    if not isinstance(raw, dict):
        return {"ok": False, "lead": None, "errors": ["input must be a dictionary"]}

    name = (raw.get("name") or "").strip()
    if not name:
        errors.append("name is required")

    service = (raw.get("service") or "").strip().lower()
    if service not in ("plumbing", "landscaping"):
        errors.append("service must be plumbing or landscaping")

    budget_raw = raw.get("budget")
    if isinstance(budget_raw, bool):
        errors.append("budget must be numeric")
    else:
        try:
            budget = float(str(budget_raw).replace("$", "").replace(",", "").strip())
            if budget <= 0:
                errors.append("budget must be above zero")
        except (ValueError, TypeError):
            errors.append("budget must be numeric")

    if errors:
        return {"ok": False, "lead": None, "errors": errors}

    clean = {"name": name, "service": service, "budget": budget}
    return {"ok": True, "lead": clean, "errors": []}
```

The budget check is the careful one: reject `True`/`False`, try to convert, catch the failure, then check it's a real number above zero. Each field gets its own check and its own message. Only if the error list is empty do we build the clean lead.

### Walking through the output
- **Bad lead** (`Sam`, budget `abc`): `ok` is `False`, `lead` is `None`, and the error list has one item: "budget must be numeric." No crash, no traceback, no red box — the function looked at bad data and, because we wrote the exceptions, reported what was wrong with it.
- **Good lead** (budget `2500`): `ok` is `True`, errors is empty, and `lead` is a clean dictionary with the name stripped and the budget turned into a real number, `2500.0`.

**The validator never raises an error to the caller.** It catches the conversion failure inside, turns it into a message, and returns normally. Whoever calls it — an app, an agent, a tester — only has to look at one field, `ok`, to know what to do next. Bad data becomes a normal result and doesn't clog the pipeline.

### The "True is not defined" live-debugging moment
Running the generated test cell threw `NameError: name 'true' is not defined` — the Gemini-generated code block had written lowercase `true` instead of Python's `True`. Python's traceback correctly pointed at the line, which made it fixable quickly.

Instructor commentary on AI models: he prefers **Claude or OpenAI for code**; Gemini is "unbeatable" for research (reading arXiv papers) but bad for code, because it wasn't trained heavily on code and is weak at contextual programming. The generated block had also broken something one cell above.

The important lesson: even if an AI solves the error for you, **make sure you understand what the issue was** — otherwise it creates a hole in your understanding. Trace it back yourself first.

### Testing: one baseline, change one thing at a time
Start with a good lead as the baseline, then change **exactly one thing at a time**:

| Changed input | Error message returned |
|---|---|
| Remove the name | name is required |
| Budget `"abc"` | budget must be numeric |
| Budget `0` | budget must be above zero |
| Service `"roofing"` | service must be plumbing or landscaping |
| Pass `None` instead of a dictionary | input must be a dictionary |

Every case must come back `ok: False`, `lead: None`, with the exact expected message. Five lines of pass → all tests passing. Before the fix, bad *syntax* (`true`) crashed the tests; now bad *inputs* don't crash anything — they return messages.

**This is what a test suite looks like at its simplest:** one good baseline, change exactly one thing, check the result. If you change the validator next week and break the zero-budget rule, this cell stops at that line and tells you right then — generally much cheaper than a customer finding the issue in production. If you build your own validator later, copy this test pattern (you'll have to edit it a bit).

### Wiring it into Langflow (visual)
Two ways to plug the validator into an agent. First, **Langflow** — the visual canvas, four boxes:

1. **Input box** — receives the lead
2. **Python box** — runs the validator (paste your *tested* validator inside)
3. **Condition box** — checks whether `ok` is `True`
4. **Reply box** — shows either the success message or the error list

Wire two branches: give it Sam with budget `abc` and the error branch replies "budget must be numeric"; change the budget to 2500 and it goes down the success branch. We didn't do it live — it's a recommended exercise after class.

**The through-line:** Langflow is the same shape as the code version — input, validate, branch on `ok`, reply. If you can draw it as four boxes, you can write it as four functions. Functions are LEGO bricks you attach to build the whole piece; Langflow is just a visual way of looking at them. Before AI, writing every variation of those bricks by hand didn't make sense — now LLMs make it practical.

### Wiring it into LangGraph (code)
**LangGraph is the code version** — like a flowchart you write in Python.

- **The state** is one dictionary that travels through the graph, with five slots: the raw lead, the clean lead, the error list, a status word, and the reply. It starts mostly empty and fills up as it moves through nodes.
- **A node** is just a normal function that receives the state and **returns only the fields it changed**. The `validate` node runs our validator and fills in `lead`, `errors`, and `status` ("ok" or "bad"); `summarize` writes the reply for a good lead; `handle_error` joins the error messages into a reply.
- **The edges** connect the nodes: the graph starts at `validate`, then a `route` function reads the status word from the state — if it says ok, go to `summarize`; if bad, go to `handle_error`. Both final nodes connect to `END`.

```python
# pip install langgraph (the cell installs it — takes a bit)
from langgraph.graph import StateGraph, END
from typing import TypedDict

class LeadState(TypedDict, total=False):
    raw: dict
    lead: dict | None
    errors: list
    status: str
    reply: str

def validate(state):
    result = validate_lead(state["raw"])
    return {"lead": result["lead"], "errors": result["errors"],
            "status": "ok" if result["ok"] else "bad"}

def summarize(state):
    service = state["lead"]["service"]
    who = "a plumber" if service == "plumbing" else "a landscaper"
    return {"reply": f"Thanks {state['lead']['name']}, {who} will call."}

def handle_error(state):
    return {"reply": ". ".join(state["errors"])}

def route(state):
    return "summarize" if state["status"] == "ok" else "handle_error"

g = StateGraph(LeadState)
g.add_node("validate", validate)
g.add_node("summarize", summarize)
g.add_node("handle_error", handle_error)
g.set_entry_point("validate")
g.add_conditional_edges("validate", route, {"summarize": "summarize", "handle_error": "handle_error"})
g.add_edge("summarize", END)
g.add_edge("handle_error", END)
app = g.compile()

print(app.invoke({"raw": {"name": "Sam", "service": "plumbing", "budget": 2500}})["reply"])
print(app.invoke({"raw": {"name": "Sam", "service": "plumbing", "budget": "abc"}})["reply"])
```

Running it with one good lead and one bad: the good one goes down the summarize branch → "Thanks Sam, a plumber will call" (path: validate → ok → summarize → end). The bad one goes down the error branch → "budget must be numeric" (path: validate → bad → handle_error → end). Same entry point, two different exits — **that's the whole idea of an agent with error routing: the validator decides, the graph routes, each branch gives a reply.**

Note at the bottom of the slide: this routing handles *validation errors we return on purpose*. A real crash inside a node still needs a `try`/`except` around the whole thing (covered a few slides later).

### Conditional routing — why it matters at scale
The routing table: ok → summarize → end; bad → handle_error → end. It gets more complex with harder workflows — e.g. a data-analysis node that checks whether a number has decimals, or a currency check ($ / £ / peso) that splits into three nodes: send to the Mexico team, the US team, or Europe (handle the error otherwise).

**The AI placement principle (big idea of the night):** you *could* let an LLM do the validating and routing — it can do all of it — but **don't use LLMs like that.** Imagine 20–30 services and 10,000 leads a day: a loose LLM would hallucinate like crazy, loaded with context, burning tokens on every row. Instead, build a **deterministic pipeline** (which you can now build with LLMs' help) that routes traffic so the LLM **only gets a small, clean, valid state at the very end**. Fewer input tokens, fewer output tokens, no mistakes in the pipeline itself — and the AI-added reply is more personalized than a template ("Thanks Sam… a plumber will call you in a few hours"). The AI never touches the pipeline; it's added right at the end to summarize the result. If you later swap the mock reply for a real model, **only the `summarize` node changes** — the pipeline stays sturdy and deterministic.

### The mock agent (no AI needed)
The "Thanks Sam, a plumber will call" reply came from a small static function: look up whether the service is plumbing or landscaping, pick plumber or landscaper, build a sentence. No AI — and if you don't want to use AI (API calls cost money), you don't have to. When you do want a real model, **swap the inside of that one function for a model call and nothing else on the graph has to change.**

**API key safety (explicit warning):** never put API keys anywhere they might go public — there are bots trolling the internet millions of times a day specifically scraping for API keys. Triple-check this. Where to get keys: a Claude subscription includes API credits (~$20 with the $20 plan, ~$100 with the $200 plan); **OpenRouter** gives you access to nearly every model — note some *free* models send your data back for training, so if you don't want that, use the **ZDR (zero data retention)** setting/filter; **DeepSeek** is genuinely cheap and the instructor uses it a lot. Free models work fine for simple things.

**New failure modes when you plug in a model:** timeouts, rate limits, and — with OpenRouter non-frontier models — occasionally malformed output. These are learnable with what you just built: write a function to detect a rate-limit hit, save the error without printing it, and fall back to a generic message (redundancy, like the fallback patterns from two lectures ago).

### The outer edge: `submit_lead()` with one broad `except`
How all of this sits inside a real application:

```python
SAVED = []

def submit_lead(raw):
    try:
        result = validate_lead(raw)
        if not result["ok"]:
            return result["errors"]          # validator messages go straight to the user
        SAVED.append(result["lead"])         # save the lead
    except Exception:
        traceback.print_exc()                # full traceback → private server log
        return ["could not submit the lead, please try again"]
    return ["lead saved"]
```

Inside the `try` we run the validator; if it's not ok, return the error messages to the user; if it's ok, save the lead. **Around all of that, one broader `except` catches anything unexpected**, writes the full traceback to a private log, and tells the user "could not submit the lead, please try again." Only if everything succeeds do we return "lead saved."

**This is the one place where catching a broad exception is correct — the extreme outer edge**, the last safety net. Inside your helpers you still catch specific errors.

**Never tell the user "lead saved" if the saving failed.** And be careful with `finally`: everything you learned means `finally` always runs — if you accidentally put "saved lead" in a `finally`, you'd report success even on failure.

Testing it: three bad submissions then one good. The messages — "budget must be numeric", "name is required", "input must be a dictionary" — come straight from the validator, pass through `submit_lead`, and would go right to the user's screen. The good lead returns "lead saved" and the saved count at the end is **1**.

### Data hygiene: the saved count is your guard's guard
Only the valid lead makes it into the database; the bad ones never touch it. In a real app, **keep checking and rechecking the saved count** to see if the boundary is working, and look at the data to confirm: bad data gets the correct message, good data gets stored, nothing in between happens. If a mistake made the saved count say 4 instead of 1, you wouldn't get an error — you'd just be **storing garbage**, and a few months down the line you'd be reverse-tracing spaghetti code or cleaning junk out of the database. Think of the validator as a guard, and this check as verifying the guard is actually stopping the bad stuff.

**AI coding hygiene warning:** even frontier models, when prompted and let loose, don't know what they're doing — they write end-to-end/unit tests, and **as long as the tests are green they keep going**, especially on long-running tasks. An LLM sees `saved = 4` and thinks "runs perfectly, unit tests pass." Someone with general intelligence sees it and says "wait, that's wrong." You have to be the one who catches it. A unit test that doesn't test the saved count won't save you.

### What happens when storage itself breaks
Replace the save function with one that **always crashes**, to simulate the database going down. Then submit a perfectly good lead:

- **The user sees:** "could not submit the lead, please try again."
- **The private log shows:** the full traceback.
- The lead is not saved.

Two parts, kept separate: the log is private (just for the people working on the project) and the message is what you send the user. **No traceback in the UI.**

**Security warning:** sometimes tracebacks find their way into the front end, and someone with inspect element can find them. For small apps it's okay-ish, but for real cybersecurity you don't want it — a traceback can give away the shape of your backend, and hackers have gotten really sophisticated. Keep the error logs in your server logs, never parsed on the edge. (Nice-to-have: some way to get pinged/alerted when the service goes down.)

Then **restore the real save function and submit a good lead again** — confirm the app works after every failed attempt. Note the contrast: with a bad input *unhandled*, Python's own traceback is what the user would see — that's the big no we're avoiding.

## Best practices

- **Keep the try block narrow** — only the one risky line. Wide try blocks disguise real bugs as "bad user input" and cost you hours of looking in the wrong place.
- **Catch specific exceptions**, not everything. Give each situation (missing phone vs invalid budget vs no leads) its **own message** — never a generic "something went wrong."
- **Use `if` for expected situations, `try`/`except` for unexpected ones.** If you can imagine it happening in the normal course of things (zero leads on a new account), check it with an `if` — the code reads like a sentence. Save exceptions for things you can't predict (abc in a number field, corrupted file, server down).
- **Use `else` for success work and `finally` for cleanup** — or the `with` statement for files, which is the everyday shortcut.
- **Return `None`, not `0`, for missing values.** Zero looks like a real budget; `None` clearly means "no value." If `None` itself is a legitimate stored value, check key existence with `in` instead.
- **Decide ambiguous rules deliberately** (does `"$2,500"` count as a number?) — either answer is fine, but choose it on purpose.
- **Users see clear messages; developers see full tracebacks in private logs.** Never expose file paths, line numbers, or tracebacks to users — inspect element is a real attack surface, and it reveals the shape of your backend.
- **The broad `except` belongs only at the extreme outer edge** (like `submit_lead`); helpers inside still catch specific errors.
- **Never save half a record, and never say "lead saved" if the save failed.** Watch what you put in `finally` — it runs no matter what.
- **Validate before the AI acts.** The validator is a filter valve: junk gets rejected before it burns tokens or gunk your database.
- **Keep AI at the end of the pipeline, not in it.** Deterministic code routes and validates; the LLM only summarizes the small, clean result. Fewer tokens, no hallucination risk in the flow.
- **Test with one good baseline, then change exactly one thing at a time.** Re-run all tests after any change — cheaper than a customer finding the bug.
- **Understand the fixes an AI makes for you.** Letting AI solve errors without understanding creates holes in your knowledge.
- **Save your snippets** — the convert/key/divide/cleanup functions compose into bigger tools.
- **Never expose API keys** anywhere they could be scraped; bots hunt for them constantly.
- **Practice readability over "it ran once."** You'll need to read your own code months later.

## Common mistakes & gotchas

- **Bare `except:`** with nothing after it — hides every bug in the block. Always name the exception.
- **Catching everything with one generic message** ("something went wrong") — tells the user and you nothing.
- **Wrapping 20 lines in one try** — an unrelated bug gets reported as bad input.
- **Returning `0` for bad input** — zero is a real budget; downstream code and salespeople can't tell it apart from a genuine $0.
- **`True`/`False` pass numeric checks** — in Python booleans *are* numbers (`True == 1`), so a budget of `True` slips through an `int()`/`float()` conversion. Reject bools explicitly.
- **Case-sensitivity across languages: lowercase `true` in Python** — the live bug of the night: Gemini generated JS-style `true`, throwing `NameError: name 'true' is not defined`. Python needs `True`.
- **Generated code catching only `ValueError`** when `AttributeError` is also possible (calling `.replace` on something that isn't a string, e.g. `None`).
- **`strip()` vs `lstrip()` ordering drift** between AI-generated variants — functionally similar but worth noticing when comparing code.
- **`None` as a legitimate stored value** — `.get()` returning `None` can't distinguish "key missing" from "key holds `None`"; use `in` when it matters.
- **Tracebacks leaking to the frontend** — inspect element exposes them; they reveal backend shape and are a security flaw.
- **Free/cheap model quirks** — timeouts, rate limits, and malformed output (especially non-frontier models via OpenRouter); free tiers may train on your data (use ZDR).
- **Green tests ≠ correct code** — AI-written tests only check what they were written for; an LLM will happily accept `saved = 4` when it should be 1. Verify counts and outputs yourself.
- **Putting success messages in `finally`** — it runs even on failure, so you'd claim "saved" when the save crashed.
- **Bad data silently flowing downstream** (e.g. zeros stored as real budgets) — no error is thrown, so the junk surfaces months later and you reverse-trace it. Filter early.

## Q&A / discussion worth keeping

- **"Is this only a chatbot, or can it be a form?"** — LangGraph is just a code representation of a graph of functions; the blocks are the same whether the front end is a chatbot, a website form, or anything else. The user only ever sees the input ("what's your name? … what budget?") and the final reply — everything behind the scenes is invisible.
- **How do Langflow and LangChain/LangGraph relate?** — LangGraph is easier to visualize in your head *after* Langflow/LangChain: blocks contain functions; in LangGraph the block becomes a node on a graph. Once you can look at a function and see it as a brick that leads to other bricks, code stops being code and becomes a flowchart — the highest-abstraction view of what you're writing.
- **"How do I prompt an LLM to keep code this simple?"** — Describe what you want in your own words (inputs, what to reject, what each node does, where to end), run the block independently to see if it works, and **ask the model to summarize what the code block does at a higher level** so you understand it. Most models write code well now — Gemini is the exception the instructor rags on for code.
- **The Mario analogy for routing** — think of inputs as WASD: W's node makes the sprite jump, S goes down, A/D go left/right, then end. If someone presses Q or E, that's a bad route — handle the error (do nothing, end). Each node is a function; describe it to Claude and it writes the brick.
- **Flowcharts before code** — the instructor's old Fundamentals of Programming professor made students hand-trace: if you can imagine yourself doing each step by hand, you can draw the route and build the flowchart. Flowcharts teach you that an algorithm is just a set of rules — and thanks to LLMs you no longer have to rote-learn syntax the way engineers did 8–9 years ago; the skill that transfers is understanding *why* the code is shaped that way. That abstraction carries across languages (he's learning Assembly for a game project, Songs of Six — Assembly → C → Python trade speed for readability, and pure routing is the only way to simulate a million units).
- **Where does the AI go in an agent pipeline?** — At the very end only. A deterministic validator/router handles the volume (10k+ leads would make a loose LLM hallucinate and burn tokens); the LLM just personalizes the final reply. It's better UX *and* it's safe, because the AI never touches the pipeline.
- **Model recommendations** — Claude or OpenAI for code; Gemini for research/papers; DeepSeek as a cheap daily driver; OpenRouter for choice across models. Watch ZDR on free models.
- **On AI-written tests** — models keep going as long as tests are green and won't notice a wrong saved-count; you're the general intelligence in the loop. Checking outputs like "saved count = 1" is the hygiene that prevents months-later garbage-data archaeology.

## Applying this to the capstone website

- **Wrap risky conversions in your TS code the same way.** Python's `try/except` maps to JavaScript/TypeScript `try/catch`; `finally` exists in TS too with identical semantics, so "log the attempt and clean up no matter what" translates one-to-one. Python's `int("abc")` throwing `ValueError` ≈ JS `parseInt("abc")` returning `NaN` — TS won't throw, so use `Number.isNaN()` checks where you'd use a Python `except`.
- **Build a quiz-answer validator with the exact same contract.** A `validateAnswer()` that returns `{ ok: boolean, value, errors: string[] }` instead of throwing mirrors `validate_lead` — one `ok` field for the caller to branch on. TS interfaces make this contract explicit: `interface ValidationResult { ok: boolean; lead?: CleanLead; errors: string[] }`. Each bad-input test (missing field, wrong type, zero, non-dict) becomes a Jest/Vitest unit test — same "one baseline, change one thing" pattern.
- **Return `null`/`undefined`, never `0`, for "no value"** in study-progress data (e.g. a session score of "not taken yet" should be `null`, not `0` — same reasoning as the $0-budget trap). And mind JS's falsy-zero gotcha: `score || default` treats a legit `0` as missing — Python's `None`-vs-`0` discussion is the exact reason to prefer `score ?? default` (nullish coalescing) in TS.
- **Keep error messages user-facing and tracebacks server-side.** On the site, show "Please enter a valid answer"; log full error details to the server/`console` only. Python's `traceback.print_exc()` in a private log ≈ TS `console.error(err)` server-side / structured logging — and never render raw error objects (stack traces) in React components.
- **Use one broad catch at the outer edge only.** A top-level `error.tsx` boundary / `try/catch` around page data-fetching in Next.js is your `submit_lead` outer edge; inner helper functions should still `catch` specific things (e.g. `JSON.parse` → `SyntaxError`). Python `.get("key")` ≈ TS optional access `lead?.budget` or `?? ""` for the missing-key case.
- **Route good/bad paths explicitly, deterministic first.** The validate → branch → summarize pattern maps to a Next.js server action or API route: validate the input, branch on `ok`, and keep any AI (e.g. a future "explain my wrong answer" feature) at the final reply step only — never inside the validation logic, for the same token/hallucination reasons from class.

## Homework / what's next

**Homework:** add **one new validation rule with a test** — require a phone number for plumbing leads. Write (or have AI write) the **failing test first**, then add the rule, then **re-run all the existing tests** to make sure nothing broke. This write-test-first habit is how professional software engineers keep code guardrailed; it's the pattern to internalize.

The instructor will share the notebook file (via Sean) so you can work through the code blocks yourself — and recommends re-running the Gemini/Colab prompt boxes after class, or regenerating them with a better coding model, deliberately looking for the small errors they introduce as debugging practice.
