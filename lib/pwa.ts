import { useSyncExternalStore } from "react";

export const INSTALL_EVENT = "lbpay:install";
const DISMISS_KEY = "lbpay_install_dismissed";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "ios" | "android" | "desktop";

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
}

export function platformFromUserAgent(ua: string, maxTouchPoints = 0, platform = ""): InstallPlatform {
  const iPadOs = platform === "MacIntel" && maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOs) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "desktop";
  return platformFromUserAgent(
    window.navigator.userAgent || "",
    window.navigator.maxTouchPoints || 0,
    window.navigator.platform || "",
  );
}

function subscribeStandalone(onStoreChange: () => void) {
  const modes = ["standalone", "fullscreen", "minimal-ui"].map((mode) =>
    window.matchMedia(`(display-mode: ${mode})`),
  );
  modes.forEach((mq) => mq.addEventListener("change", onStoreChange));
  window.addEventListener("appinstalled", onStoreChange);
  return () => {
    modes.forEach((mq) => mq.removeEventListener("change", onStoreChange));
    window.removeEventListener("appinstalled", onStoreChange);
  };
}

export function useStandaloneDisplay() {
  return useSyncExternalStore(subscribeStandalone, isStandaloneDisplay, () => false);
}

export function useInstallPlatform() {
  return useSyncExternalStore(
    () => () => undefined,
    detectInstallPlatform,
    () => "desktop" as const,
  );
}

export function wasInstallDismissed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function markInstallDismissed() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DISMISS_KEY, "1");
}

export function openInstallPrompt() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INSTALL_EVENT));
}

export function shouldAutoOfferInstall(pathname: string) {
  if (isStandaloneDisplay() || wasInstallDismissed()) return false;
  // Desktop visitors get the header install button instead of an interruption.
  if (typeof window !== "undefined" && !window.matchMedia("(max-width: 900px)").matches) return false;
  // Android browsers get a persistent APK download bar instead of the PWA sheet.
  if (typeof window !== "undefined" && detectInstallPlatform() === "android") return false;
  const blocked = ["/wallet", "/business", "/developers", "/admin", "/pin", "/pay", "/p", "/r"];
  return !blocked.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
