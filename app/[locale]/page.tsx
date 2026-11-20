import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HomeStory } from "@/app/components/HomeStory";
import styles from "@/app/components/ToolkitHome.module.css";

const repository = "https://github.com/LouisRodriguez12101815/comptia-a-plus-review";
const scopeNotes = ["example", "authoring", "recommendations", "profiles", "limits"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "toolkitHome" });
  return { title: "GapLift | " + t("descriptor"), description: t("intro") };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("homeStory");
  return (
    <div className={styles.home}>
      <HomeStory>
        <div className={styles.support}>
          <a href={repository} className={styles.repository}>{t("repositoryLink")} <span aria-hidden="true">→</span></a>
          <details className={styles.details}>
            <summary>{t("scopeHeading")}</summary>
            <ul className={styles.scopeNotes}>
              {scopeNotes.map((key) => <li key={key}>{t(`scope.${key}`)}</li>)}
            </ul>
          </details>
          <Link id="game-heading" href="/game" className={styles.compatibility}>Outage Ops <span aria-hidden="true">→</span></Link>
        </div>
      </HomeStory>
      <nav aria-label={t("graderPath")} className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 text-sm">
        <span className="w-full text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{t("graderPath")}</span>
        <Link href="/insights" className="inline-flex min-h-11 items-center rounded-full border border-indigo-400/60 px-4 py-2 text-indigo-100">{t("graderInsights")}</Link>
        <Link href="/certifications" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200">{t("graderExample")}</Link>
        <Link href="/aws-clf" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200">{t("graderStudy")}</Link>
        <Link href="/aws-clf/assessment" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200">{t("graderPractice")}</Link>
        <Link href="/weak-areas" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200">{t("graderReview")}</Link>
      </nav>
    </div>
  );
}
