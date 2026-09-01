"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactFromTransaction, contactSendHref } from "@/lib/contacts";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import {
  downloadStatement,
  filterHistory,
  historyToCsv,
  statementFilename,
  type HistoryDirection,
  type HistoryPeriod,
  type HistoryStatusFilter,
} from "@/lib/history-filter";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

const DIRECTIONS: { id: HistoryDirection; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in", label: "In" },
  { id: "out", label: "Out" },
];

const STATUSES: { id: HistoryStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "success", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

const PERIODS: { id: HistoryPeriod; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
];

export function HistoryLedger({ transactions }: { transactions: Transaction[] }) {
  const [q, setQ] = useState("");
  const [direction, setDirection] = useState<HistoryDirection>("all");
  const [status, setStatus] = useState<HistoryStatusFilter>("all");
  const [period, setPeriod] = useState<HistoryPeriod>("all");

  const filtered = useMemo(
    () => filterHistory(transactions, { q, direction, status, period }),
    [transactions, q, direction, status, period],
  );
  const dirty = Boolean(q.trim()) || direction !== "all" || status !== "all" || period !== "all";

  function download() {
    if (!filtered.length) return;
    downloadStatement(historyToCsv(filtered), statementFilename());
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Activity</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">History</h1>
          <p className="mt-1 text-sm text-muted">Filter the ledger, then download a statement.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={download}
          disabled={!filtered.length}
        >
          <Download className="h-3.5 w-3.5" />
          Statement
        </Button>
      </div>

      <div className="mt-5 space-y-3 rounded-[2rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, id, or kind"
          className="py-3"
        />
        <ChipRow>
          {DIRECTIONS.map((item) => (
            <Chip key={item.id} active={direction === item.id} onClick={() => setDirection(item.id)}>
              {item.label}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow>
          {STATUSES.map((item) => (
            <Chip key={item.id} active={status === item.id} onClick={() => setStatus(item.id)}>
              {item.label}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow>
          {PERIODS.map((item) => (
            <Chip key={item.id} active={period === item.id} onClick={() => setPeriod(item.id)}>
              {item.label}
            </Chip>
          ))}
        </ChipRow>
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <p>
            {filtered.length} of {transactions.length}
          </p>
          {dirty ? (
            <button
              type="button"
              className="font-bold text-brand"
              onClick={() => {
                setQ("");
                setDirection("all");
                setStatus("all");
                setPeriod("all");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">None</p>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((row) => (
              <HistoryRow key={row.id} tx={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold transition",
        active ? "bg-forest text-white" : "bg-paper text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function HistoryRow({ tx }: { tx: Transaction }) {
  const contact = contactFromTransaction(tx);
  const body = (
    <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-bold">{tx.counterparty}</p>
        <p className="text-xs text-muted">
          {tx.kind.replace("_", " ")} · {formatDate(tx.createdAt)}
          {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee, { withCurrency: false })}` : ""}
        </p>
        <div className="mt-1">
          <MethodDot method={tx.method} />
        </div>
      </div>
      <div className="ml-2 shrink-0 text-right">
        <p className="font-mono text-sm font-black">
          {isMoneyOut(tx.kind) ? "−" : "+"}
          {formatXAF(tx.amount, { withCurrency: false })}
        </p>
        <StatusBadge status={tx.status} />
      </div>
    </div>
  );

  if (!contact) return body;
  return (
    <Link href={contactSendHref(contact)} className="block rounded-2xl transition hover:bg-paper">
      {body}
    </Link>
  );
}
