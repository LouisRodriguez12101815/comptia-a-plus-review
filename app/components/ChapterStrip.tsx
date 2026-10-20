import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { chapterTools } from "@/lib/chapter";

/**
 * One strip per chapter that joins the four ways to study it. The current page is
 * marked, and a tool with nothing in it yet is shown as unavailable instead of
 * leading to an empty page.
 */
export type ChapterStep = "notes" | "flashcards" | "quiz";

export async function ChapterStrip({ topicId, current }: { topicId: string; current: ChapterStep }) {
  const t = await getTranslations("chapterStrip");
  const tools = chapterTools(topicId);
  if (!tools.length) return null;
  return (
    <nav aria-label={t("ariaLabel")} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tools.map((tool) => {
          const here = tool.id === current;
          const countKey =
            tool.id === "visuals" ? "visualCount" : tool.id === "flashcards" ? "cardCount" : "questionCount";
          const detail = tool.count === null ? t("youAreHere") : t(countKey, { count: tool.count });
          const body = (
            <>
              <span className="block text-sm font-medium">{t(`tools.${tool.id}`)}</span>
              <span className="block text-xs">{tool.href || here ? detail : t("comingSoon")}</span>
            </>
          );
          const base = "block min-h-12 rounded-xl border px-3 py-2";
          return (
            <li key={tool.id}>
              {here ? (
                <span aria-current="step" className={`${base} border-teal-400 bg-teal-400/10 text-teal-100`}>
                  {body}
                </span>
              ) : tool.href ? (
                <Link href={tool.href} className={`${base} border-slate-600 text-slate-100 hover:border-teal-400`}>
                  {body}
                </Link>
              ) : (
                <span className={`${base} border-slate-800 text-slate-400`}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
