"use client";

import { useSyncExternalStore } from "react";

let current = 0;

function subscribe(onStoreChange: () => void) {
  current = Date.now();
  const id = window.setInterval(() => {
    current = Date.now();
    onStoreChange();
  }, 1000);
  return () => window.clearInterval(id);
}

function getNow() {
  if (!current) current = Date.now();
  return current;
}

function getIdle() {
  return 0;
}

export function useNow(enabled = true) {
  return useSyncExternalStore(
    enabled ? subscribe : () => () => undefined,
    enabled ? getNow : getIdle,
    getIdle,
  );
}

export function secondsLeft(until: number, now: number) {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}
