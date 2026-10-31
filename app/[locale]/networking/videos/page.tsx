import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";

const EXAM = "n10-009";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "networkPlusVideos" });
  return { title: t("pageTitle") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("networkPlusVideos");
  const domains = objectives.exams.find((exam) => exam.code === EXAM)?.domains ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t("heading")}</h1>
        <p className="mt-2 max-w-3xl text-slate-300">{t("intro")}</p>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{t("englishNote")}</p>
      </div>
      <ol className="space-y-8">
        {domains.map((domain, index) => {
          const n = index + 1;
          return (
            <li key={domain.id} id={`domain-${n}`} className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
              <h2 className="text-xl font-semibold text-white">
                <span className="font-mono text-teal-300">{domain.id}</span> {domain.title}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{t("weight", { weight: domain.weight })}</p>
              <video
                className="mt-4 aspect-video w-full rounded-xl border border-slate-800 bg-slate-950"
                controls
                preload="metadata"
                playsInline
                aria-label={t("videoLabel", { title: domain.title })}
              >
                <source src={`/videos/network-plus/domain-${n}.mp4`} type="video/mp4" />
                <track kind="captions" src={`/videos/network-plus/domain-${n}.vtt`} srcLang="en" label="English" default />
                {t("noVideo")}
              </video>
              <p className="mt-4 text-sm font-medium text-slate-200">{t("covers")}</p>
              <ul className="mt-1 grid gap-x-6 gap-y-0.5 text-sm text-slate-300 sm:grid-cols-2">
                {domain.objectives.map((objective) => (
                  <li key={objective.id}>
                    <span className="font-mono text-teal-300">{objective.id}</span> {objective.title}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <p>
        <Link href="/networking#topics" className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4">
          {t("backToTopics")}
        </Link>
      </p>
    </div>
  );
}
