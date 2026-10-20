import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
export function MissionReturnLink() {
  const t = useTranslations("missionReturnLink");
  return <p className="rounded-xl border border-teal-300/40 bg-slate-900 p-4 text-sm"><Link href="/practice-games/next-hop-mission" className="-my-2 inline-flex min-h-11 items-center py-2 text-cyan-200 underline">{t("link")}</Link><span className="ml-2 text-slate-300">{t("note")}</span></p>;
}
