import { getProgressSnapshot, saveProgress, type Progress } from "@/lib/progress";
import { mergeProgress } from "@/lib/learner/merge";

export type ProgressSyncResponse = {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
};

/** Client sync orchestration shared by the UI and deterministic transport tests. */
export async function syncLearnerProgress(
  send: (progress: Progress) => Promise<ProgressSyncResponse>,
  acknowledge: (serializedProgress: string) => void,
): Promise<ProgressSyncResponse> {
  const local = getProgressSnapshot();
  const response = await send(local);
  if (!response.ok) return response;
  const remote = response.data.progress as Progress;
  // Only the returned snapshot is acknowledged; locally added work still needs syncing.
  const serializedRemote = JSON.stringify(remote);
  acknowledge(serializedRemote);
  // Preserve the existing no-write path when the server returned exactly what we sent.
  if (JSON.stringify(local) === serializedRemote) return response;
  // A response may predate local study or another sync response. Re-read immediately
  // before applying it, using the existing local-wins/timestamp/attempt-union rules.
  const current = getProgressSnapshot();
  const merged = mergeProgress(current, remote);
  if (JSON.stringify(current) !== JSON.stringify(merged)) saveProgress(merged);
  return response;
}
