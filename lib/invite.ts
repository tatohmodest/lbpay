import { normalizeHandle } from "@/lib/handle";
import { SITE_URL } from "@/lib/site";

export function inviteSignupPath(handle: string) {
  const id = normalizeHandle(handle);
  return id ? `/signup?ref=${encodeURIComponent(id)}` : "/signup";
}

export function inviteSignupUrl(handle: string, origin?: string) {
  const base = (origin || SITE_URL).replace(/\/$/, "");
  return `${base}${inviteSignupPath(handle)}`;
}

export function inviteShareText(handle: string, url: string) {
  const id = normalizeHandle(handle);
  return id
    ? `Join me on LBPay as @${id}. Open your wallet here: ${url}`
    : `Join me on LBPay. Open your wallet here: ${url}`;
}
