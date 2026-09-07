"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isNativeApp, nativeAlertSoundUrl, readOnboarded } from "@/lib/native";
import { useMe } from "@/lib/hooks/wallet";
import { enableNativePush, playNativeAlert } from "@/lib/native-push";
import { useNotify } from "@/lib/notify";

export function NativeShell() {
  const path = usePathname();
  const router = useRouter();
  const me = useMe();
  const notify = useNotify();

  useEffect(() => {
    if (!isNativeApp()) return;
    document.documentElement.classList.add("native-app");
    let gone = false;
    void import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      if (gone) return;
      void StatusBar.setOverlaysWebView({ overlay: false });
      void StatusBar.setBackgroundColor({ color: "#f3f7f4" });
      void StatusBar.setStyle({ style: Style.Dark });
    }).catch(() => undefined);
    void import("@capacitor/splash-screen").then(({ SplashScreen }) => {
      if (!gone) void SplashScreen.hide();
    }).catch(() => undefined);
    void import("@capacitor/keyboard").then(({ Keyboard, KeyboardResize }) => {
      if (!gone) void Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    }).catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [path]);

  useEffect(() => {
    if (!isNativeApp()) return;
    if (!me.isFetched) return;
    const onboarded = readOnboarded();
    const signedIn = Boolean(me.data?.session);
    if (!onboarded && path !== "/welcome") {
      router.replace("/welcome");
      return;
    }
    if (onboarded && path === "/") {
      router.replace(signedIn ? "/wallet" : "/login");
    }
  }, [me.isFetched, me.data?.session, path, router]);

  useEffect(() => {
    if (!isNativeApp() || !me.data?.session) return;
    void enableNativePush();
  }, [me.data?.session]);

  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;
    void import("@capacitor/push-notifications").then(({ PushNotifications }) => {
      const received = PushNotifications.addListener("pushNotificationReceived", (notification) => {
        void playNativeAlert();
        notify.info(notification.title || "LBPay", notification.body || "You have a new alert.");
      });
      const tapped = PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
        const url = String(event.notification.data?.url || "/wallet");
        router.push(url.startsWith("/") ? url : "/wallet");
      });
      remove = () => {
        void received.then((h) => h.remove());
        void tapped.then((h) => h.remove());
      };
    }).catch(() => undefined);
    return () => remove?.();
  }, [notify, router]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const audio = new Audio(nativeAlertSoundUrl());
    audio.preload = "auto";
    (window as Window & { __lbpayAlert?: HTMLAudioElement }).__lbpayAlert = audio;
  }, []);

  return null;
}
