# Python Class 8 — Functions as Agent Tools

**Recording:** Class 8 video | **Runtime:** ~124 min | **Instructor:** Ameya (TA/lead)

## Context — where this class fits

Last class (Class 7) covered loops: running the same logic on every item in a list. This class takes the next step — packaging repeated logic into functions, and then seeing how those same functions become *tools* that an AI agent can call. The running example for the whole class is a lead-intake app: a business website where people fill out a form asking for a callback, and the code checks each form, decides what happens to it, and logs the result. This is also the foundation for the LangChain/LangGraph sessions the course is heading toward — Ameya's warning: LLMs running through your codebase tend to overcomplicate things, so knowing this material lets you tell whether your agent is heading toward what you want or spiraling (his joke: it prevents "LLMs running 10,000 end-to-end tests for a to-do app").

## Key concepts

### Loop recap: the tally pattern

The class opened by recapping last week's loop over a `leads` list — each lead is a dictionary (a little record with a name and a zip code). An empty dictionary `zip_counts` keeps a tally; the loop grabs each zip, adds 1 to its count, and prints a line. When the loop is done, it prints the tally (94102 appears twice, 94103 once).

```python
leads = [
    {"name": "Devin", "zip": "94102"},
    {"name": "Sora",  "zip": "94102"},
    {"name": "Elena", "zip": "94103"},
]

zip_counts = {}
for lead in leads:
    zip_code = lead["zip"]
    zip_counts[zip_code] = zip_counts.get(zip_code, 0) + 1
    print(f"{lead['name']}: {zip_code}")

print(zip_counts)   # {'94102': 2, '94103': 1}
```

The point: we wrote the logic once and the loop ran it three times. The clever line is `zip_counts.get(zip, 0) + 1` — it asks "do we already have a count for this zip? If yes, give it to me; if not, pretend it's zero," then adds one and stores it back. No special case needed the first time you see a zip. Asked "how many times did the print inside the loop run?" — 3 times, once per lead (the tally print runs once).

Where you see this at work: counting anything by category — orders by state, tickets by priority, logins by role. It's almost always the same shape: empty dictionary → loop → `.get(key, 0) + 1`. Think of it as a Lego block.

**Slide warning:** a loop over a normal fixed list will always finish. You *can* make one run forever if you keep adding items to the list while looping over it. Don't do that.

### The copy-paste bug

Real-world setup: the app receives leads from three places — website form, mobile app, and a CSV file upload. Each entry point must check the same rules: does the email look valid (has an @ and a period), and is the zip code five characters? The same check was copy-pasted three times. In the slide, someone edited the mobile API copy and dropped the "period in the email" check — so the mobile app lets through bad emails the website would reject, and those bad records flow straight into the sales system. Someone tries to call the lead back and it fails.

When one rule lives in three different places, the copies eventually drift apart. Everybody who has written code has copy-pasted something and then fixed only one copy. Ameya's analogy: if you write the same recipe on three index cards and fix the typo on only one card, the other two still have the typo. This bug shows up months later, in a part of the system nobody remembers writing, sometimes after the person who made it has left the company — it only surfaces once volume is reached. AI also glosses over it, because if the code looks good enough and the logic fits, it's a blind spot for AI tools.

### Reusable functions: one rule, one place

The fix is a function. **Before:** three copies of the rule in three files — changing the rule means remembering every copy. **After:** one function `is_valid_lead(email, zip_code)` that checks the email has an @ and a period, the zip is five characters, and returns `True` only if both checks pass. All three entry points call this one function.

The payoff on the slide lists three benefits for three different people:

- **User:** consistent behavior across web, mobile, and CSV.
- **Engineer:** testability — you can test the rule by itself without spinning up the whole website.
- **Agent:** once your logic is a clean function, it's a ready-to-use tool an AI agent can call.

