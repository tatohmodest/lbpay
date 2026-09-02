"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { formatDate, formatXAF } from "@/lib/format";
import { useDisburse, useMe, useTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { NetworkMark } from "@/components/network-mark";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { feePercentLabel, FEE_RATES } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";
import {
  PAYOUT_DESTINATIONS,
  payoutDestinationFee,
  payoutFeeBadge,
  type PayoutDestinationId,
} from "@/lib/checkout-methods";
import { normalizeHandle } from "@/lib/handle";
import { cn } from "@/lib/cn";

export default function PayoutsPage() {
  const me = useMe();
  const notify = useNotify();
  const disburse = useDisburse();
  const transfer = useTransfer();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [handle, setHandle] = useState("");
  const [destination, setDestination] = useState<PayoutDestinationId>("wallet");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  const value = Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const payId = normalizeHandle(handle);
  const fee = payoutDestinationFee(value, destination);
  const debit = value + fee;
  const balance = me.data?.balance ?? 0;
  const walletReady = destination === "wallet" && !amountIssue(value, "wallet") && value > 0 && debit <= balance && Boolean(payId);
  const momoReady =
    destination !== "wallet" &&
    !amountIssue(value, "withdraw") &&
    value > 0 &&
    debit <= balance &&
    isCameroonMsisdn(clean);
  const ready = walletReady || momoReady;
  const payouts = (me.data?.transactions || []).filter(
    (tx) => tx.kind === "withdraw" || tx.kind === "payout" || tx.note === "Developer payout",
  );
  const busy = disburse.isPending || transfer.isPending;
  const details =
    destination === "wallet"
      ? [
          { label: "To", value: `@${payId}` },
          { label: "They receive", value: formatXAF(value) },
          { label: "Charge", value: "No fee" },
        ]
      : [
          { label: "To", value: `${destination === "orange" ? "Orange" : "MTN"} ${clean}` },
          { label: "They receive", value: formatXAF(value) },
          ...(fee ? [{ label: "Charge", value: formatXAF(fee) }] : []),
          { label: "You pay", value: formatXAF(debit) },
        ];

  async function confirm(pin: string) {
    setPinError("");
    try {
      if (destination === "wallet") {
        await transfer.mutateAsync({ amount: value, to: payId, pin, note: "Developer payout" });
        notify.moneyOut(value, `Paid @${payId}`);
      } else {
        await disburse.mutateAsync({
          amount: value,
          phone: clean,
          network: destination,
          pin,
          note: "Developer payout",
        });
        notify.moneyOut(debit, `Payout queued to ${clean}`);
      }
      setOpen(false);
      setAmount("");
      setPhone("");
      setHandle("");
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Payout failed");
      notify.error("Payout failed", err instanceof Error ? err.message : "Could not send");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-black">Payouts</h1>
        <p className="mt-1 text-sm text-muted">
          Send to an LBPay wallet for free, or cash out to Mobile Money.
        </p>
        <Card className="mt-6 p-6">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ready) return;
              setPinError("");
              setOpen(true);
            }}
          >
            <AmountField
              value={amount}
              onChange={setAmount}
              kind={destination === "wallet" ? "wallet" : "withdraw"}
              receive={value}
              fee={fee}
              feeLabel={destination === "wallet" ? "No fee" : feePercentLabel(FEE_RATES.withdraw)}
              pay={destination === "wallet" ? undefined : debit}
            />
            {destination === "wallet" && value > 0 && !amountIssue(value, "wallet") ? (
              <p className="text-sm font-semibold text-brand">No fee on LBPay wallet.</p>
            ) : null}
            <div className="grid gap-2">
              {PAYOUT_DESTINATIONS.map((item) => {
                const selected = destination === item.id;
                const free = item.id === "wallet";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDestination(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-[1.1rem] border p-3 text-left",
                      selected ? "border-brand bg-brand-soft" : "border-line",
                    )}
                  >
                    <NetworkMark network={item.id} className="h-9 w-9 rounded-xl text-[9px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{item.label}</span>
                      <span className={cn("text-xs", free ? "font-semibold text-brand" : "text-muted")}>
                        {payoutFeeBadge(item.id)}
                      </span>
                    </span>
                    {free ? (
                      <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Free
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {destination === "wallet" ? (
              <Field label="Pay ID" hint="The person must already have an LBPay wallet.">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">
                    @
                  </span>
                  <Input
                    className="pl-8 font-mono"
                    value={handle}
                    onChange={(e) => setHandle(normalizeHandle(e.target.value))}
                    placeholder="amina"
                  />
                </div>
              </Field>
            ) : (
              <Field label="Number">
                <Input
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
                  placeholder="677000000"
                />
              </Field>
            )}
            <Button type="submit" disabled={!ready}>
              Review payout
            </Button>
          </form>
        </Card>
      </div>
      <Card className="divide-y divide-line self-start">
        {payouts.length === 0 ? (
          <p className="p-6 text-sm text-muted">None</p>
        ) : (
          payouts.map((payout) => (
            <div key={payout.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{payout.counterparty}</p>
                <p className="text-xs text-muted">{formatDate(payout.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatXAF(payout.amount)}</p>
                {payout.fee > 0 ? <p className="text-xs text-muted">Fee {formatXAF(payout.fee)}</p> : null}
                <StatusBadge status={payout.status as "success" | "pending" | "failed"} />
              </div>
            </div>
          ))
        )}
      </Card>
      <ConfirmSheet
        open={open}
        title="Confirm payout"
        subtitle={destination === "wallet" ? `@${payId}` : `${destination === "orange" ? "Orange" : "MTN"} ${clean}`}
        amount={debit}
        details={details}
        loading={busy}
        error={pinError}
        confirmLabel="Enter PIN to pay out"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
