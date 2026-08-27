"use client";

import { useCallback, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { formatDate, formatXAF } from "@/lib/format";
import { useDisburse, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { NetworkMark } from "@/components/network-mark";

export default function PayoutsPage() {
  const me = useMe();
  const notify = useNotify();
  const disburse = useDisburse();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  const value = Number(amount) || 0;
  const clean = phone.replace(/\s+/g, "").replace(/^237/, "");
  const ready = value >= 100 && /^6\d{8}$/.test(clean);
  const payouts = (me.data?.transactions || []).filter(
    (tx) => tx.kind === "withdraw" || tx.kind === "payout",
  );

  const details = useMemo(
    () => [
      { label: "Type", value: "API disbursement" },
      { label: "Network", value: network.toUpperCase() },
      { label: "Phone", value: clean },
      { label: "Rail", value: "PayUnit" },
    ],
    [network, clean],
  );

  const confirm = useCallback(
    async (pin: string) => {
      setPinError("");
      try {
        await disburse.mutateAsync({ amount: value, phone: clean, network, pin, note: "Developer payout" });
        notify.moneyOut(value, `Payout queued to ${clean}`);
        setOpen(false);
        setAmount("");
        setPhone("");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Payout failed");
        notify.error("Payout failed", err instanceof Error ? err.message : "Could not disburse");
      }
    },
    [disburse, value, clean, network, notify],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-black">Payouts</h1>
        <p className="text-sm text-muted">Disburse wallet funds to MTN or Orange. Confirm with your PIN.</p>
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
            <Field label="Amount (XAF)">
              <Input type="number" className="font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XXXXXXXX" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              {(["mtn", "orange"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNetwork(item)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${
                    network === item ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <NetworkMark network={item} className="h-9 w-9 rounded-xl text-[9px]" />
                  {item === "mtn" ? "MTN" : "Orange"}
                </button>
              ))}
            </div>
            <Button type="submit" disabled={!ready}>
              Review payout
            </Button>
          </form>
        </Card>
      </div>
      <Card className="divide-y divide-line self-start">
        {payouts.length === 0 ? (
          <p className="p-6 text-sm text-muted">No payouts yet.</p>
        ) : (
          payouts.map((payout) => (
            <div key={payout.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{payout.counterparty}</p>
                <p className="text-xs text-muted">{formatDate(payout.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatXAF(payout.amount)}</p>
                <StatusBadge status={payout.status as "success" | "pending" | "failed"} />
              </div>
            </div>
          ))
        )}
      </Card>
      <ConfirmSheet
        open={open}
        title="Confirm disbursement"
        subtitle="This sends cash out of the LBPay wallet through PayUnit."
        amount={value}
        details={details}
        loading={disburse.isPending}
        error={pinError}
        confirmLabel="Enter PIN to pay out"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
