import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackVisuals } from "@/app/components/TrackVisuals";

export async function generateMetadata({ params }: PageProps<"/[locale]/azure-admin/visuals">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return { title: t("visualsPageTitle", { track: t("azure-admin.short") }) };
}

export default async function Page({ params }: PageProps<"/[locale]/azure-admin/visuals">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackVisuals trackId="azure-admin" />;
}
