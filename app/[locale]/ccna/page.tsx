import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/ccna">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("ccna.label") }),
    description: t("ccna.description"),
  };
}

export default async function CcnaPage({ params }: PageProps<"/[locale]/ccna">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="ccna" />;
}
