import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChallengeCatalog } from "@/app/components/practice/ChallengeCatalog";
import { challenges } from "@/lib/practice/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "practicePage" });
  return { title: t("title"), description: t("description") };
}

export default async function PracticeGamesPage({ params }: PageProps<"/[locale]/practice-games">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChallengeCatalog challenges={challenges} />;
}
