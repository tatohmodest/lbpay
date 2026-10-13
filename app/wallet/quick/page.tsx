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
import { useL } from "@/lib/i18n/use-i18n";
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
  const L = useL();
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
    { label: L("From", "Depuis"), value: `${fromNetwork === "orange" ? "Orange" : "MTN"} ${fromPhone}` },
    { label: L("To", "Vers"), value: `${toNetwork === "orange" ? "Orange" : "MTN"} ${toPhone}` },
    { label: L("They receive", "Ils reçoivent"), value: formatXAF(value) },
    ...(fee ? [{ label: L("Deducted", "Frais"), value: formatXAF(fee) }] : []),
    { label: L("You pay", "Vous payez"), value: formatXAF(payAmount) },
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
      notify.moneyOut(payAmount, L(`Sent ${formatXAF(value)} to ${toPhone}`, `${formatXAF(value)} envoyés à ${toPhone}`));
      router.push("/wallet");
      return;
    }
    if (data.status === "failed") {
      setWaiting(null);
      notify.error(
        L("Transfer failed", "Échec du transfert"),
        data.error ||
          data.message ||
          L("Your transaction could not be completed. No money has been deducted. Please try again.", "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez."),
      );
      return;
    }
    setWaiting(null);
    notify.info(L("Still waiting", "Toujours en attente"), L("If the popup never came, dial the USSD code, confirm, then check history.", "Si la fenêtre n'est jamais apparue, composez le code USSD, confirmez, puis vérifiez l'historique."));
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
        notify.moneyOut(payAmount, L(`Sent ${formatXAF(value)} to ${toPhone}`, `${formatXAF(value)} envoyés à ${toPhone}`));
        router.push("/wallet");
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error(
          L("Transfer failed", "Échec du transfert"),
          data.error ||
            data.message ||
            L("Your transaction could not be completed. No money has been deducted. Please try again.", "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez."),
        );
        return;
      }
      if (data.stage === "paying") {
        setWaiting((current) => (current ? { ...current, stage: "paying" } : current));
      }
      notify.info(
        L("Not confirmed yet", "Pas encore confirmé"),
        waiting.stage === "paying"
          ? L("We are sending the money now. This usually takes less than two minutes.", "Nous envoyons l'argent. Cela prend généralement moins de deux minutes.")
          : L(`If you have not seen a popup, dial ${ussdCode} and confirm pay.`, `Si aucune fenêtre n'est apparue, composez ${ussdCode} et confirmez.`),
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
        notify.moneyOut(payAmount, L(`Sent ${formatXAF(value)} to ${toPhone}`, `${formatXAF(value)} envoyés à ${toPhone}`));
        setOpen(false);
        router.push("/wallet");
        return;
      }
      if (result.status === "failed") {
        setPinError(
          result.message ||
            L("Your transaction could not be completed. No money has been deducted. Please try again.", "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez."),
        );
        return;
      }
      if (result.transactionId) {
        notify.pending(L("Approve on your phone", "Validez sur votre téléphone"), L(`Confirm ${formatXAF(payAmount)}`, `Confirmez ${formatXAF(payAmount)}`));
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
        notify.error(L("Transfer failed", "Échec du transfert"), fail.error);
      }
    }
  }

  return (
    <MoneyPage
      title={L("Quick transfer", "Transfert rapide")}
      copy={L("MoMo to MoMo, across networks. No wallet balance needed.", "De MoMo à MoMo, entre réseaux. Sans solde de portefeuille.")}
      trust="refund"
    >
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
                label={L("From", "Depuis")}
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
                aria-label={L("Swap from and to", "Inverser")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <Endpoint
                label={L("To", "Vers")}
                network={toNetwork}
                onNetwork={setToNetwork}
                phone={to}
                onPhone={setTo}
                placeholder="690000000"
              />
            </div>
            {fromPhone && toPhone && fromPhone === toPhone ? (
              <p className="rounded-2xl bg-[#fdf3f2] px-4 py-3 text-[13px] font-semibold text-danger">
                {L("Use two different numbers.", "Utilisez deux numéros différents.")}
              </p>
            ) : null}
            <AmountField
              value={amount}
              onChange={setAmount}
              kind="momo"
              label={L("How much should they get?", "Combien doivent-ils recevoir ?")}
              receive={value}
              fee={fee}
              receiveLabel={L(`They receive on ${toNetwork === "orange" ? "Orange" : "MTN"}`, `Ils reçoivent sur ${toNetwork === "orange" ? "Orange" : "MTN"}`)}
              feeLabel={feePercentLabel(directTransferRate(fromNetwork, toNetwork), L("Fee", "Frais"))}
              pay={payAmount}
              payLabel={L(`You pay from ${fromNetwork === "orange" ? "Orange" : "MTN"}`, `Vous payez depuis ${fromNetwork === "orange" ? "Orange" : "MTN"}`)}
            />
            <Button type="submit" disabled={!ready} className="h-14 rounded-2xl text-[16px] font-bold">
              {value ? L(`Send ${formatXAF(value)}`, `Envoyer ${formatXAF(value)}`) : L("Send", "Envoyer")}
            </Button>
          </form>
        </MoneyCard>
      )}
      <ConfirmSheet
        open={open}
        title={L("Confirm transfer", "Confirmer le transfert")}
        subtitle={`${fromNetwork === "orange" ? "Orange" : "MTN"} → ${toNetwork === "orange" ? "Orange" : "MTN"}`}
        amount={payAmount}
        details={details}
        warning={L(`If the popup does not appear, dial ${ussdCode} and confirm pay.`, `Si la fenêtre n'apparaît pas, composez ${ussdCode} et confirmez.`)}
        loading={quick.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel={L("Enter PIN to send", "Saisissez votre PIN pour envoyer")}
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
