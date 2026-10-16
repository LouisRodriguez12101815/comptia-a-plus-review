import {
  DEFAULT_REPO,
  DISPUTE_LABEL,
  createRateLimiter,
  githubIssueUrl,
  issueBody,
  issueTitle,
  validateReport,
} from "@/lib/report/issue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allow = createRateLimiter(5, 10 * 60 * 1000);
const MIN_FILL_MS = 3000;
const MAX_BYTES = 12_000;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function originOf(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const site = originOf(request);
  const origin = request.headers.get("origin");
  if (origin && origin !== site) return json({ error: "Reports must come from this site." }, 403);

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!allow(ip)) return json({ error: "Too many reports from this connection. Try again in a few minutes." }, 429);

  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "That report is too long." }, 413);
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return json({ error: "Send the report as JSON." }, 400);
  }

  // Honeypot and fill-time checks: bots fill hidden fields and submit instantly.
  if (typeof data.website === "string" && data.website.trim()) return json({ ok: true, issueUrl: null });
  if (typeof data.elapsedMs !== "number" || data.elapsedMs < MIN_FILL_MS)
    return json({ error: "That was fast. Take a moment to review the report, then submit again." }, 400);

  const result = validateReport(data);
  if (!result.ok) return json({ error: result.error }, 400);
  const report = result.report;

  const repo = process.env.GITHUB_ISSUES_REPO || DEFAULT_REPO;
  const token = process.env.GITHUB_ISSUES_TOKEN;
  const fallbackUrl = githubIssueUrl(report, site, repo);
  if (!token) return json({ error: "Automatic filing is not set up yet.", fallbackUrl }, 503);

  const create = (labels: string[]) =>
    fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "comptia-review-dispute-form",
      },
      body: JSON.stringify({ title: issueTitle(report), body: issueBody(report, site), labels }),
      signal: AbortSignal.timeout(8000),
    });

  try {
    let res = await create([DISPUTE_LABEL]);
    if (res.status === 422 || res.status === 403) res = await create([]); // label missing or token cannot set labels
    if (!res.ok) {
      console.error("report: GitHub issue create failed", res.status);
      return json({ error: "GitHub did not accept the report.", fallbackUrl }, 502);
    }
    const issue = (await res.json()) as { html_url: string; number: number };
    return json({ ok: true, issueUrl: issue.html_url, number: issue.number }, 201);
  } catch (error) {
    console.error("report: GitHub request error", error instanceof Error ? error.name : "unknown");
    return json({ error: "Could not reach GitHub.", fallbackUrl }, 502);
  }
}
