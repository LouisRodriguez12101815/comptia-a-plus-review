import Link from "next/link";
import { HomeDashboard } from "@/app/components/HomeDashboard";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-teal-300">Class study site</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          CompTIA A+ / Network+ Review
        </h1>
        <p className="max-w-2xl text-slate-300">
          Choose the certification you are preparing for, then use focused notes,
          flashcards, and original practice questions. Switch tracks anytime for class
          pacing or a retake. Scores stay in your browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/notes"
            className="rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400"
          >
            Browse notes
          </Link>
          <Link
            href="/flashcards?topic=weak"
            className="rounded-full border border-slate-600 px-5 py-2 hover:border-teal-400"
          >
            Weak-area cards
          </Link>
          <Link
            href="/quiz?topic=weak"
            className="rounded-full border border-slate-600 px-5 py-2 hover:border-teal-400"
          >
            Weak-area quiz
          </Link>
        </div>
      </section>

      <HomeDashboard />
    </div>
  );
}
