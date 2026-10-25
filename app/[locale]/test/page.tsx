import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import visuals from "@/content/track-visuals.json";
import { ExamTest, type LabLink } from "./ExamTest";

export async function generateMetadata({ params }: PageProps<"/[locale]/test">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "testPage" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

const examCodes = ["220-1201", "220-1202", "n10-009", "clf-c02", "saa-c03"] as const;
type ExamCode = (typeof examCodes)[number];

export default async function TestPage({ params, searchParams }: PageProps<"/[locale]/test">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("testPage");
  const { exam, focus, drill, pair } = await searchParams;
  const initialExam = examCodes.includes(exam as ExamCode) ? (exam as ExamCode) : undefined;
  // ?focus=2.3,3.4 starts a test on those objectives (from the scorecard).
  const initialFocus = (typeof focus === "string" ? focus.split(",") : []).filter((id) => /^\d+\.\d+$/.test(id)).slice(0, 10);
  // ?drill=id,id&pair=group:a>b runs a short test on one look-alike pair (from the scorecard).
  const initialDrill = (typeof drill === "string" ? drill.split(",") : []).filter((id) => /^[\w-]+$/.test(id)).slice(0, 12);
  const drillPair = typeof pair === "string" && /^[\w-]+:[\w-]+>[\w-]+$/.test(pair) ? pair : undefined;
  // Only the exam-style labs cross to the client, keyed by topic, for the Fix it links.
  const labsByTopic: Record<string, LabLink[]> = Object.fromEntries(
    Object.entries(visuals as Record<string, { file: string; title: string; group: string }[]>)
      .map(([topicId, items]) => [topicId, items.filter((item) => item.group === "Exam-style labs").map(({ file, title }) => ({ file, title }))])
      .filter(([, items]) => items.length > 0),
  );
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
      <ExamTest initialExam={initialExam} initialFocus={initialFocus} initialDrill={initialDrill} drillPair={drillPair} labsByTopic={labsByTopic} />
    </div>
  );
}
