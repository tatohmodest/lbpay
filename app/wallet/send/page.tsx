"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { MoneyCard, MoneyPage, RailTile } from "@/components/money-move";
import { contactsFromTransactions } from "@/lib/contacts";
import { useApp } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { formatXAF } from "@/lib/format";
import { useDisburse, useHandleLookup, useMe, useTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { FEE_RATES, feePercentLabel, momoOutFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue, cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";

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
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const lookup = useHandleLookup(network === "wallet" ? to : "");

  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const contacts = contactsFromTransactions(transactions);
  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const phone = network === "wallet" ? "" : cameroonMsisdn(to);
  const fee = network === "wallet" ? 0 : momoOutFee(value);
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
          { label: "To", value: `@${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}` },
          { label: "They receive", value: formatXAF(value) },
          { label: "Charge", value: "No fee" },
        ]
      : [
          { label: "Network", value: network === "orange" ? "Orange" : "MTN" },
          { label: "Phone", value: phone },
          { label: "They receive", value: formatXAF(value) },
          ...(fee ? [{ label: feePercentLabel(FEE_RATES.withdraw), value: formatXAF(fee) }] : []),
          { label: "You pay", value: formatXAF(debit) },
        ];

  async function confirm(pin: string) {
    setPinError("");
    setPinLockedUntil(0);
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
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error("Send failed", fail.error);
      }
    }
  }

  return (
    <MoneyPage title="Send money" copy="A friend, a shop, or any Mobile Money number.">
      <MoneyCard>
        <p className="mb-4 text-sm font-semibold text-muted">Available {formatXAF(balance)}</p>
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
          <Field label="Send to">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "wallet" as const, label: "LBPay", hint: "No fee" },
                  { id: "mtn" as const, label: "MTN", hint: "Charge 3%" },
                  { id: "orange" as const, label: "Orange", hint: "Charge 3%" },
                ]
              ).map((item) => (
                <RailTile
                  key={item.id}
                  selected={network === item.id}
                  onClick={() => {
                    setNetwork(item.id);
                    if (item.id !== "wallet") setTo((current) => cameroonMsisdn(current));
                  }}
                >
                  {item.id === "wallet" ? (
                    <ArrowLeftRight className="h-5 w-5" />
                  ) : (
                    <NetworkMark network={item.id} className="h-9 w-9 rounded-xl text-[9px]" />
                  )}
                  <span className="text-sm font-bold">{item.label}</span>
                  <span className={`text-[10px] ${item.id === "wallet" ? "font-semibold text-brand" : "font-medium text-muted"}`}>
                    {item.hint}
                  </span>
                </RailTile>
              ))}
            </div>
          </Field>
          <Field label={network === "wallet" ? "LBPay ID" : "Number"}>
            <Input
              inputMode={network === "wallet" ? "text" : "numeric"}
              placeholder={network === "wallet" ? "@handle" : "677000000"}
              value={to}
              onChange={(e) => setTo(network === "wallet" ? e.target.value : cameroonMsisdn(e.target.value))}
              required
            />
          </Field>
          {network === "wallet" && lookup.data?.found ? (
            <p className="rounded-2xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-dark">
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
            receive={value}
            fee={network === "wallet" ? 0 : fee}
            feeLabel={feePercentLabel(FEE_RATES.withdraw)}
            pay={network === "wallet" ? undefined : debit}
          />
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </Field>
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
      </MoneyCard>
      <MoneyCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">People</p>
        <h2 className="mt-1 text-lg font-black">Contacts</h2>
        {contacts.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">None</p>
        ) : (
          <div className="mt-3 divide-y divide-line/70">
            {contacts.map((contact) => (
              <button
                key={contact.key}
                type="button"
                onClick={() => {
                  setTo(contact.to);
                  setNetwork(contact.via);
                }}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-xs font-black text-brand">
                  {contact.label.trim().slice(0, 1).toUpperCase() || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{contact.label}</span>
                  <span className="block text-xs text-muted">
                    {contact.via === "wallet" ? "LBPay wallet" : contact.via === "orange" ? "Orange Money" : "MTN MoMo"}
                  </span>
                </span>
                <span className="text-sm font-bold text-brand">Send</span>
              </button>
            ))}
          </div>
        )}
      </MoneyCard>
      <ConfirmSheet
        open={open}
        title="Confirm send"
        subtitle={network === "wallet" ? `@${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}` : phone}
        amount={network === "wallet" ? value : debit}
        details={details}
        loading={transfer.isPending || disburse.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel="Enter PIN to send"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </MoneyPage>
  );
}

export default function SendPage() {
  return (
    <Suspense>
      <SendInner />
    </Suspense>
  );
}
