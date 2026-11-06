"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const sectionIds = ["overview", "study", "test", "visuals", "practice", "progress", "objectives"] as const;

export function NetworkWorkspaceNav() {
  const t = useTranslations("networkWorkspace");
  const [active, setActive] = useState<(typeof sectionIds)[number]>("overview");

  useEffect(() => {
    const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id as (typeof sectionIds)[number]);
    }, { rootMargin: "-18% 0px -68%", threshold: [0, 0.25, 0.6] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label={t("quickNavLabel")} className="network-quick-nav sticky top-2 z-30 -mx-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-2 shadow-lg backdrop-blur">
      <ul className="flex min-w-max gap-1">
        {sectionIds.map((id) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm whitespace-nowrap transition ${active === id ? "bg-[var(--track-accent-soft)] font-medium text-white ring-1 ring-[var(--track-accent-line)]" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              {t(`quick.${id}`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
