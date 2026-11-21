import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SaaGameHub } from "@/app/components/SaaMemoryGame";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-saa/games">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saaGames" });
  return { title: t("hubTitle"), description: t("hubIntro") };
}

export default async function Page({ params }: PageProps<"/[locale]/aws-saa/games">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SetTrackFocus focus="saa-c03" />
      <SaaGameHub />
    </>
  );
}
