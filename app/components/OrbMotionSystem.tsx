import type { ReactNode } from "react";

type OrbMotionProps = {
  path: string;
  duration?: string;
  delay?: string;
  className?: string;
  children?: ReactNode;
};

/** A tiny SVG motion primitive shared by ambient and interactive lab scenes. */
export function MotionOrb({ path, duration = "12s", delay = "0s", className = "", children }: OrbMotionProps) {
  return (
    <g className={`motion-orb ${className}`}>
      <circle r="7" className="motion-orb-halo" />
      <circle r="2.5" className="motion-orb-core" />
      <animateMotion dur={duration} begin={delay} repeatCount="indefinite" path={path}>
        {children}
      </animateMotion>
    </g>
  );
}

export function OrbField({ paths, className = "" }: { paths: string[]; className?: string }) {
  return (
    <g className={`orb-field ${className}`}>
      {paths.map((path, index) => (
        <MotionOrb key={`${path}-${index}`} path={path} duration={`${11 + index * 3}s`} delay={`${index * -2}s`} />
      ))}
    </g>
  );
}
