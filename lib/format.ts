import type { TransactionKind } from "@/lib/types";

export function firstName(name?: string | null) {
  const part = (name || "").trim().split(/\s+/)[0] || "";
  return part.replace(/[.,]+$/g, "");
}

export function formatXAF(amount: number, options?: { withCurrency?: boolean }) {
  const withCurrency = options?.withCurrency ?? true;
  const formatted = new Intl.NumberFormat("fr-CM", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return withCurrency ? `${formatted} XAF` : formatted;
}

export function formatCompact(amount: number) {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
  }
  return String(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelative(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

const MONEY_OUT: TransactionKind[] = [
  "send",
  "withdraw",
  "airtime",
  "data",
  "bill",
  "cross_network",
  "payout",
];

export function isMoneyOut(kind: string) {
  return MONEY_OUT.includes(kind as TransactionKind);
}

export function dayNet(
  rows: Array<{ amount: number; status: string; kind: string; createdAt: string }>,
  day = new Date(),
) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const end = start + 86_400_000;
  let net = 0;
  for (const row of rows) {
    if (row.status !== "success") continue;
    const at = new Date(row.createdAt).getTime();
    if (at < start || at >= end) continue;
    net += isMoneyOut(row.kind) ? -row.amount : row.amount;
  }
  return net;
}
