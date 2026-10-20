import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { labs } from "@/lib/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/labs">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "labsPage" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function LabsIndexPage({ params }: PageProps<"/[locale]/labs">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("labsPage");
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{t("heading")}</h1>
        <p className="mt-2 text-slate-400">
          {t("intro")}
        </p>
      </div>
      <ul className="grid gap-4">
        {labs.map((lab) => (
          <li key={lab.slug}>
            <Link
              href={`/labs/${lab.slug}`}
              className="block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-teal-400"
            >
              {lab.image ? (
                <img
                  src={lab.image}
                  alt={lab.imageAlt ?? ""}
                  className="h-52 w-full object-cover bg-white"
                  style={{ objectPosition: lab.imagePosition ?? "left center" }}
                />
              ) : null}
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-teal-300">
                  {lab.subtitle}
                </p>
                <p className="mt-1 text-lg font-medium text-white">{lab.title}</p>
                <p className="mt-1 text-sm text-slate-400">{lab.summary}</p>
                <p className="mt-3 flex flex-wrap gap-2">
                  {lab.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
