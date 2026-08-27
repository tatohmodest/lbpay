"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type BeforeInstallPromptEvent,
  type InstallPlatform,
  INSTALL_EVENT,
  isStandaloneDisplay,
  markInstallDismissed,
  shouldAutoOfferInstall,
  useInstallPlatform,
  useStandaloneDisplay,
} from "@/lib/pwa";

export function InstallPrompt() {
  const pathname = usePathname();
  const platformHint = useInstallPlatform();
  const standalone = useStandaloneDisplay();
  const [open, setOpen] = useState(false);
  const [platformOverride, setPlatformOverride] = useState<InstallPlatform | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const autoOpened = useRef(false);
  const platform = platformOverride ?? platformHint;

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
    if (!shouldAutoOfferInstall(pathname)) return;
    autoOpened.current = true;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
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

  if (!open || standalone) return null;

  const androidOrDesktop = platform !== "ios";
  const canNativeInstall = Boolean(deferred);

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
        className="lb-sheet relative w-full max-w-md overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-24px_80px_rgba(7,20,15,0.18)] sm:rounded-[1.75rem] sm:shadow-[0_24px_80px_rgba(7,20,15,0.16)]"
      >
        <div className="relative overflow-hidden px-6 pb-2 pt-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 top-12 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-[1rem] shadow-[0_8px_24px_rgba(0,179,105,0.28)]"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
                  Home screen app
                </p>
                <h2 id="lbpay-install-title" className="text-xl font-semibold tracking-tight text-ink">
                  Get LBPay
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => close()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          <p className="text-sm leading-6 text-muted">
            Install LBPay on this device. Open your XAF wallet like any other app, with PIN lock
            and faster sign-in. Works on iPhone and Android.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <OsChip
              active={platform === "ios"}
              label="iOS"
              hint="iPhone and iPad"
              onClick={() => setPlatformOverride("ios")}
            />
            <OsChip
              active={platform !== "ios"}
              label="Android"
              hint="Phone and tablet"
              onClick={() => setPlatformOverride("android")}
            />
          </div>

          {platform === "ios" ? (
            <ol className="mt-5 space-y-3">
              <InstallStep n={1} icon={<Share className="h-4 w-4" />}>
                Tap the <span className="font-medium text-ink">Share</span> button in Safari or
                Chrome.
              </InstallStep>
              <InstallStep n={2} icon={<Smartphone className="h-4 w-4" />}>
                Choose <span className="font-medium text-ink">Add to Home Screen</span>.
              </InstallStep>
              <InstallStep n={3} icon={<Download className="h-4 w-4" />}>
                Tap <span className="font-medium text-ink">Add</span>. LBPay appears with your apps.
              </InstallStep>
            </ol>
          ) : (
            <ol className="mt-5 space-y-3">
              {canNativeInstall ? (
                <InstallStep n={1} icon={<Download className="h-4 w-4" />}>
                  Tap <span className="font-medium text-ink">Install app</span>, then confirm in the
                  browser sheet.
                </InstallStep>
              ) : (
                <>
                  <InstallStep n={1} icon={<Smartphone className="h-4 w-4" />}>
                    Open the browser menu (three dots).
                  </InstallStep>
                  <InstallStep n={2} icon={<Download className="h-4 w-4" />}>
                    Tap <span className="font-medium text-ink">Install app</span> or{" "}
                    <span className="font-medium text-ink">Add to Home screen</span>.
                  </InstallStep>
                </>
              )}
            </ol>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {androidOrDesktop && canNativeInstall ? (
              <Button type="button" onClick={() => void install()} disabled={busy} className="w-full">
                {busy ? "Opening…" : "Install app"}
              </Button>
            ) : null}
            <Button type="button" variant={canNativeInstall && androidOrDesktop ? "ghost" : "secondary"} onClick={() => close()} className="w-full">
              {platform === "ios" || !canNativeInstall ? "I will do this next" : "Not now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OsChip({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl border border-brand bg-brand-soft px-3 py-3 text-left"
          : "rounded-2xl border border-line bg-paper px-3 py-3 text-left"
      }
    >
      <span className={`block text-sm font-medium ${active ? "text-brand-deep" : "text-ink"}`}>
        {label}
      </span>
      <span className="block text-xs text-muted">{hint}</span>
    </button>
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
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
        {icon}
      </span>
      <p className="pt-1 text-sm leading-6 text-muted">
        <span className="mr-1.5 font-semibold text-ink">{n}.</span>
        {children}
      </p>
    </li>
  );
}
