import type { PaymentMethod, Transaction, TransactionKind, TransactionStatus } from "@/lib/types";
import { formatXAF, isMoneyOut } from "@/lib/format";

export type TxMeta = {
  from?: string;
  to?: string;
  fromNetwork?: "mtn" | "orange";
  toNetwork?: "mtn" | "orange";
  stage?: "collecting" | "paying" | "done";
  payoutRef?: string;
  linkSlug?: string;
  handle?: string;
  refunded?: boolean;
};

const KIND_TITLE: Record<TransactionKind, string> = {
  send: "Sent",
  receive: "Received",
  deposit: "Deposit",
  withdraw: "Withdrawal",
  airtime: "Airtime",
  data: "Data",
  bill: "Bill",
  cross_network: "Quick transfer",
  collection: "Collection",
  payout: "Payout",
  request: "Request",
  split: "Split",
  subscription: "Subscription",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  success: "Paid",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function txHref(id: string) {
  return `/wallet/history/${encodeURIComponent(id)}`;
}

export function kindTitle(kind: string) {
  return KIND_TITLE[kind as TransactionKind] || kind.replaceAll("_", " ");
}

export function statusLabel(status: string) {
  return STATUS_LABEL[status as TransactionStatus] || status;
}

export function methodLabel(method: string) {
  if (method === "mtn") return "MTN MoMo";
  if (method === "orange") return "Orange Money";
  if (method === "card") return "Card";
  return "LBPay Wallet";
}

export function networkLabel(network?: string) {
  if (network === "mtn") return "MTN MoMo";
  if (network === "orange") return "Orange Money";
  return "";
}

export function publicTx(tx: {
  id: string;
  kind: string;
  amount: number;
  fee?: number;
  status: string;
  method: string;
  counterparty: string;
  note?: string;
  createdAt: string;
  railRef?: string;
  rail?: string;
  meta?: Record<string, unknown> | TxMeta;
}): Transaction {
  const raw = (tx.meta || {}) as TxMeta & { payToken?: string };
  const meta: TxMeta = {};
  if (raw.from) meta.from = String(raw.from);
  if (raw.to) meta.to = String(raw.to);
  if (raw.fromNetwork === "mtn" || raw.fromNetwork === "orange") meta.fromNetwork = raw.fromNetwork;
  if (raw.toNetwork === "mtn" || raw.toNetwork === "orange") meta.toNetwork = raw.toNetwork;
  if (raw.stage === "collecting" || raw.stage === "paying" || raw.stage === "done") meta.stage = raw.stage;
  if (raw.payoutRef) meta.payoutRef = String(raw.payoutRef);
  if (raw.linkSlug) meta.linkSlug = String(raw.linkSlug);
  if (raw.handle) meta.handle = String(raw.handle);
  if (raw.refunded) meta.refunded = true;

  return {
    id: tx.id,
    kind: tx.kind as Transaction["kind"],
    amount: tx.amount,
    fee: tx.fee || 0,
    status: tx.status as Transaction["status"],
    method: tx.method as PaymentMethod,
    counterparty: tx.counterparty,
    note: tx.note,
    createdAt: tx.createdAt,
    railRef: tx.railRef,
    rail: tx.rail as Transaction["rail"],
    meta: Object.keys(meta).length ? meta : undefined,
  };
}

export function receiptText(tx: Transaction) {
  const sign = isMoneyOut(tx.kind) ? "-" : "+";
  const lines = [
    "LBPay",
    statusLabel(tx.status),
    `${sign}${formatXAF(tx.amount)}`,
    `${kindTitle(tx.kind)} · ${tx.counterparty}`,
    new Date(tx.createdAt).toISOString().slice(0, 19).replace("T", " "),
    `Reference ${tx.id}`,
  ];
  if (tx.fee) lines.push(`Fee ${formatXAF(tx.fee)}`);
  if (tx.note) lines.push(tx.note);
  return lines.join("\n");
}
