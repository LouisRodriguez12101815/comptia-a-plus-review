import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { saaContrastGroup, saaContrastHref, saaContrastTarget } from "@/lib/saa-contrast";
import { questions } from "@/lib/content";

export function SaaContrastFeedback({ id, review }: {
  id: string;
  review?: { excluded: ReadonlySet<string>; seen: ReadonlySet<string> };
}) {
  const t = useTranslations("saaContrast");
  const group = saaContrastGroup(id);
  if (!group) return null;
  const target = review ? saaContrastTarget(id, questions, review.excluded, review.seen) : undefined;
  return (
    <div className="mt-3 rounded-lg border border-teal-800 bg-slate-950/60 p-3 text-sm text-slate-200">
      <p className="font-medium text-teal-200">{t(`${group}.title`)}</p>
      <p className="mt-1">{t(`${group}.rule`)}</p>
      {target && <Link href={saaContrastHref(target, "contrast")} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("retry", { topic: t(`${group}.title`) })}</Link>}
    </div>
  );
}
