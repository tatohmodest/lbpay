"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { celebrate } from "@/components/success-moment";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { MoneyCard, MoneyPage, RailTile } from "@/components/money-move";
import { contactsFromTransactions } from "@/lib/contacts";
import { useApp } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { formatXAF } from "@/lib/format";
import { useDisburse, useHandleLookup, useMe, useTransfer } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { useL } from "@/lib/i18n/use-i18n";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { feePercent, FEE_RATES, feePercentLabel, momoOutFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue, cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";

const RAILS = [
  { id: "wallet" as const, label: "LBPay" },
  { id: "mtn" as const, label: "MTN" },
  { id: "orange" as const, label: "Orange" },
];

const RAIL_TONE = {
  wallet: { box: "border-brand/30 bg-brand-soft" },
  mtn: { box: "border-[#e6b800]/50 bg-[#fff8d6]" },
  orange: { box: "border-[#ff7900]/40 bg-[#fff1e6]" },
} as const;

type Network = "wallet" | "mtn" | "orange";

function SendInner() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const viaParam = params.get("via");
  const notify = useNotify();
  const L = useL();
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
  const recipientRef = useRef<HTMLDivElement>(null);
  const recipientInput = useRef<HTMLInputElement>(null);
  const firstRail = useRef(true);
  const railIndex = RAILS.findIndex((r) => r.id === network);
  const railTone = RAIL_TONE[network];

  // Picking a network takes you straight to its recipient box (never on first load).
  useEffect(() => {
    if (firstRail.current) {
      firstRail.current = false;
      return;
    }
    recipientInput.current?.focus({ preventScroll: true });
    recipientRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [network]);
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
          { label: L("To", "Vers"), value: `@${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}` },
          { label: L("They receive", "Ils reçoivent"), value: formatXAF(value) },
          { label: L("Charge", "Frais"), value: L("No fee", "Sans frais") },
        ]
      : [
          { label: L("Network", "Réseau"), value: network === "orange" ? "Orange" : "MTN" },
          { label: L("Phone", "Téléphone"), value: phone },
          { label: L("They receive", "Ils reçoivent"), value: formatXAF(value) },
          ...(fee ? [{ label: feePercentLabel(FEE_RATES.withdraw), value: formatXAF(fee) }] : []),
          { label: L("You pay", "Vous payez"), value: formatXAF(debit) },
        ];

  async function confirm(pin: string) {
    setPinError("");
    setPinLockedUntil(0);
    try {
      if (network === "wallet") {
        await transfer.mutateAsync({ to, amount: value, pin, note });
        const handle = lookup.data?.user?.lbpayId || to.replace(/^@/, "");
        notify.moneyOut(value, L(`Transferred to @${handle}`, `Transféré à @${handle}`));
        celebrate({
          title: L("Sent!", "Envoyé !"),
          amount: value,
          line: L(`to ${lookup.data?.user?.name || `@${handle}`}`, `à ${lookup.data?.user?.name || `@${handle}`}`),
          details: [
            { label: L("To", "Vers"), value: `@${handle}` },
            { label: L("Fee", "Frais"), value: L("Free", "Gratuit") },
          ],
        });
      } else {
        const result = (await disburse.mutateAsync({ amount: value, phone, network, pin, note })) as {
          status?: string;
        };
        notify.moneyOut(debit, L(`Sent ${formatXAF(value)} to ${phone} on ${network.toUpperCase()}`, `${formatXAF(value)} envoyés à ${phone} sur ${network.toUpperCase()}`));
        const pending = result?.status !== "success";
        celebrate({
          title: pending ? L("On its way", "En route") : L("Sent!", "Envoyé !"),
          amount: value,
          line: L(`to ${phone} on ${network === "orange" ? "Orange Money" : "MTN MoMo"}`, `à ${phone} sur ${network === "orange" ? "Orange Money" : "MTN MoMo"}`),
          details: [
            ...(fee ? [{ label: L("Fee", "Frais"), value: formatXAF(fee) }] : []),
            { label: L("Total from wallet", "Total débité"), value: formatXAF(debit) },
          ],
          pending,
          note: pending
            ? L("We'll let you know when it lands. If the network rejects it, the amount and fee come straight back.", "Nous vous préviendrons à l'arrivée. Si le réseau refuse, le montant et les frais vous reviennent aussitôt.")
            : undefined,
        });
      }
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error(L("Send failed", "Échec de l'envoi"), fail.error);
      }
    }
  }

  return (
    <MoneyPage
      title={L("Send money", "Envoyer de l'argent")}
      copy={L("A friend, a shop, or any Mobile Money number.", "Un ami, une boutique ou tout numéro Mobile Money.")}
    >
      <MoneyCard>
        <p className="mb-4 text-sm font-semibold text-muted">
          {L("Available", "Disponible")} {formatXAF(balance)}
        </p>
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
          <div>
            <p className="mb-2.5 text-[14px] font-bold text-ink">{L("Send to", "Envoyer à")}</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={L("Send to", "Envoyer à")}>
              {RAILS.map((item) => (
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
                    {item.id === "wallet"
                      ? L("No fee", "Sans frais")
                      : L(`Charge ${feePercent(FEE_RATES.withdraw)}%`, `Frais ${feePercent(FEE_RATES.withdraw)} %`)}
                  </span>
                </RailTile>
              ))}
            </div>

            {/* Recipient box: opens right under the chosen network, pointer and all */}
            <div ref={recipientRef} key={network} className="lb-rise relative mt-3 scroll-mt-24">
              <span
                aria-hidden
                className={`absolute -top-2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t ${railTone.box}`}
                style={{ left: `${railIndex * 33.333 + 16.666}%` }}
              />
              <div className={`relative rounded-2xl border p-4 ${railTone.box}`}>
                <label htmlFor="send-to" className="flex items-center gap-2 text-[13px] font-bold text-ink">
                  {network === "wallet" ? (
                    <ArrowLeftRight className="h-4 w-4 text-brand-deep" />
                  ) : (
                    <NetworkMark network={network} className="h-5 w-5 rounded-md text-[6px]" />
                  )}
                  {network === "wallet"
                    ? L("Their @handle or LBPay ID", "Son @identifiant ou ID LBPay")
                    : network === "orange"
                      ? L("Orange number to send to", "Numéro Orange du destinataire")
                      : L("MTN number to send to", "Numéro MTN du destinataire")}
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                  {network === "wallet" ? (
                    <span className="font-mono text-lg font-bold text-muted">@</span>
                  ) : (
                    <span className="font-mono text-[15px] font-semibold text-muted">+237</span>
                  )}
                  <input
                    ref={recipientInput}
                    id="send-to"
                    inputMode={network === "wallet" ? "text" : "numeric"}
                    autoComplete={network === "wallet" ? "off" : "tel"}
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={network === "wallet" ? "handle" : "6XX XX XX XX"}
                    value={network === "wallet" ? to.replace(/^@/, "") : to}
                    onChange={(e) => setTo(network === "wallet" ? e.target.value : cameroonMsisdn(e.target.value))}
                    required
                    className="tabular h-12 min-w-0 flex-1 bg-transparent font-mono text-[18px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted/60"
                  />
                </div>
                {network === "wallet" && lookup.data?.found ? (
                  <p className="mt-2 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-brand-dark ring-1 ring-brand/20">
                    {lookup.data.user?.name} · @{lookup.data.user?.lbpayId}
                  </p>
                ) : network === "wallet" && to.replace(/^@/, "").length >= 2 && lookup.data && !lookup.data.found ? (
                  <p className="mt-2 text-[13px] font-semibold text-danger">
                    {L("No wallet with that ID.", "Aucun portefeuille avec cet identifiant.")}
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-muted">
                    {network === "wallet"
                      ? L("Instant and free to any LBPay wallet.", "Instantané et gratuit vers tout portefeuille LBPay.")
                      : network === "orange"
                        ? L("They receive it on Orange Money.", "Il le reçoit sur Orange Money.")
                        : L("They receive it on MTN Mobile Money.", "Il le reçoit sur MTN Mobile Money.")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <AmountField
            value={amount}
            onChange={setAmount}
            kind={amountKind}
            receive={value}
            fee={network === "wallet" ? 0 : fee}
            feeLabel={feePercentLabel(FEE_RATES.withdraw, L("Fee", "Frais"))}
            pay={network === "wallet" ? undefined : debit}
          />
          <Field label={L("Note (optional)", "Note (facultatif)")}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={L("Optional", "Facultatif")} />
          </Field>
          {overDaily ? (
            <p className="text-sm font-semibold text-danger">
              {L(
                `Daily limit remaining is ${formatXAF(Math.max(0, (cap || 0) - usedToday))}.`,
                `Plafond restant aujourd'hui : ${formatXAF(Math.max(0, (cap || 0) - usedToday))}.`,
              )}
            </p>
          ) : null}
          {value > 0 && debit > balance ? (
            <p className="text-sm font-semibold text-danger">{L("Insufficient wallet balance. Deposit funds or enter a lower amount.", "Solde insuffisant. Rechargez ou saisissez un montant plus bas.")}</p>
          ) : null}
          <Button type="submit" disabled={!ready}>
            {L("Review and confirm", "Vérifier et confirmer")}
          </Button>
        </form>
      </MoneyCard>
      <MoneyCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{L("People", "Personnes")}</p>
        <h2 className="mt-1 text-lg font-black">Contacts</h2>
        {contacts.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">{L("None yet", "Personne pour l'instant")}</p>
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
                    {contact.via === "wallet" ? L("LBPay wallet", "Portefeuille LBPay") : contact.via === "orange" ? "Orange Money" : "MTN MoMo"}
                  </span>
                </span>
                <span className="text-sm font-bold text-brand">{L("Send", "Envoyer")}</span>
              </button>
            ))}
          </div>
        )}
      </MoneyCard>
      <ConfirmSheet
        open={open}
        title={L("Confirm send", "Confirmer l'envoi")}
        subtitle={network === "wallet" ? `@${lookup.data?.user?.lbpayId || to.replace(/^@/, "")}` : phone}
        amount={network === "wallet" ? value : debit}
        details={details}
        loading={transfer.isPending || disburse.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel={L("Enter PIN to send", "Saisissez votre PIN pour envoyer")}
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
