import ch10 from "@/content/network-plus/ch10.json";
import ChapterViewer from "./ChapterViewer";

export const metadata = { title: ch10.title };

const css = `
.ch10 {
  --bg: #f6f4ef; --surface: #ffffff; --ink: #1d1f24; --muted: #5d6270;
  --line: #d9d5cc; --accent: #1f5f7a; --accent-soft: #dcebf1;
  color-scheme: light;
  background: var(--bg); color: var(--ink);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
  max-width: 1080px; margin: 0 auto; padding: 32px 16px 56px;
}
@media (prefers-color-scheme: dark) {
  .ch10 {
    --bg: #15171c; --surface: #1e2129; --ink: #ece9e1; --muted: #a3a8b5;
    --line: #353a46; --accent: #7fc0da; --accent-soft: #223640;
    color-scheme: dark;
  }
}
.ch10 h1 { font-size: clamp(28px, 4vw, 38px); line-height: 1.15; margin: 4px 0 12px; }
.ch10 h2 { font-size: 22px; margin: 0 0 6px; }
.ch10 h3 { font-size: 18px; margin: 0 0 4px; }
.ch10 .eyebrow { color: var(--accent); font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: .06em; margin: 0; }
.ch10 .lede { color: var(--muted); max-width: 70ch; margin: 0; }
.ch10 .muted { color: var(--muted); margin: 0 0 12px; }
.ch10 .card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 22px; margin-top: 24px; min-width: 0; }
.ch10 .table-wrap { overflow-x: auto; }
.ch10 table { width: 100%; border-collapse: collapse; }
.ch10 th, .ch10 td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); }
.ch10 thead th { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.ch10 td { font-variant-numeric: tabular-nums; }
.ch10 .viewer { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 20px; align-items: start; }
.ch10 .viewer-list { display: grid; gap: 14px; }
.ch10 .viewer-group-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 0 0 6px; }
.ch10 .viewer-group { display: grid; gap: 6px; }
.ch10 .viewer-item {
  font: inherit; text-align: left; color: var(--ink); background: var(--bg);
  border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; cursor: pointer;
}
.ch10 .viewer-item:hover { border-color: var(--accent); }
.ch10 .viewer-item[aria-pressed="true"] { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }
.ch10 .viewer-item:focus-visible, .ch10 .open-link:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.ch10 .viewer-main { min-width: 0; }
.ch10 .viewer-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 12px; }
.ch10 .open-link { color: var(--accent); font-weight: 600; white-space: nowrap; }
.ch10 .viewer-frame {
  display: block; width: 100%; height: min(78vh, 820px); min-height: 520px;
  border: 1px solid var(--line); border-radius: 12px; background: var(--bg);
}
@media (max-width: 760px) {
  .ch10 .viewer { grid-template-columns: 1fr; }
  .ch10 .viewer-list { grid-template-columns: 1fr; }
  .ch10 .viewer-frame { min-height: 460px; }
}
`;

export default function Page() {
  return (
    <main className="ch10">
      <style>{css}</style>

      <header>
        <p className="eyebrow">CompTIA Network+ · Chapter 10</p>
        <h1>{ch10.title}</h1>
        <p className="lede">{ch10.summary}</p>
      </header>

      <section className="card" aria-labelledby="ad-heading">
        <h2 id="ad-heading">Administrative distance</h2>
        <p className="muted">Lower numbers are trusted more. The router installs the route from the source with the lowest AD.</p>
        <div className="table-wrap">
          <table>
            <caption className="muted" style={{ textAlign: "left", captionSide: "top", padding: 0 }}>
              Default administrative distance by route source
            </caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">AD</th>
              </tr>
            </thead>
            <tbody>
              {ch10.adTable.map((row) => (
                <tr key={row.source}>
                  <th scope="row">{row.source}</th>
                  <td>{row.ad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="visuals-heading">
        <h2 id="visuals-heading">Interactive visuals</h2>
        <p className="muted">Pick a topic. Each visual is interactive, and you can open it full screen.</p>
        <ChapterViewer visuals={ch10.visuals} />
      </section>
    </main>
  );
}
