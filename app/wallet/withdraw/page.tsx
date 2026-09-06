"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { MoneyCard, MoneyPage } from "@/components/money-move";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useDisburse, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { NetworkMark } from "@/components/network-mark";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { FEE_RATES, feePercentLabel, momoOutFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { LIMITS, amountIssue, cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";

async function pollWithdrawStatus(tx: string, onTick: () => void) {
  for (let i = 0; i < 30; i += 1) {
    onTick();
    try {
      const res = await fetch(`/api/wallet/disburse/status?tx=${encodeURIComponent(tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success" || data.status === "failed") return data;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  return { status: "pending" as const };
}

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
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number } | null>(null);
  const [checking, setChecking] = useState(false);

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
    ...(fee ? [{ label: feePercentLabel(FEE_RATES.withdraw), value: formatXAF(fee) }] : []),
    { label: "You pay", value: formatXAF(debit) },
  ];

  const finishSuccess = useCallback(() => {
    setWaiting(null);
    notify.moneyOut(debit, `Withdrew ${formatXAF(value)} to ${clean} on ${network.toUpperCase()}`);
    router.push("/wallet");
  }, [clean, debit, network, notify, router, value]);

  async function pollPayment(tx: string) {
    const data = await pollWithdrawStatus(tx, () => {
      setWaiting((current) => (current ? { ...current, seconds: Math.max(0, current.seconds - 4) } : current));
    });
    if (data.status === "success") {
      finishSuccess();
      return;
    }
    if (data.status === "failed") {
      setWaiting(null);
      notify.error(
        "Withdrawal failed",
        data.error ||
          data.message ||
          "Your transaction could not be completed. No money has been deducted. Please try again.",
      );
      return;
    }
    setWaiting(null);
    notify.info("Still sending", "The withdrawal is still processing. Check history in a minute.");
    router.push("/wallet");
  }

  async function verifyNow() {
    if (!waiting?.tx) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/wallet/disburse/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success") {
        finishSuccess();
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error(
          "Withdrawal failed",
          data.error ||
            data.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      notify.info("Still sending", "The money is on its way. This usually takes less than two minutes.");
    } finally {
      setChecking(false);
    }
  }

  async function confirm(pin: string) {
    setPinError("");
    setPinLockedUntil(0);
    try {
      const result = (await disburse.mutateAsync({
        amount: value,
        phone: clean,
        network,
        pin,
        note: "Wallet withdrawal",
      })) as { status?: string; transactionId?: string; message?: string };
      if (result.status === "failed") {
        setPinError(
          result.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      if (result.status === "pending" && result.transactionId) {
        notify.pending("Sending to Mobile Money", `Paying ${formatXAF(value)} to ${clean}`);
        setOpen(false);
        setWaiting({ tx: result.transactionId, seconds: 120 });
        void pollPayment(result.transactionId);
        return;
      }
      notify.moneyOut(debit, `Withdrew ${formatXAF(value)} to ${clean} on ${network.toUpperCase()}`);
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error("Withdrawal failed", fail.error);
      }
    }
  }

  return (
    <MoneyPage title="Withdraw" copy="Cash out to MTN or Orange whenever you need it.">
      {waiting ? (
        <MoneyCard className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Sending</p>
          <h2 className="mt-2 text-2xl font-black">Paying Mobile Money</h2>
          <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink">
            We are sending {formatXAF(value)} to {network === "orange" ? "Orange" : "MTN"} {clean}. This usually
            takes less than two minutes.
          </p>
          <p className="mt-6 font-mono text-4xl font-black">{waiting.seconds}s</p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => void verifyNow()} disabled={checking}>
              {checking ? "Checking…" : "Check status"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/wallet")}>
              Back to wallet
            </Button>
          </div>
        </MoneyCard>
      ) : (
        <MoneyCard>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ready) return;
              setPinError("");
              setPinLockedUntil(0);
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
              fee={fee}
              feeLabel={feePercentLabel(FEE_RATES.withdraw)}
              pay={debit}
              payLabel="Wallet pays"
            />
            <p className="text-xs text-muted">Minimum withdrawal is {formatXAF(LIMITS.withdrawMin)}.</p>
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
        </MoneyCard>
      )}
      <ConfirmSheet
        open={open}
        title="Confirm withdrawal"
        subtitle={`${network === "orange" ? "Orange" : "MTN"} ${clean}`}
        amount={debit}
        details={details}
        loading={disburse.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel="Enter PIN to withdraw"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </MoneyPage>
  );
}
