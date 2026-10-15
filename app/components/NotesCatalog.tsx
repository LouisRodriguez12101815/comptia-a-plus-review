"use client";

import Link from "next/link";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { NotesSearch } from "@/app/components/NotesSearch";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getTopics, getTopicsByConcept } from "@/lib/content";
import { examLabel } from "@/lib/exams";

export function NotesCatalog() {
  const [focus, setFocus] = useStudyFocus();
  const focusedTopics = getTopics(focus);
  const groups = getTopicsByConcept(focus);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <ExamFocusPicker focus={focus} onChange={setFocus} />
      </section>
      <NotesSearch focus={focus} />
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-white">{examLabel(focus)}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {focusedTopics.length} matching topics, grouped by concept.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.concept} className="space-y-3">
            <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
              {group.label}
            </h3>
            <ul className="space-y-3">
              {group.topics.map((topic) => (
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
        ))}
      </section>
    </div>
  );
}
