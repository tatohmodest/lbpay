"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Send } from "lucide-react";
import { MethodDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contactFromTransaction, contactSendHref } from "@/lib/contacts";
import { copyText } from "@/lib/clipboard";
import { formatDay, formatTime, formatXAF, isMoneyOut } from "@/lib/format";
import { payLinkPath } from "@/lib/origin";
import { useNotify } from "@/lib/notify";
import { kindTitle, methodLabel, networkLabel, receiptText, statusLabel } from "@/lib/tx";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

export function TxDetail({
  tx,
  backHref = "/wallet/history",
  backLabel = "History",
}: {
  tx: Transaction;
  backHref?: string;
  backLabel?: string;
}) {
  const notify = useNotify();
  const outgoing = isMoneyOut(tx.kind);
  const contact = contactFromTransaction(tx);
  const net = tx.amount + (outgoing ? tx.fee : 0);
  const rows: { label: string; value: string; href?: string }[] = [
    { label: "Status", value: statusLabel(tx.status) },
    { label: "Type", value: kindTitle(tx.kind) },
    { label: outgoing ? "To" : "From", value: tx.counterparty },
    { label: "Method", value: methodLabel(tx.method) },
    { label: "Amount", value: formatXAF(tx.amount) },
  ];
  if (tx.fee > 0) {
    rows.push({ label: "Fee", value: formatXAF(tx.fee) });
    rows.push({ label: outgoing ? "Total out" : "You received", value: formatXAF(outgoing ? net : tx.amount) });
  }
  rows.push({ label: "Date", value: formatDay(tx.createdAt) });
  rows.push({ label: "Time", value: formatTime(tx.createdAt) });
  rows.push({ label: "Reference", value: tx.id });
  if (tx.railRef) rows.push({ label: "Rail ref", value: tx.railRef });
  if (tx.rail) rows.push({ label: "Rail", value: tx.rail === "payunit" ? "PayUnit" : tx.rail });
  if (tx.meta?.fromNetwork) rows.push({ label: "From network", value: networkLabel(tx.meta.fromNetwork) });
  if (tx.meta?.toNetwork) rows.push({ label: "To network", value: networkLabel(tx.meta.toNetwork) });
  if (tx.meta?.from) rows.push({ label: "From number", value: tx.meta.from });
  if (tx.meta?.to) rows.push({ label: "To number", value: tx.meta.to });
  if (tx.meta?.handle) rows.push({ label: "Pay ID", value: `@${tx.meta.handle.replace(/^@/, "")}` });
  if (tx.meta?.linkSlug) {
    rows.push({ label: "Checkout", value: tx.meta.linkSlug, href: payLinkPath(tx.meta.linkSlug) });
  }
  if (tx.meta?.payoutRef) rows.push({ label: "Payout ref", value: tx.meta.payoutRef });
  if (tx.meta?.stage) rows.push({ label: "Stage", value: tx.meta.stage });
  if (tx.meta?.refunded) rows.push({ label: "Refund", value: "Refunded" });
  if (tx.note) rows.push({ label: "Note", value: tx.note });

  async function copyId() {
    try {
      await copyText(tx.id);
      notify.success("Copied", "Transaction reference is on your clipboard.");
    } catch {
      notify.error("Could not copy", "Select the reference and copy it yourself.");
    }
  }

  async function copyReceipt() {
    try {
      await copyText(receiptText(tx));
      notify.success("Copied", "Transaction details are on your clipboard.");
    } catch {
      notify.error("Could not copy", "Select the details and copy them yourself.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <section
        className={cn(
          "overflow-hidden rounded-[1.25rem] p-5",
          outgoing || tx.status !== "success"
            ? "border border-line/80 bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]"
            : "lb-house-card text-white",
        )}
      >
        <p
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            outgoing || tx.status !== "success" ? "bg-paper text-muted" : "bg-white/20 text-white",
          )}
        >
          {statusLabel(tx.status)}
        </p>
        <p
          className={cn(
            "mt-3 font-mono text-[2.1rem] font-black leading-none tracking-tight",
            outgoing || tx.status !== "success" ? "text-ink" : "text-white",
          )}
        >
          {outgoing ? "−" : "+"}
          {formatXAF(tx.amount, { withCurrency: false })}
          <span
            className={cn(
              "ml-1.5 text-sm font-semibold",
              outgoing || tx.status !== "success" ? "text-muted" : "text-white/80",
            )}
          >
            XAF
          </span>
        </p>
        <p className={cn("mt-2 text-sm", outgoing || tx.status !== "success" ? "text-muted" : "text-white/80")}>
          {kindTitle(tx.kind)} · {tx.counterparty}
        </p>
      </section>

      <section className="overflow-hidden rounded-[1.25rem] border border-line/80 bg-white shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        <div className="divide-y divide-line/80">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3.5">
              <p className="text-sm text-muted">{row.label}</p>
              {row.href ? (
                <Link href={row.href} className="max-w-[60%] break-all text-right text-sm font-semibold text-brand">
                  {row.value}
                </Link>
              ) : (
                <p className="max-w-[60%] break-all text-right text-sm font-semibold text-ink">{row.value}</p>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-line/80 px-4 py-3">
          <MethodDot method={tx.method} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" className="w-full" onClick={() => void copyId()}>
          <Copy className="h-4 w-4" />
          Copy ID
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void copyReceipt()}>
          <Copy className="h-4 w-4" />
          Copy details
        </Button>
      </div>
      {contact ? (
        <Link href={contactSendHref(contact)} className="block">
          <Button className="w-full">
            <Send className="h-4 w-4" />
            Send again
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
