import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/security-plus">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("security-plus.label") }),
    description: t("security-plus.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/security-plus">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="security-plus" />;
}
