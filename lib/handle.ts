import { slugify } from "@/lib/format";

const RESERVED = new Set([
  "admin",
  "api",
  "pay",
  "p",
  "r",
  "wallet",
  "login",
  "signup",
  "verify",
  "forgot",
  "pin",
  "docs",
  "products",
  "business",
  "developers",
  "support",
  "help",
  "lbpay",
  "official",
  "me",
]);

export function normalizeHandle(value: string) {
  return slugify(value.replace(/^@/, ""));
}

export function handleBase(value: string) {
  const id = normalizeHandle(value);
  const match = id.match(/^(.*?)(\d+)$/);
  if (match?.[1]) return match[1].replace(/-$/, "");
  return id;
}

export function isReservedHandle(value: string) {
  const id = normalizeHandle(value);
  return !id || id.length < 2 || RESERVED.has(id);
}

export function numberedHandle(base: string, n: number) {
  const root = normalizeHandle(base) || "user";
  return n <= 1 ? root : `${root}${n}`;
}
