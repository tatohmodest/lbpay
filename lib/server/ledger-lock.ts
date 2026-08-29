let tail: Promise<unknown> = Promise.resolve();

/** Serialize ledger reads+writes in this process so two "I've paid" clicks cannot both credit. */
export function withLedgerLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
