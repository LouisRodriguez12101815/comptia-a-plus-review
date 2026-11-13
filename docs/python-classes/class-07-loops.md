# Python Class 7 — Loops + Intro to Agents

**Recording:** Class 7 video | **Runtime:** ~110 min | **Instructor:** Ameya (TA/lead) unless transcript suggests otherwise

## Context — where this class fits
Class 6 covered conditionals; this class recaps those briefly and adds loops — how one piece of code repeats across every item in a collection. The running example apps continue: an inventory app, a fitness app (workout cards), a retail upload queue, and a CRM/leads pipeline. The second half of class pivots to agent building inside ChatGPT (connectors, skills, memory, scheduler, multi-agent teams), which sets up next week's move into agent frameworks (LangChain, LlamaIndex, OpenAI Agents SDK).

## Key concepts

### Recap: conditionals don't repeat
A conditional (`if`) takes one input and produces one decision — it runs once. A shopper checks one stock number and Python outputs one result. On its own, a condition does **not** repeat. Loops are what make work repeat across a whole collection. (TS equivalent: a single `if` statement, same idea.)

### The for loop — walking a product list
When the inventory list opens, Python repeats the same action for each product:

```python
products = ["apple", "banana", "orange"]

for product in products:
    print(product)
```

- `product` is the **loop variable** — it receives a new item on every iteration (first, next, ..., last).
- The **colon** starts the loop body; the **indented lines** run once for each item.
- When the list is exhausted, the loop ends.
- Variants from class: loop over a price list to print each price, or a stock list to check each quantity.

(TS equivalent: `for (const product of products) { console.log(product); }` — same iteration model.)

### The iteration model in each app context
Every app in the running example is the same pattern — input is a collection, the loop reads/processes each item, output is an aggregate or side effect:

- **Fitness app (workouts):** input is all workout records; the loop reads the `name` and `minutes` of each; output is a card per workout.
- **Retail app (upload queue):** you upload an image and get a file + status; the loop checks each status (uploaded successfully? error? what issue?); output is how many uploaded / what's wrong.
- **Sales app (importing leads):** bring in lead data; the loop reads and scores each item, finds its source; output is a sales route, nurture route, or automation kicking off.

Generic form:

```python
for item in collection:
    print(item)
```

### Workout cards — building strings during the loop
Each dictionary is one card with a name and minutes:

```python
workouts = [
    {"name": "walk", "minutes": 20},
    {"name": "stretch", "minutes": 10},
]

for workout in workouts:
    card = f"{workout['name']} - {workout['minutes']} min"
    print(card)
```

The rendered user experience is "Walk - 20 min", "Stretch - 10 min" — the loop generates one card per record.

**Class discussion (data integration):** if you pulled workouts from an outside source (e.g., Nike) into your app, what must happen first? Answers from the class:
- Parse the incoming JSON and create objects.
- Sanity-check: is it an array, is it non-empty, does every object have the expected keys (`name`, `minutes`)?
- **Transform the data to your format** — e.g., if Nike sends seconds and your app renders minutes, convert seconds → minutes. Otherwise users see "2000 min."
- Best practice: store data uniformly across your app so you pull it in and render it without doing a pile of calculations on the front end. Keep transformation logic in one place if formats must differ.

(TS equivalent: `JSON.parse()`, checking `Object.hasOwn(obj, "name")`, mapping fields; the transform is like a `map()` before render.)

### The cart total — the accumulator pattern
Shopper opens the cart: **start the total before the loop, add each price during the loop, show the final total afterwards.**

```python
prices = [12.99, 5.49, 3.75]

total = 0                 # start before the loop
for price in prices:
    total = total + price # running total inside the loop

print(total)              # final total after the loop
```

This is **accumulation** — a lot of Python (and AI/ML) is math like this. The loop variable changes, and a value outside the loop collects the result.
(TS equivalent: `prices.reduce((sum, p) => sum + p, 0)`, or the same `let total = 0` + `for...of` loop.)

### Looping over dictionaries — scored leads and routing
CRM context: you import lead data, score each lead, and route the good ones.

- The loop visits each dictionary; the **keys** are used to retrieve the fields.
- Business rule: if a lead's score is **over 80**, route it to sales.

