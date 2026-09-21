import { QuizRunner } from "@/app/components/QuizRunner";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Practice quiz</h1>
        <p className="mt-2 text-slate-400">
          Original questions written from class notes — not CompTIA exam dumps. Choose an
          exam focus, check each answer, and review every miss.
        </p>
      </div>
      <QuizRunner initialTopic={topic ?? "all"} />
    </div>
  );
}
