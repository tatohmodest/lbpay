"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => undefined;
}

export function useBrowserOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin.replace(/\/$/, ""),
    () => "",
  );
}
