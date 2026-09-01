import { detectMobileNetwork, isCameroonMsisdn, cameroonMsisdn } from "@/lib/phone";
import type { Transaction } from "@/lib/types";

const SKIP_KINDS = new Set([
  "deposit",
  "withdraw",
  "airtime",
  "data",
  "bill",
  "adjustment",
  "reversal",
  "subscription",
]);

const SKIP_NAMES =
  /^(mtn mobile money|orange money|card|lbpay admin|lbpay transfer|payunit|api customer)$/i;

export type WalletContact = {
  key: string;
  label: string;
  to: string;
  via: "wallet" | "mtn" | "orange";
  lastAt: string;
};

export function contactSendHref(contact: WalletContact) {
  const query = new URLSearchParams({ to: contact.to });
  if (contact.via !== "wallet") query.set("via", contact.via);
  return `/wallet/send?${query.toString()}`;
}

export function contactInitials(label: string) {
  const clean = label.replace(/^@/, "");
  if (isCameroonMsisdn(clean)) return clean.slice(-2);
  const letters = clean.replace(/[^a-zA-Z0-9]/g, "");
  return (letters.slice(0, 2) || "?").toUpperCase();
}

export function contactsFromTransactions(txs: Transaction[]): WalletContact[] {
  const map = new Map<string, WalletContact>();
  for (const tx of txs) {
    const contact = contactFromTransaction(tx);
    if (!contact) continue;
    const existing = map.get(contact.key);
    if (!existing || existing.lastAt < contact.lastAt) map.set(contact.key, contact);
  }
  return [...map.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export function contactFromTransaction(tx: Transaction): WalletContact | null {
  if (tx.status !== "success") return null;
  if (SKIP_KINDS.has(tx.kind)) return null;
  const raw = String(tx.counterparty || "").trim();
  if (!raw || SKIP_NAMES.test(raw)) return null;

  const asPhone = cameroonMsisdn(raw);
  if (raw.startsWith("@") || (tx.method === "wallet" && !isCameroonMsisdn(asPhone) && /[a-z]/i.test(raw))) {
    const id = raw.replace(/^@/, "").trim().toLowerCase();
    if (!id || /^\d/.test(id)) return null;
    return {
      key: `wallet:${id}`,
      label: `@${id}`,
      to: `@${id}`,
      via: "wallet",
      lastAt: tx.createdAt,
    };
  }

  const phone = cameroonMsisdn(raw);
  if (!isCameroonMsisdn(phone)) return null;
  const detected = detectMobileNetwork(phone);
  const via =
    tx.method === "mtn" || tx.method === "orange"
      ? tx.method
      : detected === "mtn" || detected === "orange"
        ? detected
        : "mtn";
  return {
    key: `momo:${phone}`,
    label: phone,
    to: phone,
    via,
    lastAt: tx.createdAt,
  };
}
