"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useDisburse, useHandleLookup, useMe, useTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { feeLabel, momoOutFee, momoOutRate } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue, cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";

type Network = "wallet" | "mtn" | "orange";

function SendInner() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const viaParam = params.get("via");
  const notify = useNotify();
  const transfer = useTransfer();
  const disburse = useDisburse();
  const [to, setTo] = useState(() => {
    const initial = params.get("to") || "";
    if (viaParam === "mtn" || viaParam === "orange") return cameroonMsisdn(initial);
    return initial || "@";
  });
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState<Network>(
    viaParam === "mtn" || viaParam === "orange" ? viaParam : "wallet",
  );
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const lookup = useHandleLookup(network === "wallet" ? to : "");

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const phone = network === "wallet" ? "" : cameroonMsisdn(to);
  const rate = network === "wallet" ? 0 : momoOutRate(state.user.phone, network);
  const fee = network === "wallet" ? 0 : momoOutFee(value, state.user.phone, network);
  const debit = value + fee;
  const amountKind = network === "wallet" ? "wallet" : "momo";
  const cap = network === "wallet" ? null : dailyOutboundCap(me.data?.user?.kyc?.personal);
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
    !amountIssue(value, amountKind) &&
    value > 0 &&
    debit <= balance &&
    !overDaily &&
    (network === "wallet" ? Boolean(lookup.data?.found) : isCameroonMsisdn(phone));

  const details =
    network === "wallet"
      ? [
          { label: "Type", value: "LBPay wallet transfer" },
          { label: "To", value: `@${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}` },
          { label: "Name", value: lookup.data?.user?.name || "n/a" },
          { label: "Rail", value: "Internal ledger" },
          { label: "Fee", value: "Free" },
        ]
      : [
          { label: "Type", value: "Disbursement" },
          { label: "Network", value: network === "orange" ? "Orange Money" : "MTN Mobile Money" },
          { label: "Phone", value: phone },
          { label: "They receive", value: formatXAF(value) },
          { label: `Fee ${feeLabel(rate)}`, value: formatXAF(fee) },
          { label: "Debited from wallet", value: formatXAF(debit) },
        ];

  async function confirm(pin: string) {
    setPinError("");
    try {
      if (network === "wallet") {
        await transfer.mutateAsync({ to, amount: value, pin, note });
        notify.moneyOut(value, `Transferred to @${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}`);
      } else {
        await disburse.mutateAsync({ amount: value, phone, network, pin, note });
        notify.moneyOut(debit, `Sent ${formatXAF(value)} to ${phone} on ${network.toUpperCase()}`);
      }
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Could not send");
      notify.error("Send failed", err instanceof Error ? err.message : "Could not send");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Send money</h1>
      <p className="mt-1 text-sm text-muted">
        Wallet to wallet is free. Same-network Mobile Money is 3%. Orange to MTN or MTN to Orange is 6%.
      </p>
      <Card className="mt-6 p-6">
        <p className="mb-4 text-sm text-muted">Available {formatXAF(balance)}</p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            setPinError("");
            setOpen(true);
          }}
        >
          <Field label="How should it move?">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "wallet" as const, label: "LBPay" },
                  { id: "mtn" as const, label: "MTN" },
                  { id: "orange" as const, label: "Orange" },
                ]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setNetwork(item.id);
                    if (item.id !== "wallet") setTo((current) => cameroonMsisdn(current));
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                    network === item.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line"
                  }`}
                >
                  {item.id === "wallet" ? (
                    <ArrowLeftRight className="mx-auto mb-1 h-5 w-5" />
                  ) : (
                    <NetworkMark network={item.id} className="mx-auto mb-1 h-9 w-9 rounded-xl text-[9px]" />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label={network === "wallet" ? "LBPay ID" : "Mobile number"}
            hint={
              network === "wallet"
                ? "Moves wallet balance only. The recipient can withdraw later."
                : "9-digit number, no +237. Cash leaves LBPay to this Mobile Money number."
            }
          >
            <Input
              inputMode={network === "wallet" ? "text" : "numeric"}
              placeholder={network === "wallet" ? "@handle" : "677000000"}
              value={to}
              onChange={(e) => setTo(network === "wallet" ? e.target.value : cameroonMsisdn(e.target.value))}
              required
            />
          </Field>
          {network === "wallet" && lookup.data?.found ? (
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-dark">
              {lookup.data.user?.name} · @{lookup.data.user?.lbpayId}
            </p>
          ) : null}
          {network === "wallet" && to.replace(/^@/, "").length >= 2 && lookup.data && !lookup.data.found ? (
            <p className="text-sm font-semibold text-danger">No wallet with that ID.</p>
          ) : null}
          <AmountField
            value={amount}
            onChange={setAmount}
            kind={amountKind}
            label="Amount (XAF)"
            extra={
              network === "wallet"
                ? undefined
                : cap
                  ? `KYC Level 1 daily limit: ${formatXAF(cap)}. Remaining today ${formatXAF(Math.max(0, cap - usedToday))}.`
                  : "KYC Level 2: no daily sending cap."
            }
          />
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </Field>
          {value > 0 && network !== "wallet" && !amountIssue(value, "momo") ? (
            <p className="text-sm text-muted">
              Fee {feeLabel(rate)} {formatXAF(fee)}. They receive {formatXAF(value)}. Wallet is charged{" "}
              {formatXAF(debit)}.
            </p>
          ) : null}
          {overDaily ? (
            <p className="text-sm font-semibold text-danger">
              Daily limit remaining is {formatXAF(Math.max(0, (cap || 0) - usedToday))}.
            </p>
          ) : null}
          {value > 0 && debit > balance ? (
            <p className="text-sm font-semibold text-danger">Insufficient wallet balance. Deposit funds or enter a lower amount.</p>
          ) : null}
          <Button type="submit" disabled={!ready}>
            Review and confirm
          </Button>
        </form>
      </Card>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Saved people</p>
        <div className="flex flex-wrap gap-2">
          {state.beneficiaries.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => {
                setTo(person.lbpayId ? `@${person.lbpayId}` : cameroonMsisdn(person.phone || ""));
                setNetwork(person.network ?? "wallet");
              }}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
            >
              {person.name}
            </button>
          ))}
        </div>
      </div>
      <ConfirmSheet
        open={open}
        title={network === "wallet" ? "Transfer wallet balance" : "Send to Mobile Money"}
        subtitle={
          network === "wallet"
            ? "This is an LBPay → LBPay ledger move. No Mobile Money rail."
            : "This disbursement sends cash out of your wallet via PayUnit."
        }
        amount={network === "wallet" ? value : debit}
        details={details}
        warning={
          network === "wallet"
            ? "The recipient’s wallet balance increases immediately. They can withdraw it themselves."
            : "Check the number carefully. Mobile Money payouts cannot be reversed from LBPay."
        }
        loading={transfer.isPending || disburse.isPending}
        error={pinError}
        confirmLabel="Enter PIN to send"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense>
      <SendInner />
    </Suspense>
  );
}
