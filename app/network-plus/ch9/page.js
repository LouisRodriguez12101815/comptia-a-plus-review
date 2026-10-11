import ch9 from "@/content/network-plus/ch9.json";
import ChapterViewer from "@/app/network-plus/ch10/ChapterViewer";

export const metadata = { title: ch9.title };

const css = `
.ch9 {
  --bg: #f6f4ef; --surface: #ffffff; --ink: #1d1f24; --muted: #5d6270;
  --line: #d9d5cc; --accent: #1f5f7a; --accent-soft: #dcebf1;
  color-scheme: light;
  background: var(--bg); color: var(--ink);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
  max-width: 1080px; margin: 0 auto; padding: 32px 16px 56px;
}
@media (prefers-color-scheme: dark) {
  .ch9 {
    --bg: #15171c; --surface: #1e2129; --ink: #ece9e1; --muted: #a3a8b5;
    --line: #353a46; --accent: #7fc0da; --accent-soft: #223640;
    color-scheme: dark;
  }
}
.ch9 h1 { font-size: clamp(28px, 4vw, 38px); line-height: 1.15; margin: 4px 0 12px; }
.ch9 h2 { font-size: 22px; margin: 0 0 6px; }
.ch9 h3 { font-size: 18px; margin: 0 0 4px; }
.ch9 .eyebrow { color: var(--accent); font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: .06em; margin: 0; }
.ch9 .lede { color: var(--muted); max-width: 70ch; margin: 0; }
.ch9 .muted { color: var(--muted); margin: 0 0 12px; }
.ch9 .card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 22px; margin-top: 24px; min-width: 0; }
.ch9 .links a { color: var(--accent); font-weight: 600; }
`;

export default function Page() {
  const hasVisuals = ch9.visuals && ch9.visuals.length > 0;
  return (
    <main className="ch9">
      <style>{css}</style>

      <header>
        <p className="eyebrow">CompTIA Network+ · Chapter 9</p>
        <h1>{ch9.title}</h1>
        <p className="lede">{ch9.summary}</p>
        <p className="links">
          <a href="/notes?exam=n10-009">Read the Chapter 9 notes in the Notes section</a>
        </p>
      </header>

      {hasVisuals ? (
        <section className="card" aria-labelledby="visuals-heading">
          <h2 id="visuals-heading">Interactive visuals</h2>
          <p className="muted">Pick a topic. Each visual is interactive, and you can open it full screen.</p>
          <ChapterViewer visuals={ch9.visuals} />
        </section>
      ) : null}
    </main>
  );
}
