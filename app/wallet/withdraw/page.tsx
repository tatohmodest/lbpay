"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useDisburse, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { NetworkMark } from "@/components/network-mark";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { momoOutFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue, cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";

export default function WithdrawPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const disburse = useDisburse();
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");
  const [phone, setPhone] = useState(cameroonMsisdn(state.user.phone));
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const fee = momoOutFee(value);
  const debit = value + fee;
  const cap = dailyOutboundCap(me.data?.user?.kyc?.personal);
  const usedToday = (me.data?.transactions || [])
    .filter(
      (tx) =>
        outboundKinds(tx.kind) &&
        cameroonDay(tx.createdAt) === cameroonDay() &&
        (tx.status === "success" || tx.status === "pending"),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
  const overDaily = cap != null && value > 0 && usedToday + value > cap;
  const ready =
    !amountIssue(value, "withdraw") &&
    value > 0 &&
    debit <= balance &&
    !overDaily &&
    isCameroonMsisdn(clean);

  const details = [
    { label: "To", value: `${network === "orange" ? "Orange" : "MTN"} ${clean}` },
    { label: "They receive", value: formatXAF(value) },
    { label: "You pay", value: formatXAF(debit) },
  ];

  async function confirm(pin: string) {
    setPinError("");
    try {
      await disburse.mutateAsync({ amount: value, phone: clean, network, pin, note: "Wallet withdrawal" });
      notify.moneyOut(debit, `Withdrawing ${formatXAF(value)} to ${clean} on ${network.toUpperCase()}`);
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Withdrawal failed");
      notify.error("Withdrawal failed", err instanceof Error ? err.message : "Could not disburse");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Withdraw</h1>
      <p className="mt-1 text-sm text-muted">Move your balance onto MTN or Orange when you need cash out.</p>
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
            {(["mtn", "orange"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setNetwork(item)}
                className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${
                  network === item ? "border-brand bg-brand-soft text-brand-dark" : "border-line"
                }`}
              >
                <NetworkMark network={item} className="h-9 w-9 rounded-xl text-[9px]" />
                {item === "mtn" ? "MTN" : "Orange"}
              </button>
            ))}
          </div>
          <Field label="Number">
            <Input
              inputMode="numeric"
              placeholder="677000000"
              value={phone}
              onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
              required
            />
          </Field>
          <AmountField
            value={amount}
            onChange={setAmount}
            kind="withdraw"
            receive={value}
            pay={debit}
            payLabel="Wallet pays"
          />
          {overDaily ? (
            <p className="text-sm font-semibold text-danger">Daily limit remaining is {formatXAF(Math.max(0, (cap || 0) - usedToday))}.</p>
          ) : null}
          {value > 0 && debit > balance ? (
            <p className="text-sm font-semibold text-danger">Insufficient wallet balance. Deposit funds or enter a lower amount.</p>
          ) : null}
          <Button type="submit" disabled={!ready}>
            Review withdrawal
          </Button>
        </form>
      </Card>
      <ConfirmSheet
        open={open}
        title="Confirm withdrawal"
        subtitle={`${network === "orange" ? "Orange" : "MTN"} ${clean}`}
        amount={debit}
        details={details}
        loading={disburse.isPending}
        error={pinError}
        confirmLabel="Enter PIN to withdraw"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
