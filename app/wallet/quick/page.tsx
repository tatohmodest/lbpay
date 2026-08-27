"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkToggle } from "@/components/network-toggle";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useMe, useQuickTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { directTransferFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";

async function pollQuickStatus(
  tx: string,
  onTick: (stage?: "collecting" | "paying") => void,
) {
  for (let i = 0; i < 30; i += 1) {
    onTick();
    try {
      const res = await fetch(`/api/wallet/quick/status?tx=${encodeURIComponent(tx)}`);
      const data = (await res.json()) as {
        status?: string;
        stage?: "collecting" | "paying" | "done";
        error?: string;
        message?: string;
      };
      if (data.stage === "paying") onTick("paying");
      if (data.status === "success" || data.status === "failed") return data;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  return { status: "pending" as const, stage: "collecting" as const };
}

export default function QuickTransferPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const quick = useQuickTransfer();
  const [fromNetwork, setFromNetwork] = useState<"mtn" | "orange">("mtn");
  const [toNetwork, setToNetwork] = useState<"mtn" | "orange">("orange");
  const [from, setFrom] = useState(cameroonMsisdn(state.user.phone));
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number; stage: "collecting" | "paying" } | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  const value = Number(amount) || 0;
  const fromPhone = cameroonMsisdn(from);
  const toPhone = cameroonMsisdn(to);
  const fee = directTransferFee(value);
  const payAmount = value + fee;
  const ussdCode = fromNetwork === "orange" ? "#150#" : "*126#";
  const ready =
    !amountIssue(value, "momo") &&
    value > 0 &&
    isCameroonMsisdn(fromPhone) &&
    isCameroonMsisdn(toPhone) &&
    fromPhone !== toPhone;

  const details = [
    { label: "From", value: `${fromNetwork === "orange" ? "Orange" : "MTN"} ${fromPhone}` },
    { label: "To", value: `${toNetwork === "orange" ? "Orange" : "MTN"} ${toPhone}` },
    { label: "They receive", value: formatXAF(value) },
    { label: "You pay", value: formatXAF(payAmount) },
  ];

  async function pollPayment(tx: string) {
    const data = await pollQuickStatus(tx, (stage) => {
      setWaiting((current) =>
        current
          ? { ...current, seconds: Math.max(0, current.seconds - 4), stage: stage || current.stage }
          : current,
      );
    });
    if (data.status === "success") {
      setWaiting(null);
      notify.moneyOut(payAmount, `Sent ${formatXAF(value)} to ${toPhone}`);
      router.push("/wallet");
      return;
    }
    if (data.status === "failed") {
      setWaiting(null);
      notify.error(
        "Transfer failed",
        data.error ||
          data.message ||
          "Your transaction could not be completed. No money has been deducted. Please try again.",
      );
      return;
    }
    setWaiting(null);
    notify.info("Still waiting", "If the popup never came, dial the USSD code, confirm, then check history.");
  }

  async function verifyNow() {
    if (!waiting?.tx) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/wallet/quick/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as {
        status?: string;
        stage?: string;
        error?: string;
        message?: string;
      };
      if (data.status === "success") {
        setWaiting(null);
        notify.moneyOut(payAmount, `Sent ${formatXAF(value)} to ${toPhone}`);
        router.push("/wallet");
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error(
          "Transfer failed",
          data.error ||
            data.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      if (data.stage === "paying") {
        setWaiting((current) => (current ? { ...current, stage: "paying" } : current));
      }
      notify.info(
        "Not confirmed yet",
        waiting.stage === "paying"
          ? "We are sending the money now. This usually takes less than two minutes."
          : `If you have not seen a popup, dial ${ussdCode} and confirm pay.`,
      );
    } finally {
      setChecking(false);
    }
  }

  async function confirm(pin: string) {
    setPinError("");
    try {
      const result = (await quick.mutateAsync({
        amount: value,
        from: fromPhone,
        to: toPhone,
        fromNetwork,
        toNetwork,
        pin,
      })) as { status?: string; stage?: string; transactionId?: string; message?: string };
      if (result.status === "success") {
        notify.moneyOut(payAmount, `Sent ${formatXAF(value)} to ${toPhone}`);
        setOpen(false);
        router.push("/wallet");
        return;
      }
      if (result.status === "failed") {
        setPinError(
          result.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      if (result.transactionId) {
        notify.pending("Approve on your phone", `Confirm ${formatXAF(payAmount)}`);
        setOpen(false);
        setWaiting({
          tx: result.transactionId,
          seconds: 120,
          stage: result.stage === "paying" ? "paying" : "collecting",
        });
        void pollPayment(result.transactionId);
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Transfer failed");
      notify.error("Transfer failed", err instanceof Error ? err.message : "Could not send");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Quick Transfer</h1>
      <p className="mt-1 text-sm text-muted">Send money to any Mobile Money network in Cameroon.</p>
      {waiting ? (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">
            {waiting.stage === "paying" ? "Sending" : "Waiting for payment"}
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {waiting.stage === "paying" ? "Paying the recipient" : "Approve on your phone"}
          </h2>
          {waiting.stage === "collecting" ? (
            <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink">
              If you have not seen a popup, dial <span className="font-mono font-semibold">{ussdCode}</span>{" "}
              and confirm pay.
            </p>
          ) : null}
          <p className="mt-6 font-mono text-4xl font-black">{waiting.seconds}s</p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => void verifyNow()} disabled={checking}>
              {checking ? "Checking…" : waiting.stage === "paying" ? "Check status" : "I've paid"}
            </Button>
            <Button variant="ghost" onClick={() => setWaiting(null)}>
              Cancel wait
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 p-6">
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ready) return;
              setPinError("");
              setOpen(true);
            }}
          >
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">From</p>
              <NetworkToggle value={fromNetwork} onChange={setFromNetwork} />
              <Field label="Number">
                <Input
                  inputMode="numeric"
                  placeholder="677000000"
                  value={from}
                  onChange={(e) => setFrom(cameroonMsisdn(e.target.value))}
                  required
                />
              </Field>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">To</p>
              <NetworkToggle value={toNetwork} onChange={setToNetwork} />
              <Field label="Number">
                <Input
                  inputMode="numeric"
                  placeholder="690000000"
                  value={to}
                  onChange={(e) => setTo(cameroonMsisdn(e.target.value))}
                  required
                />
              </Field>
            </div>
            {fromPhone && toPhone && fromPhone === toPhone ? (
              <p className="text-sm font-semibold text-danger">Use two different numbers.</p>
            ) : null}
            <AmountField
              value={amount}
              onChange={setAmount}
              kind="momo"
              receive={value}
              pay={payAmount}
            />
            <Button type="submit" disabled={!ready}>
              Continue
            </Button>
          </form>
        </Card>
      )}
      <ConfirmSheet
        open={open}
        title="Confirm transfer"
        subtitle={`${fromNetwork === "orange" ? "Orange" : "MTN"} to ${toNetwork === "orange" ? "Orange" : "MTN"}`}
        amount={payAmount}
        details={details}
        warning={`If the popup does not appear, dial ${ussdCode} and confirm pay.`}
        loading={quick.isPending}
        error={pinError}
        confirmLabel="Enter PIN to send"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
      <p className="mt-4 text-xs text-muted">@{me.data?.user?.lbpayId || state.user.lbpayId}</p>
    </div>
  );
}
