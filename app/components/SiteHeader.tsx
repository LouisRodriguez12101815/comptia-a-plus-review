"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/app/components/LocaleSwitcher";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { tracks, trackForPath } from "@/lib/tracks";

type MenuItem = { href: string; label: string; current: boolean };
type MenuGroup = { label: string; items: MenuItem[]; active: boolean };

const pill = "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm";

/** A compact desktop dropdown that is keyboard-dismissible and returns focus to its trigger. */
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
        <ul id={panelId} className="absolute left-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-xl">
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

function MobileNavigation({ groups, search, label, closeLabel }: { groups: MenuGroup[]; search: MenuItem; label: string; closeLabel: string }) {
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
    <div ref={wrapper} className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : label}
        onClick={() => setOpen((value) => !value)}
        className={`${pill} ${open ? "border-teal-400 bg-teal-400/10 text-teal-100" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}
      >
        <span aria-hidden="true" className="text-lg leading-none">{open ? "×" : "☰"}</span>
        <span className="sr-only sm:not-sr-only">{open ? closeLabel : label}</span>
      </button>
      {open ? (
        <div id={panelId} className="absolute inset-x-4 top-full z-50 mt-2 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl lg:hidden">
          <nav aria-label={label} className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <section key={group.label} className="space-y-1">
                <h2 className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={item.current ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm ${item.current ? "bg-teal-400/10 font-medium text-teal-100" : "text-slate-200 hover:bg-slate-900 hover:text-white"}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <section className="space-y-1 sm:col-span-2">
              <h2 className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{search.label}</h2>
              <Link href={search.href} aria-current={search.current ? "page" : undefined} onClick={() => setOpen(false)} className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm ${search.current ? "bg-teal-400 font-medium text-slate-950" : "text-slate-200 hover:bg-slate-900 hover:text-white"}`}>
                {search.label}
              </Link>
            </section>
          </nav>
        </div>
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
  const makeItems = (items: { href: string; label: string; match: (path: string) => boolean }[]): MenuItem[] =>
    items.map((item) => ({ href: item.href, label: item.label, current: item.match(pathname) }));

  const studyItems = makeItems([
    { href: "/notes", label: t("notes"), match: (p) => p.startsWith("/notes") },
    { href: "/flashcards", label: t("flashcards"), match: (p) => p.startsWith("/flashcards") },
    { href: "/networking/visuals", label: t("visuals"), match: (p) => p.startsWith("/networking/visuals") },
    { href: "/networking/videos", label: t("videos"), match: (p) => p.startsWith("/networking/videos") },
    { href: "/glossary", label: t("glossary"), match: (p) => p.startsWith("/glossary") },
    { href: "/study-path", label: t("studyPath"), match: (p) => p.startsWith("/study-path") },
  ]);
  const testItems = makeItems([
    { href: "/quiz", label: t("quiz"), match: (p) => p.startsWith("/quiz") },
    { href: "/test", label: t("testMode"), match: (p) => p === "/test" },
    { href: "/top-5", label: t("top5"), match: (p) => p.startsWith("/top-5") },
    { href: "/final-15", label: t("final15"), match: (p) => p.startsWith("/final-15") },
  ]);
  const practiceItems = makeItems([
    { href: "/practice-games", label: t("practiceGames"), match: (p) => p.startsWith("/game") || p.startsWith("/practice-games") },
    { href: "/scenario-builder", label: t("scenarioBuilder"), match: (p) => p.startsWith("/scenario-builder") },
    { href: "/subnet-sources", label: t("subnetPractice"), match: (p) => p.startsWith("/subnet-sources") },
  ]);
  const progressItems = makeItems([
    { href: "/weak-areas", label: t("weakAreas"), match: (p) => p.startsWith("/weak-areas") },
    { href: "/scorecard", label: t("scorecard"), match: (p) => p.startsWith("/scorecard") },
    { href: "/coverage", label: t("coverage"), match: (p) => p.startsWith("/coverage") },
  ]);
  const methodologyItems = makeItems([
    { href: "/assessment-workflow", label: t("methodologyLink"), match: (p) => p.startsWith("/assessment-workflow") },
  ]);
  const search: MenuItem = { href: "/search", label: t("search"), current: pathname.startsWith("/search") };
  const nonCertificationActive = [studyItems, testItems, practiceItems, progressItems, methodologyItems].some((items) => items.some((item) => item.current)) || search.current;
  const groups: MenuGroup[] = [
    { label: t("certificationMenu"), items: trackItems, active: Boolean(current) && pathname !== "/" && !nonCertificationActive },
    { label: t("studyMenu"), items: studyItems, active: studyItems.some((item) => item.current) },
    { label: t("testMenu"), items: testItems, active: testItems.some((item) => item.current) },
    { label: t("practiceMenu"), items: practiceItems, active: practiceItems.some((item) => item.current) },
    { label: t("progressMenu"), items: progressItems, active: progressItems.some((item) => item.current) },
    { label: t("methodology"), items: methodologyItems, active: methodologyItems.some((item) => item.current) },
  ];

  return (
    <header className="relative z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:gap-3 sm:py-4">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-white sm:text-lg">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(34,211,238,.6)]" />
          Certification Review
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <MobileNavigation groups={groups} search={search} label={t("mobileMenu")} closeLabel={t("closeMenu")} />
        </div>
        <nav className="hidden w-full flex-wrap items-center justify-end gap-2 lg:flex" aria-label={t("tracksLabel")}>
          <HeaderMenu label={current ? tTracks(`${current.id}.short`) : t("chooseTrack")} active={groups[0].active} items={trackItems} />
          <HeaderMenu label={t("studyMenu")} active={groups[1].active} items={studyItems} />
          <HeaderMenu label={t("testMenu")} active={groups[2].active} items={testItems} />
          <HeaderMenu label={t("practiceMenu")} active={groups[3].active} items={practiceItems} />
          <HeaderMenu label={t("progressMenu")} active={groups[4].active} items={progressItems} />
          <HeaderMenu label={t("methodology")} active={groups[5].active} items={methodologyItems} />
          <Link href={search.href} aria-current={search.current ? "page" : undefined} className={`${pill} ${search.current ? "border-teal-400 bg-teal-400 font-medium text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400 hover:text-white"}`}>
            {search.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
