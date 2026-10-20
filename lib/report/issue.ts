/**
 * Content dispute reports: validation and GitHub issue formatting.
 * Pure functions so tests can run them without a server (see tests/report-issue.test.mjs).
 */

export const DEFAULT_REPO = "LouisRodriguez12101815/comptia-a-plus-review";
export const ISSUE_TEMPLATE = "content-dispute.yml";
export const DISPUTE_LABEL = "content-dispute";

export const categories = [
  "Wrong answer key",
  "Factual error",
  "Outdated for the current exam objectives",
  "Typo or unclear wording",
  "Broken visual, game, or lab",
  "Other",
] as const;

export type Category = (typeof categories)[number];

export type DisputeReport = {
  category: Category;
  page: string;
  pageTitle: string;
  item: string;
  claim: string;
  source: string;
  reporter: string;
};

export const limits = { page: 300, pageTitle: 200, item: 600, claim: 4000, source: 1000, reporter: 80 } as const;

export type ValidationResult = { ok: true; report: DisputeReport } | { ok: false; error: string; errors: string[] };

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max) : "";

/**
 * Checks every field and collects every problem, like validate_lead in Python Class 10,
 * so the visitor fixes the form once instead of one error per submit.
 * `error` joins the list for callers that show a single sentence.
 */
export function validateReport(input: unknown): ValidationResult {
  const fail = (errors: string[]): ValidationResult => ({ ok: false, error: errors.join(" "), errors });
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail(["Send the report as a JSON object."]);
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];
  const category = categories.find((c) => c === raw.category);
  if (!category) errors.push("Choose a category.");
  const page = clean(raw.page, limits.page);
  if (!page.startsWith("/")) errors.push("The page path is missing.");
  const item = clean(raw.item, limits.item);
  if (item.length < 3) errors.push("Say which item is wrong (paste the text, question, or card).");
  const claim = clean(raw.claim, limits.claim);
  if (claim.length < 15) errors.push("Explain what is wrong and what it should say (at least 15 characters).");
  if (errors.length || !category) return fail(errors);
  return {
    ok: true,
    report: {
      category,
      page,
      pageTitle: clean(raw.pageTitle, limits.pageTitle),
      item,
      claim,
      source: clean(raw.source, limits.source),
      reporter: clean(raw.reporter, limits.reporter),
    },
  };
}

/** Neutralise markdown that could ping people, close the quote, or inject HTML into the issue. */
export function quote(text: string): string {
  if (!text) return "> _(not provided)_";
  return text
    .replace(/@/g, "@​")
    .replace(/#(\d)/g, "#​$1")
    .replace(/</g, "&lt;")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function issueTitle(r: DisputeReport): string {
  const item = r.item.replace(/\s+/g, " ").slice(0, 70);
  return `[Content dispute] ${r.category}: ${item}${r.item.length > 70 ? "…" : ""}`;
}

export function issueBody(r: DisputeReport, siteOrigin: string): string {
  const url = `${siteOrigin.replace(/\/$/, "")}${r.page}`;
  return [
    "Filed automatically from the **Report an error** form on the site.",
    "",
    `**Page:** [${r.pageTitle.replace(/[[\]]/g, "") || r.page}](${encodeURI(url)})`,
    `**Category:** ${r.category}`,
    "",
    "### Item disputed",
    quote(r.item),
    "",
    "### What is wrong and what it should say",
    quote(r.claim),
    "",
    "### Source or reference",
    quote(r.source),
    "",
    `**Reported by:** ${r.reporter ? quote(r.reporter).slice(2) : "anonymous"}`,
    "",
    "---",
    "Maintainer checklist: verify against the official exam objectives and the course book, fix or reply with the source, then close.",
  ].join("\n");
}

/** Prefilled GitHub issue-form URL: the no-token fallback, and a link for people who prefer GitHub. */
export function githubIssueUrl(r: Partial<DisputeReport>, siteOrigin: string, repo = DEFAULT_REPO): string {
  const params = new URLSearchParams({ template: ISSUE_TEMPLATE });
  if (r.item) params.set("title", `[Content dispute] ${r.item.replace(/\s+/g, " ").slice(0, 70)}`);
  if (r.page) params.set("page", `${siteOrigin.replace(/\/$/, "")}${r.page}`);
  if (r.item) params.set("item", r.item.slice(0, 500));
  if (r.category) params.set("category", r.category);
  if (r.claim) params.set("claim", r.claim.slice(0, 1500));
  if (r.source) params.set("source", r.source.slice(0, 500));
  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}

/** Fixed-window limiter. Per server instance only: a speed bump, not a guarantee. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; start: number }>();
  return (key: string, now = Date.now()): boolean => {
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { count: 1, start: now });
      if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}