A function is a nice Lego block. For AI specifically: models are probabilistic (in their vector space they're always guessing the next token), so if you have an AI write the same function multiple times, it might change ever so slightly each time. Reusing one function maintains consistency across the codebase. Modern AI agents increasingly handle this with a "semantic layer" to keep things consistent, but the principle stands.

### Anatomy of a function: `def`, parameters, docstring, return

The `def` keyword starts a function (short for *define*), then the name, then parentheses with the inputs (called **parameters**), then a colon, and everything indented underneath is the body.

```python
def is_valid_email(email):
    """Return True if email looks valid (has an @ and a period)."""
    return "@" in email and "." in email


def compute_lead_score(tier, in_service_area):
    """Score a lead: 50 base, +30 if enterprise tier, +20 if in service area."""
    score = 50
    if tier == "enterprise":
        score = score + 30
    if in_service_area:
        score = score + 20
    return score

compute_lead_score("enterprise", True)   # 100  (50 + 30 + 20)
```

The line in triple quotes is a **docstring** — a plain-English description of what the function does. `return` sends a value back to whoever called the function.

The `=` vs `==` trap: one equal sign **assigns** (`score = 50` sets it); two equal signs **compare** (`tier == "enterprise"` asks a question). Mixing them up is a common error, though Python will call it out.

### Sets, guards, and protecting agent tools from bad input

`service_zips` is a **set** — like a list, but checking whether something is in it is very fast. The function first guards against bad input, then does real work:

```python
service_zips = {"94102", "94103", "94110"}

def in_service_area(zip_code):
    if not zip_code or not isinstance(zip_code, str):
        return False                      # guard: reject bad input right away
    return zip_code.strip() in service_zips
```

Walked through with three leads: Devin (`94102`, in the set) → `True`, active; Sora (zip not in the set) → `False`, refer out; Elena (zip blank) → `False` via the guard.

The first line inside the function is the one to notice: before doing any real work it asks "is the zip empty, or not text at all?" If either is true, return `False` right there and stop. That's a **guard** — it protects the rest of the function from bad input. Only after the guard passes does it strip spaces and check the set.

Why this matters for agents: an AI model will sometimes hand your tool the wrong thing — it's probabilistic. A number instead of text, or nothing at all. Gemini does this. A tool that crashes on bad input breaks the whole agent run; a tool with a guard protects against that.

One subtlety flagged on the slide: the table says Elena gets a "validation prompt," but the code returns "refer out" for her, same as Sora — the function only answers yes or no, so a blank zip is indistinguishable from an outside-area zip. If the app needs to treat those differently, the function has to return a reason too (that comes a few slides later).

Real-world maintenance: when the business says "we now serve 94111," you add one zip to the set — you don't touch the function. Good separation means the data changes, not the logic.

### Print vs return — the biggest beginner mistake

`print` and `return` look similar but do completely different things. **Print** writes text on the screen for a human to read. **Return** hands a value back to the program.

```python
def route_lead_bad(lead):
    print("Accepted")          # only prints — returns nothing

status = route_lead_bad({})
# status is None — nothing was returned
# status.upper() later → AttributeError: 'NoneType' has no .upper()


def route_lead_good(lead):
    return "accepted"          # hands the value back

status = route_lead_good({})
# status == "accepted" — can display it, save it, pass it on
```

In the bad version, when the app stores the result in `status`, `status` is `None`. If the app later tries `status.upper()` to save into a database, it crashes, because `None` has no `.upper()`. In the good version, `status` actually holds `"accepted"` and the app can display it, save it, and pass it on.

Rule of thumb: **print is for humans, return is for code.** The reason this trips people up is that the bad version *looks* like it works — you run it, you see "Accepted" on screen, you move on. The crash comes later, somewhere else, when something else tries to use the result and finds `None`. "Print lies to you sometimes by showing you the right thing at the wrong time."

He demoed this in Colab: the bad one printed "Accepted" on screen but gave back `None`; the good one gave the actual text.

**A test you can use forever:** write `x = some_function()` then `print(x)`. If you get `None`, that function is printing instead of returning. Nine times out of ten, that's the bug.

### Default parameters

Default parameters let the caller skip an argument:

```python
def book_callback(name, urgency="normal"):
    window = "2 hours" if urgency == "high" else "24 hours"
    return f"Callback for {name} scheduled within {window}."

book_callback("Dana")                    # 24 hours (urgency falls back to "normal")
book_callback("Liam", urgency="high")    # 2 hours
```

The default sits right in the parentheses — `urgency="normal"` is Python's way of saying "this argument is optional, and here's what to use if the caller doesn't say."

Two rules that go with this:

1. **Parameters with defaults must come after ones without.** `def fn(a, b=1)` is fine; `def fn(a=1, b)` is an error.
2. **Never use an empty list as a default.** Python creates that list *once*, when the function is defined, and every call shares it — tags from one call leak into the next. "People have lost afternoons trying to fix this." The fix: default to `None` and create the list inside the function.

```python
def add_tag(item, tags=None):        # good
    if tags is None:
        tags = []
    tags.append(item)
    return tags
```

Why defaults matter for agent tools: when an AI model calls `check_availability`, it may only know the zip. If `day` has a default, the model doesn't have to supply it. That's the mutable-default trap context — and it's one even experienced developers hit.

### Scope: globals vs parameters

**Scope** means which variables a function can see.

```python
discount_rate = 0.15            # a global

def calculate_quote_bad(price):
    return price * (1 - discount_rate)     # works, but reads a hidden global


def calculate_quote_good(price, discount=0.0):
    return price * (1 - discount)          # everything comes in through the parameters

calculate_quote_good(100)            # 100
calculate_quote_good(100, 0.15)      # 85
```

The bad version works, but it's hidden: if anyone changes `discount_rate` anywhere in the program, every quote changes, and you can't tell that by reading the function call. Worse: if you *assign* to `discount_rate` inside the function, Python treats it as a brand-new local variable for the whole function — and reading it before that line raises `UnboundLocalError`.

The good version takes the discount as a parameter defaulting to 0. Same inputs → same outputs, every single time. That's the predictability we want for agent tools later. Think of two people running the bad version at the same time and one changing the global halfway through — the other person's quote changes under them. With a parameter, each call carries its own discount, so nothing leaks.

Practical rule: **if a function needs a value, pass it in; if a function produces a value, return it. Don't reach outside.** The one exception is constants that never change — like `service_zips` from before, or `calendar_db` in the workshop — written in CAPITALS so everybody knows they're fixed. This hygiene pays off when working with multiple people, or when you come back to a codebase after 6–8 months and don't remember all the little things you did.

### Composing functions into a pipeline

Small functions combine into a pipeline. `validate_email` checks the email, `in_service_area` checks the zip, and `process_lead` calls both and decides: bad email → rejected; good email but outside the area → partner referral; both good → dispatched.

```python
def process_lead(lead):
    if not validate_email(lead.get("email", "")):
        return {"status": "rejected", "reason": "bad email"}
    if not in_service_area(lead.get("zip", "")):
        return {"status": "partner_referral", "reason": "outside area"}
    return {"status": "dispatched", "reason": "all checks passed"}

results = [process_lead(l) for l in leads]   # list comprehension — next class's topic
```

Trace: Nora — good email, 94102 → dispatched. J — email `j_invalid` (no @ sign) → rejected. Ava — good email but zip not served → partner referral.

Note `process_lead` returns a **dictionary with a status and a reason**, not just `True`/`False`. That makes the result easy to log, to show the user, and later to hand back to an AI agent. Three stages: extract the data, validate it, route it.

`process_lead` has three returns, one per outcome — **the first check that fails wins.** Bad email → return rejected and stop. Good email outside area → return partner referral and stop. Only if both pass is it dispatched. The order is deliberate: there's no point checking the zip of a lead whose email is trash.

The square-bracket line at the bottom is a **list comprehension** — next class's topic; for tonight just read it as "run `process_lead` on every lead and collect the results in a list." That's composing functions with a loop.

### In-class challenges (quiz)

- **Return vs print.** `def add(a, b): print(a + b)` then `result = add(2, 3)` — is it true that `result` holds 5? **False.** 5 appears on screen because *print* wrote it there; the function has no return line, so it hands back `None`, and `None` is what lands in `result`. This is the mistake beginners make the most.
- **Default parameter values.** `def greet(name, greeting="hello")` — what does `greet("Ada")` return? **"hello Ada"** — the greeting falls back to its default. No error, because a default makes the argument optional.
- **Variable scope.** "The print will work and show 100" where `total` was created inside `calculate()` — **False.** `total` only exists inside the function; outside it, Python has never heard of it → `NameError`. If you want the value out, return it.
- **Returning more than one value.** Best way to give back both a minimum and a maximum? **One return line with a comma** (a pair) — the caller writes `low, high = find_range(nums)`. Printing them gives the caller nothing; a global is the scope problem from the previous slide; "impossible" is just wrong.
- **Match the parameter syntax** (left for homework, then confirmed at the end): `def report(title, *args, **kwargs)` — `title` is a normal required positional argument; `*args` collects any extra positional arguments into a tuple; `**kwargs` collects any extra keyword arguments into a dictionary.
- **Design a reusable discount function** (left for homework, with the answer essentially given): the best design for use across a script and later a test suite is `def apply_discount(price, pct): return price * (1 - pct)` — everything it needs comes through the parentheses and it returns the value. The version that reads a global and prints can't be tested and can't be reused. The version that mutates a shared dictionary in place has hidden side effects — a few slides later, that's what we call **impure**.

### Returning multiple values: the (ok, reason) pair

A function can return more than one value. `check_lead` returns two things: `True`/`False` **plus a reason** — `no_phone` is False because it's missing the phone; "no @ in the email" is False because the email is trash; otherwise `True`.

```python
def check_lead(lead):
    if not lead.get("phone"):
        return False, "missing phone"
    if "@" not in lead.get("email", ""):
        return False, "no @ in email"
    return True, "valid"


ok, reason = check_lead({"email": "gabe@x.com"})   # unpacks the pair
# ok == False, reason == "missing phone"  →  print(f"Rejected: {reason}")
```

On the calling side you write two names on the left of the equal sign — `ok, reason` — and Python fills them in order. Every return line in `check_lead` hands back a yes-or-no and a reason. The **pair pattern** (True/False + a reason) is the one used in the workshop, and the one to use for *anything that can fail*. A bare `False` tells the caller nothing; a `False` plus "missing phone" tells the caller what to fix or what to tell the user.

**Tuple vs dictionary.** A tuple is quick and fine for two values used inside your own code. A dictionary has named keys (`ok`, `reason`) — it explains itself, it's easy to add fields, and it converts straight to JSON, which is what websites and AI agent tools use. Rule of thumb: **three or more values, or anything leaving your code → use a dictionary.** Six months later nobody has to remember whether the reason was the first or second item in the tuple.

### `*args` and `**kwargs`: variable arguments

Sometimes you don't know how many arguments are coming. `*args` and `**kwargs` handle that:

```python
def log_event(action, *args, **kwargs):
    print(action, args, kwargs)

log_event("lead_ping")                                  # args=() kwargs={}
log_event("lead_routed", "vip", "urgent")               # args=('vip', 'urgent')
log_event("lead_saved", "vip", agent="bot-1", latency=42)
# args=('vip',)  kwargs={'agent': 'bot-1', 'latency': 42}
```

In `log_event`, `action` is a normal parameter; `*args` collects any extra plain values into a **tuple**; `**kwargs` (double star, "details" in the slide) collects any extra named values into a **dictionary**.

This is great for logging and wrappers — but **don't use it for core business functions.** Named parameters like `lead_id` and `email` give you autocomplete, type checking, and — important tonight — they tell an AI model exactly what inputs a tool is expecting. If `validate_lead` took `**kwargs`, nobody — human or AI — could tell what it expects. Named parameters *are* documentation. Use `*args`/`**kwargs` when writing a logger, a wrapper around somebody else's function, or passing options through to a library.

### Pure functions and testing

A **pure function** always gives the same output for the same input and doesn't change anything outside itself.

```python
def normalize_zip(raw_zip):
    """Strip spaces; return the zip only if it is exactly 5 digits, else ''."""
    cleaned = raw_zip.strip()
    return cleaned if cleaned.isdigit() and len(cleaned) == 5 else ""


assert normalize_zip(" 94110 ") == "94110"   # spaces stripped
assert normalize_zip("9410") == ""           # 4 digits → empty
assert normalize_zip("abcde") == ""          # letters → empty
print("All tests passed")
```

`normalize_zip` is small, but look at the shape: strip the spaces, return the zip only if it's all digits and exactly 5 long, otherwise return an empty string. Nothing else happens — no file, no database, no screen. That's what lets the three `assert` lines beneath it work: the whole test suite calls it, compares the answer, done. Each assert says "this must be true, otherwise stop with an error." The tests run instantly and cost nothing.

This is why **pure functions are the first ones you test** — no setup, no database to start, no clock to fail. The more of your logic you keep pure, the cheaper your tests are.

**Impure functions** do things like add to a global list, write to a database, or read the clock. Not inherently bad, but riskier. Test for purity with this question: *if I call this function and then delete the call, did anything else in the world change?* The agent rule: **keep read-only checking tools pure**, so if an AI agent calls one twice by accident, nothing bad happens. (Gemini does this, by the way.)

### A tool is a typed Python function

This is the key idea of the day. A tool is just a Python function with **typed inputs and a typed output and a clear description**:

```python
def check_availability(zip_code: str, day: str = "tomorrow") -> dict:
    """Look up open appointment slots for a zip code on a given day.

    zip_code: the 5-digit zip to search.
    day: which day to check; defaults to tomorrow.
    """
    ...
```

- `zip_code: str` and `day: str` are **type hints**; `-> dict` says it returns a dictionary.
- The docstring explains what the function does and what each input means.

On the right of the slide is what the AI model actually sees — a description in JSON with the name, the description, the inputs and their types, and which inputs are required. `zip_code` is required; `day` is not, because it has a default. The model reads this and decides when to call the tool and what to pass it.

The mapping is one-to-one: the function name becomes the JSON `name` field; the docstring becomes the `description`; each parameter with its type hint becomes an entry under `parameters`; the `required` list contains only `zip_code` because `day` has a default. Every piece of that JSON came from something you wrote in Python — **you will never write the JSON by hand; the framework builds it from your function.** One format note: this layout is OpenAI's format; Anthropic Claude uses the same idea but calls the input section `input_schema` — just in case you use ChatGPT or Claude.

The takeaway: **your function name, docstring, and type hints are literally your instructions to the AI. Your docstring is a prompt.** Writing a clear function is writing a clear instruction to the AI — and this is what connects to the agent-building sessions ahead.

### Fixed pipeline vs LLM agent

Two ways to run your tools:

- **Fixed pipeline** (left): your code calls the functions in the same order every time — validate, route, save. It's free, fast, deterministic — exactly the same thing on every run. Its weakness: if the input is messy (a rambling email), it can't adapt.
- **LLM agent** (right): the model reads the incoming text and decides which tools to call and in what order. Flexible — great for pulling details out of messy text. But every step costs money and adds delay (and eats API credits, which is rough), and the model can make mistakes.

Rule of thumb: **if you can write the steps down in advance, use a plain pipeline. Use an agent only for the part that really needs judgment.** Validating a form is a pipeline job. Reading an email that says "hey, my cousin/client wants a callback next week, he's in the 94111 area, here's their email" and pulling out the name, zip, and email — that's the agent's job. Then the agent hands those values to the same validate function we wrote.

The big mistake to avoid: **don't use an agent to do what an `if` statement can do.** If the rule is "the email must contain an @ sign," that's one line of Python — free and instant. Asking a model to check it costs money and might get it wrong. Save the models for the parts you can't write the rule down for. (This is the deterministic-workflow-vs-agent distinction.)

### Agent safety: step limits and the four production rules

If — not if, *when* — you let an agent call tools, you need guardrails. The slide sketches an agent loop with a step limit:

```python
MAX_STEPS = 5

for step in range(MAX_STEPS):
    action = decide_next_step(state)     # placeholder — not runnable
    if action == "finish":
        break
    result = run_tool(action)
    log_step(step, action, result)       # placeholder — not runnable
else:
    print("Aborted: step limit reached")
```

The sketch is not really runnable — `decide_next_step` and `log_step` aren't defined, and in a real agent, `decide_next_step` must also be given the results so far, otherwise the agent can't react to what happened. But the loop itself is simple: up to 5 times, ask the agent what to do next; if it says finish, stop; otherwise run the tool, log it, and go around again.

The interesting bit is the **`else` after the loop** — a Python feature: it runs only if the loop ended *without* hitting a `break`. So "aborted" prints exactly when the agent used all five steps and never said finish. That's your safety net.

The four rules on the slide are practical, not theoretical:

1. **Read-only by default** — your first version of any agent only looks things up.
2. **Human approval** — a person clicks confirm before anything real happens (emails, charges).
3. **Hard step limit** — a stuck agent costs you 5 calls, not 5,000. If you've ever used an LLM that got wedged in a loop without reaching resolution, you've seen this. OpenAI/Claude have run limits built in, but if you take a key from OpenRouter and drive the loop yourself, a stuck function will keep going in circles and genuinely cost money. A confused agent trying the same failing booking call forever "until your API bill stops it" is the failure mode.
4. **Log every call and its inputs** — when something goes wrong (it often will), you can read exactly what the agent did and why instead of being completely blind.

These safety limits save time, money, and a lot of headache.

### TypeScript ↔ Python: moving front-end logic to the backend

The last concept slide compares TypeScript (the language a lot of website front ends are written in — you'll see `.ts` everywhere) with Python for the same validation:

```typescript
// TypeScript (front end)
interface Lead {
  name: string;
  email: string;
  zip: string;
}

function validateLead(lead: Lead): { ok: boolean; reason: string } {
  if (!lead.email.includes("@")) return { ok: false, reason: "invalid email" };
  if (lead.zip.length !== 5)     return { ok: false, reason: "invalid zip" };
  return { ok: true, reason: "valid" };
}
```

```python
# Python (backend, agent-ready)
from typing import TypedDict

class Lead(TypedDict):
    name: str
    email: str
    zip: str

def validate_lead(lead: dict) -> dict:
    email = lead.get("email", "")     # "" fallback → missing field won't crash
    zip_code = lead.get("zip", "")
    if "@" not in email:
        return {"ok": False, "reason": "invalid email"}
    if len(zip_code) != 5:
        return {"ok": False, "reason": "invalid zip"}
    return {"ok": True, "reason": "valid"}
```

The `TypedDict` describes the shape of the lead dictionary; `lead.get(..., "")` with an empty-string fallback means a missing field won't crash the function. Same rules, same kind of result. Comparing the two slides: the same three checks, in the same order, with the same result. The point: **logic you find in your app's front end can move to Python almost line by line** — and once it's in Python with types and a dictionary result, it is ready to become an agent tool.

### Workshop part 1: `validate_lead`

After the break, the workshop builds one flow in a single file/Colab notebook: (1) a lead comes in from a form, (2) `validate_lead` checks name and email, (3) `check_availability` looks for open appointment slots for that zip, (4) print a log of what happened to each lead. The calendar is fake — a mock dictionary in the code, not connected to the internet.

```python
def validate_lead(lead):
    """Return (ok, reason): True/'valid' or False + why."""
    name = lead.get("name", "").strip()
    email = lead.get("email", "").strip()
    if not name:
        return False, "missing_name"
    if "@" not in email or "." not in email:
        return False, "invalid_email"
    return True, "valid"
```

It takes a lead dictionary and returns two things: `True`/`False` plus a reason. It pulls out the name and email using `.get` with an empty-string fallback, so a missing field doesn't crash it. `.strip()` removes extra spaces — recall from an earlier class: strip removes spaces *outside* (at the ends), not the inside. No name → `missing_name`; email without an @ or a period → `invalid_email`; otherwise valid. Below the function it's tested on three example leads:

- Taylor → `True, "valid"`.
- Morgan (bad email) → `False, "invalid_email"`.
- Empty lead (Yu) → `False, "missing_name"`.

The **order of the checks matters**: name is checked first, so a lead with no name *and* a bad email is reported as `missing_name` — because `return` ends the function immediately. Suggested experiment: change Morgan's email to a valid one like `morgan@corp.com` and it prints `True, valid` — same function, different input, different answer. That's the whole point of a function: write the rule once, feed it different data.

### Workshop part 2: the mock `calendar_db` tool

```python
calendar_db = {
    "94102": ["Wednesday 10am", "Wednesday 2pm"],
    "94103": ["Thursday 1pm"],
    "94110": ["Friday 3pm"],
}

def check_availability(zip_code: str, day: str = "tomorrow") -> dict:
    slots = calendar_db.get(zip_code.strip(), [])    # unknown zip → [] not a crash
    return {"zip": zip_code, "available": len(slots) > 0, "slots": slots}
```

Each zip code maps to a list of open time slots (the "Wednesday/Thursday/Friday" keys are the available times). `check_availability` takes a zip, strips spaces, and looks it up with `.get` with an empty list as the fallback — an unknown zip gives you *no slots* instead of crashing. It returns a dictionary with three keys: the zip, whether anything is available, and the time slots. `94102` has two slots → `available: True`; `90210` isn't in the calendar → `available: False` and an empty slot list.

The result is a plain dictionary — **the exact shape an AI agent can read: named fields, no guessing.** If you swapped in a real calendar backend, the only thing that would change is the lookup line. Then he added a Tampa zip with one slot to the dictionary and asked the tool about it — it answered correctly. **We didn't change the function; we changed the data it looks at. The function is the rule; the dictionary is the data.** (Suggested exercise: add your own zip and a slot to `calendar_db`, or deliberately *don't* add one and watch it come back waitlisted.)

A student asked if this is like an appointment-booking function — yes: someone fills out a form, one function checks the form is valid, another takes their zip and looks up open slots; if there are slots they're booked, if not they're waitlisted. The calendar is fake (just a dictionary), but this is exactly the kind of thing you point an AI tool at rather than having it rebuilt every time. On why not just have the LLM do the lookup itself: this costs nothing to run in our backend and is **deterministic** — always the same output. An LLM *could* do the same task decently most of the time, but it's probabilistic and will make mistakes.

### Workshop part 3: putting it together with one loop

For each lead: first validate. If it fails, print "reject" with the reason and `continue` (skip right to the next lead). If it passes, check availability: slots found → booked; no slots → waitlist. Three outcomes, one loop:

```python
for lead in leads:
    ok, reason = validate_lead(lead)
    if not ok:
        print(f"Rejected: {reason}")
        continue
    result = check_availability(lead.get("zip", ""))
    if result["available"]:
        print(f"{lead.get('name')}: booked", result["slots"])
    else:
        print(f"{lead.get('name')}: waitlisted — no slots in this zip")
```

Trace: Devon → slots `Wednesday 10am, Wednesday 2pm` → booked. Morgan → invalid email → rejected, and because of `continue` **we never even looked up Morgan's calendar** — it stopped right there. Sora → passes validation but no slots in her zip → waitlisted. Three leads, three paths, and the loop is just a few lines because the functions do all the work. **This is the pattern in most real systems: small functions, one loop, called in an order.**

He then added a fourth lead (himself, in Tampa with the fake zip) via `calendar_db.append(...)` *outside the functions* — re-running the same loop booked him at the end. If he'd used a zip he hadn't added, he'd be waitlisted. "You see how everything connects: the validation function, the calendar data, the lookup function, and the loop." (Exercise: change the append, add different zips, or skip adding one and watch what happens.)

A student asked why Morgan was rejected → his email has no @ sign; `validate_lead` returns `False` with reason `invalid_email` — "we're defining not just true or false, but *why*." Without the reason you'd only ever see "rejected." Another student asked whether "Python knew" the email was bad — no: Python only knows the rule we wrote in the function ("the email must contain an @ and a period"). The rule was built earlier in the file.

### Workshop part 4: five tests before any tool goes live

Before any tool goes live, test it. Five checks, each an `assert` saying "this must be true, otherwise stop":

```python
assert check_availability("94102")["available"] is True    # 1. normal case
assert check_availability("")["available"] is False        # 2. empty input — no crash
assert check_availability("  94102  ")["available"] is True  # 3. "default" test — really space-trimming
assert check_availability("94102") == check_availability("94102")  # 4. repeat calls, same answer
try:
    check_availability(None)                               # 5. None
except Exception:
    print("None crashes — caught")
```

All passed — but be precise about **test 5**: the function did *not* handle `None` gracefully. It crashed, and the surrounding `try`/`except` caught the crash — the test *records* that `None` crashes the function. To handle `None` inside the function, you add a guard at the top. The guard is the real fix; the try/except just catches the fact.

Then he broke a test on purpose (forced "not available"): the red failure is an `AssertionError`, and the message after it comes from the text you put after the comma in the assert line. **Always put a message there** — when it fails at 2 in the morning, the message tells you *what* broke instead of just that something broke. Any test that breaks loudly instead of failing silently is doing its job; silent failures lead to spaghetti code with downstream effects.

### Langflow preview

First of two quick looks at where this goes next. **Langflow** is a visual version of what we did: instead of writing loops, you drag boxes onto a canvas and connect them — exactly the Lego-pieces idea. The slide shows three boxes: a chat input box, a Python function box running `check_availability`, and a chat output box.

Two caveats: adding a model box needs an API key and costs money per run (get one from OpenRouter, or an Anthropic subscription includes a few dollars of free API credits if you want to run free). And the catch: **without an AI model in the chain, nothing understands a sentence.** Type "I want an appointment at XYZ zip code" and the whole sentence becomes the zip code, so the lookup finds nothing. Without a model, just type `94111`. Pulling the zip out of a sentence is exactly the job a model would do — tonight we're not doing it, but it's a good Langflow exercise. Everything today was the nuts and bolts of the pieces you'll put in there — now you know what boxes you're grabbing and how the workflow works.

### LangGraph preview

Second preview, from the same LangChain team (the framework Sean posted in the group). Four ideas on the slide:

- **State** — one shared dictionary that travels through the entire process. `lead_state` holds the name, email, zip, and whether the lead is valid.
- **Nodes** — ordinary Python functions that receive the state and update it. The validate node sets `valid`; the lookup node sets `slots`. Those are the same functions from today, just wired differently.
- **Edges** — the arrows between nodes: validate → then → lookup.
- **Conditional edges and end** — if the lead isn't valid, jump straight to the end; otherwise go to lookup.

The slide is an overview, not a runnable program — building the actual graph comes next session. The point today: **the building blocks in LangChain/LangGraph are just the same Python functions you saw in Colab — pretty blocks instead of loops.**

### Wrap-up and homework

Recap: syntax (`def`, parameters with types, return, default values, keeping variables local); why pure functions matter (easy to test, they're the building blocks of AI agents — that's why they're called tools); and the safety steps (step limits, read-only by default, human approval for anything with real effects). The one thing to take from tonight: in LangChain, a tool is almost exactly the way we defined `check_availability` tonight — a plain Python function with type hints and a docstring. You hand a list of those functions to an agent, and the model decides when to call them.

The final slide previews **comprehensions** (next class): four lines of loop that build a list of valid names become one line. The match-the-parameter-syntax quiz was confirmed at the end (see the challenges section above).

## Best practices

- **Guard clauses come first.** The first line inside a function that touches input should reject bad input (empty, wrong type) immediately — return early and stop. This matters doubly for agent tools, where the AI will hand you wrong types or `None`.
- **Keep pure functions pure.** Same input → same output; touch no files, databases, or the clock. Pure functions are the cheapest to test and the safest to expose to agents (accidental double-calls do nothing). Test for purity: "if I call this function and delete the call, did anything else in the world change?"
- **Pass in what a function needs; return what it produces.** Don't reach for globals. The only exception: constants that never change, written in CAPITALS (`SERVICE_ZIPS`, `CALENDAR_DB`).
- **Keep rules and thresholds in one place.** The served zips live in a set, the calendar lives in a dictionary — business changes mean editing the *data*, not the function. "The function is the rule, the dictionary is the data."
- **Name the business rule in a function.** One rule, one place — all entry points call the same function so copies can't drift.
- **Order checks so the first failure wins.** Check the most fundamental thing first (name before email; don't check the zip of a lead whose email is trash). `return` ends the function, so the first failing check determines the reported reason.
- **Always return a reason with a failure.** The `(ok, reason)` pair pattern for anything that can fail; a bare `False` tells the caller nothing.
- **Use a dictionary when 3+ values are returned, or when the result leaves your code.** Named keys, JSON-ready — what websites and AI agent tools consume.
- **Use named parameters, not `**kwargs`, for business logic.** Named parameters are documentation: autocomplete, type checking, and a clear tool schema for the AI model. `*args`/`**kwargs` are for loggers and wrappers only.
- **Write the docstring and type hints as if the AI will read them — because it will.** Your docstring is a prompt; the framework generates the tool's JSON schema from your function, so you never hand-write the JSON.
- **Default to `None` for mutable defaults; create the list inside the function.**
- **Always put a message after the comma in an `assert`.** At 2 a.m. the message tells you *what* broke, not just that something broke.
- **For agents: read-only by default, human approval for real-world effects, hard step limits, log every call and its inputs.**
- **Strip external input and use `.get(key, fallback)` everywhere.** Missing fields and stray spaces shouldn't crash the pipeline.
- **Know every line the AI writes for you.** Any LLM can draft a function, but you should be able to explain each line as it's generated.

## Common mistakes & gotchas

- **Copy-paste drift.** The same validation rule pasted into three entry points *will* diverge — one copy loses a check and bad records flow into the sales system. Shows up months later, sometimes after the author has left. AI glosses over it too.
- **Printing instead of returning.** `result = add(2, 3)` where `add` only prints → `result` is `None`. The bad version *looks* like it works; the crash comes later, somewhere else (`None.upper()`). Diagnose with `x = f(); print(x)` → `None` means print-instead-of-return.
- **`=` vs `==`.** One equals assigns, two compares. Mixing them is a classic beginner error.
- **Mutable default arguments.** `def f(tags=[])` creates the list once at definition time and every call shares it — tags from one call leak into the next. Even experienced people lose afternoons to this. Fix: `tags=None`, create inside.
- **Defaults before non-defaults.** `def fn(a=1, b)` is a syntax error; parameters with defaults must come after ones without.
- **`UnboundLocalError`.** Assigning to a name inside a function makes it local for the *whole* function — reading it before the assignment line crashes, even if a global with that name exists.
- **`NameError` on locals used outside.** A variable created inside a function doesn't exist outside it. Return the value instead.
- **Blank input vs out-of-area are indistinguishable** when a function returns only True/False. If the app must treat them differently, return a reason (or a dictionary).
- **Don't add items to a list while looping over it** — that's how a loop that should finish runs forever.
- **Order-of-checks surprises.** A lead with no name *and* a bad email reports `missing_name`, because the name check runs first and `return` ends the function. Be aware of which reason wins.
- **Spaces in input.** `strip()` removes spaces at the ends only, not inside — and unstripped input ("  94102  ") fails exact-match lookups. Strip before comparing.
- **`None` isn't handled just because you caught it.** In the workshop, test 5 "passed" only because `try`/`except` caught the crash — the function still didn't handle `None`; a guard at the top of the function is the real fix.
- **Missing docstring/type hints break the tool.** The JSON schema the model reads is generated from your function — no types or description means the model can't tell what the tool expects (and `**kwargs`-style business functions hide it from humans too).
- **LLM overcomplication.** ChatGPT in particular loves to bloat simple functions with sub-contingencies (and, per Ameya, models were trained to always add unit tests — the "slop coding" era). If a simple function comes back massive for no reason, push back.
- **Silent test failures.** A test that fails quietly instead of loudly leads to spaghetti code; loud `AssertionError`s with messages are the goal.
## Q&A / discussion worth keeping

**"Should I write functions from scratch, or have the LLM write them?"** Two years ago Ameya would have said write it manually. Now, with frontier models, have them write the code, review it, and plug it in "like a Lego brick" — provided you can look at it and understand it. Per-model caveats he called out:

- **ChatGPT/OpenAI:** tends to overcomplicate — it will take a simple function and make it massive with sub-contingencies, partly because these models were trained to always produce unit tests. Watch for bloat.
- **Gemini:** fine for small functions and single files; his experience is slightly negative because he works as a data engineer, not a software engineer — where functions can't mess up even a little, and a small mistake surfaces 2–3 weeks later while you're hunting for it. It has issues on long-running tasks.
- **Anthropic (Opus-class):** writes beautiful code with surprisingly few mistakes — even his software-engineering friends are surprised — but still makes some, and past roughly a million tokens of context quality degrades. **"The best context is your own brain."**
- His rule: you should be able to explain every line as it's generated. A suggested exercise: have the worst model, a middling model, and the best model write the same function and compare — you'll start to see what's bad, decent, and good.

**On permission prompts / guardrails in coding tools.** A student mentioned tools asking "can I use return or print?" — Ameya connected it to the guard-clause material: keep the prompts on. Second-order benefit: it forces you to know what's in your code. Even a massive codebase can't fit in a model's context window (~1M tokens, compressed), so you can't let LLMs loose on a whole codebase or database — if you know the code yourself, you catch it when the model ignores a function or an entire `.py` file. He keeps "ask me every time" on even though he's experienced.

**Data engineering vs software engineering constraints.** Ameya works mainly as a data engineer (he used to use Vim editors and Jupyter notebooks; his code is generally small — he writes DAGs). In data work you never let the LLM touch the database — you hand it rules: "you don't touch the database; this is the SQL query you use." Step limits (the `MAX_STEPS = 5` pattern) are critically important there: an agent lost in a database churns through API credits without finding anything. Any mistake compounds heavily in his world, which is why he uses frontier models for it.

**Colab vs Jupyter?** He used to use Vim and Jupyter; Colab is handy for the class because it runs anywhere on the internet.

**"Why was Morgan rejected?"** His email has no @ sign — `validate_lead` returned `False` with reason `invalid_email`. The reason field is the point: not just *that* it was rejected, but *why*.

**"Doesn't Python already know the email is bad?"** No — Python only knows the rule we wrote ("the email must contain an @ and a period"). The intelligence is in the function we built earlier in the file.

**"Is it okay to use Gemini in Colab while I practice from scratch?"** Completely fine, especially for small functions; just be careful with long-running tasks, and keep practicing so you understand what you're looking at.

**Langflow without a model:** typing a full sentence makes the whole sentence the zip code and the lookup finds nothing — without a model, type a bare zip. Extracting the zip from a sentence is precisely the model's job.

**Match-the-parameter-syntax answers (confirmed at the end):** `title` = required positional argument; `*args` = any extra positional arguments, collected into a tuple; `**kwargs` = any extra keyword (name=value) arguments, collected into a dictionary. He noted the slide answers were literally in the same order and joked they need scrambling.

## Applying this to the capstone website

- **Port validation logic with the same shape in both languages.** The TypeScript↔Python slide is literally your capstone pattern: a `Lead` interface + `validateLead` on the front end maps almost line-for-line to a Python `TypedDict` + `validate_lead` on the back end. Same checks, same order, same result shape (`{ ok, reason }` — the TS way to spell Python's `(ok, reason)` tuple).
- **Build your TS equivalents cheat sheet from tonight:** Python `.strip()` = TS `.trim()`; Python `dict.get(key, fallback)` ≈ TS `obj[key] ?? fallback`; Python type hints/`TypedDict` = TS type annotations and `interface`/`type`; Python `dict` = TS object/`Record`; Python tuple return `(ok, reason)` = TS tuple `[boolean, string]` or a typed result object; Python `assert` tests = Vitest/Jest `expect()` calls; the tool JSON schema = the function-calling schema you'd generate from zod schemas.
- **Keep route handlers thin.** Next.js API routes should be impure wrappers (they touch the network/DB) around pure functions that hold all the business logic — that's what makes them unit-testable without spinning up the app, exactly like `normalize_zip`.
- **If you add any AI-agent feature to the study site, apply the four safety rules:** read-only tools by default, human confirmation before anything with side effects, a hard step limit (a wedged agent burning API credits is a real failure mode), and logging of every tool call.
- **Remember "don't use an agent to do what an if statement can do."** Quiz scoring, form validation, and flashcard routing on your site are deterministic pipelines — free and instant. Reserve model calls for genuinely fuzzy work (e.g., parsing a messy user question into structured search terms), and hand the parsed values to the same plain validation functions.
- **Write docstrings/comments as prompts.** If you ever expose site logic as an LLM tool, the name + description + types *are* the tool schema — the same discipline that makes a function readable to you in six months makes it usable by an agent today.

## Homework / what's next

- **Homework:** try the challenges on course.hub. The two left for self-study were the match-the-parameter-syntax puzzle (answers confirmed at the end of class — see Q&A) and designing the reusable `apply_discount(price, pct)` function. Ameya also suggested: build one reusable function for your own app (or have AI draft it and make sure you can explain every line); compare outputs from a weak, middling, and frontier model on the same function; and try the Langflow exercise of wiring chat input → Python function (`check_availability`) → chat output without a model (type a bare zip, not a sentence).
- **Next class (Class 9): list comprehensions** — the preview slide showed four lines of loop that build a list of valid names collapsing into one line. The session after that gets into actually building a runnable LangGraph program (tonight's LangGraph slide was overview only).
