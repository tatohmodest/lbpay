"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useCollect, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { NetworkMark } from "@/components/network-mark";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { depositFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";
import type { PaymentMethod } from "@/lib/types";

const methods: { id: PaymentMethod; label: string }[] = [
  { id: "mtn", label: "MTN" },
  { id: "orange", label: "Orange" },
  { id: "card", label: "Card" },
];

export default function DepositPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const collect = useCollect();
  const [method, setMethod] = useState<PaymentMethod>("mtn");
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
  const fee = depositFee(value);
  const payAmount = value + fee;
  const ready = !amountIssue(value, "deposit") && value > 0 && (method === "card" || isCameroonMsisdn(clean));
  const ussdCode = method === "orange" ? "#150#" : "*126#";

  const details = [
    { label: "From", value: method === "mtn" ? "MTN" : method === "orange" ? "Orange" : "Card" },
    { label: "Number", value: method === "card" ? "Card" : clean },
    { label: "Wallet receives", value: formatXAF(value) },
    ...(fee ? [{ label: "Charge", value: formatXAF(fee) }] : []),
    { label: "You pay", value: formatXAF(payAmount) },
  ];

  const pollPayment = useCallback(
    async (tx: string) => {
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        setWaiting((current) => (current ? { ...current, seconds: Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) } : current));
        try {
          const res = await fetch(`/api/wallet/collect/status?tx=${encodeURIComponent(tx)}`);
          const data = (await res.json()) as { status?: string; error?: string; message?: string };
          if (data.status === "success") {
            setWaiting(null);
            notify.moneyIn(value, "Wallet deposit received");
            router.push("/wallet");
            return;
          }
          if (data.status === "failed") {
            setWaiting(null);
            notify.error(
              "Deposit failed",
              data.error || data.message || "Your transaction could not be completed. No money has been deducted. Please try again.",
            );
            return;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
      setWaiting(null);
      notify.info("Still waiting", "If the popup never came, dial the USSD code, confirm, then check history.");
    },
    [notify, router, value],
  );

  const verifyNow = useCallback(async () => {
    if (!waiting?.tx) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/wallet/collect/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success") {
        setWaiting(null);
        notify.moneyIn(value, "Wallet deposit received");
        router.push("/wallet");
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error(
          "Deposit failed",
          data.error || data.message || "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      notify.info("Not confirmed yet", `If you have not seen a popup, dial ${ussdCode} and confirm pay.`);
    } finally {
      setChecking(false);
    }
  }, [waiting, notify, router, value, ussdCode]);

  const confirm = async (pin: string) => {
    setPinError("");
    setPinLockedUntil(0);
    try {
      const result = (await collect.mutateAsync({
        amount: value,
        method: method === "orange" ? "orange" : method === "card" ? "card" : "mtn",
        phone: clean,
        pin,
      })) as { hostedUrl?: string; status?: string; transactionId?: string };
      if (result.hostedUrl) {
        notify.pending("Continue on checkout", "Complete the card payment to credit your wallet.");
        window.location.assign(result.hostedUrl);
        return;
      }
      if (result.status === "pending" && result.transactionId) {
        notify.pending("Approve on your phone", `Confirm ${formatXAF(payAmount)} on ${method.toUpperCase()}.`);
        setOpen(false);
        setWaiting({ tx: result.transactionId, seconds: 120 });
        void pollPayment(result.transactionId);
        return;
      }
      notify.moneyIn(value, "Wallet deposit received");
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error("Deposit failed", fail.error);
      }
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Add money</h1>
      <p className="mt-1 text-sm text-muted">Add money from MTN, Orange, or your card.</p>
      {waiting ? (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Waiting for payment</p>
          <h2 className="mt-2 text-2xl font-black">Approve on your phone</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Enter your {method === "orange" ? "Orange Money" : "MTN"} PIN on the popup. This page checks the
            payment automatically.
          </p>
          <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink">
            If you have not seen a popup, dial <span className="font-mono font-semibold">{ussdCode}</span> and
            confirm pay. Then tap I&apos;ve paid.
          </p>
          <p className="mt-6 font-mono text-4xl font-black">{waiting.seconds}s</p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => void verifyNow()} disabled={checking}>
              {checking ? "Checking…" : "I've paid"}
            </Button>
            <Button variant="ghost" onClick={() => setWaiting(null)}>
              Cancel wait
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 p-6">
          <p className="mb-4 text-sm text-muted">Available {formatXAF(balance)}</p>
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
            <div className="grid gap-2">
              {methods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${
                    method === item.id ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <NetworkMark network={item.id} />
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
            {method !== "card" ? (
              <Field label="Number">
                <Input
                  inputMode="numeric"
                  placeholder="677000000"
                  value={phone}
                  onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
                  required
                />
              </Field>
            ) : null}
            <AmountField
              value={amount}
              onChange={setAmount}
              kind="deposit"
              receive={value}
              fee={fee}
              pay={payAmount}
              receiveLabel="Wallet receives"
            />
            <Button type="submit" disabled={!ready}>
              Review deposit
            </Button>
          </form>
        </Card>
      )}
      <ConfirmSheet
        open={open}
        title="Confirm deposit"
        subtitle={method === "card" ? "Card" : `${method === "orange" ? "Orange" : "MTN"} ${clean}`}
        amount={payAmount}
        details={details}
        warning={
          method === "card"
            ? undefined
            : `If the popup does not appear, dial ${ussdCode} and confirm pay.`
        }
        loading={collect.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel="Enter PIN to deposit"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
