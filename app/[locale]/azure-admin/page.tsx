import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/azure-admin">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("azure-admin.label") }),
    description: t("azure-admin.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/azure-admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="azure-admin" />;
}
