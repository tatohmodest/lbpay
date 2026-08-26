"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useCollect, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import type { PaymentMethod } from "@/lib/types";

const methods: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "mtn", label: "MTN Mobile Money", hint: "MTN → LBPay wallet" },
  { id: "orange", label: "Orange Money", hint: "Orange → LBPay wallet" },
  { id: "card", label: "Visa / Mastercard", hint: "Card → LBPay wallet" },
];

export default function DepositPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const collect = useCollect();
  const [method, setMethod] = useState<PaymentMethod>("mtn");
  const [phone, setPhone] = useState(state.user.phone);
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const clean = phone.replace(/\s+/g, "").replace(/^237/, "");
  const ready = value >= 100 && (method === "card" || /^6\d{8}$/.test(clean));

  const details = useMemo(
    () => [
      { label: "Type", value: "Wallet deposit" },
      {
        label: "From",
        value: method === "mtn" ? "MTN Mobile Money" : method === "orange" ? "Orange Money" : "Card",
      },
      { label: "Number", value: method === "card" ? "Hosted checkout" : clean },
      { label: "Rail", value: "PayUnit collection" },
      { label: "To", value: `@${state.user.lbpayId}` },
    ],
    [method, clean, state.user.lbpayId],
  );

  const confirm = useCallback(
    async (pin: string) => {
      setPinError("");
      try {
        const result = (await collect.mutateAsync({
          amount: value,
          method: method === "orange" ? "orange" : method === "card" ? "card" : "mtn",
          phone: clean,
          pin,
        })) as { hostedUrl?: string; status?: string };
        if (result.hostedUrl) {
          notify.pending("Continue on checkout", "Complete the card payment to credit your wallet.");
          window.location.href = result.hostedUrl;
          return;
        }
        if (result.status === "pending") {
          notify.pending("Approve on your phone", `Confirm ${formatXAF(value)} on ${method.toUpperCase()}.`);
        } else {
          notify.moneyIn(value, "Wallet deposit received");
        }
        setOpen(false);
        router.push("/wallet");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Deposit failed");
        notify.error("Deposit failed", err instanceof Error ? err.message : "Could not collect");
      }
    },
    [collect, value, method, clean, notify, router],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Add money</h1>
      <p className="mt-1 text-sm text-muted">
        Fund your LBPay wallet. Current balance {formatXAF(balance)}.
      </p>
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
          <div className="grid gap-2">
            {methods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id)}
                className={`rounded-xl border p-3 text-left ${
                  method === item.id ? "border-brand bg-brand-soft" : "border-line"
                }`}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted">{item.hint}</p>
              </button>
            ))}
          </div>
          {method !== "card" ? (
            <Field label="Paying from">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </Field>
          ) : null}
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
            Review deposit
          </Button>
        </form>
      </Card>
      <ConfirmSheet
        open={open}
        title="Confirm deposit"
        subtitle="You are funding your LBPay wallet from an external rail."
        amount={value}
        details={details}
        warning={
          method === "card"
            ? "You will finish payment on the hosted checkout page."
            : "Approve the collection prompt on your phone to credit the wallet."
        }
        loading={collect.isPending}
        error={pinError}
        confirmLabel="Enter PIN to deposit"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
