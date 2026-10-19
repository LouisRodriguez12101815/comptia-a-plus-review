---
name: exam-visual-designer
description: Redraw word-heavy chapter visuals in public/visuals as accurate, source-backed pictures that teach the facts the A+ and Network+ exams test. Use when a visual explains with paragraphs, when picking which visuals to redraw, or when building a new chapter visual.
---

# Exam Visual Designer

Before applying this workflow, read the [workflow contract](../../../docs/skills/README.md#workflow-contract) for authorization, source authority, explicit loading and tool fallbacks. Apply only the sections the request needs.

A chapter visual earns its place when a learner can **see** a fact the exam tests: the shape of a connector, the order of a process, which end of a link changes, how far apart two speeds are. If a sentence says it faster, keep the sentence and do not draw. If the page is a wall of text in boxes, it is notes, not a visual.

## 1. Pick what to redraw

1. Run `npm run audit:visuals` (add `-- --top 40` for more). It ranks visuals by words per drawn shape, weighted by the heaviest exam domain the visual's topic maps to in `content/objectives.json`.
2. Open the top candidates in a browser and read them. The ranking is triage. A short comparison table can already be the right form; a "chapter map" of facts may belong in notes rather than redrawn.
3. Prefer visuals whose facts are recognized by sight on the exam (connectors, ports, cable ends, pinouts, sequences, layer stacks, topologies, scales).

## 2. Write the fact list before drawing

List every claim the finished visual will show, one line each. For each claim, record:

- the **objective key** (`220-1201 3.2`, `220-1202 1.5`, `n10-009 1.4`) from `content/objectives.json`;
- at least one **source**: the notes topic and section (`content/topics.json`, `content/topics-network-plus.json`, `content/network-plus/*.json`), the official objectives, and a standard or vendor document for technical behavior (pin counts, speeds, port numbers, timings).

Follow `certification-content-verifier` for every number and name. Never draw a pin, port, speed or step order from memory alone. If a detail cannot be verified, either leave it out or draw it as a labeled simplification (section 4). While extracting facts, check the existing visual's claims too; report errors you find (for example a ranking that ignores overlapping speed ranges) and fix them only with authorization.

Store the list in the page as the fact block (section 6). Quiz answers, labels and captions read from the same data so they cannot disagree.

## 3. Choose the form from the kind of fact

| Fact the exam tests | Draw | Avoid |
| --- | --- | --- |
| Identify by sight (connector, port, slot, cable end) | Front-face drawing to the same scale: outline, key/notch, pin rows and count | A list of names with descriptions |
| Order of steps (EP process, DORA, boot, troubleshooting method) | Sequence or swimlane with numbered, labeled arrows; a cycle when it repeats | Numbered paragraphs |
| Quantity or speed comparison | Bars on a stated scale (log scale when values span powers of ten), with ranges drawn as ranges | Ranked list that hides ties and overlaps |
| Layers or encapsulation (OSI, TCP/IP, frame vs packet) | Stacked layers; nested boxes for headers | Two columns of terms |
| Who talks to whom (topology, path, broadcast domain) | Nodes and labeled links; highlight the hop or boundary in question | Boxes with no connections |
| Choose between options (RAID level, cable type) | Side-by-side drawing of the difference: the disk that fails, the pair that crosses | Separate cards per option |
| Category membership (analog vs digital, power vs data) | One axis or Venn with each item placed by its property | A table only |

Match complexity to the question. A one-fact visual is one figure; do not inventory the whole chapter.

## 4. Draw it

- Inline `<svg>` built from the page's data array (see `core1-ch3-connectors.html` and `core1-ch3-video-signals.html`). No images, libraries or external requests.
- Size by `viewBox` and scale with CSS (`width:100%; height:auto`). Lay out on a grid; keep a shared baseline and even gaps.
- Use the page's CSS custom properties (`--ink`, `--muted`, `--line`, `--accent`, `--good`, `--bad`, `--warm`) so light and dark themes both work. Color carries meaning only together with a label, pattern or shape.
- Labels inside the drawing are one to three words, 12 px or larger at the drawn scale. Explanations go in the caption or the step panel below.
- Label arrows with what moves (`DHCPOFFER`, `UDP 67 → 68`, `toner`). A legend only when one encoding repeats.
- Drawings of physical parts are **schematic**: proportions and pin positions follow the source, not a photo. Say so in the caption, and list anything simplified in the fact block's `simplifications` (for example "DVI-A grid pins drawn as a region; count only").
- Do not draw things that are not true for every case the label covers. If a property varies by version (USB 3.x is 5, 10 or 20 Gbps), draw the range.

## 5. Make it teach, not just show

- Keep a predict-then-reveal step: ask, let the learner choose, then highlight the answer in the drawing (the matching pins, the right lane, the correct bar).
- Quiz questions and feedback come from the fact data. One exam fact per question, with the trap stated in the feedback.
- Text budget: page lede two sentences; each step or state panel about 40 words; no paragraph inside the drawing. `npm run audit:visuals` should show a clearly lower words-per-shape ratio after the redraw.

## 6. Fact block format

Put this before the page's main `<script>`. `npm run audit:visuals -- --check` validates it.

```html
<script type="application/json" id="visual-facts">
{
  "facts": [
    { "claim": "VGA uses a DE-15 connector: 15 pins in three rows of five.",
      "objectives": ["220-1201 3.2"],
      "sources": ["notes core1-ch3-peripherals: Video connectors", "VESA DDC / DE-15 pinout"] }
  ],
  "simplifications": ["Connector faces are schematic, not to scale between connectors."]
}
</script>
```

The checker requires a `<figure>` with an `svg role="img"` and a `<figcaption>` once a fact block exists, a non-empty `facts` array, known objective keys and at least one source per fact.

## 7. Accessibility

- `<figure>` + `<figcaption>` stating the figure's single claim; the `<svg>` has `role="img"` and an `aria-label` with the same claim, updated when the state changes.
- Every interaction works with keyboard and touch; buttons use `aria-pressed` for selection; results announce through an `aria-live` region.
- Scrollable diagram containers stay focusable (`tabindex="0"`, `role="region"`, label), as fixed in commit 9174e9b.
- Respect `prefers-reduced-motion`. No information only in color, hover or animation.

## 8. Verify before calling it done

1. Compare every drawn pin row, label, arrow and number against the fact list and its sources. Re-count pins on the rendered page, not in the code.
2. `npm run audit:visuals -- --check` and `npm run check:content`.
3. Browser at 390 px and 1280 px, light and dark: no horizontal page overflow, labels legible, every state reachable by keyboard, no console errors. `npm run test:a11y` when the page is in its scan list.
4. Report what was checked, what was simplified, any fact errors found in the old version, and the before/after words-per-shape ratio. Commits, pushes and PRs follow the workflow contract.
