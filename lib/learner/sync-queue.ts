type Waiter = { resolve: (value: unknown) => void; reject: (error: unknown) => void };

type Job = {
  run: () => Promise<unknown>;
  waiters: Waiter[];
};

let current: Promise<void> | null = null;
let queued: Job | null = null;

function settle(job: Job) {
  const pending = job.run().then(
    (value) => { for (const waiter of job.waiters) waiter.resolve(value); },
    (error) => { for (const waiter of job.waiters) waiter.reject(error); },
  );
  current = pending.finally(() => {
    current = null;
    const next = queued;
    queued = null;
    if (next) settle(next);
  });
}

/** One sync runs at a time. A save that arrives during it replaces any save already waiting. */
export function enqueueLearnerSave<T>(run: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const waiter = { resolve: resolve as (value: unknown) => void, reject };
    if (!current) settle({ run, waiters: [waiter] });
    else if (!queued) queued = { run, waiters: [waiter] };
    else {
      queued.run = run;
      queued.waiters.push(waiter);
    }
  });
}
