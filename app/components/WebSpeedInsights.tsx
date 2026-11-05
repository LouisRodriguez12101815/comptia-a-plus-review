"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactSearchQuery } from "@/lib/vercel-analytics";

export function WebSpeedInsights() {
  return <SpeedInsights beforeSend={redactSearchQuery} />;
}
