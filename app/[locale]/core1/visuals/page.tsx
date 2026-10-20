import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackVisuals } from "@/app/components/TrackVisuals";

export async function generateMetadata({ params }: PageProps<"/[locale]/core1/visuals">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return { title: t("visualsPageTitle", { track: t("core1.short") }) };
}

export default async function Page({ params }: PageProps<"/[locale]/core1/visuals">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackVisuals trackId="core1" />;
}
