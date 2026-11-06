"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { trackForPath } from "@/lib/tracks";
import { ambientVariantForPath, CertificationAmbient } from "@/app/components/CertificationAmbient";

/**
 * Gives every page under a certification that certification's accent color, so the header, the tool
 * bar and the content all match. Pages outside a certification keep the default accent.
 */
export function TrackTheme({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [focus] = useStudyFocus();
  const track = trackForPath(pathname, focus);
  return <div className={`relative isolate block min-h-full ${track ? `track-shell track-${track.id}` : ""}`}><CertificationAmbient variant={ambientVariantForPath(pathname, track?.id)} />{children}</div>;
}
