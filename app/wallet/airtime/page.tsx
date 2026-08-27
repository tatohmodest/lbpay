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
import { NetworkMark } from "@/components/network-mark";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";

export default function AirtimePage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const spend = useSpend();
  const [phone, setPhone] = useState(cameroonMsisdn(state.user.phone));
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const ready = value >= 100 && value <= balance && isCameroonMsisdn(clean);

  const details = useMemo(
    () => [
      { label: "Type", value: "Airtime" },
      { label: "Network", value: network.toUpperCase() },
      { label: "Phone", value: clean },
      { label: "Fee", value: "Free" },
      { label: "Paid from", value: "LBPay wallet" },
    ],
    [network, clean],
  );

  const confirm = useCallback(
    async (pin: string) => {
      setPinError("");
      try {
        await spend.mutateAsync({
          amount: value,
          pin,
          kind: "airtime",
          counterparty: `${network.toUpperCase()} ${clean}`,
        });
        notify.moneyOut(value, `Airtime sent to ${clean}`);
        setOpen(false);
        router.push("/wallet");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Could not buy airtime");
        notify.error("Airtime failed", err instanceof Error ? err.message : "Could not buy airtime");
      }
    },
    [spend, value, network, clean, notify, router],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Buy airtime & data</h1>
      <p className="mt-1 text-sm text-muted">Top up any MTN or Orange number from your wallet.</p>
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
          <Field label="Phone" hint="9-digit number, no +237">
            <Input
              inputMode="numeric"
              placeholder="677000000"
              value={phone}
              onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
              required
            />
          </Field>
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
          {value >= 100 ? <p className="text-sm text-muted">Fee: Free. Wallet is charged {formatXAF(value)}.</p> : null}
          {value > balance ? <p className="text-sm font-semibold text-danger">Not enough wallet balance.</p> : null}
          <Button type="submit" disabled={!ready}>
            Review airtime
          </Button>
        </form>
      </Card>
      <ConfirmSheet
        open={open}
        title="Confirm airtime"
        subtitle="This debit uses your LBPay wallet balance. There is no extra fee."
        amount={value}
        details={details}
        loading={spend.isPending}
        error={pinError}
        confirmLabel="Enter PIN to buy"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
