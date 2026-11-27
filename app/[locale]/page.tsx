import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EditorialHome } from "@/app/components/EditorialHome";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "toolkitHome" });
  return { title: "GapLift | " + t("descriptor"), description: t("intro") };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EditorialHome />;
}
