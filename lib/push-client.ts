"use client";

import { getServiceWorkerRegistration } from "@/components/pwa/register-sw";
import { isStandaloneDisplay } from "@/lib/pwa";

const DISMISS_KEY = "lbpay_push_dismissed";
export const PUSH_EVENT = "lbpay:push";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushPermission() {
  if (typeof Notification === "undefined") return "denied" as NotificationPermission;
  return Notification.permission;
}

export function wasPushDismissed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function markPushDismissed() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DISMISS_KEY, "1");
}

export function openPushPrompt() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PUSH_EVENT));
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function enablePush() {
  if (!pushSupported()) {
    return { ok: false as const, error: "This browser cannot show phone alerts." };
  }
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (ios && !isStandaloneDisplay()) {
    return {
      ok: false as const,
      error: "On iPhone, add LBPay to your Home Screen first, then turn on alerts.",
    };
  }

  const vapidRes = await fetch("/api/push/vapid");
  const vapid = (await vapidRes.json().catch(() => ({}))) as { publicKey?: string; configured?: boolean };
  if (!vapid.publicKey) {
    return { ok: false as const, error: "Alerts are not configured on the server yet." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false as const, error: "Alerts were blocked. Enable them in your phone settings." };
  }

  const registration = await getServiceWorkerRegistration();
  await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
  });
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!res.ok) {
    return { ok: false as const, error: "Could not save this phone for alerts." };
  }
  return { ok: true as const };
}

export async function refreshPushSubscription() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    const vapidRes = await fetch("/api/push/vapid");
    const vapid = (await vapidRes.json().catch(() => ({}))) as { publicKey?: string };
    if (!vapid.publicKey) return;
    const registration = await getServiceWorkerRegistration();
    await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      }));
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch {
    // Keep the existing subscription if a refresh fails.
  }
}

export async function disablePush() {
  if (!pushSupported()) return;
  const registration = await getServiceWorkerRegistration().catch(() => null);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe().catch(() => undefined);
  } else {
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => undefined);
  }
}
