import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { examOptions } from "@/lib/exams";
import { glossaryEntries } from "@/lib/glossary";

export async function generateMetadata({ params }: PageProps<"/[locale]/glossary">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function GlossaryPage({ params, searchParams }: PageProps<"/[locale]/glossary">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { exam = "all" } = await searchParams;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const tExams = await getTranslations({ locale, namespace: "exams" });
  const examLabel = (id: string) => tExams(`${id}.shortLabel` as never);
  const selected = examOptions.some((option) => option.id === exam) ? exam : "all";
  const entries = glossaryEntries.filter((entry) => selected === "all" || entry.exam === selected);

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const first = entry.term.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), entry]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="text-slate-300">{t("intro")}</p>
      </header>

      <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {examOptions.map((option) => (
          <Link key={option.id} href={`/glossary?exam=${option.id}`} aria-current={selected === option.id ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 ${selected === option.id ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400"}`}>
            {examLabel(option.id)}
          </Link>
        ))}
      </nav>

      <nav aria-label={t("lettersLabel")} className="flex flex-wrap gap-1 text-sm">
        {[...groups.keys()].map((letter) => (
          <a key={letter} href={`#letter-${letter}`} className="min-h-11 min-w-11 rounded-lg border border-slate-700 px-2 py-2 text-center text-slate-200 hover:border-teal-400">{letter}</a>
        ))}
      </nav>

      {entries.length === 0 ? <p className="text-slate-400">{t("empty")}</p> : null}

      {[...groups.entries()].map(([letter, items]) => (
        <section key={letter} id={`letter-${letter}`} className="space-y-2 scroll-mt-24">
          <h2 className="border-b border-slate-700 pb-1 text-2xl font-semibold text-teal-200">{letter}</h2>
          <dl className="space-y-3">
            {items.map((entry) => (
              <div key={entry.id} id={entry.id} className="scroll-mt-24 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <dt className="font-semibold text-white">{entry.term} <span className="text-xs font-normal text-slate-500">{examLabel(entry.exam)}</span></dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-300">{entry.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
