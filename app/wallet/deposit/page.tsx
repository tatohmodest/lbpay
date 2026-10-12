"use client";

import { celebrate } from "@/components/success-moment";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { MoneyCard, MoneyPage } from "@/components/money-move";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useCollect, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { BalancePill, MethodPicker, WaitingOnPhone } from "@/components/money-ui";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { FEE_RATES, depositFee, feePercent, feePercentLabel } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";
import type { PaymentMethod } from "@/lib/types";

const feeHint = `${feePercent(FEE_RATES.deposit)}% fee`;

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
  const verifyLock = useRef(false);

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const fee = depositFee(value);
  const payAmount = value + fee;
  const ready = !amountIssue(value, "deposit") && value > 0 && isCameroonMsisdn(clean);
  const ussdCode = method === "orange" ? "#150#" : "*126#";

  const details = [
    { label: "From", value: method === "mtn" ? "MTN" : "Orange" },
    { label: "Number", value: clean },
    { label: "Wallet receives", value: formatXAF(value) },
    ...(fee ? [{ label: feePercentLabel(FEE_RATES.deposit, "Fee"), value: formatXAF(fee) }] : []),
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
            celebrate({ title: "Money added!", amount: value, line: "Your wallet is topped up and ready to use." });
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
    if (!waiting?.tx || verifyLock.current) return;
    verifyLock.current = true;
    setChecking(true);
    try {
      const res = await fetch(`/api/wallet/collect/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success") {
        setWaiting(null);
        notify.moneyIn(value, "Wallet deposit received");
        celebrate({ title: "Money added!", amount: value, line: "Your wallet is topped up and ready to use." });
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
      verifyLock.current = false;
    } catch {
      verifyLock.current = false;
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
        method: method === "orange" ? "orange" : "mtn",
        phone: clean,
        pin,
      })) as { hostedUrl?: string; status?: string; transactionId?: string };
      if (result.hostedUrl) {
        notify.pending("Continue on checkout", "Complete the payment to credit your wallet.");
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
      celebrate({ title: "Money added!", amount: value, line: "Your wallet is topped up and ready to use." });
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
    <MoneyPage title="Add money" copy="Top up from MTN MoMo or Orange Money.">
      {waiting ? (
        <WaitingOnPhone
          network={method === "orange" ? "orange" : "mtn"}
          amountLabel={formatXAF(payAmount)}
          seconds={waiting.seconds}
          ussd={ussdCode}
          checking={checking}
          onCheck={() => void verifyNow()}
          onCancel={() => setWaiting(null)}
        />
      ) : (
        <MoneyCard>
          <BalancePill amount={formatXAF(balance)} label="In your wallet" />
          <form
            className="mt-5 flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ready) return;
              setPinError("");
              setPinLockedUntil(0);
              setOpen(true);
            }}
          >
            <MethodPicker
              label="Add from"
              value={method}
              onChange={setMethod}
              options={[
                { id: "mtn" as PaymentMethod, network: "mtn", title: "MTN MoMo", hint: feeHint },
                { id: "orange" as PaymentMethod, network: "orange", title: "Orange Money", hint: feeHint },
              ]}
            />
            <Field label={`Your ${method === "orange" ? "Orange" : "MTN"} number`}>
              <Input
                inputMode="numeric"
                autoComplete="tel"
                placeholder="677000000"
                value={phone}
                onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
                className="tabular h-12 text-[16px] font-semibold"
                required
              />
            </Field>
            <AmountField
              value={amount}
              onChange={setAmount}
              kind="deposit"
              label="How much?"
              receive={value}
              fee={fee}
              pay={payAmount}
              receiveLabel="Added to your wallet"
              feeLabel={feePercentLabel(FEE_RATES.deposit, "Fee")}
              payLabel={`You pay from ${method === "orange" ? "Orange" : "MTN"}`}
            />
            <Button type="submit" disabled={!ready} className="h-14 rounded-2xl text-[16px] font-bold">
              {value ? `Add ${formatXAF(value)}` : "Add money"}
            </Button>
          </form>
        </MoneyCard>
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
    </MoneyPage>
  );
}
