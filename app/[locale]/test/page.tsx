import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExamTest } from "./ExamTest";

export async function generateMetadata({ params }: PageProps<"/[locale]/test">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "testPage" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

const examCodes = ["220-1201", "220-1202", "n10-009"] as const;
type ExamCode = (typeof examCodes)[number];

export default async function TestPage({ params, searchParams }: PageProps<"/[locale]/test">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("testPage");
  const { exam } = await searchParams;
  const initialExam = examCodes.includes(exam as ExamCode) ? (exam as ExamCode) : undefined;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("heading")}</h1>
        <p className="max-w-3xl text-slate-300">
          {t.rich("intro", {
            coverageLink: (chunks) => (
              <Link href="/coverage" className="text-teal-300 underline underline-offset-4 hover:text-teal-200">{chunks}</Link>
            ),
          })}
        </p>
      </header>
      <ExamTest initialExam={initialExam} />
    </div>
  );
}
