"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { searchNotes } from "@/lib/content";
import type { StudyFocus } from "@/lib/types";

export function NotesSearch({ focus }: { focus: StudyFocus }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchNotes(query, focus), [query, focus]);

  return (
    <section className="space-y-3">
      <label className="block text-sm font-medium text-slate-200" htmlFor="notes-search">
        Search focused notes
      </label>
      <input
        id="notes-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try RAID, DHCP, BitLocker, or bootrec"
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-400"
      />
      {query.trim() && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{results.length} matching sections</p>
          {results.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
              No match in this exam focus. Try another term or switch to All.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map(({ topic, section, snippet }) => (
                <li key={`${topic.id}-${section.id}`}>
                  <Link
                    href={`/notes/${topic.id}#${section.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
                  >
                    <p className="font-medium text-white">
                      {topic.title} · {section.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{snippet}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
