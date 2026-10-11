"use client";

import { useState } from "react";

export default function ChapterViewer({ visuals }) {
  const [index, setIndex] = useState(0);
  const current = visuals[index];
  const groups = [...new Set(visuals.map((v) => v.group))];

  return (
    <div className="viewer">
      <nav aria-label="Chapter visuals" className="viewer-list">
        {groups.map((group) => (
          <div key={group} className="viewer-group">
            <p className="viewer-group-label">{group}</p>
            {visuals.map((v, i) =>
              v.group === group ? (
                <button
                  key={v.file}
                  type="button"
                  className="viewer-item"
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                >
                  {v.title}
                </button>
              ) : null
            )}
          </div>
        ))}
      </nav>

      <div className="viewer-main">
        <div className="viewer-head">
          <div>
            <h3>{current.title}</h3>
            <p className="muted">{current.description}</p>
          </div>
          <a
            className="open-link"
            href={`/visuals/${current.file}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full screen
          </a>
        </div>
        <iframe
          key={current.file}
          className="viewer-frame"
          src={`/visuals/${current.file}`}
          title={current.title}
        />
      </div>
    </div>
  );
}
