"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/app/components/LocaleSwitcher";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { tracks, trackForPath } from "@/lib/tracks";

export function SiteHeader() {
  const t = useTranslations("header");
  const tTracks = useTranslations("tracks");
  const pathname = usePathname();
  const [focus] = useStudyFocus();
  const current = trackForPath(pathname, focus);
  const onGame = pathname.startsWith("/game") || pathname.startsWith("/practice-games");

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-white sm:text-lg">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(34,211,238,.6)]"
            />
            CompTIA Review
          </Link>
          <LocaleSwitcher />
        </div>
        <nav
          className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1 text-sm sm:mx-0 sm:flex-wrap sm:overflow-visible sm:p-0"
          aria-label={t("tracksLabel")}
        >
          {tracks.map((track) => {
            const active = !onGame && pathname !== "/coverage" && !pathname.startsWith("/assessment-workflow") && pathname !== "/test" && !pathname.startsWith("/final-15") && !pathname.startsWith("/top-5") && current?.id === track.id;
            return (
              <Link
                key={track.id}
                href={track.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 ${
                  active
                    ? "border-teal-400 bg-teal-400 font-medium text-slate-950"
                    : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"
                }`}
              >
                {tTracks(`${track.id}.short`)}
              </Link>
            );
          })}
          <Link
            href="/coverage"
            aria-current={pathname === "/coverage" ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 ${pathname === "/coverage" ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
          >
            {t("objectiveLab")}
          </Link>
          <Link
            href="/assessment-workflow"
            aria-current={pathname.startsWith("/assessment-workflow") ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 ${pathname.startsWith("/assessment-workflow") ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
          >
            {t("methods")}
          </Link>
          <Link
            href="/test"
            aria-current={pathname === "/test" ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 ${pathname === "/test" ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
          >
            {t("testMode")}
          </Link>
          <Link
            href="/top-5"
            aria-current={pathname.startsWith("/top-5") ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 ${pathname.startsWith("/top-5") ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
          >
            {t("top5")}
          </Link>
          <Link
            href="/final-15"
            aria-current={pathname.startsWith("/final-15") ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 ${pathname.startsWith("/final-15") ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
          >
            {t("final15")}
          </Link>
          <Link
            href="/practice-games"
            aria-current={onGame ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 py-1.5 font-medium ${
              onGame
                ? "border-amber-400 bg-amber-400 text-slate-950"
                : "border-amber-400/60 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
            }`}
          >
            {t("practiceGames")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
