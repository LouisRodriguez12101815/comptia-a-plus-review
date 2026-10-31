/*
 * Turns the questions a learner missed, guessed on, or flagged into a plain Markdown report.
 * The report is pasted into Claude Code, where the weak-concept-coach agent explains the concepts
 * and drafts visuals and practice. Pure and dependency-free so it can be tested without a browser.
 */
export type WeakStatus = "sure-wrong" | "wrong" | "guessed-wrong" | "lucky-guess" | "flagged";

export type WeakRow = {
  id: string;
  objectiveId: string;
  topicId: string;
  topicTitle: string;
  status: WeakStatus;
  flagged: boolean;
  prompt: string;
  picked: string;
  correct: string;
  explanation: string;
};

/** Most urgent first: confident wrong answers show a wrong belief, not just a gap. */
export const STATUS_ORDER: WeakStatus[] = ["sure-wrong", "wrong", "guessed-wrong", "lucky-guess", "flagged"];
const STATUS_TITLE: Record<WeakStatus, string> = {
  "sure-wrong": "Sure, but wrong (a wrong belief to replace)",
  wrong: "Wrong",
  "guessed-wrong": "Guessed, and wrong",
  "lucky-guess": "Guessed, and right (not yet learned)",
  flagged: "Flagged for review",
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

export function buildWeakReport(input: { exam: string; date: string; correct: number; total: number; rows: WeakRow[] }): string {
  const { exam, date, correct, total, rows } = input;
  const lines: string[] = [`# Weak-concept report: ${exam}, ${date}`, ""];
  // Zero rows is a normal result for a strong sitting, so it is checked with an if.
  if (!rows.length) {
    lines.push(`Score ${correct} of ${total}. No wrong, guessed or flagged questions this time.`);
    return lines.join("\n") + "\n";
  }
  lines.push(`Score ${correct} of ${total}. ${rows.length} question${rows.length === 1 ? " needs" : "s need"} attention.`, "", "## By objective", "", "| Objective | Questions | Worst status |", "| --- | --- | --- |");
  const byObjective = new Map<string, WeakRow[]>();
  for (const row of rows) byObjective.set(row.objectiveId, [...(byObjective.get(row.objectiveId) ?? []), row]);
  const rank = (s: WeakStatus) => STATUS_ORDER.indexOf(s);
  for (const [objective, list] of [...byObjective].sort((a, b) => b[1].length - a[1].length)) {
    const worst = list.reduce((w, r) => (rank(r.status) < rank(w) ? r.status : w), list[0].status);
    lines.push(`| ${objective} | ${list.length} | ${STATUS_TITLE[worst]} |`);
  }
  for (const status of STATUS_ORDER) {
    const group = rows.filter((row) => row.status === status);
    if (!group.length) continue;
    lines.push("", `## ${STATUS_TITLE[status]}`);
    group.forEach((row, i) => {
      lines.push("", `### ${i + 1}. ${row.objectiveId} · ${row.topicTitle} (${row.id})${row.flagged ? " ⚑" : ""}`, "", `Question: ${clean(row.prompt)}`);
      if (status !== "lucky-guess" && status !== "flagged") lines.push(`I picked: ${clean(row.picked)}`);
      lines.push(`Correct answer: ${clean(row.correct)}`, `Site explanation: ${clean(row.explanation)}`, `Notes: /notes/${row.topicId}`);
    });
  }
  lines.push("", "---", "Ask Claude Code: use the weak-concept-coach agent on this report.");
  return lines.join("\n") + "\n";
}
