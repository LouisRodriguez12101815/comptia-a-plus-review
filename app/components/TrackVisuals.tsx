import Link from "next/link";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";
import VisualLibrary from "@/app/components/VisualLibrary";
import { getTrack, type TrackId } from "@/lib/tracks";
import { visualChapters } from "@/lib/visuals";

/* The picker and the visuals use the same cream and teal palette as the Network+
   chapter pages, set here as variables so the picker can read them. */
const css = `
.cvp {
  --bg: #f6f4ef; --surface: #ffffff; --ink: #1d1f24; --muted: #5d6270;
  --line: #d9d5cc; --accent: #1f5f7a; --accent-soft: #dcebf1;
  color-scheme: light;
  background: var(--bg); color: var(--ink);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
  border-radius: 18px; padding: 24px 16px 32px;
}
@media (prefers-color-scheme: dark) {
  .cvp {
    --bg: #15171c; --surface: #1e2129; --ink: #ece9e1; --muted: #a3a8b5;
    --line: #353a46; --accent: #7fc0da; --accent-soft: #223640;
    color-scheme: dark;
  }
}
.cvp h1 { font-size: clamp(26px, 4vw, 34px); line-height: 1.15; margin: 4px 0 10px; }
.cvp h2 { font-size: 22px; margin: 0 0 6px; }
.cvp .eyebrow { color: var(--accent); font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: .06em; margin: 0; }
.cvp .lede { color: var(--muted); max-width: 70ch; margin: 0; }
.cvp .card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 22px; margin-top: 22px; min-width: 0; }
.cvp .muted { color: var(--muted); margin: 0 0 12px; }
.cvp .empty-list { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.cvp .empty-list li { padding: 10px 12px; border: 1px dashed var(--line); border-radius: 10px; color: var(--muted); }
.cvp .empty-list strong { display: block; color: var(--ink); }
.cvp .empty-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.cvp .empty-links a { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border: 1px solid var(--accent); border-radius: 10px; background: var(--accent-soft); color: var(--ink); font-weight: 600; text-decoration: none; }
.cvp .empty-links a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
`;

const emptyCopy: Record<TrackId, string> = {
  core1: "Visuals for Core 1 are being added chapter by chapter.",
  core2: "Visuals for Core 2 are being added chapter by chapter.",
  networking: "Visuals for Network+ are being added chapter by chapter.",
  ccna: "CCNA does not have interactive visuals yet. The Packet Tracer labs are ready now and each one includes its own topology.",
};

export function TrackVisuals({ trackId }: { trackId: TrackId }) {
  const track = getTrack(trackId);
  const chapters = visualChapters(track.focus);
  const total = chapters.reduce((sum, chapter) => sum + chapter.visuals.length, 0);
  const readyCount = chapters.filter((chapter) => chapter.visuals.length > 0).length;

  return (
    <div className="space-y-6">
      <SetTrackFocus focus={track.focus} />
      <section className="cvp" aria-labelledby="visuals-title">
        <style>{css}</style>
        <header>
          <p className="eyebrow">
            {track.label} · <span style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace", textTransform: "none" }}>{track.code}</span>
          </p>
          <h1 id="visuals-title">Visuals</h1>
          <p className="lede">
            {total > 0
              ? `${total} interactive visuals across ${readyCount} ${readyCount === 1 ? "chapter" : "chapters"}. Go through them in order with Next, or open a chapter and jump to any topic.`
              : "Interactive diagrams and simulators that make each chapter easier to picture."}
          </p>
        </header>

        {total > 0 ? (
          <div className="card">
            <h2 id="visuals-heading">Interactive visuals</h2>
            <p className="muted">Each visual is interactive, and you can open it full screen.</p>
            <VisualLibrary chapters={chapters} />
          </div>
        ) : (
          <div className="card">
            <h2>No visuals yet</h2>
            <p className="muted">{emptyCopy[trackId]}</p>
            {chapters.length > 0 ? (
              <ul className="empty-list">
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <strong>
                      {chapter.label}: {chapter.title}
                    </strong>
                    Coming soon
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="empty-links">
              {track.focus ? <Link href="/notes">Read the notes</Link> : null}
              {track.id === "ccna" ? <Link href="/labs">Open the labs</Link> : null}
              <Link href={track.href}>Back to {track.short}</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
