"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type BeforeInstallPromptEvent,
  INSTALL_EVENT,
  isStandaloneDisplay,
  markInstallDismissed,
  shouldAutoOfferInstall,
  useInstallPlatform,
  useStandaloneDisplay,
} from "@/lib/pwa";
import { isNativeApp } from "@/lib/native";

export function InstallPrompt() {
  const pathname = usePathname();
  const platform = useInstallPlatform();
  const standalone = useStandaloneDisplay();
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const autoOpened = useRef(false);

  const close = useCallback((persist = true) => {
    setOpen(false);
    if (persist) markInstallDismissed();
  }, []);

  useEffect(() => {
    if (standalone) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setOpen(false);
    };
    const onOpen = () => {
      if (!isStandaloneDisplay()) setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(INSTALL_EVENT, onOpen);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(INSTALL_EVENT, onOpen);
    };
  }, [standalone]);

  useEffect(() => {
    if (autoOpened.current) return;
    if (isNativeApp()) return;
    if (!shouldAutoOfferInstall(pathname)) return;
    // Let people read first: offer the app only after they have scrolled a screen
    // or spent a while on the page, and only once per session.
    let timer = 0;
    const offer = () => {
      if (autoOpened.current) return;
      autoOpened.current = true;
      cleanup();
      setOpen(true);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.9) offer();
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
    timer = window.setTimeout(offer, 20_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return cleanup;
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function install() {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setDeferred(null);
        setOpen(false);
        return;
      }
    } catch {
      // Browser cancelled the native sheet. Keep our prompt available.
    } finally {
      setBusy(false);
    }
  }

  if (!open || standalone || isNativeApp()) return null;

  const isIos = platform === "ios";
  const isAndroid = platform === "android";
  const canNativeInstall = Boolean(deferred) && !isIos;
  const deviceLabel =
    platform === "ios" ? "iPhone" : platform === "android" ? "Android" : "this device";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Dismiss install"
        className="absolute inset-0 bg-navy/45 backdrop-blur-[3px]"
        onClick={() => close()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lbpay-install-title"
        className="lb-sheet relative flex min-h-[min(36rem,88svh)] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-24px_80px_rgba(7,20,15,0.18)] sm:min-h-0 sm:rounded-[2rem] sm:shadow-[0_24px_80px_rgba(7,20,15,0.16)]"
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

        <div className="flex flex-1 flex-col px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-10 sm:pt-10">
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="LBPay"
              width={112}
              height={112}
              className="h-28 w-28 rounded-[1.75rem] shadow-[0_18px_40px_rgba(12,25,19,0.16)]"
            />
            <p className="mt-5 rounded-full bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              App for {deviceLabel}
            </p>
            <h2 id="lbpay-install-title" className="mt-3 text-3xl font-semibold tracking-tight text-ink">
              Install LBPay
            </h2>
            <p className="mt-3 max-w-sm text-base leading-7 text-muted">
              {`Add LBPay to your home screen as a PWA. Your XAF wallet, PIN lock, and transfers open like any other app on ${
                platform === "ios" ? "your iPhone" : platform === "android" ? "your Android phone" : "this device"
              }.`}
            </p>
          </div>

          {isIos ? (
            <ol className="mt-8 space-y-4">
              <InstallStep n={1} icon={<Share className="h-5 w-5" />}>
                Tap the <span className="font-medium text-ink">Share</span> button in Safari.
              </InstallStep>
              <InstallStep n={2} icon={<Smartphone className="h-5 w-5" />}>
                Choose <span className="font-medium text-ink">Add to Home Screen</span>.
              </InstallStep>
              <InstallStep n={3} icon={<Download className="h-5 w-5" />}>
                Tap <span className="font-medium text-ink">Add</span>. LBPay sits with your other apps.
              </InstallStep>
            </ol>
          ) : canNativeInstall ? (
            <p className="mt-8 rounded-2xl bg-paper px-4 py-4 text-center text-sm leading-6 text-muted">
              Tap install, then confirm. LBPay will appear on your home screen.
            </p>
          ) : (
            <ol className="mt-8 space-y-4">
              <InstallStep n={1} icon={<Smartphone className="h-5 w-5" />}>
                Open the browser menu (three dots).
              </InstallStep>
              <InstallStep n={2} icon={<Download className="h-5 w-5" />}>
                Tap <span className="font-medium text-ink">Install app</span> or{" "}
                <span className="font-medium text-ink">Add to Home screen</span>.
              </InstallStep>
              {isAndroid ? (
                <InstallStep n={3} icon={<Download className="h-5 w-5" />}>
                  Confirm install when Android asks.
                </InstallStep>
              ) : null}
            </ol>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-8">
            {canNativeInstall ? (
              <Button type="button" size="lg" onClick={() => void install()} disabled={busy} className="h-12 w-full text-[15px]">
                {busy ? "Opening…" : "Install app"}
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              variant={canNativeInstall ? "ghost" : "secondary"}
              onClick={() => close()}
              className="h-12 w-full"
            >
              {isIos || !canNativeInstall ? "I will do this next" : "Not now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallStep({
  n,
  icon,
  children,
}: {
  n: number;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-4 rounded-2xl bg-paper px-4 py-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-ink shadow-[0_1px_2px_rgba(12,25,19,0.06)]">
        {icon}
      </span>
      <p className="pt-2 text-[15px] leading-6 text-muted">
        <span className="mr-1.5 font-semibold text-ink">{n}.</span>
        {children}
      </p>
    </li>
  );
}
