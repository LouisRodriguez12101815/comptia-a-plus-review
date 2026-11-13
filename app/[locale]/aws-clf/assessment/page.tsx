import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AwsClfAssessment } from "@/app/components/AwsClfAssessment";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-clf/assessment">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "awsClfAssessment" });
  return { title: t("title"), description: t("intro") };
}

export default async function Page({ params }: PageProps<"/[locale]/aws-clf/assessment">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AwsClfAssessment />;
}
