import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { domainQuizzes } from "@/lib/domain-quiz";

/** Five cards, one per N10-009 domain, each starting a practice quiz limited to that domain. */
export async function NetworkPlusDomainQuiz() {
  const t = await getTranslations("networkPlusDomainQuiz");
  const domains = domainQuizzes();
  return (
    <section id="test" aria-labelledby="domain-quiz-heading" className="scroll-mt-24 space-y-4">
      <div>
        <h2 id="domain-quiz-heading" className="text-lg font-medium text-white">{t("title")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("body")}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => (
          <li key={domain.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t("domainLabel", { id: domain.id })}</p>
              <h3 className="mt-1 font-medium text-white">{domain.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{t("meta", { weight: domain.weight, count: domain.questionIds.length })}</p>
            </div>
            {domain.questionIds.length > 0 ? (
              <Link
                href={`/quiz?domain=${encodeURIComponent(domain.id)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400"
              >
                {t("start")}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
