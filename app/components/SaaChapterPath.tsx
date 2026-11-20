import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import chapterMap from "@/content/saa-chapter-map.json";
import objectives from "@/content/objectives.json";
import { labs, topics } from "@/lib/content";
import { drillDecks } from "@/lib/practice/drills";
import { resolveSaaChapterPath, saaChapterMapMeta } from "@/lib/saa-chapter-map";

const resourceLink =
  "inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4 hover:text-white";

/** Book-order spine that only links existing objectives, notes, drills, and labs. */
export async function SaaChapterPath() {
  const t = await getTranslations("navigationJourney");
  const meta = saaChapterMapMeta(chapterMap);
  const chapters = resolveSaaChapterPath(chapterMap, {
    exam: objectives.exams.find((exam) => exam.code === "saa-c03"),
    topics,
    labs,
    drills: drillDecks.map((deck) => ({ id: deck.id, topic: deck.topic, exam: deck.exam })),
  });

  return (
    <section id="chapter-path" aria-labelledby="saa-chapter-path-heading" className="scroll-mt-24 space-y-5">
      <div>
        <h2 id="saa-chapter-path-heading" className="text-2xl font-semibold text-white">
          {t("chapterPath")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{t("chapterPathIntro")}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {t("chapterPathGuide", {
            title: meta.guide.title,
            authors: meta.guide.authors.join(", "),
            count: meta.chapterCount,
          })}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{t("chapterPathUsage")}</p>
        <nav aria-label={t("chapterPath")} className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {chapters.map((chapter) => (
            <a key={chapter.id} href={`#saa-chapter-${chapter.id}`} className={resourceLink}>
              {t("chapterShort", { number: chapter.number })}
            </a>
          ))}
          <a href="#curriculum" className={resourceLink}>{t("curriculum")}</a>
          <Link href="/test?exam=saa-c03" className={resourceLink}>{t("saaPracticeTest")}</Link>
        </nav>
      </div>

      <ol className="space-y-4">
        {chapters.map((chapter) => (
          <li
            key={chapter.id}
            id={`saa-chapter-${chapter.id}`}
            data-saa-chapter={chapter.id}
            className="scroll-mt-24 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 sm:p-5"
          >
            <h3 className="text-lg font-semibold text-white">
              <span className="track-accent-text mr-2 font-mono text-sm">
                {t("chapterShort", { number: chapter.number })}
              </span>
              {chapter.title}
            </h3>
            <p className="mt-1 text-sm text-slate-300">{chapter.focus}</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-slate-200">{t("chapterObjectives")}</h4>
                <ul className="mt-2 space-y-1">
                  {chapter.objectives.map((objective) => (
                    <li key={objective.id}>
                      <a href={objective.href} className={resourceLink}>
                        <span className="font-mono">{objective.id}</span> {objective.title}
                      </a>
                    </li>
                  ))}
                </ul>
                {chapter.domainAnchors.length > 0 ? (
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{t("chapterDomains")}</p>
                ) : null}
                <ul className="mt-1 flex flex-wrap gap-x-4">
                  {chapter.domainAnchors.map((domain) => (
                    <li key={domain.id}>
                      <a href={domain.href} className={resourceLink}>
                        {domain.id} {domain.title} ({domain.weight}%)
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-slate-200">{t("chapterNotes")}</h4>
                  <ul className="mt-2 space-y-1">
                    {chapter.topics.map((topic) => (
                      <li key={topic.id}>
                        <Link href={topic.href} className={resourceLink}>{topic.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-200">{t("chapterDrills")}</h4>
                  {chapter.drills.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {chapter.drills.map((drill) => (
                        <li key={drill.id}>
                          <Link href={drill.href} className={resourceLink}>{drill.title}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">{t("chapterNoDrills")}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-200">{t("chapterLabs")}</h4>
                  {chapter.labs.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {chapter.labs.map((lab) => (
                        <li key={lab.slug}>
                          <Link href={lab.href} className={resourceLink}>{lab.title}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">{t("chapterNoLabs")}</p>
                  )}
                </div>
                <p>
                  <Link href={chapter.practiceHref} className={resourceLink}>
                    {t("chapterPractice")}
                  </Link>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
