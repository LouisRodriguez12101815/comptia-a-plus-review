"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/app/components/LocaleSwitcher";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { tracks, trackForPath } from "@/lib/tracks";

type MenuItem = { href: string; label: string; current: boolean };

const pill = "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm";

/**
 * A button that opens a short list of links. It closes on Escape and on a click outside it, and Escape
 * returns focus to the button. The parent keys it by path, so it also closes when the page changes.
 */
function HeaderMenu({ label, active, items }: { label: ReactNode; active: boolean; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`${pill} ${active ? "border-teal-400 bg-teal-400/10 font-medium text-teal-100" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
      >
        {label}
        <span aria-hidden="true" className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open ? (
        <ul id={panelId} className="absolute left-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-xl">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm ${item.current ? "bg-teal-400/10 font-medium text-teal-100" : "text-slate-200 hover:bg-slate-900 hover:text-white"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslations("header");
  const tTracks = useTranslations("tracks");
  const pathname = usePathname();
  const [focus] = useStudyFocus();
  const current = trackForPath(pathname, focus);

  const trackItems: MenuItem[] = tracks.map((track) => ({
    href: track.href,
    label: tTracks(`${track.id}.label`),
    current: current?.id === track.id,
  }));

  const study: { href: string; label: string; match: (path: string) => boolean }[] = [
    { href: "/test", label: t("testMode"), match: (p) => p === "/test" },
    { href: "/practice-games", label: t("practiceGames"), match: (p) => p.startsWith("/game") || p.startsWith("/practice-games") },
    { href: "/top-5", label: t("top5"), match: (p) => p.startsWith("/top-5") },
    { href: "/final-15", label: t("final15"), match: (p) => p.startsWith("/final-15") },
    { href: "/coverage", label: t("objectiveLab"), match: (p) => p === "/coverage" },
    { href: "/glossary", label: t("glossary"), match: (p) => p.startsWith("/glossary") },
    { href: "/assessment-workflow", label: t("methods"), match: (p) => p.startsWith("/assessment-workflow") },
  ];
  const studyItems: MenuItem[] = study.map((item) => ({ href: item.href, label: item.label, current: item.match(pathname) }));
  const studyActive = studyItems.some((item) => item.current);
  const searchActive = pathname.startsWith("/search");

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-white sm:text-lg">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(34,211,238,.6)]"
            />
            Certification Review
          </Link>
          <LocaleSwitcher />
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label={t("tracksLabel")}>
          <HeaderMenu
            key={`track-${pathname}`}
            label={current ? tTracks(`${current.id}.short`) : t("chooseTrack")}
            active={Boolean(current) && !studyActive}
            items={trackItems}
          />
          <HeaderMenu key={`study-${pathname}`} label={t("studyMenu")} active={studyActive} items={studyItems} />
          <Link
            href="/search"
            aria-current={searchActive ? "page" : undefined}
            className={`${pill} ${searchActive ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
          >
            {t("search")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
