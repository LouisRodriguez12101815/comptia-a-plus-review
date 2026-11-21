"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { trackForPath } from "@/lib/tracks";

export function FooterNotice() {
  const t = useTranslations("footer");
  const tracks = useTranslations("tracks");
  const pathname = usePathname();
  const [focus] = useStudyFocus();
  const track = trackForPath(pathname, focus);
  const certification = track ? tracks(`${track.id}.label`) : t("thisCertification");
  return <p className="max-w-prose">{t("disputeNotice", { certification })}</p>;
}
