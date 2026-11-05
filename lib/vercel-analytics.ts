export type AnalyticsEvent = {
  type: "pageview" | "event";
  url: string;
};

/** Remove free-form search text before a Web Analytics event is sent. */
export function redactSearchQuery(event: AnalyticsEvent): AnalyticsEvent {
  const url = new URL(event.url, "https://vercel-analytics.invalid");
  if (!url.searchParams.has("q")) return event;

  url.searchParams.delete("q");
  const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(event.url);
  return {
    ...event,
    url: absolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`,
  };
}
