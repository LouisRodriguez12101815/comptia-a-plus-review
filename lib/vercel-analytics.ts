export type AnalyticsEvent = { url: string };

/** Remove free-form search text before a Vercel analytics event is sent. */
export function redactSearchQuery<T extends AnalyticsEvent>(event: T): T {
  const url = new URL(event.url, "https://vercel-analytics.invalid");
  if (!url.searchParams.has("q")) return event;

  url.searchParams.delete("q");
  const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(event.url);
  return {
    ...event,
    url: absolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`,
  } as T;
}
