"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

/*
 * Visual picker used on every Visuals page and on the Network+ chapter pages.
 *
 * Design decisions:
 * - The list is a numbered table of contents in a clear order, not a pile of
 *   same-looking buttons, so the learner always knows where they are.
 * - With more than one chapter, chapters fold like an accordion and only the
 *   current chapter is open. Each header shows its count and progress.
 * - The current item has a text label ("Viewing"), a bar, and aria-current,
 *   never color alone.
 * - Previous and Next move through every visual in order, across chapters.
 *   "Up next" names the next one.
 * - Visuals the learner has opened get a check mark and a running count, saved
 *   in this browser only.
 * - Chapters with no visuals yet are listed as "Coming soon" so the learner can
 *   see what exists and what is planned.
 * - On a phone the list folds behind a "Browse all" button, so the visual, not a
 *   wall of buttons, is the first thing on screen.
 * - The link hash (#visual-ch9-arp-chase) lets a learner bookmark or share one.
 * - The "(Review questions ...)" note in each description is pulled out into a
 *   separate "Covers" line so the description reads cleanly.
 * Colors come from the CSS variables set by the page that renders this.
 */

export type Visual = {
  file: string;
  title: string;
  description: string;
  group: string;
};

export type Chapter = {
  id: string;
  label: string;
  title: string;
  notesHref?: string;
  visuals: Visual[];
};

type Item = Visual & {
  chapterId: string;
  chapterLabel: string;
  chapterTitle: string;
  notesHref?: string;
  inChapter: number;
  chapterCount: number;
};

const COVERS = /^([\s\S]*?)\s*\(([^()]+)\)\.?\s*$/;
const STORE = "visuals-viewed";

function splitDescription(description: string) {
  const text = (description || "").trim();
  const match = COVERS.exec(text);
  if (match && match[1]) return { text: match[1].trim(), covers: match[2].trim() };
  return { text, covers: "" };
}

function idOf(file: string) {
  return file.replace(/\.html$/, "");
}

/** Viewed marks live in one key. Older per-chapter keys are merged in. */
function loadSeen(): string[] {
  const out = new Set<string>();
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (key === STORE || key.startsWith(`${STORE}:`))) {
        const value: unknown = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (Array.isArray(value)) value.forEach((x) => typeof x === "string" && out.add(x));
      }
    }
  } catch {
    /* storage can be blocked; the page still works */
  }
  return [...out];
}

function saveSeen(files: string[]) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(files));
  } catch {
    /* ignore */
  }
}

function clearSeen() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (key === STORE || key.startsWith(`${STORE}:`))) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Clock() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


/* Viewed marks and the link hash are read with useSyncExternalStore, so the page
   renders the same on the server and the browser and then picks up saved state. */
const seenListeners = new Set<() => void>();

function notifySeen() {
  seenListeners.forEach((listener) => listener());
}