```python
leads = [
    {"name": "Ada", "score": 92, "source": "instagram"},
    {"name": "Ben", "score": 61, "source": "tiktok"},
]

for lead in leads:
    if lead["score"] > 80:
        print(f"Send {lead['name']} to sales route")
```

- What "route to sales" kicks off: a drip campaign, an automated phone call, an SMS — assuming the right checks are in place.
- **Variants:** route by *source* (Instagram, TikTok, Google Ads, website form, call-in, in-person event), adjust the threshold (80), or adjust the scoring algorithm. The threshold and the rules live in your code, so changing them is a one-place edit.
- **Connection to agents:** this is exactly what an agent does when routing — it isn't guessing. It uses an algorithm or preset rules ("if it meets this criteria, pass it to that location").

### Looping over a dictionary yields its keys
Looping over a list of leads yields the dictionaries (one per lead). Looping over **one** dictionary directly yields that dictionary's **keys**:

```python
lead = {"name": "Ada", "score": 92}

for key in lead:
    print(key)   # name, score
```

(TS equivalent: `Object.keys(lead)` / `for (const key in lead)` / `Object.entries(lead)` for key+value pairs.)

### range() — fixed repetitions
Use `range()` when the app needs a known number of repetitions (a known number of reminders, numbered rows). **The stop value is excluded.**

```python
for i in range(3):
    print(i)
# 0
# 1
# 2
```

`range(3)` visits 0, 1, 2 — not 3. Why it matters even when AI writes the code: you need to read scripts and responses and communicate what you want — repetition, showing a range, paginating something, randomization — so these pieces apply constantly.
(TS equivalent: `for (let i = 0; i < 3; i++)`.)

### enumerate() — position + value together
When a user opens an upload queue (retail context), show a friendly position beside each file. `enumerate()` supplies both values together:

```python
queue = ["image.png", "video.mp4"]

for position, file in enumerate(queue, start=1):
    print(f"{position}. {file}")
# 1. image.png
# 2. video.mp4
```

`start=1` makes the first position 1 (instead of the default 0) — better for a user-facing list.
(TS equivalent: `queue.map((file, index) => ...)` or `queue.forEach((file, i) => ...)`, or `for (const [i, file] of queue.entries())`.)

### break and continue
Match the keyword to its effect (from the practice game):
- `break` — **exit the loop entirely.**
- `continue` — **skip the rest of this iteration and move to the next one.**

Use case framing: a loop processes a list of orders and needs special handling for certain cases.
(TS equivalents: `break` and `continue` work identically in JavaScript/TypeScript.)

### zip() — looping over two lists together
You have names and scores and want to pair them up while looping. The idiomatic way:

```python
names = ["Ada", "Grace"]
scores = [92, 88]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Ada: 92
# Grace: 88
```

**Important discussion from class:** "pairing" is ambiguous.
- `zip()` gives **corresponding pairs** — first with first, second with second. Ada→92, Grace→88.
- If you want **all possible pairs** (every name with every score), that's a **nested for loop** — the Cartesian product / cross join:

```python
for name in names:
    for score in scores:
        print(name, score)
# Ada 92, Ada 88, Grace 92, Grace 88
```

### Performance: nested loops vs. flat loops
A student (Sean) pointed out the complexity difference, which the instructor endorsed:
- `zip()` pairing is **linear — O(n)**.
- Nested-loop pairing is **quadratic — O(n²)** ("order n square") — a big speed difference.

Why it matters at scale: think bigger than two-item lists — thousands or millions of records. If your app is slow, look at how it does its checks and data pulls: pulling a list, finding matches, then re-scanning the data for every match is a red flag. Alternatives: restructure how data is pulled, or pull only certain amounts of data at certain times. Since AI writes most of the statements, your job is to **communicate performance problems to the agent** ("page loads took way too long — change the matching approach"); modern agents will catch and fix these, but you have to notice and describe them from the user experience.

### while loops and the infinite loop trap
A `while` loop only stops when its condition becomes false:

```python
i = 0
while i < 5:
    print(i)
    i += 1   # without this line, the loop never ends
```

