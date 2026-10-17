import type { Challenge, Receipt, Session } from "@/lib/practice/types";
export const newSession = (challenge: Challenge): Session => ({ challengeId: challenge.id, version: challenge.version, roundIndex: 0, receipts: {} });
const receiptFor = (session: Session, id: string): Receipt => session.receipts[id] ?? { attemptedIds: [], hintUsed: false };
export function isComplete(session: Session, challenge: Challenge) { return session.roundIndex === challenge.rounds.length; }
export function solved(session: Session, challenge: Challenge) {
  const round = challenge.rounds[session.roundIndex];
  return session.challengeId === challenge.id && session.version === challenge.version && !!round && receiptFor(session, round.id).attemptedIds.includes(round.correctAnswerId);
}
/** Pure transitions: future shared room implementations can apply these rules in an authorized CAS transaction.
 * Current practice scores are local; they are never reported as authoritative multiplayer contributions.
 */
export function submit(session: Session, challenge: Challenge, roundId: string, answerId: string): Session {
  const round = challenge.rounds[session.roundIndex];
  if (!round || round.id !== roundId || session.challengeId !== challenge.id || session.version !== challenge.version || solved(session, challenge) || !round.choices.some((choice) => choice.id === answerId)) return session;
  const receipt = receiptFor(session, roundId);
  if (receipt.attemptedIds.includes(answerId)) return session;
  return { ...session, receipts: { ...session.receipts, [roundId]: { ...receipt, attemptedIds: [...receipt.attemptedIds, answerId] } } };
}
export function requestHint(session: Session, challenge: Challenge): Session {
  const round = challenge.rounds[session.roundIndex];
  if (!round || session.challengeId !== challenge.id || session.version !== challenge.version || solved(session, challenge)) return session;
  const receipt = receiptFor(session, round.id);
  if (receipt.hintUsed) return session;
  return { ...session, receipts: { ...session.receipts, [round.id]: { ...receipt, hintUsed: true } } };
}
export function advance(session: Session, challenge: Challenge): Session {
  return solved(session, challenge) ? { ...session, roundIndex: session.roundIndex + 1 } : session;
}
export function summarize(session: Session, challenge: Challenge) {
  const rows = challenge.rounds.map((round) => {
    const receipt = receiptFor(session, round.id);
    const complete = receipt.attemptedIds.includes(round.correctAnswerId);
    return { round, complete, firstAttempt: receipt.attemptedIds.length > 0, firstAttemptCorrect: receipt.attemptedIds[0] === round.correctAnswerId,
      hintUsed: receipt.hintUsed, points: complete ? receipt.hintUsed ? 75 : 100 : 0,
      misconceptions: receipt.attemptedIds.filter((id) => id !== round.correctAnswerId).map((id) => round.choices.find((c) => c.id === id)!) };
  });
  const attempted = rows.filter((row) => row.firstAttempt).length;
  const firstCorrect = rows.filter((row) => row.firstAttemptCorrect).length;
  const fullAwards = rows.filter((row) => row.points === 100).length;
  const hintedAwards = rows.filter((row) => row.points === 75).length;
  return { rows, points: rows.reduce((sum, row) => sum + row.points, 0), fullAwards, hintedAwards, hints: rows.filter((row) => row.hintUsed).length,
    completed: rows.filter((row) => row.complete).length, attempted, firstCorrect,
    retries: challenge.rounds.reduce((n, round) => n + Math.max(0, (session.receipts[round.id]?.attemptedIds.length ?? 0) - 1), 0),
    firstAttemptAccuracy: attempted ? Math.round(firstCorrect / attempted * 100) : null,
    recommendations: rows.filter((row) => row.misconceptions.length || row.hintUsed).map((row) => ({ objective: row.round.objective, sourceIds: row.round.sourceIds })) };
}
/** Display only. First true branch wins, as in Python if / elif / else. The clean branch is finished and hints === 0. Zero is a real count; null, "", and a non-number are not. Points are unchanged. */
export function readinessLine(completed: unknown, total: unknown, hints: unknown): string {
  const finished = typeof completed === "number" && typeof total === "number" && total > 0 && completed === total;
  if (finished && typeof hints === "number" && hints === 0) return "finished with no hints.";
  if (finished && typeof hints === "number" && hints > 0) return "finished with a hint.";
  return "this run is not finished.";
}
/** Display only. The index increases every pass, so the while condition eventually fails. A hinted round is skipped. The walk breaks after stopAfter unaided titles. Points and the full match list are unchanged. */
export function shortWalk(rows: { title: string; hintUsed: boolean }[], stopAfter = 3) {
  const kept: string[] = [];
  let skipped = 0;
  let index = 0;
  let exit: "break" | "end" = "end";
  while (index < rows.length) {
    const row = rows[index];
    index += 1;
    if (row.hintUsed) {
      skipped += 1;
      continue;
    }
    kept.push(row.title);
    if (kept.length === stopAfter) {
      exit = "break";
      break;
    }
  }
  return { kept, skipped, index, exit, stoppedEarly: exit === "break" && index < rows.length };
}
export function shortWalkText(rows: { title: string; hintUsed: boolean }[], stopAfter = 3) {
  const walk = shortWalk(rows, stopAfter);
  const list = walk.kept.length ? walk.kept.map((title, position) => `${position + 1} ${title}`).join(", ") : "none";
  const skipLabel = walk.skipped === 1 ? "Skipped 1 hinted round." : `Skipped ${walk.skipped} hinted rounds.`;
  const stopLabel = walk.stoppedEarly ? `Stopped after ${walk.kept.length} unaided matches.` : "Stopped because the round list ended.";
  return `Short walk: ${list}. ${skipLabel} ${stopLabel}`;
}
/** Restore only a valid sequential session for this content revision; scores/accuracy are always recomputed. */
export function restoreSession(raw: string | null, challenge: Challenge): Session | null {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (session.challengeId !== challenge.id || session.version !== challenge.version || !Number.isInteger(session.roundIndex) || session.roundIndex < 0 || session.roundIndex > challenge.rounds.length || !session.receipts || typeof session.receipts !== "object" || Array.isArray(session.receipts)) return null;
    for (const id of Object.keys(session.receipts)) {
      const index = challenge.rounds.findIndex((r) => r.id === id), receipt = session.receipts[id];
      if (index < 0 || index > session.roundIndex || !receipt || typeof receipt.hintUsed !== "boolean" || !Array.isArray(receipt.attemptedIds) || new Set(receipt.attemptedIds).size !== receipt.attemptedIds.length) return null;
      const round = challenge.rounds[index];
      if (receipt.attemptedIds.some((id) => !round.choices.some((c) => c.id === id))) return null;
      const correctAt = receipt.attemptedIds.indexOf(round.correctAnswerId);
      if (correctAt >= 0 && correctAt !== receipt.attemptedIds.length - 1) return null;
    }
    if (challenge.rounds.slice(0, session.roundIndex).some((r) => !session.receipts[r.id]?.attemptedIds.includes(r.correctAnswerId))) return null;
    return session;
  } catch { return null; }
}
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const index = Math.floor(random() * (i + 1));
    [result[i], result[index]] = [result[index], result[i]];
  }
  return result;
}
