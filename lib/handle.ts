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

/** New LBPay IDs stay short enough to say out loud and fit on a shop sign. */
export const HANDLE_MAX = 20;
export const HANDLE_MIN = 3;

function nameWords(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Normalise what someone types into the ID field: accents stripped, length capped. */
export function cleanHandleInput(value: string) {
  const plain = value.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return normalizeHandle(plain).slice(0, HANDLE_MAX).replace(/-+$/, "");
}

/**
 * Short ID ideas from a full name.
 * "Tatoh Modest Wilton" → tatoh, modest, tatohmw, twilton
 */
export function shortHandleOptions(name: string, limit = 4) {
  const words = nameWords(name);
  if (!words.length) return [];
  const [first, ...rest] = words;
  const last = rest[rest.length - 1];
  const initials = rest.map((w) => w[0]).join("");
  const candidates = [
    first,
    rest[0],
    rest.length ? `${first}${initials}` : `${first}cm`,
    last ? `${first[0]}${last}` : undefined,
    last ? `${first}${last}` : undefined,
  ];
  const out: string[] = [];
  for (const raw of candidates) {
    if (!raw) continue;
    const id = cleanHandleInput(raw);
    if (id.length < HANDLE_MIN || isReservedHandle(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}
