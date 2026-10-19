# Adding interactive visuals to a chapter

Each certification track has a Visuals page (`/core1/visuals`, `/core2/visuals`,
`/networking/visuals`, `/ccna/visuals`). It lists every chapter in the track. A
chapter with no visuals shows under "Coming soon" until you add some.

## Add visuals for a chapter

1. Put each visual in `public/visuals/` as a single self-contained `.html` file.
   Use a prefix that names the chapter, for example `core1-ch2-ram-slots.html`.
2. Open `content/track-visuals.json` and add the chapter's topic id (the `id` in
   `content/topics.json`) with its visuals:

```json
{
  "core1-ch2": [
    {
      "file": "core1-ch2-ram-slots.html",
      "title": "RAM slots and form factors",
      "description": "Match each module to its slot. (Review questions 3, 5)",
      "group": "Memory"
    }
  ]
}
```

   - `group` sets the small heading inside the chapter. Visuals with the same
     group appear together, in the order they are listed.
   - A trailing note in parentheses, such as `(Review questions 3, 5)`, is shown
     on its own "Covers" line.
   - The chapter appears on every track whose exam codes the topic uses, the same
     way its notes do.
3. Run `npm run dev` and open the track's Visuals page.

Network+ chapters 9, 10, and 11 keep their visuals in
`content/network-plus/ch9.json`, `ch10.json`, and `ch11.json`, and they also show
on their own chapter pages.

## Draw the fact, then check it

Visuals should show what the exam tests (a connector face, a sequence, a scale), not
restate notes in boxes. `npm run audit:visuals` lists the wordiest visuals by exam
weight. When you redraw one, follow `.agents/skills/exam-visual-designer/SKILL.md`:
add a `visual-facts` block naming each claim's objective and source, and run
`npm run audit:visuals -- --check`.
