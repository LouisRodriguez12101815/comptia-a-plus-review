import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { saaCurriculumDomains } from "@/lib/saa-curriculum";
import objectives from "@/content/objectives.json";
import { topics, questions, labs } from "@/lib/content";
import { visualItemsForTopic } from "@/lib/visuals";

/** An index of existing teaching and resources, not a new instructional sequence. */
export async function SaaCurriculumIndex() {
  const t = await getTranslations("navigationJourney");
  const domains = saaCurriculumDomains(objectives.exams.find((exam) => exam.code === "saa-c03"), {
    topics, questions, labs, visualsForTopic: visualItemsForTopic,
  });
  const resourceLink = "inline-flex min-h-11 items-center text-sm text-teal-200 underline underline-offset-4 hover:text-white";
  return (
    <section id="curriculum" aria-labelledby="saa-curriculum-heading" className="scroll-mt-24 space-y-5">
      <div>
        <h2 id="saa-curriculum-heading" className="text-2xl font-semibold text-white">{t("curriculum")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{t("curriculumIntro")}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{t("saaPracticeTestDetail")}</p>
        <p className="mt-2"><Link href="/test?exam=saa-c03" className={resourceLink}>{t("saaPracticeTest")}</Link></p>
        <nav aria-label={t("curriculum")} className="mt-3 flex flex-wrap gap-x-5">
          {domains.map((domain) => <a key={domain.id} href={`#saa-domain-${domain.id}`} className={resourceLink}>{domain.title}</a>)}
          <a href="#chapter-path" className={resourceLink}>{t("chapterPath")}</a>
          <a href="#topics" className={resourceLink}>{t("chapterBrowsing")}</a>
          <a href="#shared-resources" className={resourceLink}>{t("sharedResources")}</a>
          <Link href="/test?exam=saa-c03" className={resourceLink}>{t("saaPracticeTest")}</Link>
        </nav>
      </div>
      {domains.map((domain) => (
        <section key={domain.id} id={`saa-domain-${domain.id}`} aria-labelledby={`saa-domain-${domain.id}-heading`} className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 sm:p-5">
          <h3 id={`saa-domain-${domain.id}-heading`} className="text-xl font-semibold text-white">{domain.title} <span className="track-accent-text font-mono text-sm">{domain.weight}%</span></h3>
          <ol className="grid gap-3 sm:grid-cols-2">
            {domain.tasks.map((task) => (
              <li key={task.id} data-saa-task={task.id} className="min-w-0 rounded-xl border border-slate-700 p-4">
                <h4 className="font-medium text-white"><span className="track-accent-text mr-2 font-mono">{task.id}</span>{task.title}</h4>
                {task.lesson ? <Link data-saa-lesson href={task.lesson.href} className={`${resourceLink} mt-1`}>{task.lesson.title}</Link> : <p className="mt-2 text-sm text-amber-200">{t("unresolvedLesson")}</p>}
                {task.questionHref ? <p><Link href={task.questionHref} className={resourceLink}>{t("taskPractice")}</Link></p> : null}
              </li>
            ))}
          </ol>
          <Link href={`/practice-games/drills/${domain.drillId}`} className={resourceLink}>{t("domainPractice")}</Link>
          <details className="rounded-xl border border-slate-700 p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-white">{t("relatedResources")}</summary>
            <p className="mt-2 text-sm text-slate-400">{t("associationsNote")}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div><h4 className="font-medium text-slate-200">{t("relatedNotes")}</h4><ul>{domain.topics.map((topic) => <li key={topic.id}><Link href={`/notes/${topic.id}`} className={resourceLink}>{topic.title}</Link></li>)}</ul></div>
              <div>
                {domain.visuals.length > 0 ? <><h4 className="font-medium text-slate-200">{t("visuals")}</h4><ul>{domain.visuals.map((visual) => <li key={visual.file}><Link href={`/aws-saa/visuals#visual-${visual.file.replace(/\.html$/, "")}`} className={resourceLink}>{visual.title}</Link></li>)}</ul></> : null}
                {domain.labs.length > 0 ? <><h4 className="mt-3 font-medium text-slate-200">{t("labs")}</h4><ul>{domain.labs.map((lab) => <li key={lab.slug}><Link href={`/labs/${lab.slug}`} className={resourceLink}>{lab.title}</Link></li>)}</ul></> : null}
              </div>
            </div>
          </details>
        </section>
      ))}
      <nav aria-label={t("sharedReview")} className="flex flex-wrap gap-x-6 rounded-xl border border-slate-700 p-4">
        <Link href="/weak-areas" className={resourceLink}>{t("sharedReview")}</Link>
        <Link href="/performance" className={resourceLink}>{t("sharedPerformance")}</Link>
        <Link href="/test?exam=saa-c03" className={resourceLink}>{t("saaPracticeTest")}</Link>
      </nav>
    </section>
  );
}
