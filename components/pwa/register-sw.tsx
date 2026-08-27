"use client";

import { useEffect } from "react";

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

export function getServiceWorkerRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.reject(new Error("Push is not supported in this browser."));
  }
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  }
  return registrationPromise;
}

export function RegisterServiceWorker() {
  useEffect(() => {
    void getServiceWorkerRegistration().catch(() => undefined);
  }, []);
  return null;
}
