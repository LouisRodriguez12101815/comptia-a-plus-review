"use client";

import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";
import { setStudyFocus } from "@/lib/progress";
import type { StudyFocus } from "@/lib/types";

/**
 * A link that stores the track's exam focus before navigating, so the existing
 * notes, flashcard, and quiz pages open already filtered to that certification.
 */
export function TrackLink({
  focus,
  onClick,
  ...props
}: { focus: StudyFocus | null } & ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (focus) setStudyFocus(focus);
        onClick?.(event);
      }}
    />
  );
}
