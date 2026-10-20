import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const chapters = [
  { id: "ch9", href: "/network-plus/ch9" },
  { id: "ch10", href: "/network-plus/ch10" },
  { id: "ch11", href: "/network-plus/ch11" },
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/network-plus">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "networkPlusIndex" });
  return { title: t("pageTitle") };
}

export default async function NetworkPlusIndex({ params }: PageProps<"/[locale]/network-plus">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("networkPlusIndex");
  const tChapter = await getTranslations("networkChapters");
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t("heading")}</h1>
        <p className="mt-2 text-slate-400">
          {t("intro")}
        </p>
      </div>
      <ul className="space-y-3">
        {chapters.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
            >
              <p className="text-xs uppercase tracking-wide text-teal-300">{tChapter(`${c.id}.label`)}</p>
              <p className="mt-1 text-lg font-medium text-white">{tChapter(`${c.id}.title`)}</p>
              <p className="mt-1 text-sm text-slate-400">{t("chapterNote")}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/notes?exam=n10-009" className="text-teal-300 underline">
          {t("readNotes")}
        </Link>
      </p>
    </div>
  );
}
