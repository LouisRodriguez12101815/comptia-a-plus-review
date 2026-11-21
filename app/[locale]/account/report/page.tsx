import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OwnerReport } from "@/app/components/OwnerReport";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/report">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ownerReport" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function OwnerReportPage({ params }: PageProps<"/[locale]/account/report">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ownerReport" });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
        <p className="max-w-3xl text-slate-300">{t("intro")}</p>
      </header>
      <OwnerReport />
    </div>
  );
}
