"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusIcon, ToolIcon } from "@/app/components/icons";
import { TrackLink } from "@/app/components/TrackLink";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { isHubPath, toolStatuses, trackForPath } from "@/lib/tracks";

function isActive(toolId: string, pathname: string): boolean {
  if (toolId === "game") return pathname.startsWith("/game");
  if (toolId === "labs") return pathname.startsWith("/labs");
  return pathname.startsWith(`/${toolId}`);
}

/**
 * Shown on the tool pages (notes, flashcards, quizzes, labs, game, Network+ chapters)
 * so a learner can move between tools without going back to the landing page.
 */
export function TrackBar() {
  const pathname = usePathname();
  const [focus] = useStudyFocus();

  if (pathname === "/" || isHubPath(pathname)) return null;
  const track = trackForPath(pathname, focus);
  if (!track) return null;
  const tools = toolStatuses(track);

  return (
    <div className="border-b border-slate-800 bg-slate-900/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={track.href} className="font-medium text-slate-100 hover:text-white">
            {track.label}
          </Link>
        </p>
        <nav aria-label={`${track.short} study tools`} className="flex flex-wrap gap-2 text-sm">
          {tools.map((tool) => {
            const active = isActive(tool.id, pathname);
            if (tool.state === "soon") {
              return (
                <span
                  key={tool.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-700 px-3 py-1.5 text-slate-500"
                >
                  <ToolIcon id={tool.id} width={16} height={16} />
                  {tool.label}
                  <span className="sr-only">: coming soon</span>
                </span>
              );
            }
            return (
              <TrackLink
                key={tool.id}
                href={tool.href}
                focus={tool.focus}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                  active
                    ? "border-teal-400 bg-teal-400 font-medium text-slate-950"
                    : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"
                }`}
              >
                <ToolIcon id={tool.id} width={16} height={16} />
                {tool.label}
                {tool.state === "elsewhere" ? (
                  <span className="text-xs text-slate-400">
                    <StatusIcon kind="elsewhere" className="inline" /> CCNA
                  </span>
                ) : null}
              </TrackLink>
            );
          })}
          {track.id === "networking" ? (
            <Link
              href="/network-plus"
              aria-current={pathname.startsWith("/network-plus") ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                pathname.startsWith("/network-plus")
                  ? "border-teal-400 bg-teal-400 font-medium text-slate-950"
                  : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"
              }`}
            >
              Chapter visuals
            </Link>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
