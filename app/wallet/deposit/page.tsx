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
import { useL } from "@/lib/i18n/use-i18n";
import { BalancePill, MethodPicker, WaitingOnPhone } from "@/components/money-ui";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { FEE_RATES, depositFee, feePercent, feePercentLabel } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";
import type { PaymentMethod } from "@/lib/types";


export default function DepositPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const L = useL();
  const feeHint = L(`${feePercent(FEE_RATES.deposit)}% fee`, `${feePercent(FEE_RATES.deposit)} % de frais`);
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
    { label: L("From", "Depuis"), value: method === "mtn" ? "MTN" : "Orange" },
    { label: L("Number", "Numéro"), value: clean },
    { label: L("Wallet receives", "Le portefeuille reçoit"), value: formatXAF(value) },
    ...(fee ? [{ label: feePercentLabel(FEE_RATES.deposit, L("Fee", "Frais")), value: formatXAF(fee) }] : []),
    { label: L("You pay", "Vous payez"), value: formatXAF(payAmount) },
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
            notify.moneyIn(value, L("Wallet deposit received", "Recharge reçue"));
            celebrate({
              title: L("Money added!", "Argent ajouté !"),
              amount: value,
              line: L("Your wallet is topped up and ready to use.", "Votre portefeuille est rechargé et prêt."),
            });
            router.push("/wallet");
            return;
          }
          if (data.status === "failed") {
            setWaiting(null);
            notify.error(
              L("Deposit failed", "Échec de la recharge"),
              data.error ||
                data.message ||
                L(
                  "Your transaction could not be completed. No money has been deducted. Please try again.",
                  "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez.",
                ),
            );
            return;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
      setWaiting(null);
      notify.info(
        L("Still waiting", "Toujours en attente"),
        L("If the popup never came, dial the USSD code, confirm, then check history.", "Si la fenêtre n'est jamais apparue, composez le code USSD, confirmez, puis vérifiez l'historique."),
      );
    },
    [notify, router, value, L],
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
        notify.moneyIn(value, L("Wallet deposit received", "Recharge reçue"));
        celebrate({
              title: L("Money added!", "Argent ajouté !"),
              amount: value,
              line: L("Your wallet is topped up and ready to use.", "Votre portefeuille est rechargé et prêt."),
            });
        router.push("/wallet");
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error(
          L("Deposit failed", "Échec de la recharge"),
          data.error ||
                data.message ||
                L(
                  "Your transaction could not be completed. No money has been deducted. Please try again.",
                  "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez.",
                ),
        );
        return;
      }
      notify.info(
        L("Not confirmed yet", "Pas encore confirmé"),
        L(`If you have not seen a popup, dial ${ussdCode} and confirm pay.`, `Si aucune fenêtre n'est apparue, composez ${ussdCode} et confirmez.`),
      );
      verifyLock.current = false;
    } catch {
      verifyLock.current = false;
    } finally {
      setChecking(false);
    }
  }, [waiting, notify, router, value, ussdCode, L]);

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
        notify.pending(L("Continue on checkout", "Continuez le paiement"), L("Complete the payment to credit your wallet.", "Terminez le paiement pour créditer votre portefeuille."));
        window.location.assign(result.hostedUrl);
        return;
      }
      if (result.status === "pending" && result.transactionId) {
        notify.pending(
          L("Approve on your phone", "Validez sur votre téléphone"),
          L(`Confirm ${formatXAF(payAmount)} on ${method.toUpperCase()}.`, `Confirmez ${formatXAF(payAmount)} sur ${method.toUpperCase()}.`),
        );
        setOpen(false);
        setWaiting({ tx: result.transactionId, seconds: 120 });
        void pollPayment(result.transactionId);
        return;
      }
      notify.moneyIn(value, L("Wallet deposit received", "Recharge reçue"));
      setOpen(false);
      celebrate({
              title: L("Money added!", "Argent ajouté !"),
              amount: value,
              line: L("Your wallet is topped up and ready to use.", "Votre portefeuille est rechargé et prêt."),
            });
      router.push("/wallet");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error(L("Deposit failed", "Échec de la recharge"), fail.error);
      }
    }
  };

  return (
    <MoneyPage
      title={L("Add money", "Ajouter de l'argent")}
      copy={L("Top up from MTN MoMo or Orange Money.", "Rechargez depuis MTN MoMo ou Orange Money.")}
    >
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
          <BalancePill amount={formatXAF(balance)} label={L("In your wallet", "Dans votre portefeuille")} />
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
              label={L("Add from", "Recharger depuis")}
              value={method}
              onChange={setMethod}
              options={[
                { id: "mtn" as PaymentMethod, network: "mtn", title: "MTN MoMo", hint: feeHint },
                { id: "orange" as PaymentMethod, network: "orange", title: "Orange Money", hint: feeHint },
              ]}
            />
            <Field label={L(`Your ${method === "orange" ? "Orange" : "MTN"} number`, `Votre numéro ${method === "orange" ? "Orange" : "MTN"}`)}>
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
              label={L("How much?", "Combien ?")}
              receive={value}
              fee={fee}
              pay={payAmount}
              receiveLabel={L("Added to your wallet", "Ajouté à votre portefeuille")}
              feeLabel={feePercentLabel(FEE_RATES.deposit, L("Fee", "Frais"))}
              payLabel={L(`You pay from ${method === "orange" ? "Orange" : "MTN"}`, `Vous payez depuis ${method === "orange" ? "Orange" : "MTN"}`)}
            />
            <Button type="submit" disabled={!ready} className="h-14 rounded-2xl text-[16px] font-bold">
              {value ? L(`Add ${formatXAF(value)}`, `Ajouter ${formatXAF(value)}`) : L("Add money", "Ajouter de l'argent")}
            </Button>
          </form>
        </MoneyCard>
      )}
      <ConfirmSheet
        open={open}
        title={L("Confirm deposit", "Confirmer la recharge")}
        subtitle={method === "card" ? L("Card", "Carte") : `${method === "orange" ? "Orange" : "MTN"} ${clean}`}
        amount={payAmount}
        details={details}
        warning={
          method === "card"
            ? undefined
            : L(`If the popup does not appear, dial ${ussdCode} and confirm pay.`, `Si la fenêtre n'apparaît pas, composez ${ussdCode} et confirmez.`)
        }
        loading={collect.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel={L("Enter PIN to deposit", "Saisissez votre PIN pour recharger")}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </MoneyPage>
  );
}
