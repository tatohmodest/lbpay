"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useMe, useQuickTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { cameroonMsisdn, detectMobileNetwork, isCameroonMsisdn } from "@/lib/phone";
import { directTransferFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";

function momoNetwork(phone: string) {
  const network = detectMobileNetwork(phone);
  return network === "mtn" || network === "orange" ? network : null;
}

function networkLabel(network: "mtn" | "orange" | null) {
  if (network === "orange") return "Orange Money";
  if (network === "mtn") return "MTN Mobile Money";
  return "MTN or Orange";
}

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
  const fromNetwork = momoNetwork(fromPhone);
  const toNetwork = momoNetwork(toPhone);
  const fee = directTransferFee(value);
  const payAmount = value + fee;
  const ussdCode = fromNetwork === "orange" ? "#150#" : "*126#";
  const ready =
    !amountIssue(value, "momo") &&
    value > 0 &&
    isCameroonMsisdn(fromPhone) &&
    Boolean(fromNetwork) &&
    isCameroonMsisdn(toPhone) &&
    Boolean(toNetwork) &&
    fromPhone !== toPhone;

  const details = [
    { label: "Type", value: "Quick transfer" },
    { label: "Paying from", value: `${networkLabel(fromNetwork)} ${fromPhone}` },
    { label: "Sending to", value: `${networkLabel(toNetwork)} ${toPhone}` },
    { label: "They receive", value: formatXAF(value) },
    { label: "Fee 6%", value: formatXAF(fee) },
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
        notify.pending("Approve on your phone", `Confirm ${formatXAF(payAmount)} on ${networkLabel(fromNetwork)}.`);
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
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
        <Zap className="h-3.5 w-3.5" /> Direct transfer
      </p>
      <h1 className="mt-3 text-2xl font-black">Quick Transfer</h1>
      <p className="mt-1 text-sm text-muted">
        Send from an MTN or Orange number straight to another MTN or Orange number. Direct transfers are
        6%. Minimum {formatXAF(1000)}.
      </p>
      {waiting ? (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">
            {waiting.stage === "paying" ? "Sending" : "Waiting for payment"}
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {waiting.stage === "paying" ? "Paying the recipient" : "Approve on your phone"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {waiting.stage === "paying"
              ? `Sending ${formatXAF(value)} to ${toPhone}. This usually takes less than two minutes.`
              : `Enter your ${networkLabel(fromNetwork)} PIN on the popup. This page checks the payment automatically.`}
          </p>
          {waiting.stage === "collecting" ? (
            <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink">
              If you have not seen a popup, dial <span className="font-mono font-semibold">{ussdCode}</span>{" "}
              and confirm pay. Then tap I&apos;ve paid.
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
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ready) return;
              setPinError("");
              setOpen(true);
            }}
          >
            <Field label="Paying from" hint="Your MTN or Orange number. 9 digits, no +237.">
              <div className="flex items-center gap-2">
                {fromNetwork ? <NetworkMark network={fromNetwork} className="h-11 w-11 rounded-xl text-[9px]" /> : null}
                <Input
                  inputMode="numeric"
                  placeholder="677000000"
                  value={from}
                  onChange={(e) => setFrom(cameroonMsisdn(e.target.value))}
                  required
                />
              </div>
            </Field>
            {from && !fromNetwork ? (
              <p className="text-sm font-semibold text-danger">Use an MTN or Orange number.</p>
            ) : null}
            <Field label="Sending to" hint="The MTN or Orange number receiving the money.">
              <div className="flex items-center gap-2">
                {toNetwork ? <NetworkMark network={toNetwork} className="h-11 w-11 rounded-xl text-[9px]" /> : null}
                <Input
                  inputMode="numeric"
                  placeholder="690000000"
                  value={to}
                  onChange={(e) => setTo(cameroonMsisdn(e.target.value))}
                  required
                />
              </div>
            </Field>
            {to && !toNetwork ? (
              <p className="text-sm font-semibold text-danger">Use an MTN or Orange number.</p>
            ) : null}
            {fromPhone && toPhone && fromPhone === toPhone ? (
              <p className="text-sm font-semibold text-danger">Use two different numbers.</p>
            ) : null}
            <AmountField
              value={amount}
              onChange={setAmount}
              kind="momo"
              label="Amount they receive (XAF)"
              extra="Direct transfer fee is 6%."
            />
            {value > 0 && !amountIssue(value, "momo") ? (
              <p className="text-sm text-muted">
                Fee 6% {formatXAF(fee)}. You pay {formatXAF(payAmount)} from {fromPhone || "your number"}. They
                receive {formatXAF(value)} on {toPhone || "the destination number"}.
              </p>
            ) : null}
            <Button type="submit" disabled={!ready}>
              Review transfer
            </Button>
          </form>
        </Card>
      )}
      <ConfirmSheet
        open={open}
        title="Confirm quick transfer"
        subtitle="This is a direct Mobile Money transfer. Fee is 6%."
        amount={payAmount}
        details={details}
        warning={`Approve the collection prompt on ${fromPhone}. If it does not appear, dial ${ussdCode} and confirm pay.`}
        loading={quick.isPending}
        error={pinError}
        confirmLabel="Enter PIN to send"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
      <p className="mt-4 text-xs text-muted">
        Signed in as @{me.data?.user?.lbpayId || state.user.lbpayId}. This does not use your wallet balance.
      </p>
    </div>
  );
}
