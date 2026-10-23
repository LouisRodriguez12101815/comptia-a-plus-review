import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import guide from "@/docs/assessment-workflow-guide.json";
import { GuideBody, type GuideContent } from "./GuideBody";

export async function generateMetadata({ params }: PageProps<"/[locale]/assessment-workflow">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "assessmentWorkflowPage" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function AssessmentWorkflowPage({ params }: PageProps<"/[locale]/assessment-workflow">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "assessmentWorkflowPage" });

  return <GuideBody
    guide={guide as GuideContent}
    locale={locale}
    eyebrow={t("eyebrow")}
    title={t("title")}
    englishNotice={locale === "en" ? undefined : t("englishNotice")}
    navigation={<Link href="/coverage"><span aria-hidden="true">← </span>{t("backToCoverage")}</Link>}
  />;
}
