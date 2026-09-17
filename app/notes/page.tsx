import Link from "next/link";
import { NotesSearch } from "@/app/components/NotesSearch";
import { topics } from "@/lib/content";

export default function NotesIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Notes</h1>
        <p className="mt-2 text-slate-400">
          Search the study guide or open a chapter. Amber callouts mark weak-area drills.
        </p>
      </div>
      <NotesSearch />
      <ul className="space-y-3">
        {topics.map((topic) => (
          <li key={topic.id}>
            <Link
              href={`/notes/${topic.id}`}
              className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
            >
              <p className="text-xs uppercase tracking-wide text-teal-300">
                {topic.chapter}
              </p>
              <p className="mt-1 text-lg font-medium text-white">{topic.title}</p>
              <p className="mt-1 text-sm text-slate-400">{topic.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
