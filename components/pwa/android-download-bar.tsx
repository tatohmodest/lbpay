"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";
import { ANDROID_APK_FILENAME, ANDROID_APK_HREF } from "@/lib/assets";
import { isNativeApp } from "@/lib/native";
import { detectInstallPlatform, isStandaloneDisplay, useStandaloneDisplay } from "@/lib/pwa";

const DISMISS_KEY = "lbpay_android_apk_dismissed";

function wasDismissed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function AndroidDownloadBar() {
  const pathname = usePathname();
  const standalone = useStandaloneDisplay();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === "/welcome") {
      setVisible(false);
      return;
    }
    if (isNativeApp() || standalone || isStandaloneDisplay()) {
      setVisible(false);
      return;
    }
    if (detectInstallPlatform() !== "android") {
      setVisible(false);
      return;
    }
    if (wasDismissed()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [pathname, standalone]);

  const dismiss = useCallback(() => {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  if (!visible) return null;

  const aboveBottomNav =
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/business") ||
    pathname.startsWith("/developers") ||
    pathname.startsWith("/admin");

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[45] flex justify-center px-3 ${
        aboveBottomNav ? "bottom-[5.75rem]" : "bottom-[max(1rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-[1.4rem] border border-white/10 bg-forest px-3 py-2.5 text-white shadow-[0_18px_50px_rgba(6,38,28,0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">LBPay for Android</p>
          <p className="truncate text-xs text-white/70">Install the app for money alerts</p>
        </div>
        <a
          href={ANDROID_APK_HREF}
          download={ANDROID_APK_FILENAME}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-sm font-semibold text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss Android download"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
