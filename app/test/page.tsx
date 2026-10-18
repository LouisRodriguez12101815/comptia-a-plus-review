import type { Metadata } from "next";
import Link from "next/link";
import { ExamTest } from "./ExamTest";

export const metadata: Metadata = {
  title: "Timed test mode | CompTIA Review",
  description: "Timed practice exams for A+ Core 1, A+ Core 2, and Network+, drafted from the exam objective map.",
};

const examCodes = ["220-1201", "220-1202", "n10-009"] as const;
type ExamCode = (typeof examCodes)[number];

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const { exam } = await searchParams;
  const initialExam = examCodes.includes(exam as ExamCode) ? (exam as ExamCode) : undefined;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-teal-300">Test mode</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Timed practice exam</h1>
        <p className="max-w-3xl text-slate-300">
          Questions are drawn from the exam objective map on the{" "}
          <Link href="/coverage" className="text-teal-300 underline underline-offset-4 hover:text-teal-200">coverage page</Link>,
          weighted by each domain&apos;s share of the real exam. Every question has its own countdown at exam pace.
          Original questions written from class notes, not CompTIA exam content.
        </p>
      </header>
      <ExamTest initialExam={initialExam} />
    </div>
  );
}
