const listeners = new Set<() => void>();

export const LEARNER_SESSION_EVENT = "learner-session";

/** Ask the signed-in persistence binder to save immediately. No-op when nobody is listening. */
export function requestLearnerFlush(): void {
  for (const listener of listeners) listener();
}

export function onLearnerFlush(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
