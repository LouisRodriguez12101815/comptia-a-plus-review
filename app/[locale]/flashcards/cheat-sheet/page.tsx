import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cheatSheet } from "@/lib/study/records";
import type { SaaDomainId } from "@/lib/saa-tags";

const domains = ["D1", "D2", "D3", "D4"] as const;
const exams = ["saa-c03", "clf-c02"] as const;

function domainFromParam(value: string | undefined): SaaDomainId {
  const match = domains.find((domain) => domain === value || domain === `D${value}`);
  return match ?? "D1";
}

function examFromParam(value: string | undefined) {
  return exams.find((exam) => exam === value) ?? "saa-c03";
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/flashcards/cheat-sheet">) {
  const { locale } = await params;
  const { exam: examParam } = (await searchParams) as { exam?: string };
  const t = await getTranslations({ locale, namespace: "flashcardDeck" });
  return { title: examFromParam(examParam) === "clf-c02" ? t("sheetTitleClf") : t("sheetTitle") };
}

export default async function CheatSheetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/flashcards/cheat-sheet">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("flashcardDeck");
  const { domain: domainParam, exam: examParam } = (await searchParams) as { domain?: string; exam?: string };
  const domain = domainFromParam(domainParam);
  const exam = examFromParam(examParam);
  const sheet = cheatSheet(domain, exam);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cheat-sheet, #cheat-sheet * { visibility: visible; }
          #cheat-sheet { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; }
          #cheat-sheet a { color: black; text-decoration: none; }
        }
      `}</style>
      <div className="no-print space-y-3">
        <h1 className="text-3xl font-semibold text-white">{exam === "clf-c02" ? t("sheetTitleClf") : t("sheetTitle")}</h1>
        <p className="text-slate-400">{t("sheetIntro")}</p>
        <div className="flex flex-wrap gap-2">
          {exams.map((item) => (
            <Link
              key={item}
              href={`/flashcards/cheat-sheet?exam=${item}&domain=${domain}`}
              className={
                item === exam
                  ? "inline-flex min-h-11 items-center rounded-full bg-teal-500 px-4 text-sm font-medium text-slate-950"
                  : "inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-slate-100"
              }
            >
              {t(item === "clf-c02" ? "sheetExamClf" : "sheetExamSaa")}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {domains.map((item) => (
            <Link
              key={item}
              href={`/flashcards/cheat-sheet?exam=${exam}&domain=${item}`}
              className={
                item === domain
                  ? "inline-flex min-h-11 items-center rounded-full bg-teal-500 px-4 text-sm font-medium text-slate-950"
                  : "inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 text-sm text-slate-100"
              }
            >
              {t("sheetDomain", { domain: item })}
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">{t("sheetPrintHint")}</p>
      </div>
      <article id="cheat-sheet" className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 print:border-0 print:bg-white">
        <header>
          <h2 className="text-2xl font-semibold text-white print:text-black">{t("sheetDomain", { domain })}</h2>
          <p className="mt-1 text-sm text-slate-400 print:text-black">{t("sheetUntagged")}</p>
        </header>
        <section>
          <h3 className="text-lg font-medium text-teal-200 print:text-black">{t("sheetCards")}</h3>
          {sheet.cards.length === 0 ? (
            <p className="mt-2 text-slate-400">{t("sheetEmpty")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sheet.cards.map((card) => (
                <li key={card.id} className="border-b border-slate-800 pb-3 print:border-black">
                  <p className="font-medium text-white print:text-black">{card.front}</p>
                  <p className="mt-1 text-sm text-slate-300 print:text-black">{card.back}</p>
                  <p className="mt-1 text-xs text-slate-500 print:text-black">{card.taskId}{card.docsUrl ? ` · ${card.docsUrl}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="text-lg font-medium text-teal-200 print:text-black">{t("sheetPairs")}</h3>
          {sheet.pairs.length === 0 ? (
            <p className="mt-2 text-slate-400">{t("sheetEmpty")}</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {sheet.pairs.map((pair) => (
                <li key={pair.id} className="border-b border-slate-800 pb-3 print:border-black">
                  {pair.difference && <p className="font-medium text-white print:text-black">{pair.difference}</p>}
                  <ul className="mt-2 space-y-1 text-sm text-slate-300 print:text-black">
                    {pair.sides.map((side) => (
                      <li key={side.label}><span className="text-white print:text-black">{side.label}.</span> {side.pickWhen}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-slate-500 print:text-black">{pair.taskId} · {pair.docsUrl}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