function subscribeSeen(listener: () => void) {
  seenListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    seenListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function seenSnapshot() {
  return JSON.stringify(loadSeen().sort());
}

function markSeen(file: string) {
  const list = loadSeen();
  if (list.includes(file)) return;
  saveSeen([...list, file]);
  notifySeen();
}

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function subscribeNothing() {
  return () => {};
}

function Groups({
  items,
  idPrefix,
  currentFile,
  seen,
  onPick,
}: {
  items: Item[];
  idPrefix: string;
  currentFile: string;
  seen: Set<string>;
  onPick: (item: Item) => void;
}) {
  const groups = [...new Set(items.map((v) => v.group))];
  return (
    <>
      {groups.map((group, gi) => {
        const inGroup = items.filter((v) => v.group === group);
        const labelId = `cv-g-${idPrefix}-${gi}`;
        return (
          <section key={group} className="cv-group">
            <p id={labelId} className="cv-group-label">
              <span>{group}</span>
              <span className="cv-count">
                {inGroup.length} {inGroup.length === 1 ? "visual" : "visuals"}
              </span>
            </p>
            <ol aria-labelledby={labelId} className="cv-items">
              {inGroup.map((v) => {
                const active = v.file === currentFile;
                const viewed = seen.has(v.file);
                return (
                  <li key={v.file}>
                    <button
                      type="button"
                      className="cv-item"
                      aria-current={active ? "true" : undefined}
                      onClick={() => onPick(v)}
                    >
                      <span className="cv-num" aria-hidden="true">
                        {v.inChapter}
                      </span>
                      <span className="cv-title">{v.title}</span>
                      {active ? (
                        <span className="cv-tag">Viewing</span>
                      ) : viewed ? (
                        <span className="cv-done">
                          <Check />
                          <span className="cv-sr">Viewed</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}

export default function VisualLibrary({ chapters }: { chapters: Chapter[] }) {
  const { ready, soon, flat } = useMemo(() => {
    const readyChapters = chapters.filter((c) => c.visuals.length > 0);
    const soonChapters = chapters.filter((c) => c.visuals.length === 0);
    const items: Item[] = readyChapters.flatMap((c) => {
      // Groups in first-appearance order, items in file order inside each group.
      const groups = [...new Set(c.visuals.map((v) => v.group))];
      const ordered = groups.flatMap((g) => c.visuals.filter((v) => v.group === g));
      return ordered.map((v, i) => ({
        ...v,
        chapterId: c.id,
        chapterLabel: c.label,
        chapterTitle: c.title,
        notesHref: c.notesHref,
        inChapter: i + 1,
        chapterCount: ordered.length,
      }));
    });
    return { ready: readyChapters, soon: soonChapters, flat: items };
  }, [chapters]);

  const total = flat.length;
  const multi = chapters.length > 1;

  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const seenJson = useSyncExternalStore(subscribeSeen, seenSnapshot, () => "[]");
  const seenSet = useMemo(() => new Set<string>(JSON.parse(seenJson) as string[]), [seenJson]);

  const [open, setOpen] = useState(false);
  // Chapters the learner opened or closed by hand. Otherwise only the current chapter is open.
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const headRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const focusAfterMove = useRef(false);
  const listId = "cv-list";

  const wanted = hash.replace(/^#visual-/, "");
  const found = wanted ? flat.findIndex((v) => idOf(v.file) === wanted) : -1;
  const index = found > -1 ? found : 0;
  const current = flat[index];
  const currentFile = current?.file;

  // Mark the visual on screen as viewed (after the page has loaded in the browser).
  useEffect(() => {
    if (mounted && currentFile) markSeen(currentFile);
  }, [mounted, currentFile]);

  // After the learner moves to another visual, bring its heading into view.
  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    const el = headRef.current;
    if (!el) return;
    if (window.matchMedia("(max-width: 899px)").matches) el.scrollIntoView({ block: "start" });
    el.focus({ preventScroll: true });
  }, [currentFile]);

  // Keep the active item visible inside the scrolling list (the list only, never the page).
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.offsetParent === null) return;
    const btn = list.querySelector<HTMLElement>('[aria-current="true"]');
    if (!btn) return;
    const lr = list.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const top = br.top - lr.top + list.scrollTop;
    const bottom = top + br.height;
    if (top < list.scrollTop + 8) list.scrollTop = Math.max(0, top - 8);
    else if (bottom > list.scrollTop + list.clientHeight - 8) list.scrollTop = bottom - list.clientHeight + 8;
  }, [currentFile, manual]);

  if (!current) return null;

  function go(nextIndex: number, fromList = false) {
    if (nextIndex < 0 || nextIndex >= total) return;
    const target = flat[nextIndex];
    const small = window.matchMedia("(max-width: 899px)").matches;
    focusAfterMove.current = fromList || small;
    setOpen(false);
    try {
      window.history.replaceState(null, "", `#visual-${idOf(target.file)}`);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  const { text, covers } = splitDescription(current.description);
  const chapterFiles = flat.filter((v) => v.chapterId === current.chapterId);
  const chapterViewed = chapterFiles.filter((v) => seenSet.has(v.file)).length;
  const seenCount = flat.filter((v) => seenSet.has(v.file)).length;
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index < total - 1 ? flat[index + 1] : null;
  const nextIsNewChapter = next ? next.chapterId !== current.chapterId : false;

  return (
    <div className={`cv${open ? " cv-open" : ""}`}>
      <style>{css}</style>

      <p className="cv-sr" role="status" aria-live="polite">
        {`Showing ${multi ? `${current.chapterLabel}, ` : ""}visual ${current.inChapter} of ${current.chapterCount}: ${current.title}`}
      </p>

      <div className="cv-bar">
        <button
          type="button"
          className="cv-browse"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true">{open ? "\u2715" : "\u2630"}</span>
          {open ? "Close the list" : `Browse all ${total} visuals`}
        </button>
        <p className="cv-pos">
          <strong>
            {multi ? `${current.chapterLabel} · ` : ""}Visual {current.inChapter} of {current.chapterCount}
          </strong>
          <span>
            {" "}
            · {multi ? chapterViewed : seenCount} viewed
          </span>
        </p>
        <div className="cv-steps">
          <button type="button" className="cv-btn" onClick={() => go(index - 1)} disabled={!prev}>
            <span aria-hidden="true">{"\u2190"}</span> Previous
          </button>
          <button type="button" className="cv-btn cv-primary" onClick={() => go(index + 1)} disabled={!next}>
            Next <span aria-hidden="true">{"\u2192"}</span>
          </button>
        </div>
      </div>

      <div className="cv-body">
        <nav
          id={listId}
          ref={listRef}
          aria-label={multi ? "Visuals by chapter" : "Chapter visuals"}
          className="cv-list"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {multi
            ? ready.map((chapter) => {
                const items = flat.filter((v) => v.chapterId === chapter.id);
                const isCurrent = chapter.id === current.chapterId;
                const isOpen = manual[chapter.id] ?? isCurrent;
                const viewed = items.filter((v) => seenSet.has(v.file)).length;
                const panelId = `cv-ch-${chapter.id}`;
                return (
                  <div key={chapter.id} className={`cv-chap${isCurrent ? " cv-chap-current" : ""}`}>
                    <button
                      type="button"
                      className="cv-chap-btn"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setManual((m) => ({ ...m, [chapter.id]: !isOpen }))}
                    >
                      <span className="cv-chev" aria-hidden="true">
                        {isOpen ? "\u25BE" : "\u25B8"}
                      </span>
                      <span className="cv-chap-text">
                        <span className="cv-chap-label">{chapter.label}</span>
                        <span className="cv-chap-title">{chapter.title}</span>
                        <span className="cv-chap-meta">
                          {items.length} {items.length === 1 ? "visual" : "visuals"} · {viewed} viewed
                          {isCurrent ? <span className="cv-sr"> (current chapter)</span> : null}
                        </span>
                      </span>
                    </button>
                    <div id={panelId} hidden={!isOpen} className="cv-chap-panel">
                      <Groups
                        items={items}
                        idPrefix={chapter.id}
                        currentFile={current.file}
                        seen={seenSet}
                        onPick={(v) => go(flat.indexOf(v), true)}
                      />
                    </div>
                  </div>
                );
              })
            : (
              <Groups
                items={flat}
                idPrefix="all"
                currentFile={current.file}
                seen={seenSet}
                onPick={(v) => go(flat.indexOf(v), true)}
              />
            )}

          {soon.length > 0 ? (
            <section className="cv-group cv-soon" aria-labelledby="cv-soon-label">
              <p id="cv-soon-label" className="cv-group-label">
                <span>Coming soon</span>
                <span className="cv-count">
                  {soon.length} {soon.length === 1 ? "chapter" : "chapters"}
                </span>
              </p>
              <ul className="cv-soon-list">
                {soon.map((chapter) => (
                  <li key={chapter.id}>
                    <Clock />
                    <span>
                      <span className="cv-soon-label">{chapter.label}</span>
                      <span className="cv-soon-title">{chapter.title}</span>
                      <span className="cv-sr"> (no visuals yet)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="cv-foot">
            <span>
              {seenCount} of {total} viewed
            </span>
            {seenCount > 1 ? (
              <button
                type="button"
                className="cv-link"
                onClick={() => {
                  clearSeen();
                  saveSeen([current.file]);
                  notifySeen();
                }}
              >
                Clear viewed marks
              </button>
            ) : null}
          </div>
        </nav>

        <div className="cv-main">
          <header className="cv-head">
            <p className="cv-kicker">
              {multi ? `${current.chapterLabel} · ${current.chapterTitle}` : current.group}
            </p>
            <h3 ref={headRef} tabIndex={-1}>
              {current.title}
            </h3>
            {multi ? <p className="cv-group-pill">{current.group}</p> : null}
            <p className="cv-text">{text}</p>
            {covers ? (
              <p className="cv-covers">
                <strong>Covers:</strong> {covers}
              </p>
            ) : null}
            <div className="cv-actions">
              <a
                className="cv-btn cv-open-link"
                href={`/visuals/${current.file}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open full screen <span aria-hidden="true">{"\u2197"}</span>
                <span className="cv-sr"> (opens in a new tab)</span>
              </a>
              {multi && current.notesHref ? (
                <a className="cv-btn" href={current.notesHref}>
                  Read this chapter&rsquo;s notes
                </a>
              ) : null}
            </div>
          </header>

          <iframe key={current.file} className="cv-frame" src={`/visuals/${current.file}`} title={current.title} />

          <div className="cv-next">
            {next ? (
              <button type="button" className="cv-upnext" onClick={() => go(index + 1)}>
                <span className="cv-upnext-label">{nextIsNewChapter ? "Up next · new chapter" : "Up next"}</span>
                <span className="cv-upnext-title">
                  {nextIsNewChapter ? `${next.chapterLabel}: ` : ""}
                  {next.title} <span aria-hidden="true">{"\u2192"}</span>
                </span>
              </button>
            ) : (
              <p className="cv-end">
                <Check /> That is the last visual{multi ? " in this track" : " in this chapter"}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
.cv { --cv-bg: var(--bg, #f6f4ef); --cv-surface: var(--surface, #fff); --cv-ink: var(--ink, #1d1f24); --cv-muted: var(--muted, #5d6270); --cv-line: var(--line, #d9d5cc); --cv-accent: var(--accent, #1f5f7a); --cv-soft: var(--accent-soft, #dcebf1); --cv-cta: #fbbf24; --cv-cta-hover: #fcd34d; --cv-cta-edge: #b45309; --cv-cta-ink: #0b1220; }
.cv *, .cv *::before, .cv *::after { box-sizing: border-box; }
.cv button { font: inherit; color: inherit; cursor: pointer; }
.cv button:disabled { cursor: not-allowed; opacity: .45; }
.cv button:focus-visible, .cv a:focus-visible, .cv h3:focus-visible { outline: 3px solid var(--cv-accent); outline-offset: 2px; }
.cv-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.cv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 10px 12px; margin-bottom: 16px; border: 1px solid var(--cv-line); border-radius: 12px; background: var(--cv-bg); }
.cv-pos { margin: 0; flex: 1 1 140px; font-size: 14px; color: var(--cv-muted); }
.cv-pos strong { color: var(--cv-ink); }
.cv-steps { display: flex; gap: 8px; margin-left: auto; }
.cv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 8px 14px; border: 1px solid var(--cv-line); border-radius: 10px; background: var(--cv-surface); color: var(--cv-ink); font-weight: 600; text-decoration: none; }
.cv-btn:hover:not(:disabled) { border-color: var(--cv-accent); }
.cv-primary { background: var(--cv-accent); border-color: var(--cv-accent); color: var(--cv-bg); }
.cv-browse { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 14px; border: 1px solid var(--cv-accent); border-radius: 10px; background: var(--cv-soft); font-weight: 600; }

.cv-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: start; }
.cv-list { display: none; gap: 16px; padding: 14px; border: 1px solid var(--cv-line); border-radius: 12px; background: var(--cv-bg); }
.cv-open .cv-list { display: grid; }
.cv-group { display: grid; gap: 6px; }
.cv-group-label { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin: 0 0 2px; padding-bottom: 4px; border-bottom: 1px solid var(--cv-line); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--cv-muted); }
.cv-count { flex: none; white-space: nowrap; font-weight: 500; text-transform: none; letter-spacing: 0; }
.cv-items { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.cv-item { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 8px 10px 8px 12px; text-align: left; border: 1px solid transparent; border-left: 4px solid transparent; border-radius: 8px; background: transparent; }
.cv-item:hover { background: var(--cv-soft); }
.cv-item[aria-current="true"] { background: var(--cv-soft); border-color: var(--cv-accent); border-left-color: var(--cv-accent); font-weight: 600; }
.cv-num { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--cv-line); background: var(--cv-surface); font-size: 12px; font-weight: 700; color: var(--cv-muted); }
.cv-item[aria-current="true"] .cv-num { background: var(--cv-accent); border-color: var(--cv-accent); color: var(--cv-bg); }
.cv-title { flex: 1; min-width: 0; line-height: 1.3; }
.cv-tag { flex: none; padding: 1px 8px; border-radius: 999px; background: var(--cv-accent); color: var(--cv-bg); font-size: 11px; font-weight: 700; }
.cv-done { flex: none; display: inline-flex; color: var(--cv-accent); }

.cv-chap { display: grid; gap: 8px; }
.cv-chap + .cv-chap { padding-top: 12px; border-top: 1px solid var(--cv-line); }
.cv-chap-btn { display: flex; align-items: flex-start; gap: 10px; width: 100%; min-height: 44px; padding: 8px 10px; text-align: left; border: 1px solid var(--cv-line); border-radius: 10px; background: var(--cv-surface); }
.cv-chap-btn:hover { border-color: var(--cv-accent); }
.cv-chap-current .cv-chap-btn { border-color: var(--cv-accent); }
.cv-chev { flex: none; width: 16px; padding-top: 2px; color: var(--cv-accent); font-size: 14px; }
.cv-chap-text { display: grid; gap: 1px; min-width: 0; }
.cv-chap-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--cv-accent); }
.cv-chap-title { font-weight: 600; line-height: 1.3; }
.cv-chap-meta { font-size: 12px; color: var(--cv-muted); }
.cv-chap-panel { display: grid; gap: 14px; padding-left: 4px; }
.cv-chap-panel[hidden] { display: none; }

.cv-soon-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.cv-soon-list li { display: flex; align-items: flex-start; gap: 8px; padding: 6px 4px; color: var(--cv-muted); font-size: 14px; }
.cv-soon-list svg { flex: none; margin-top: 3px; }
.cv-soon-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
.cv-soon-title { display: block; line-height: 1.3; }

.cv-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid var(--cv-line); font-size: 13px; color: var(--cv-muted); }
.cv-link { padding: 6px 4px; border: 0; background: none; color: var(--cv-accent); font-size: 13px; font-weight: 600; text-decoration: underline; }

.cv-main { min-width: 0; }
.cv-head { display: grid; gap: 6px; justify-items: start; margin-bottom: 14px; }
.cv-kicker { margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--cv-accent); }
.cv-head h3 { margin: 0; font-size: 22px; line-height: 1.2; }
.cv-group-pill { margin: 0; padding: 1px 10px; border: 1px solid var(--cv-line); border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--cv-muted); }
.cv-text { margin: 0; max-width: 68ch; color: var(--cv-ink); }
.cv-covers { margin: 0; font-size: 14px; color: var(--cv-muted); }
.cv-covers strong { color: var(--cv-ink); }
.cv-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.cv-open-link { background: var(--cv-cta); border-color: var(--cv-cta-edge); color: var(--cv-cta-ink); font-weight: 700; box-shadow: 0 1px 0 var(--cv-cta-edge); }
.cv-open-link:hover:not(:disabled) { background: var(--cv-cta-hover); border-color: var(--cv-cta-edge); }
.cv-frame { display: block; width: 100%; height: min(78vh, 820px); min-height: 480px; border: 1px solid var(--cv-line); border-radius: 12px; background: var(--cv-bg); }
.cv-next { margin-top: 14px; }
.cv-upnext { display: grid; gap: 2px; width: 100%; padding: 12px 16px; text-align: left; border: 1px solid var(--cv-line); border-radius: 12px; background: var(--cv-surface); }
.cv-upnext:hover { border-color: var(--cv-accent); background: var(--cv-soft); }
.cv-upnext-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--cv-muted); }
.cv-upnext-title { font-weight: 600; color: var(--cv-accent); }
.cv-end { display: flex; align-items: center; gap: 8px; margin: 0; padding: 12px 16px; border: 1px dashed var(--cv-line); border-radius: 12px; color: var(--cv-muted); }

@media (min-width: 900px) {
  .cv-browse { display: none; }
  .cv-body { grid-template-columns: 300px minmax(0, 1fr); }
  .cv-list { display: grid; position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto; overscroll-behavior: contain; }
}
@media (max-width: 899px) {
  .cv-frame { min-height: 440px; }
  .cv-steps { margin-left: 0; width: 100%; }
  .cv-steps .cv-btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) { .cv * { transition: none !important; scroll-behavior: auto !important; } }
`;
