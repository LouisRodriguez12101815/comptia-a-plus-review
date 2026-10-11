"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { tracks, trackForPath } from "@/lib/tracks";

export function SiteHeader() {
  const pathname = usePathname();
  const [focus] = useStudyFocus();
  const current = trackForPath(pathname, focus);
  const onGame = pathname.startsWith("/game") || pathname.startsWith("/practice-games");

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(34,211,238,.6)]"
          />
          CompTIA Review
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Certification tracks">
          {tracks.map((track) => {
            const active = !onGame && current?.id === track.id;
            return (
              <Link
                key={track.id}
                href={track.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 ${
                  active
                    ? "border-teal-400 bg-teal-400 font-medium text-slate-950"
                    : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"
                }`}
              >
                {track.short}
              </Link>
            );
          })}
          <Link
            href="/practice-games"
            aria-current={onGame ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 font-medium ${
              onGame
                ? "border-amber-400 bg-amber-400 text-slate-950"
                : "border-amber-400/60 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
            }`}
          >
            Practice Games
          </Link>
        </nav>
      </div>
    </header>
  );
}