If nothing inside the loop body moves `i` toward the exit condition (`i += 1`, `i += 2`, etc.), the condition `i < 5` stays true forever — the loop runs forever. (TS: `while (i < 5)` with `i++` inside — identical trap.)

## Best practices
- **Keep the end use case in mind.** Business stakeholders don't want to hear about loops and conditionals — keep the problem-to-be-solved at the forefront when presenting.
- **Accumulator discipline:** initialize the total *before* the loop, add *inside* the loop, present the result *after* the loop.
- **Name business rules explicitly** — the "over 80" threshold and the source-based routes are stated rules, so anyone can read what triggers the sales route.
- **Keep thresholds/rules in one place** so changing the score cutoff or scoring algorithm is a single edit.
- **Store data uniformly across the app** so incoming data renders without front-end calculations; do unit/format conversion in one place during ingestion.
- **Validate incoming data before looping over it:** check it's the expected shape (array, non-empty, every object has the expected keys like `name` and `minutes`).
- **Prefer flat loops over nested loops** when a corresponding pairing is what you need — nested loops are O(n²) and will hurt at scale.
- **Use the purpose-built tool:** `enumerate()` when you need index + value, `zip()` when you need to pair two lists — instead of manually tracking a counter.
- **Watch the user experience as your performance signal:** if loading is slow, describe it to the AI agent and let it restructure the matching/data-pull approach.
- **Pick one agent tool and go deep.** Context and memory compound over time once your stuff is connected; jumping between tools forfeits that.

## Common mistakes & gotchas
- **The infinite while loop:** forgetting to increment the counter inside the loop body means the condition stays true forever.
- **range() off-by-one:** `range(3)` yields 0, 1, 2 — the stop value is excluded. Expecting 1–3 is the classic bug.
- **Ambiguous "pairing":** `zip()` gives corresponding pairs only; if you actually need all combinations, you need a nested loop (Cartesian product) — and you accept O(n²) cost. Read the requirement before choosing.
- **Semicolons in Python:** a trailing semicolon (`i = 0;`) is *not* a syntax error — it's a statement separator (like in JS/TS) and is effectively ignored. A student tested this live: it runs fine. It's still unidiomatic; don't rely on it.
- **Index vs. human numbering:** loops default to position 0; for user-facing lists use `enumerate(..., start=1)` so people see "1." not "0."
- **Assuming external data matches your shape:** data pulled from another system may use different keys, different structure, or different units (seconds vs. minutes) — render "2000 min" is the failure mode. Validate and transform before rendering.
- **Letting performance problems hide in AI-written code:** the AI writes the statements, but a slow page or slow data pull is your signal; you must be able to describe the problem and ask for a different approach.

## Q&A / discussion worth keeping
- **"How would you actually use an agent?"** (student discussion, before the demo):
  - One student's Claude "cowork" setup: the agent has access to a "second brain" folder on his desktop — it creates folders, updates a project brief as he learns new things, keeps context so he doesn't have to re-explain his project in every chat, connects to GitHub, and (carefully, keys handled manually) touches Supabase.
  - Real-world lesson from that student: his project depended on Strava (then Garmin) data, and both now forbid using user data for AI models. That forced a redesign — **check whether the data/API you depend on allows AI use *before* building**; it can kill or reshape a project. Even a blocked idea can still be a portfolio case study.
  - The agent effectively did the work of three people (PM, developer, designer): updating the brief, implementing changes on GitHub, adjusting the design.
