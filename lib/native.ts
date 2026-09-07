export const ONBOARD_KEY = "lbpay.onboarded.v1";

export function isNativeApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function readOnboarded() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function nativeAlertSoundUrl() {
  return "/sounds/lbpay-alert.wav";
}
