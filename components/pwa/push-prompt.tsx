"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/hooks/wallet";
import { useApp } from "@/lib/store";
import { useNotify } from "@/lib/notify";
import {
  openInstallPrompt,
  useInstallPlatform,
  useStandaloneDisplay,
} from "@/lib/pwa";
import {
  PUSH_EVENT,
  enablePush,
  markPushDismissed,
  pushPermission,
  pushSupported,
  refreshPushSubscription,
  wasPushDismissed,
} from "@/lib/push-client";

export function PushPrompt() {
  const pathname = usePathname();
  const me = useMe();
  const notify = useNotify();
  const { state } = useApp();
  const platform = useInstallPlatform();
  const standalone = useStandaloneDisplay();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoOpened = useRef(false);
  const signedIn = Boolean(me.data?.session && me.data.user);

  const close = useCallback((persist = true) => {
    setOpen(false);
    if (persist) markPushDismissed();
  }, []);

  useEffect(() => {
    if (signedIn && pushPermission() === "granted") {
      void refreshPushSubscription();
    }
  }, [signedIn]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(PUSH_EVENT, onOpen);
    return () => window.removeEventListener(PUSH_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (autoOpened.current || !signedIn || !state.pinUnlocked) return;
    if (!pushSupported() || pushPermission() !== "default" || wasPushDismissed()) return;
    const onWallet = pathname === "/wallet" || pathname.startsWith("/wallet/");
    if (!onWallet) return;
    autoOpened.current = true;
    const timer = window.setTimeout(() => setOpen(true), 1100);
    return () => window.clearTimeout(timer);
  }, [pathname, signedIn, state.pinUnlocked]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !signedIn) return null;

  const iosNeedsInstall = platform === "ios" && !standalone;
  const alreadyOn = pushPermission() === "granted";

  async function turnOn() {
    if (iosNeedsInstall) {
      close(false);
      openInstallPrompt();
      return;
    }
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    if (!result.ok) {
      notify.error("Could not enable alerts", result.error);
      return;
    }
    notify.success("Alerts on", "This phone will ping for money in, money out, and account changes.");
    close();
  }

  return (
    <div className="fixed inset-0 z-[82] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Dismiss notifications"
        className="absolute inset-0 bg-navy/45 backdrop-blur-[3px]"
        onClick={() => close()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lbpay-push-title"
        className="lb-sheet relative flex min-h-[min(32rem,86svh)] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(7,20,15,0.18)] sm:min-h-0 sm:rounded-[2rem] sm:shadow-[0_24px_80px_rgba(7,20,15,0.16)]"
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-line" />
        </div>
        <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-10">
          <button
            type="button"
            onClick={() => close()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-10 sm:pt-10">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-paper text-ink shadow-[0_18px_40px_rgba(12,25,19,0.12)]">
              <Bell className="h-10 w-10" />
            </span>
            <h2 id="lbpay-push-title" className="mt-6 text-3xl font-semibold tracking-tight text-ink">
              Turn on phone alerts
            </h2>
            <p className="mt-3 max-w-sm text-base leading-7 text-muted">
              {iosNeedsInstall
                ? "On iPhone, install LBPay on your Home Screen first. Then open the app and allow notifications for money in, money out, and account changes."
                : "Get a popup on this phone when money comes in, money goes out, a collection lands, or your account changes."}
            </p>
          </div>

          <ul className="mt-8 space-y-3 text-left text-[15px] leading-6 text-muted">
            <li className="rounded-2xl bg-paper px-4 py-3">Money received and deposits</li>
            <li className="rounded-2xl bg-paper px-4 py-3">Sends, withdrawals, airtime, and bills</li>
            <li className="rounded-2xl bg-paper px-4 py-3">KYC decisions and account freeze alerts</li>
          </ul>

          <div className="mt-auto flex flex-col gap-2 pt-8">
            {alreadyOn ? (
              <Button type="button" size="lg" className="h-12 w-full" onClick={() => close()}>
                Alerts are already on
              </Button>
            ) : (
              <Button type="button" size="lg" className="h-12 w-full" disabled={busy} onClick={() => void turnOn()}>
                {busy ? "Please wait…" : iosNeedsInstall ? "Install the app first" : "Turn on alerts"}
              </Button>
            )}
            <Button type="button" size="lg" variant="ghost" className="h-12 w-full" onClick={() => close()}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
