"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftRight, Landmark, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useDisburse, useHandleLookup, useMe, useTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";

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
  const [to, setTo] = useState(params.get("to") || "@");
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
  const phone = to.replace(/\D/g, "").replace(/^237/, "");

  const ready =
    value >= 100 &&
    value <= balance &&
    (network === "wallet" ? Boolean(lookup.data?.found) : /^6\d{8}$/.test(phone));

  const details = useMemo(() => {
    if (network === "wallet") {
      return [
        { label: "Type", value: "LBPay wallet transfer" },
        { label: "To", value: `@${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}` },
        { label: "Name", value: lookup.data?.user?.name || "n/a" },
        { label: "Rail", value: "Internal ledger" },
        { label: "Fee", value: "0 XAF" },
      ];
    }
    return [
      { label: "Type", value: "Disbursement" },
      { label: "Network", value: network === "orange" ? "Orange Money" : "MTN Mobile Money" },
      { label: "Phone", value: phone },
      { label: "Rail", value: "PayUnit" },
      { label: "From", value: "LBPay wallet balance" },
    ];
  }, [network, lookup.data, to, phone]);

  const confirm = useCallback(
    async (pin: string) => {
      setPinError("");
      try {
        if (network === "wallet") {
          await transfer.mutateAsync({ to, amount: value, pin, note });
          notify.moneyOut(value, `Transferred to @${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}`);
        } else {
          await disburse.mutateAsync({ amount: value, phone, network, pin, note });
          notify.moneyOut(value, `Sent to ${phone} on ${network.toUpperCase()}`);
        }
        setOpen(false);
        router.push("/wallet");
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Could not send");
        notify.error("Send failed", err instanceof Error ? err.message : "Could not send");
      }
    },
    [network, transfer, disburse, to, value, note, lookup.data, notify, router, phone],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Send money</h1>
      <p className="mt-1 text-sm text-muted">
        Transfer wallet balance to another LBPay ID, or disburse cash to MTN / Orange.
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
                  { id: "wallet", label: "LBPay", icon: ArrowLeftRight },
                  { id: "mtn", label: "MTN", icon: Smartphone },
                  { id: "orange", label: "Orange", icon: Landmark },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNetwork(item.id)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                    network === item.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line"
                  }`}
                >
                  <item.icon className="mx-auto mb-1 h-4 w-4" />
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
                : "Cash leaves LBPay to this Mobile Money number."
            }
          >
            <Input
              placeholder={network === "wallet" ? "@handle" : "6XXXXXXXX"}
              value={to}
              onChange={(e) => setTo(e.target.value)}
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
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </Field>
          {value > balance ? (
            <p className="text-sm font-semibold text-danger">Not enough wallet balance.</p>
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
                setTo(person.lbpayId ? `@${person.lbpayId}` : person.phone || "");
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
        amount={value}
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
