"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { StatusIcon, ToolIcon } from "@/app/components/icons";
import { TrackLink } from "@/app/components/TrackLink";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { isHubPath, toolStatuses, trackForPath } from "@/lib/tracks";

function isActive(toolId: string, pathname: string): boolean {
  if (toolId === "game") return pathname.startsWith("/game") || pathname.startsWith("/practice-games");
  if (toolId === "labs") return pathname.startsWith("/labs");
  if (toolId === "visuals") return pathname.endsWith("/visuals") || pathname.startsWith("/network-plus");
  return pathname.startsWith(`/${toolId}`);
}

/**
 * Shown on the tool pages (notes, visuals, flashcards, quizzes, labs, game, Network+ chapters)
 * so a learner can move between tools without going back to the landing page.
 */
export function TrackBar() {
  const t = useTranslations("tracks");
  const pathname = usePathname();
  const [focus] = useStudyFocus();

  if (pathname === "/" || pathname === "/coverage" || isHubPath(pathname)) return null;
  const track = trackForPath(pathname, focus);
  if (!track) return null;
  const tools = toolStatuses(track);

  return (
    <div className={`track-shell track-${track.id} border-b border-slate-800 bg-slate-900/60`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:py-3">
        <p className="hidden text-sm text-slate-400 sm:block">
          <Link href="/" className="hover:text-white">
            {t("home")}
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={track.href} className="font-medium text-slate-100 hover:text-white">
            {t(`${track.id}.label`)}
          </Link>
        </p>
        <nav
          aria-label={t("toolsLabel", { track: t(`${track.id}.short`) })}
          className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1 text-sm sm:mx-0 sm:flex-wrap sm:overflow-visible sm:p-0"
        >
          {tools.map((tool) => {
            const active = isActive(tool.id, pathname);
            if (tool.state === "soon" && !tool.openable) {
              return (
                <span
                  key={tool.id}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-slate-700 px-3 py-1.5 text-slate-500"
                >
                  <ToolIcon id={tool.id} width={16} height={16} />
                  {t(`tools.${tool.id}.label`)}
                  <span className="sr-only">{t("comingSoonSr")}</span>
                </span>
              );
            }
            return (
              <TrackLink
                key={tool.id}
                href={tool.href}
                focus={tool.focus}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 ${
                  active
                    ? "track-accent-button border-transparent font-medium"
                    : "border-slate-700 text-slate-200 hover:track-accent-border hover:text-white"
                }`}
              >
                <ToolIcon id={tool.id} width={16} height={16} />
                {t(`tools.${tool.id}.label`)}
                {tool.state === "elsewhere" ? (
                  <span className="text-xs text-slate-400">
                    <StatusIcon kind="elsewhere" className="inline" /> CCNA
                  </span>
                ) : null}
                {tool.state === "soon" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <StatusIcon kind="soon" className="inline" /> {t("soon")}
                  </span>
                ) : null}
              </TrackLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
