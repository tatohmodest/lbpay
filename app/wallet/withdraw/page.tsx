"use client";

import { useCallback, useMemo, useState } from "react";
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
import { feeLabel, momoOutFee, momoOutRate } from "@/lib/fees";

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
  const rate = momoOutRate(state.user.phone, network);
  const fee = momoOutFee(value, state.user.phone, network);
  const debit = value + fee;
  const ready = value >= 100 && debit <= balance && isCameroonMsisdn(clean);

  const details = useMemo(
    () => [
      { label: "Type", value: "Wallet withdrawal" },
      { label: "Network", value: network === "orange" ? "Orange Money" : "MTN Mobile Money" },
      { label: "Phone", value: clean },
      { label: "They receive", value: formatXAF(value) },
      { label: `Fee ${feeLabel(rate)}`, value: formatXAF(fee) },
      { label: "Debited from wallet", value: formatXAF(debit) },
    ],
    [network, clean, value, rate, fee, debit],
  );

  const confirm = useCallback(
    async (pin: string) => {
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
    },
    [disburse, value, clean, network, debit, notify, router],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Withdraw</h1>
      <p className="mt-1 text-sm text-muted">
        Disburse wallet balance to your Mobile Money number. Same-network fee is 3%. Orange to MTN or
        MTN to Orange is 6%. Available {formatXAF(balance)}.
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
          <Field label="Mobile Money number" hint="9-digit number, no +237">
            <Input
              inputMode="numeric"
              placeholder="677000000"
              value={phone}
              onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
              required
            />
          </Field>
          <Field label="Amount they receive (XAF)">
            <Input
              type="number"
              min={100}
              className="font-mono text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          {value >= 100 ? (
            <p className="text-sm text-muted">
              Fee {feeLabel(rate)} {formatXAF(fee)}. They receive {formatXAF(value)}. Wallet is charged{" "}
              {formatXAF(debit)}.
            </p>
          ) : null}
          {value >= 100 && debit > balance ? (
            <p className="text-sm font-semibold text-danger">Not enough wallet balance for amount plus fee.</p>
          ) : null}
          <Button type="submit" disabled={!ready}>
            Review withdrawal
          </Button>
        </form>
      </Card>
      <ConfirmSheet
        open={open}
        title="Confirm disbursement"
        subtitle="Cash leaves LBPay and lands on Mobile Money. Confirm the number."
        amount={debit}
        details={details}
        warning="This cannot be reversed from LBPay once the rail accepts it."
        loading={disburse.isPending}
        error={pinError}
        confirmLabel="Enter PIN to withdraw"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
