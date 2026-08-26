"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useMe, useSpend } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";

const billers = ["ENEO", "CAMWATER", "Canal+", "Camtel Internet"];

export default function BillsPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const spend = useSpend();
  const [biller, setBiller] = useState(billers[0]);
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const ready = value >= 100 && value <= balance;

  const details = useMemo(
    () => [
      { label: "Type", value: "Bill payment" },
      { label: "Biller", value: biller },
      { label: "Paid from", value: "LBPay wallet" },
    ],
    [biller],
  );

  const confirm = useCallback(
    async (pin: string) => {
      setPinError("");
      try {
        await spend.mutateAsync({ amount: value, pin, kind: "bill", counterparty: biller });
        notify.moneyOut(value, `Paid ${biller}`);
        setOpen(false);
        router.push("/wallet");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Bill payment failed");
        notify.error("Payment failed", err instanceof Error ? err.message : "Could not pay bill");
      }
    },
    [spend, value, biller, notify, router],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Pay bills</h1>
      <p className="mt-1 text-sm text-muted">Paid from your wallet. Available {formatXAF(balance)}.</p>
      <Card className="mt-6 p-6">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            setPinError("");
            setOpen(true);
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {billers.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBiller(item)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                  biller === item ? "border-brand bg-brand-soft" : "border-line"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <Field label="Amount (XAF)">
            <Input
              type="number"
              min={100}
              className="font-mono text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" disabled={!ready}>
            Review {biller} payment
          </Button>
        </form>
      </Card>
      <ConfirmSheet
        open={open}
        title={`Pay ${biller}`}
        subtitle="This debit uses your LBPay wallet balance."
        amount={value}
        details={details}
        loading={spend.isPending}
        error={pinError}
        confirmLabel="Enter PIN to pay"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
