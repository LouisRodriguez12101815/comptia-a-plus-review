"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactSearchQuery } from "@/lib/vercel-analytics";

export function WebAnalytics() {
  return <Analytics beforeSend={redactSearchQuery} />;
}
