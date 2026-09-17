import Link from "next/link";
import { ProgressDashboard } from "@/app/components/ProgressDashboard";
import { topics } from "@/lib/content";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-teal-300">Class study site</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          CompTIA A+ Review
        </h1>
        <p className="max-w-2xl text-slate-300">
          Notes, flashcards, and original practice questions from the Core 1 and Core 2
          study guide. Public link — no login. Scores stay in your browser.
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

      <ProgressDashboard />

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">Chapters</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/notes/${topic.id}`}
                className="block h-full rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
              >
                <p className="text-xs uppercase tracking-wide text-teal-300">
                  {topic.chapter}
                  {topic.weak ? " · Weak" : ""}
                </p>
                <p className="mt-1 font-medium text-white">{topic.title}</p>
                <p className="mt-2 text-sm text-slate-400">{topic.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
