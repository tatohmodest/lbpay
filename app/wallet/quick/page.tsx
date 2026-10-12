"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { MoneyCard, MoneyPage } from "@/components/money-move";
import { NetworkMark } from "@/components/network-mark";
import { WaitingOnPhone } from "@/components/money-ui";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useQuickTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { directTransferFee, directTransferRate, feePercentLabel } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";

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
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number; stage: "collecting" | "paying" } | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  const value = Number(amount) || 0;
  const fromPhone = cameroonMsisdn(from);
  const toPhone = cameroonMsisdn(to);
  const fee = directTransferFee(value, fromNetwork, toNetwork);
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
    ...(fee ? [{ label: "Deducted", value: formatXAF(fee) }] : []),
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
    setPinLockedUntil(0);
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
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error("Transfer failed", fail.error);
      }
    }
  }

  return (
    <MoneyPage title="Quick transfer" copy="MoMo to MoMo, across networks. No wallet balance needed." trust="refund">
      {waiting ? (
        <WaitingOnPhone
          network={waiting.stage === "paying" ? toNetwork : fromNetwork}
          stage={waiting.stage === "paying" ? "sending" : "approve"}
          amountLabel={waiting.stage === "paying" ? `${formatXAF(value)} to ${toPhone}` : formatXAF(payAmount)}
          seconds={waiting.seconds}
          ussd={ussdCode}
          checking={checking}
          onCheck={() => void verifyNow()}
          onCancel={() => setWaiting(null)}
        />
      ) : (
        <MoneyCard>
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ready) return;
              setPinError("");
              setPinLockedUntil(0);
              setOpen(true);
            }}
          >
            <div className="relative space-y-2">
              <Endpoint
                label="From"
                network={fromNetwork}
                onNetwork={setFromNetwork}
                phone={from}
                onPhone={setFrom}
                placeholder="677000000"
              />
              <button
                type="button"
                onClick={() => {
                  setFromNetwork(toNetwork);
                  setToNetwork(fromNetwork);
                  setFrom(to);
                  setTo(from);
                }}
                className="absolute left-1/2 top-1/2 z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-white shadow-lg ring-4 ring-white transition hover:rotate-180"
                aria-label="Swap from and to"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <Endpoint
                label="To"
                network={toNetwork}
                onNetwork={setToNetwork}
                phone={to}
                onPhone={setTo}
                placeholder="690000000"
              />
            </div>
            {fromPhone && toPhone && fromPhone === toPhone ? (
              <p className="rounded-2xl bg-[#fdf3f2] px-4 py-3 text-[13px] font-semibold text-danger">
                Use two different numbers.
              </p>
            ) : null}
            <AmountField
              value={amount}
              onChange={setAmount}
              kind="momo"
              label="How much should they get?"
              receive={value}
              fee={fee}
              receiveLabel={`They receive on ${toNetwork === "orange" ? "Orange" : "MTN"}`}
              feeLabel={feePercentLabel(directTransferRate(fromNetwork, toNetwork), "Fee")}
              pay={payAmount}
              payLabel={`You pay from ${fromNetwork === "orange" ? "Orange" : "MTN"}`}
            />
            <Button type="submit" disabled={!ready} className="h-14 rounded-2xl text-[16px] font-bold">
              {value ? `Send ${formatXAF(value)}` : "Send"}
            </Button>
          </form>
        </MoneyCard>
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
        lockedUntil={pinLockedUntil}
        confirmLabel="Enter PIN to send"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </MoneyPage>
  );
}

function Endpoint({
  label,
  network,
  onNetwork,
  phone,
  onPhone,
  placeholder,
}: {
  label: string;
  network: "mtn" | "orange";
  onNetwork: (n: "mtn" | "orange") => void;
  phone: string;
  onPhone: (p: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold text-muted">{label}</p>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line" role="radiogroup" aria-label={`${label} network`}>
          {(["mtn", "orange"] as const).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={network === n}
              onClick={() => onNetwork(n)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-bold transition",
                network === n ? "bg-ink text-white" : "text-muted hover:text-ink",
              )}
            >
              <NetworkMark network={n} className="h-5 w-5 rounded-md text-[6px]" />
              {n === "mtn" ? "MTN" : "Orange"}
            </button>
          ))}
        </div>
      </div>
      <input
        inputMode="numeric"
        autoComplete="tel"
        aria-label={`${label} number`}
        placeholder={placeholder}
        value={phone}
        onChange={(e) => onPhone(cameroonMsisdn(e.target.value))}
        required
        className="tabular mt-3 h-11 w-full bg-transparent font-mono text-[22px] font-bold tracking-wide text-ink outline-none placeholder:text-line"
      />
    </div>
  );
}
