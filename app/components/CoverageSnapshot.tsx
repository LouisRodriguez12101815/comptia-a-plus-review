import { getTranslations } from "next-intl/server";
import type { InsightsSummary } from "@/lib/objective-coverage.mjs";

export async function CoverageSnapshot({ summary, locale }: { summary: InsightsSummary; locale: string }) {
  const t = await getTranslations({ locale, namespace: "coverageSnapshot" });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return <div className="overflow-x-auto rounded-xl border border-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300" tabIndex={0} role="region" aria-label={t("caption")}>
    <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
      <caption className="sr-only">{t("caption")}</caption>
      <thead><tr className="border-b border-slate-700 text-slate-300"><th scope="col" className="p-3">{t("track")}</th><th scope="col" className="p-3">{t("objectives")}</th><th scope="col" className="p-3">{t("questions")}</th><th scope="col" className="p-3">{t("cards")}</th><th scope="col" className="p-3">{t("labs")}</th><th scope="col" className="p-3">{t("estimate")}</th></tr></thead>
      <tbody>{summary.resourceTracks.map((track) => {
        const exam = summary.exams.find((item) => item.code === track.code);
        const objectiveCount = exam?.total ?? 0;
        const estimate = !exam ? t("noMatrix") : exam.total === 0 ? t("noObjectiveEstimate") : percent.format(track.weighted! / 100);
        return <tr key={track.code} className="border-b border-slate-800 text-slate-200"><th scope="row" className="p-3 font-medium">{track.name} <span className="font-mono text-xs text-teal-300">{track.code}</span></th><td className="p-3">{number.format(objectiveCount)}</td><td className="p-3">{number.format(track.questions)}</td><td className="p-3">{number.format(track.flashcards)}</td><td className="p-3">{number.format(track.labs)}</td><td className="p-3">{estimate}</td></tr>;
      })}</tbody>
    </table>
    <ul className="space-y-2 border-t border-slate-700 p-3 text-sm text-slate-300" aria-label={t("trackNotes")}>
      {summary.resourceTracks.map((track) => {
        const exam = summary.exams.find((item) => item.code === track.code);
        if (exam?.total === 0) return <li key={track.code}>{t("emptyTrack", { track: track.name, questions: number.format(track.questions), cards: number.format(track.flashcards), labs: number.format(track.labs) })}</li>;
        if (!exam) return <li key={track.code}>{t("noMatrixTrack", { track: track.name, code: track.code, questions: number.format(track.questions), cards: number.format(track.flashcards), labs: number.format(track.labs) })}</li>;
        return null;
      })}
    </ul>
  </div>;
}
