# SAD visuals

Architecture-document pages that teach one hard exam concept with diagrams and a simulator. Use the `architecture-sad-designer` skill (`.claude/skills/architecture-sad-designer/SKILL.md`) and review with the `sad-reviewer` agent.

```
tools/sad-visuals/
  engine.js, engine.css, shell.html   shared renderer, theme and page shell
  build.mjs                           builds every source into public/visuals/
  sources/<slug>/                     SAD.md, diagrams.js, facts.json, meta.json
```

Build: `npm run build:sad-visuals`. Check that built pages match their sources: `node tools/sad-visuals/build.mjs --check`. Test: `npm run test:sad-visuals`.

View locally: `npm run dev`, then open the page from Network+ Visuals, or serve `public/visuals` with `python3 -m http.server 8000` from that folder and open `http://localhost:8000/n10-sad-zero-rpo.html`.

Current pages:

| Page | Objective | Topic |
| --- | --- | --- |
| `n10-sad-zero-rpo.html` | N10-009 3.3 | `n10-disaster-recovery` |
| `n10-sad-stp-broadcast-storm.html` | N10-009 5.3 | `n10-troubleshoot-services` |
| `n10-case-ipv4-addressing.html` | N10-009 1.7 | `n10-ch8` |

Add `"kind": "case-file"` to `meta.json` for a failure-first case file (see the `forensic-concept-investigator` skill). It uses four required sections instead of the five architecture sections.

All pages describe invented systems or scenarios. Numbers are teaching values. The `.agents/` copies for other assistants are not updated by this folder.
