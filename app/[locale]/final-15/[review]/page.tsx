import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import objectives from "@/content/objectives.json";
import { FinalReview } from "@/app/components/practice/FinalReview";
import { allocate, finalReviews, getFinalReview, troubleshootingDomain, type DomainPlan } from "@/lib/practice/finalReview";

export function generateStaticParams() {
  return finalReviews.map((r) => ({ review: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/final-15/[review]">): Promise<Metadata> {
  const { locale, review: id } = await params;
  const review = getFinalReview(id);
  if (!review) return {};
  const t = await getTranslations({ locale, namespace: "finalReview" });
  return { title: t("metaTitle", { certification: review.certification }), description: t("metaDescription", { minutes: review.minutes }) };
}

export default async function FinalReviewPage({ params }: PageProps<"/[locale]/final-15/[review]">) {
  const { locale, review: id } = await params;
  setRequestLocale(locale);
  const review = getFinalReview(id);
  const exam = review && objectives.exams.find((e) => e.code === review.exam);
  if (!review || !exam) notFound();
  // Questions per domain follow the exam's own domain weights.
  const domains = exam.domains.map((d) => ({ domain: d.objectives[0].id.split(".")[0], title: d.title, weight: d.weight }));
  const counts = allocate(domains, review.drillQuestions);
  const plan: DomainPlan[] = domains.map((d) => ({ ...d, count: counts[d.domain] }));
  return <FinalReview reviewId={review.id} plan={plan} troubleshooting={troubleshootingDomain(exam.domains)} />;
}
