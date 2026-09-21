"use client";

import Link from "next/link";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { ProgressDashboard } from "@/app/components/ProgressDashboard";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getTopics } from "@/lib/content";
import { examOptions } from "@/lib/exams";

export function HomeDashboard() {
  const [focus, setFocus] = useStudyFocus();
  const focusedTopics = getTopics(focus);
  const selectedExam = examOptions.find((exam) => exam.id === focus);
  const query = `exam=${focus}`;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <ExamFocusPicker focus={focus} onChange={setFocus} />
        <p className="mt-4 text-sm text-teal-200">{selectedExam?.description}</p>
      </section>

      <ProgressDashboard />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-white">Your current study path</h2>
            <p className="mt-1 text-sm text-slate-400">
              Showing material connected to {selectedExam?.label.toLowerCase()}.
            </p>
          </div>
          <Link href={`/notes?${query}`} className="text-sm text-teal-300 hover:text-teal-200">
            Open all matching notes →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {focusedTopics.map((topic) => (
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
        <p className="rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          This library is growing from class recordings and textbook notes. Item counts show current coverage, not the full CompTIA blueprint yet.
        </p>
      </section>
    </div>
  );
}
