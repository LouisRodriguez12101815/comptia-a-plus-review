import type { ReactNode } from "react";

type MotionConceptAProps = {
  eyebrow: string;
  heading: string;
  stages: readonly { label: string; detail: string }[];
  children: ReactNode;
};

/** Concept A: a quiet network of study stages that keeps the learner's loop visible. */
export function MotionConceptA({ eyebrow, heading, stages, children }: MotionConceptAProps) {
  return (
    <div className="motion-a-shell">
      <div className="motion-a-network" aria-hidden="true">
        <svg viewBox="0 0 1200 460" preserveAspectRatio="none">
          <path d="M-40 340C160 80 290 420 500 160S830 40 1240 250" />
          <path d="M-20 110C220 300 390 40 640 250S940 350 1220 80" />
          {[{ x: 120, y: 220 }, { x: 350, y: 330 }, { x: 520, y: 150 }, { x: 760, y: 280 }, { x: 1010, y: 170 }].map((node) => (
            <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r="4" />
          ))}
          <circle className="motion-a-packet" cx="0" cy="0" r="5">
            <animateMotion dur="18s" repeatCount="indefinite" path="M-40 340C160 80 290 420 500 160S830 40 1240 250" />
          </circle>
        </svg>
      </div>
      <div className="motion-a-content">
        {children}
        <section className="motion-a-loop" aria-labelledby="motion-a-loop-heading">
          <div className="motion-a-loop-heading">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300">{eyebrow}</p>
            <h2 id="motion-a-loop-heading" className="text-2xl font-semibold text-white">{heading}</h2>
          </div>
          <ol className="motion-a-stages">
            {stages.map((stage, index) => (
              <li key={stage.label} className="motion-a-stage">
                <span className="motion-a-stage-node" aria-hidden="true">0{index + 1}</span>
                <div>
                  <h3>{stage.label}</h3>
                  <p>{stage.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
