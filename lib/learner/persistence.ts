import { onLearnerFlush } from "@/lib/learner/flush";

export const LEARNER_SAVE_DELAY_MS = 8000;

type Target = {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

/**
 * While signed in, save about 8 seconds after the last progress change.
 * A finish flush or pagehide saves immediately instead of waiting out that timer.
 */
export function bindLearnerPersistence(options: {
  signedIn: boolean;
  lastSynced: () => string;
  snapshot: () => string;
  save: (mode: "debounced" | "now") => void;
  subscribe: (listener: () => void) => () => void;
  target: Target;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (id: unknown) => void;
}): () => void {
  if (!options.signedIn) return () => {};
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = options.cancel ?? ((id) => clearTimeout(id as ReturnType<typeof setTimeout>));
  let timer: unknown = null;
  const clear = () => {
    if (timer !== null) cancel(timer);
    timer = null;
  };
  const dirty = () => options.snapshot() !== options.lastSynced();
  const unsubscribe = options.subscribe(() => {
    if (!dirty()) return;
    clear();
    timer = schedule(() => { timer = null; options.save("debounced"); }, LEARNER_SAVE_DELAY_MS);
  });
  const saveNow = () => {
    clear();
    if (dirty()) options.save("now");
  };
  const unflush = onLearnerFlush(saveNow);
  const onHide = () => saveNow();
  options.target.addEventListener("pagehide", onHide);
  return () => {
    clear();
    unsubscribe();
    unflush();
    options.target.removeEventListener("pagehide", onHide);
  };
}
