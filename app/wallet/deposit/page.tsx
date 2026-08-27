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
import { NetworkMark } from "@/components/network-mark";
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
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number } | null>(null);
  const [checking, setChecking] = useState(false);

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

  const pollPayment = useCallback(
    async (tx: string) => {
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        setWaiting((current) => (current ? { ...current, seconds: Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) } : current));
        try {
          const res = await fetch(`/api/wallet/collect/status?tx=${encodeURIComponent(tx)}`);
          const data = (await res.json()) as { status?: string; error?: string };
          if (data.status === "success") {
            setWaiting(null);
            notify.moneyIn(value, "Wallet deposit received");
            router.push("/wallet");
            return;
          }
          if (data.status === "failed") {
            setWaiting(null);
            notify.error("Deposit failed", data.error || "The Mobile Money collection was not approved.");
            return;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
      setWaiting(null);
      notify.info("Still waiting", "Enter your PIN on the phone, then tap verify, or check history in a moment.");
    },
    [notify, router, value],
  );

  const verifyNow = useCallback(async () => {
    if (!waiting?.tx) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/wallet/collect/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string };
      if (data.status === "success") {
        setWaiting(null);
        notify.moneyIn(value, "Wallet deposit received");
        router.push("/wallet");
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error("Deposit failed", data.error || "The collection was not approved.");
        return;
      }
      notify.info("Not confirmed yet", "Approve the USSD prompt on your phone, then tap verify again.");
    } finally {
      setChecking(false);
    }
  }, [waiting, notify, router, value]);

  const confirm = useCallback(
    async (pin: string) => {
      setPinError("");
      try {
        const result = (await collect.mutateAsync({
          amount: value,
          method: method === "orange" ? "orange" : method === "card" ? "card" : "mtn",
          phone: clean,
          pin,
        })) as { hostedUrl?: string; status?: string; transactionId?: string };
        if (result.hostedUrl) {
          notify.pending("Continue on checkout", "Complete the card payment to credit your wallet.");
          window.location.href = result.hostedUrl;
          return;
        }
        if (result.status === "pending" && result.transactionId) {
          notify.pending("Approve on your phone", `Confirm ${formatXAF(value)} on ${method.toUpperCase()}.`);
          setOpen(false);
          setWaiting({ tx: result.transactionId, seconds: 120 });
          void pollPayment(result.transactionId);
          return;
        }
        notify.moneyIn(value, "Wallet deposit received");
        setOpen(false);
        router.push("/wallet");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Deposit failed");
        notify.error("Deposit failed", err instanceof Error ? err.message : "Could not collect");
      }
    },
    [collect, value, method, clean, notify, router, pollPayment],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Add money</h1>
      <p className="mt-1 text-sm text-muted">
        Fund your LBPay wallet. Current balance {formatXAF(balance)}.
      </p>
      {waiting ? (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">USSD sent</p>
          <h2 className="mt-2 text-2xl font-black">Approve on your phone</h2>
          <p className="mt-2 text-sm text-muted">
            Enter your {method === "orange" ? "Orange Money" : "MTN"} PIN. This page checks the payment automatically.
          </p>
          <p className="mt-6 font-mono text-4xl font-black">{waiting.seconds}s</p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => void verifyNow()} disabled={checking}>
              {checking ? "Checking…" : "I entered my PIN, verify"}
            </Button>
            <Button variant="ghost" onClick={() => setWaiting(null)}>
              Cancel wait
            </Button>
          </div>
        </Card>
      ) : (
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
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${
                    method === item.id ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <NetworkMark network={item.id} />
                  <span>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-muted">{item.hint}</p>
                  </span>
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
      )}
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
