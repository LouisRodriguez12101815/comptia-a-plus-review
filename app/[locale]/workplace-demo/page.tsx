import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WorkplaceDemo } from "@/app/components/WorkplaceDemo";

export async function generateMetadata({ params }: PageProps<"/[locale]/workplace-demo">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workplaceDemo" });
  return { title: t("title"), description: t("intro") };
}

export default async function WorkplaceDemoPage({ params }: PageProps<"/[locale]/workplace-demo">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WorkplaceDemo />;
}
