import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-saa">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("aws-saa.label") }),
    description: t("aws-saa.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/aws-saa">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="aws-saa" />;
}
