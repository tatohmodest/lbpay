export function readPinFail(err: unknown) {
  const error = err instanceof Error ? err.message : "Incorrect PIN.";
  const fromField =
    typeof err === "object" && err && "retryAfter" in err
      ? Number((err as { retryAfter?: number }).retryAfter) || 0
      : 0;
  const fromMessage = Number(/Try again in (\d+)s/.exec(error)?.[1] || 0);
  const retryAfter = fromField || fromMessage;
  return {
    error,
    retryAfter,
    lockedUntil: retryAfter > 0 ? Date.now() + retryAfter * 1000 : 0,
  };
}

export function isPinError(message: string) {
  return /incorrect pin|too many incorrect/i.test(message);
}
