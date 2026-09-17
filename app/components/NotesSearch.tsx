"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { searchNotes } from "@/lib/content";

export function NotesSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchNotes(query), [query]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Search notes</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes (TPM, sysprep, RAID, APIPA…)"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-teal-400 placeholder:text-slate-500 focus:ring-2"
        />
      </label>
      {query.trim() && (
        <ul className="space-y-3">
          {results.length === 0 && (
            <li className="text-slate-400">No matching sections.</li>
          )}
          {results.map((hit) => (
            <li key={`${hit.topic.id}-${hit.section.id}`}>
              <Link
                href={`/notes/${hit.topic.id}#${hit.section.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-teal-400"
              >
                <p className="text-xs uppercase tracking-wide text-teal-300">
                  {hit.topic.chapter}
                </p>
                <p className="font-medium text-white">{hit.section.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{hit.snippet}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
