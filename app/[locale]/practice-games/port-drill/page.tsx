import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PortDrill } from "@/app/components/practice/PortDrill";

export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games/port-drill">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portDrillPage" });
  return { title: t("title"), description: t("description") };
}

export default async function PortDrillPage({ params }: PageProps<"/[locale]/practice-games/port-drill">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortDrill />;
}
