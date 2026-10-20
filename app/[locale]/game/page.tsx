import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OutageOps } from "@/app/components/game/OutageOps";

export async function generateMetadata({ params }: PageProps<"/[locale]/game">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gamePage" });
  return { title: t("title"), description: t("description") };
}

export default async function GamePage({ params }: PageProps<"/[locale]/game">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gamePage");
  return <><p className="mb-5"><Link href="/practice-games" className="text-cyan-200 underline">{t("backToPractice")}</Link></p><OutageOps /></>;
}
