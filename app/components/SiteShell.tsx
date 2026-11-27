"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { TrackBar } from "@/app/components/TrackBar";

export function SiteShell({ children }: { children: ReactNode }) {
  const landing = usePathname() === "/";
  if (landing) return <main>{children}</main>;
  return <><SiteHeader /><TrackBar /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main><SiteFooter /></>;
}