- **Agent vs. chat:** in chat you prompt a model to do a thing; an agent is set up to *get work done* — it has connectors (inbox, calendar, Slack, GitHub), skills, memory/knowledge sources, and can run on a schedule.
- **Platform landscape:** OpenAI is deprecating its agent builder in favor of "Dots" (on a higher plan); Claude's "cowork" is now just baked into Claude; Grok bot supports agents creating/spawning other agents; Muse targets consumers. The big three copy each other, so features arrive across all of them within weeks. Copilot has agents but weaker intelligence — its win is native Microsoft-ecosystem access (SharePoint, OneDrive, inbox) so it can pull your files without uploads. Azure Copilot has specialized agents but more hoops to set up.
- **One agent spawning others:** students likened it to classic **process forking** — a program creating another process. The instructor confirmed the "chief of staff creates and kicks off sub-agents that report back" pattern should be universal across the big platforms.
- **Interview advice:** "At the interview they're not going to say 'write this line of Python' — they're going to say **what have you built?**" The agent work still counts even though no Python is involved; the concepts transfer (loops, functions, conditionals). Also noted: the LinkedIn "AI agent developer" job posting from last class maps directly to these skills.
- **How agent work maps to Python concepts** (instructor's explicit mapping, using the chief-of-staff inbox agent):
  - **Loops** → repeat the briefing workflow every weekday; process the last 50 emails.
  - **Functions** → separate steps: read sources, extract to-dos, prioritize, format, post to Slack.
  - **Lists** → meetings, emails, messages, risks, to-dos — iterate each group.
  - **Dictionaries** → structured items with owner and deadline fields.
  - **Conditionals** → include only urgent items, suppress FYIs/marketing, mark a to-do complete only if there's deliverable evidence.
  - **Sorting** → rank items; overdue items and high risks (e.g., partner terminating an agreement in 30 days) go to the top.
  - **Error handling** → failed payments/deliveries, access issues — surface an error and prompt for re-authentication instead of failing silently.
  - **Classes** → agent configuration resembles an object: behavior, tools, presentation settings; skills bundle tools (e.g., a "final brief formatting" skill you can edit when the output format is wrong).
  - **Scheduler** → kick off the flow at a specific time (not a Python while loop, but the same "do this then stop" shape).
- **The role shifts when you roll out agents:** instead of doing the work, you become the **manager of agents and tools** — monitoring outputs, more decision-making, less coding, understanding how they move data around.
- **Semicolon side-quest:** a student flagged `i = 0;` in a quiz question; live testing showed Python tolerates it (statement separator), resolving the confusion — a good example of verifying rather than assuming.

## Applying this to the capstone website
- **Render lists with `for...of` / `.map()`:** your question banks and topic lists are the workout-cards pattern — loop the collection, build one card per item. Python `for x in xs` ≈ TS `for (const x of xs)`; building the display string ≈ TS template literals instead of f-strings.
- **Accumulators for scoring:** the cart-total pattern is how a quiz-score total works — TS `reduce()` (`items.reduce((sum, q) => sum + q.points, 0)`) or the identical `let total = 0` loop. Use the same before/during/after structure.
- **Data validation at the boundary:** when importing question data (JSON/CSV into your Next.js app), check shape and keys first and normalize units/format once — Python's "check the keys, convert seconds to minutes" lesson. TS: `Object.hasOwn()`, a `map()` transform, or a schema validator like Zod before render.
- **Object.entries() for dictionary loops:** when you loop over keyed objects (e.g., per-topic progress stored as `{ [topic]: score }`), Python's "looping a dict yields keys" ≈ TS `Object.entries(obj)` giving `[key, value]` pairs — the direct equivalent of iterating a Python dict.
- **Index-aware rendering:** Python `enumerate(items, start=1)` ≈ TS `items.map((item, i) => ...)` using `i + 1` for human-facing numbering (question numbers, leaderboard ranks).
- **Guard against O(n²):** if you ever match two lists (e.g., tagging questions against categories), reach for a `Map`/lookup or a single `zip`-style pass rather than nested loops — same linear-vs-quadratic warning, same TS tools.
- **Scheduled jobs = the agent scheduler concept:** the chief-of-staff "repeat every weekday" maps to Vercel Cron/`setInterval` patterns if the site ever needs periodic work (e.g., regenerating an index or digest page).

## Homework / what's next
- **Homework:** a "dream jobs" form (delayed, to be sent this week) — part dream-job collection (so later Python/ML lessons can be tailored), part feedback on pacing and what's landing vs. what needs help.
- Practice questions for loops were pinned in chat and uploaded to the classroom for extra practice.
- **Next class: functions** — explicitly framed as "we might be separating things out, prioritizing, formatting, posting" — i.e., packaging the steps the demo agent performed into reusable code.
- **Coming after:** agent frameworks (LangChain, LlamaIndex, OpenAI Agents SDK) for hands-on development; SQL appears later in the course; ongoing thread is connecting every class to real job postings and portfolio building.
