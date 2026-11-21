import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SaaMistakeLog } from "@/app/components/SaaMistakeLog";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-saa/mistakes">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saaMistakes" });
  return { title: t("title"), description: t("intro") };
}

export default async function Page({ params }: PageProps<"/[locale]/aws-saa/mistakes">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SetTrackFocus focus="saa-c03" />
      <SaaMistakeLog />
    </>
  );
}
