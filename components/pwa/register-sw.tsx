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

function activateWaiting(reg: ServiceWorkerRegistration) {
  const waiting = reg.waiting;
  if (waiting) waiting.postMessage("SKIP_WAITING");
  const installing = reg.installing;
  if (!installing) return;
  installing.addEventListener("statechange", () => {
    if (installing.state === "installed" && navigator.serviceWorker.controller) {
      installing.postMessage("SKIP_WAITING");
    }
  });
}

export function RegisterServiceWorker() {
  useEffect(() => {
    void getServiceWorkerRegistration()
      .then((reg) => {
        activateWaiting(reg);
        void reg.update();
        reg.addEventListener("updatefound", () => activateWaiting(reg));
      })
      .catch(() => undefined);
  }, []);
  return null;
}
