"use client";

import { useEffect, useState } from "react";
import { flashcards, questions, topics } from "@/lib/content";
import { loadProgress, type Progress } from "@/lib/progress";

export function ProgressDashboard() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) {
    return <p className="text-sm text-slate-500">Loading progress from this browser…</p>;
  }

  const known = Object.keys(progress.knownCards).length;
  const last = progress.quizAttempts[0];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Flashcards marked known" value={`${known} / ${flashcards.length}`} />
      <Stat label="Practice questions" value={`${questions.length}`} />
      <Stat
        label="Last quiz on this device"
        value={
          last
            ? `${last.correct}/${last.total} (${Math.round((last.correct / last.total) * 100)}%)`
            : "Not taken yet"
        }
      />
      <div className="sm:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-400">
          {topics.length} note chapters · Progress is stored in this browser only (no accounts).
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
