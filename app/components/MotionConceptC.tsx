"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Stage = { label: string; detail: string };

export function MotionConceptC({ eyebrow, heading, stages, children }: { eyebrow: string; heading: string; stages: readonly Stage[]; children: ReactNode }) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.stage ?? 0));
      });
    }, { threshold: 0.55 });
    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="motion-c-shell">
      {children}
      <section className="motion-c-journey" aria-labelledby="motion-c-heading">
        <div className="motion-c-intro"><p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300">{eyebrow}</p><h2 id="motion-c-heading" className="mt-2 text-2xl font-semibold text-white">{heading}</h2></div>
        <div className="motion-c-path" aria-hidden="true"><span className="motion-c-path-fill" style={{ width: `${(active / Math.max(stages.length - 1, 1)) * 100}%` }} /><span className="motion-c-path-pulse" style={{ left: `${(active / Math.max(stages.length - 1, 1)) * 100}%` }} /></div>
        <ol className="motion-c-stages">
          {stages.map((stage, index) => <li key={stage.label} ref={(node) => { refs.current[index] = node; }} data-stage={index} className={`motion-c-stage ${index === active ? "is-active" : ""} ${index < active ? "is-complete" : ""}`}><span className="motion-c-node">{index < active ? "✓" : index + 1}</span><div><h3>{stage.label}</h3><p>{stage.detail}</p></div></li>)}
        </ol>
      </section>
    </div>
  );
}
