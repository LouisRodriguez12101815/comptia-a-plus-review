import type { JSX, SVGProps } from "react";
import type { DeviceIconName, ToolId } from "@/lib/tracks";

type IconProps = SVGProps<SVGSVGElement>;

/*
 * Flat device icons: one outline weight, rounded joins, a dark panel fill, and an
 * accent stroke from currentColor. They are decorative (aria-hidden) because the
 * text beside them always names the device.
 */
const device = {
  width: 48,
  height: 48,
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export function LaptopIcon(props: IconProps) {
  return (
    <svg {...device} {...props}>
      <rect x="10" y="10" width="28" height="20" rx="2.5" className="fill-slate-900" />
      <path d="M5 36h38l-3.5-6h-31z" className="fill-slate-800" />
      <path d="M20 33.5h8" />
    </svg>
  );
}

export function ServerIcon(props: IconProps) {
  return (
    <svg {...device} {...props}>
      <rect x="9" y="8" width="30" height="13" rx="2.5" className="fill-slate-900" />
      <rect x="9" y="27" width="30" height="13" rx="2.5" className="fill-slate-900" />
      <path d="M15 14.5h.01M15 33.5h.01M21 14.5h12M21 33.5h12" />
    </svg>
  );
}

export function SwitchIcon(props: IconProps) {
  return (
    <svg {...device} {...props}>
      <rect x="5" y="17" width="38" height="16" rx="3" className="fill-slate-900" />
      <path d="M12 25h.01M18 25h.01M24 25h.01M30 25h.01M36 25h.01" />
      <path d="M12 17v-5M24 17v-5M36 17v-5" />
    </svg>
  );
}

export function RouterIcon(props: IconProps) {
  return (
    <svg {...device} {...props}>
      <rect x="6" y="26" width="36" height="13" rx="3" className="fill-slate-900" />
      <path d="M13 32.5h.01M19 32.5h.01M33 32.5h4" />
      <path d="M14 26L9 12M34 26l5-14" />
      <path d="M18 17a8 8 0 0 1 12 0M20.5 21a4 4 0 0 1 7 0" />
    </svg>
  );
}

export function AccessPointIcon(props: IconProps) {
  return (
    <svg {...device} {...props}>
      <rect x="9" y="30" width="30" height="9" rx="3" className="fill-slate-900" />
      <path d="M15 34.5h.01M21 34.5h.01" />
      <path d="M14 22a14 14 0 0 1 20 0M18.5 26.5a8 8 0 0 1 11 0" />
      <path d="M24 17v0" />
    </svg>
  );
}

const deviceIcons: Record<DeviceIconName, (props: IconProps) => JSX.Element> = {
  laptop: LaptopIcon,
  server: ServerIcon,
  switch: SwitchIcon,
  router: RouterIcon,
};

export function DeviceIcon({ name, ...props }: { name: DeviceIconName } & IconProps) {
  const Icon = deviceIcons[name];
  return <Icon {...props} />;
}

const small = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export function ToolIcon({ id, ...props }: { id: ToolId } & IconProps) {
  switch (id) {
    case "notes":
      return (
        <svg {...small} {...props}>
          <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
          <path d="M9 9h6M9 13h6" />
        </svg>
      );
    case "visuals":
      return (
        <svg {...small} {...props}>
          <circle cx="6" cy="7" r="2.2" />
          <circle cx="18" cy="7" r="2.2" />
          <circle cx="12" cy="18" r="2.2" />
          <path d="M8 7h8M7.2 9l3.6 7M16.8 9l-3.6 7" />
        </svg>
      );
    case "flashcards":
      return (
        <svg {...small} {...props}>
          <rect x="6" y="3" width="13" height="10" rx="2" />
          <rect x="4" y="8" width="13" height="10" rx="2" className="fill-slate-900" />
          <path d="M7.5 13h6" />
        </svg>
      );
    case "quiz":
      return (
        <svg {...small} {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
        </svg>
      );
    case "labs":
      return (
        <svg {...small} {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 10l3 2-3 2M13 14h4" />
        </svg>
      );
    case "game":
      return (
        <svg {...small} {...props}>
          <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
  }
}

/* Status icons. Color is never the only signal: each status pairs an icon with a label. */
export function StatusIcon({
  kind,
  ...props
}: { kind: "ready" | "soon" | "shared" | "elsewhere" } & IconProps) {
  const p = { ...small, width: 14, height: 14, strokeWidth: 2.2, ...props };
  switch (kind) {
    case "ready":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.7 2.7L16 9.5" />
        </svg>
      );
    case "soon":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "shared":
      return (
        <svg {...p}>
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8.2 11l7.6-4M8.2 13l7.6 4" />
        </svg>
      );
    case "elsewhere":
      return (
        <svg {...p}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
  }
}
