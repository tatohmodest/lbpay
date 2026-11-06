const queues = new Map<string, Promise<unknown>>();

/**
 * Run fn after every earlier call with the same key has finished (in this process).
 * Used where a counter guards guessing: parallel requests must not all read "0 tries".
 */
export function serialByKey<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) || Promise.resolve();
  const run = prev.then(fn, fn);
  const settled = run.catch(() => undefined);
  queues.set(key, settled);
  void settled.then(() => {
    if (queues.get(key) === settled) queues.delete(key);
  });
  return run;
}
