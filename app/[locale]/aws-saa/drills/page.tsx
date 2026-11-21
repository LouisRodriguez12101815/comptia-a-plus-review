import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SaaDrillHub } from "@/app/components/SaaDrillHub";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-saa/drills">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saaDrills" });
  return { title: t("title"), description: t("intro") };
}

export default async function Page({ params }: PageProps<"/[locale]/aws-saa/drills">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SetTrackFocus focus="saa-c03" />
      <SaaDrillHub />
    </>
  );
}
