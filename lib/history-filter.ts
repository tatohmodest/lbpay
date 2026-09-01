import { isMoneyOut } from "@/lib/format";
import type { Transaction, TransactionStatus } from "@/lib/types";

export type HistoryDirection = "all" | "in" | "out";
export type HistoryPeriod = "all" | "7d" | "30d" | "90d";
export type HistoryStatusFilter = "all" | "success" | "pending" | "failed";

export type HistoryFilters = {
  q?: string;
  direction?: HistoryDirection;
  status?: HistoryStatusFilter;
  period?: HistoryPeriod;
  now?: number | Date;
};

const PERIOD_MS: Record<Exclude<HistoryPeriod, "all">, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

const FAILED_STATUSES = new Set<TransactionStatus>(["failed", "cancelled", "expired"]);

export function matchesHistoryStatus(status: TransactionStatus, filter: HistoryStatusFilter) {
  if (filter === "all") return true;
  if (filter === "failed") return FAILED_STATUSES.has(status);
  return status === filter;
}

export function filterHistory(transactions: Transaction[], filters: HistoryFilters = {}) {
  const q = (filters.q || "").trim().toLowerCase();
  const direction = filters.direction || "all";
  const status = filters.status || "all";
  const period = filters.period || "all";
  const now = filters.now instanceof Date ? filters.now.getTime() : filters.now ?? Date.now();
  const since = period === "all" ? 0 : now - PERIOD_MS[period];

  return transactions.filter((tx) => {
    if (direction === "out" && !isMoneyOut(tx.kind)) return false;
    if (direction === "in" && isMoneyOut(tx.kind)) return false;
    if (!matchesHistoryStatus(tx.status, status)) return false;
    if (since && new Date(tx.createdAt).getTime() < since) return false;
    if (!q) return true;
    const hay = [tx.counterparty, tx.id, tx.kind, tx.method, tx.note, tx.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function statementDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function historyToCsv(transactions: Transaction[]) {
  const header = [
    "Date",
    "ID",
    "Kind",
    "Direction",
    "Counterparty",
    "Method",
    "Amount",
    "Fee",
    "Status",
  ];
  const rows = transactions.map((tx) =>
    [
      statementDate(tx.createdAt),
      tx.id,
      tx.kind.replaceAll("_", " "),
      isMoneyOut(tx.kind) ? "Out" : "In",
      tx.counterparty,
      tx.method,
      isMoneyOut(tx.kind) ? -Math.round(tx.amount) : Math.round(tx.amount),
      Math.round(tx.fee || 0),
      tx.status,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}

export function statementFilename(now: Date = new Date()) {
  const stamp = now.toISOString().slice(0, 10);
  return `lbpay-statement-${stamp}.csv`;
}

export function downloadStatement(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
