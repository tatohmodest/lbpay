"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { AmountField } from "@/components/amount-field";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { amountIssue } from "@/lib/limits";
import { depositFee } from "@/lib/fees";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import type { PaymentMethod } from "@/lib/types";

type Method = PaymentMethod;

const methods: { id: Method; label: string }[] = [
  { id: "mtn", label: "MTN" },
  { id: "orange", label: "Orange" },
  { id: "card", label: "Card" },
  { id: "wallet", label: "LBPay wallet" },
];

async function pollStatus(tx: string) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`/api/pay/status?tx=${encodeURIComponent(tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success" || data.status === "failed") return data;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  return { status: "pending" as const };
}

export function CheckoutPay({
  handle,
  slug,
  title,
  merchantName,
  merchantHandle,
  fixedAmount,
}: {
  handle?: string;
  slug?: string;
  title: string;
  merchantName: string;
  merchantHandle: string;
  fixedAmount?: number | null;
}) {
  const me = useMe();
  const search = useSearchParams();
  const signedIn = Boolean(me.data?.session);
  const [method, setMethod] = useState<Method>("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(fixedAmount ? String(fixedAmount) : "");
  const [error, setError] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);

  const value = fixedAmount && fixedAmount > 0 ? fixedAmount : Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const fee = method === "wallet" ? 0 : depositFee(value);
  const payAmount = value + fee;
  const amountKind = method === "wallet" ? "wallet" : "deposit";
  const ussdCode = method === "orange" ? "#150#" : "*126#";
  const ready =
    !amountIssue(value, amountKind) &&
    value > 0 &&
    (method === "card" || method === "wallet" || isCameroonMsisdn(clean)) &&
    (method !== "wallet" || signedIn);

  const startedTx = useRef("");

  const markPaid = useCallback(() => {
    setWaiting(null);
    setPaid(true);
    setError("");
  }, []);

  const fail = useCallback((message: string) => {
    setWaiting(null);
    setError(message);
  }, []);

  const watchPayment = useCallback(
    async (tx: string) => {
      const data = await pollStatus(tx);
      if (data.status === "success") {
        markPaid();
        return;
      }
      if (data.status === "failed") {
        fail(
          data.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      setWaiting(null);
      setError("Still waiting. If the popup never came, dial the USSD code, confirm, then try again.");
    },
    [fail, markPaid],
  );

  useEffect(() => {
    const tx = search.get("tx");
    if (!tx || paid || startedTx.current === tx) return;
    startedTx.current = tx;
    setWaiting({ tx, seconds: 120 });
    void watchPayment(tx);
  }, [paid, search, watchPayment]);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => {
      setWaiting((current) =>
        current ? { ...current, seconds: Math.max(0, current.seconds - 1) } : current,
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [waiting]);

  async function payNow(pin?: string) {
    setError("");
    setPinError("");
    setPinLockedUntil(0);
    setBusy(true);
    try {
      const res = await fetch("/api/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          slug,
          amount: value,
          method,
          phone: clean,
          pin,
          returnUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        status?: string;
        hostedUrl?: string;
        transactionId?: string;
        retryAfter?: number;
      };
      if (!res.ok) {
        if (method === "wallet") {
          setPinError(data.error || "Could not pay");
          setPinLockedUntil(Number(data.retryAfter) ? Date.now() + Number(data.retryAfter) * 1000 : 0);
        } else setError(data.error || "Could not pay");
        return;
      }
      if (data.hostedUrl) {
        window.location.assign(data.hostedUrl);
        return;
      }
      if (data.status === "success") {
        setPinOpen(false);
        markPaid();
        return;
      }
      if (data.transactionId) {
        setPinOpen(false);
        setWaiting({ tx: data.transactionId, seconds: 120 });
        void watchPayment(data.transactionId);
      }
    } catch {
      setError("Could not start the payment. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyNow() {
    if (!waiting?.tx) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/pay/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success") {
        markPaid();
        return;
      }
      if (data.status === "failed") {
        fail(
          data.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      setError(`If you have not seen a popup, dial ${ussdCode} and confirm pay.`);
    } finally {
      setChecking(false);
    }
  }

  if (paid) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <Card className="max-w-sm p-8 text-center">
          <p className="text-sm font-bold uppercase text-brand">Paid</p>
          <h1 className="mt-2 text-2xl font-black">{formatXAF(value || payAmount)}</h1>
          <p className="mt-2 text-sm text-muted">{merchantName} has received this payment.</p>
        </Card>
      </main>
    );
  }

  if (waiting) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Waiting for payment</p>
          <h2 className="mt-2 text-2xl font-black">Approve on your phone</h2>
          {method !== "card" ? (
            <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink">
              If you have not seen a popup, dial <span className="font-mono font-semibold">{ussdCode}</span>{" "}
              and confirm pay.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted">Finish the card payment, then this page will update.</p>
          )}
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
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-2xl font-black text-brand">LBPay</p>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute left-0 top-0 h-1 w-full bg-brand" />
          <p className="text-center text-[11px] font-bold uppercase tracking-wide text-muted">{merchantName}</p>
          <h1 className="mt-2 text-center text-xl font-bold">{title}</h1>
          <p className="mt-1 text-center font-mono text-sm text-brand">@{merchantHandle}</p>
          {fixedAmount && fixedAmount > 0 ? (
            <>
              <p className="mt-3 text-center font-mono text-4xl font-black text-brand">
                {formatXAF(fixedAmount, { withCurrency: false })}
                <span className="ml-1 align-super text-sm font-semibold text-muted">XAF</span>
              </p>
              {method !== "wallet" && value > 0 ? (
                <div className="mt-3 space-y-1 rounded-2xl bg-paper px-4 py-3 text-sm">
                  <p>
                    They receive <span className="font-mono font-semibold">{formatXAF(value)}</span>
                  </p>
                  <p className="text-muted">
                    You pay <span className="font-mono font-semibold text-ink">{formatXAF(payAmount)}</span>
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5">
              <AmountField
                value={amount}
                onChange={setAmount}
                kind={amountKind}
                receive={value}
                pay={method === "wallet" ? undefined : payAmount}
              />
            </div>
          )}
          <div className="mt-5 grid gap-2">
            {methods
              .filter((item) => item.id !== "wallet" || signedIn)
              .map((item) => (
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
          {method !== "card" && method !== "wallet" ? (
            <div className="mt-4">
              <Field label="Paying from">
                <Input
                  inputMode="numeric"
                  placeholder="677000000"
                  value={phone}
                  onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
                  required
                />
              </Field>
            </div>
          ) : null}
          {!signedIn ? (
            <p className="mt-4 text-center text-xs text-muted">
              Have an LBPay wallet? <a href="/login" className="font-semibold text-brand">Sign in</a> to pay from it.
            </p>
          ) : null}
          {error ? <p className="mt-4 text-sm font-semibold text-danger">{error}</p> : null}
          <Button
            className="mt-6 w-full"
            disabled={!ready || busy}
            onClick={() => {
              if (method === "wallet") {
                setPinError("");
                setPinLockedUntil(0);
                setPinOpen(true);
                return;
              }
              void payNow();
            }}
          >
            <Lock className="h-4 w-4" />
            {busy ? "Starting…" : value ? `Pay ${formatXAF(payAmount)}` : "Pay"}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by LBPay
          </p>
        </Card>
      </div>
      <ConfirmSheet
        open={pinOpen}
        title="Confirm payment"
        subtitle={`Pay @${merchantHandle}`}
        amount={value}
        details={[
          { label: "To", value: `@${merchantHandle}` },
          { label: "They receive", value: formatXAF(value) },
        ]}
        loading={busy}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel="Enter PIN to pay"
        onClose={() => setPinOpen(false)}
        onConfirm={(pin) => void payNow(pin)}
      />
    </main>
  );
}
