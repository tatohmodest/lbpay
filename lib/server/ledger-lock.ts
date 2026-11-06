import { AsyncLocalStorage } from "node:async_hooks";

let tail: Promise<unknown> = Promise.resolve();
const inside = new AsyncLocalStorage<true>();

/**
 * Serialize ledger reads+writes in this process so two "I've paid" clicks cannot both credit.
 * Re-entrant: code already holding the lock runs straight through instead of waiting on itself.
 */
export function withLedgerLock<T>(fn: () => Promise<T>): Promise<T> {
  if (inside.getStore()) return fn();
  const locked = () => inside.run(true, fn);
  const run = tail.then(locked, locked);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
