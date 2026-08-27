"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

export function useNow(enabled = true) {
  return useSyncExternalStore(
    enabled ? subscribe : () => () => undefined,
    () => Date.now(),
    () => 0,
  );
}

export function secondsLeft(until: number, now: number) {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}
