"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Stat = { label: string; value: number };
type Station = { label: string; detail: string };

export function MotionConceptB({ eyebrow, heading, ariaLabel, stats, stations, children }: { eyebrow: string; heading: string; ariaLabel: string; stats: readonly Stat[]; stations: readonly Station[]; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="motion-b-shell">
      {children}
      <section ref={ref} className={`motion-b-station ${active ? "is-active" : ""}`} aria-labelledby="motion-b-heading">
        <div className="motion-b-grid" aria-hidden="true" />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300">{eyebrow}</p>
          <h2 id="motion-b-heading" className="mt-2 text-2xl font-semibold text-white">{heading}</h2>
          <div className="motion-b-stats" aria-label={ariaLabel}>
            {stats.map((stat) => <div key={stat.label} className="motion-b-stat"><strong>{active ? stat.value : 0}</strong><span>{stat.label}</span></div>)}
          </div>
          <div className="motion-b-stations">
            {stations.map((station, index) => <article key={station.label} className="motion-b-card" style={{ "--motion-delay": `${index * 90}ms` } as CSSProperties}><span className="motion-b-card-index">0{index + 1}</span><h3>{station.label}</h3><p>{station.detail}</p></article>)}
          </div>
        </div>
      </section>
    </div>
  );
}
