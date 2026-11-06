import { OrbField } from "@/app/components/OrbMotionSystem";

export type AmbientVariant = "lab" | "network" | "hardware" | "software" | "cloud" | "security" | "azure" | "ccna" | "workflow" | "discovery" | "progress" | "objectives";

const paths: Record<AmbientVariant, string[]> = {
  lab: ["M50 190 260 80 470 200 710 90 1150 190", "M80 610 310 470 540 570 820 430 1130 560"],
  network: ["M40 180 180 90 330 210 510 120 690 250 865 118 1130 205", "M80 570 240 430 410 520 600 390 790 540 990 420 1160 505"],
  hardware: ["M60 170H260L320 110H520L580 170H820L900 100H1140", "M100 560H300L360 500H620L680 560H1100"],
  software: ["M60 170H260V100H520V180H760V110H1130", "M90 560H340V470H610V550H890V430H1130"],
  cloud: ["M60 190C190 40 340 40 470 180S760 320 880 150 1060 50 1150 180", "M80 560C230 420 350 430 500 540S790 650 930 500 1080 420 1160 540"],
  security: ["M60 180 250 80 440 180 630 80 820 180 1010 80 1150 160", "M80 560 260 470 440 560 620 470 800 560 980 470 1160 550"],
  azure: ["M50 180 220 90 420 190 600 80 820 190 1030 90 1150 180", "M80 560 280 450 470 550 680 430 880 550 1080 450"],
  ccna: ["M45 190 200 80 380 210 560 100 740 220 940 90 1150 190", "M70 570 250 450 430 560 620 430 820 560 1010 440 1160 550"],
  workflow: ["M50 190H220L320 100H500L600 190H780L880 100H1150", "M80 560H290L390 470H620L720 560H1120"],
  discovery: ["M55 180 230 90 410 190 590 95 780 200 980 100 1145 180", "M80 570 260 450 450 550 650 440 850 550 1060 450"],
  progress: ["M45 560 210 470 350 500 510 330 680 390 850 220 1140 280", "M80 180H260L380 250H610L760 150H1130"],
  objectives: ["M50 190 220 90 390 190 560 90 730 190 900 90 1150 190", "M80 560 260 450 440 560 620 450 800 560 980 450 1160 560"],
};

export function CertificationAmbient({ variant }: { variant: AmbientVariant }) {
  const motifPaths = paths[variant];
  return (
    <div aria-hidden="true" className={`certification-ambient ambient-${variant}`}>
      <div className="certification-aura" />
      <svg viewBox="0 0 1200 720" preserveAspectRatio="none" className="certification-topology">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          {motifPaths.map((path, index) => <path key={`${variant}-${index}`} d={path} />)}
        </g>
        <g fill="currentColor">
          {motifPaths.flatMap((path) => {
            const points = path.match(/[ML]([0-9]+) ([0-9]+)/g) ?? [];
            return points.slice(0, 5).map((point, index) => {
              const [, x, y] = point.match(/[ML]([0-9]+) ([0-9]+)/) ?? [];
              return <circle key={`${path}-${index}`} cx={x} cy={y} r={index % 2 ? 2 : 3} />;
            });
          })}
        </g>
        <OrbField paths={motifPaths} className="ambient-orbs" />
        <circle className="certification-packet" cx="0" cy="0" r="4" fill="var(--color-cyan-300)">
          <animateMotion dur="19s" repeatCount="indefinite" path={motifPaths[0]} />
        </circle>
      </svg>
    </div>
  );
}

export function ambientVariantForPath(pathname: string, trackId?: string): AmbientVariant {
  if (pathname.startsWith("/methodology") || pathname.startsWith("/assessment-workflow")) return "workflow";
  if (pathname.startsWith("/search")) return "discovery";
  if (pathname.startsWith("/coverage")) return "objectives";
  if (pathname.startsWith("/scorecard") || pathname.startsWith("/weak-areas")) return "progress";
  if (trackId === "networking") return "network";
  if (trackId === "core1") return "hardware";
  if (trackId === "core2") return "software";
  if (trackId === "ccna") return "ccna";
  if (trackId === "security-plus") return "security";
  if (trackId === "azure-admin") return "azure";
  if (trackId?.startsWith("aws-")) return "cloud";
  return "lab";
}
