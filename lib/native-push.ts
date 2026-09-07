"use client";

import { isNativeApp, nativeAlertSoundUrl } from "@/lib/native";

const FCM_ENDPOINT = "fcm:android";
let registering: Promise<{ ok: true } | { ok: false; error: string }> | null = null;

export async function playNativeAlert() {
  if (typeof window === "undefined") return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* web */
  }
  const held = (window as Window & { __lbpayAlert?: HTMLAudioElement }).__lbpayAlert;
  const audio = held || new Audio(nativeAlertSoundUrl());
  audio.currentTime = 0;
  await audio.play().catch(() => undefined);
}

export async function enableNativePush() {
  if (!isNativeApp()) return { ok: false as const, error: "Not a native app." };
  if (registering) return registering;
  registering = (async () => {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.createChannel({
        id: "lbpay_money",
        name: "Money alerts",
        description: "Deposits, sends, savings, and account changes",
        importance: 5,
        sound: "lbpay_alert",
        vibration: true,
        visibility: 1,
      }).catch(() => undefined);
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") {
        return { ok: false as const, error: "Alerts were blocked. Enable them in Android settings." };
      }
      const token = await new Promise<string>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("FCM timed out")), 12_000);
        void PushNotifications.addListener("registration", (entry) => {
          window.clearTimeout(timer);
          resolve(entry.value);
        });
        void PushNotifications.addListener("registrationError", (error) => {
          window.clearTimeout(timer);
          reject(new Error(error.error || "Could not register this phone"));
        });
        void PushNotifications.register();
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "fcm",
          token,
          endpoint: `${FCM_ENDPOINT}:${token.slice(-24)}`,
          keys: { p256dh: "fcm", auth: "fcm" },
        }),
      });
      if (!res.ok) return { ok: false as const, error: "Could not save this phone for alerts." };
      return { ok: true as const };
    } catch (error) {
      registering = null;
      return { ok: false as const, error: error instanceof Error ? error.message : "Could not enable alerts." };
    }
  })();
  return registering;
}
