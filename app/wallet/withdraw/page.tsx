"use client";

import { celebrate } from "@/components/success-moment";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { MoneyCard, MoneyPage } from "@/components/money-move";
import { useApp } from "@/lib/store";
import { formatXAF } from "@/lib/format";
import { useDisburse, useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { useL } from "@/lib/i18n/use-i18n";
import { BalancePill, MethodPicker, WaitingOnPhone } from "@/components/money-ui";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { FEE_RATES, feePercent, feePercentLabel, momoOutFee } from "@/lib/fees";
import { AmountField } from "@/components/amount-field";
import { amountIssue, cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";
import { readPinFail, isPinError } from "@/lib/pin-fail";

async function pollWithdrawStatus(tx: string, onTick: () => void) {
  for (let i = 0; i < 30; i += 1) {
    onTick();
    try {
      const res = await fetch(`/api/wallet/disburse/status?tx=${encodeURIComponent(tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success" || data.status === "failed") return data;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  return { status: "pending" as const };
}

export default function WithdrawPage() {
  const { state } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const L = useL();
  const disburse = useDisburse();
  const [network, setNetwork] = useState<"mtn" | "orange">("mtn");
  const [phone, setPhone] = useState(cameroonMsisdn(state.user.phone));
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number } | null>(null);
  const [checking, setChecking] = useState(false);

  const balance = me.data?.balance ?? state.balance;
  const value = Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const fee = momoOutFee(value);
  const debit = value + fee;
  const cap = dailyOutboundCap(me.data?.user?.kyc?.personal);
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
    !amountIssue(value, "withdraw") &&
    value > 0 &&
    debit <= balance &&
    !overDaily &&
    isCameroonMsisdn(clean);

  const details = [
    { label: L("To", "Vers"), value: `${network === "orange" ? "Orange" : "MTN"} ${clean}` },
    { label: L("They receive", "Ils reçoivent"), value: formatXAF(value) },
    ...(fee ? [{ label: feePercentLabel(FEE_RATES.withdraw), value: formatXAF(fee) }] : []),
    { label: L("You pay", "Vous payez"), value: formatXAF(debit) },
  ];

  const finishSuccess = useCallback(() => {
    setWaiting(null);
    notify.moneyOut(debit, L(`Withdrew ${formatXAF(value)} to ${clean} on ${network.toUpperCase()}`, `Retrait de ${formatXAF(value)} vers ${clean} sur ${network.toUpperCase()}`));
    celebrate({
      title: L("Withdrawn!", "Retiré !"),
      amount: value,
      line: L(`to ${clean} on ${network === "orange" ? "Orange Money" : "MTN MoMo"}`, `vers ${clean} sur ${network === "orange" ? "Orange Money" : "MTN MoMo"}`),
      details: [
        ...(fee ? [{ label: L("Fee", "Frais"), value: formatXAF(fee) }] : []),
        { label: L("Total from wallet", "Total débité"), value: formatXAF(debit) },
      ],
    });
    router.push("/wallet");
  }, [clean, debit, fee, network, notify, router, value, L]);

  async function pollPayment(tx: string) {
    const data = await pollWithdrawStatus(tx, () => {
      setWaiting((current) => (current ? { ...current, seconds: Math.max(0, current.seconds - 4) } : current));
    });
    if (data.status === "success") {
      finishSuccess();
      return;
    }
    if (data.status === "failed") {
      setWaiting(null);
      notify.error(
        L("Withdrawal failed", "Échec du retrait"),
        data.error ||
          data.message ||
          L("Your transaction could not be completed. No money has been deducted. Please try again.", "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez."),
      );
      return;
    }
    setWaiting(null);
    notify.info(L("Still sending", "Envoi en cours"), L("The withdrawal is still processing. Check history in a minute.", "Le retrait est toujours en cours. Vérifiez l'historique dans une minute."));
    router.push("/wallet");
  }

  async function verifyNow() {
    if (!waiting?.tx) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/wallet/disburse/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success") {
        finishSuccess();
        return;
      }
      if (data.status === "failed") {
        setWaiting(null);
        notify.error(
          L("Withdrawal failed", "Échec du retrait"),
          data.error ||
            data.message ||
            L("Your transaction could not be completed. No money has been deducted. Please try again.", "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez."),
        );
        return;
      }
      notify.info(L("Still sending", "Envoi en cours"), L("The money is on its way. This usually takes less than two minutes.", "L'argent est en route. Cela prend généralement moins de deux minutes."));
    } finally {
      setChecking(false);
    }
  }

  async function confirm(pin: string) {
    setPinError("");
    setPinLockedUntil(0);
    try {
      const result = (await disburse.mutateAsync({
        amount: value,
        phone: clean,
        network,
        pin,
        note: "Wallet withdrawal",
      })) as { status?: string; transactionId?: string; message?: string };
      if (result.status === "failed") {
        setPinError(
          result.message ||
            L("Your transaction could not be completed. No money has been deducted. Please try again.", "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez."),
        );
        return;
      }
      if (result.status === "pending" && result.transactionId) {
        notify.pending(L("Sending to Mobile Money", "Envoi vers Mobile Money"), L(`Paying ${formatXAF(value)} to ${clean}`, `Paiement de ${formatXAF(value)} vers ${clean}`));
        setOpen(false);
        setWaiting({ tx: result.transactionId, seconds: 120 });
        void pollPayment(result.transactionId);
        return;
      }
      notify.moneyOut(debit, L(`Withdrew ${formatXAF(value)} to ${clean} on ${network.toUpperCase()}`, `Retrait de ${formatXAF(value)} vers ${clean} sur ${network.toUpperCase()}`));
      setOpen(false);
      celebrate({
        title: L("Withdrawn!", "Retiré !"),
        amount: value,
        line: L(`to ${clean} on ${network === "orange" ? "Orange Money" : "MTN MoMo"}`, `vers ${clean} sur ${network === "orange" ? "Orange Money" : "MTN MoMo"}`),
        details: [
          ...(fee ? [{ label: L("Fee", "Frais"), value: formatXAF(fee) }] : []),
          { label: L("Total from wallet", "Total débité"), value: formatXAF(debit) },
        ],
      });
      router.push("/wallet");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setPinLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) {
        notify.error(L("Withdrawal failed", "Échec du retrait"), fail.error);
      }
    }
  }

  return (
    <MoneyPage
      title={L("Withdraw", "Retirer")}
      copy={L("Cash out to any MTN or Orange number.", "Retirez vers n'importe quel numéro MTN ou Orange.")}
      trust="refund"
    >
      {waiting ? (
        <WaitingOnPhone
          network={network}
          stage="sending"
          amountLabel={`${formatXAF(value)} to ${clean}`}
          seconds={waiting.seconds}
          checking={checking}
          onCheck={() => void verifyNow()}
          onCancel={() => router.push("/wallet")}
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
              label={L("Send to", "Envoyer vers")}
              value={network}
              onChange={setNetwork}
              options={[
                { id: "mtn" as const, network: "mtn", title: "MTN MoMo", hint: L(`${feePercent(FEE_RATES.withdraw)}% fee`, `${feePercent(FEE_RATES.withdraw)} % de frais`) },
                { id: "orange" as const, network: "orange", title: "Orange Money", hint: L(`${feePercent(FEE_RATES.withdraw)}% fee`, `${feePercent(FEE_RATES.withdraw)} % de frais`) },
              ]}
            />
            <Field label={L(`${network === "orange" ? "Orange" : "MTN"} number`, `Numéro ${network === "orange" ? "Orange" : "MTN"}`)}>
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
              kind="withdraw"
              label={L("How much?", "Combien ?")}
              receive={value}
              fee={fee}
              receiveLabel={L(`Lands on ${network === "orange" ? "Orange" : "MTN"}`, `Arrive sur ${network === "orange" ? "Orange" : "MTN"}`)}
              feeLabel={feePercentLabel(FEE_RATES.withdraw, L("Fee", "Frais"))}
              pay={debit}
              payLabel={L("Taken from your wallet", "Débité de votre portefeuille")}
            />
            {overDaily ? (
              <p className="rounded-2xl bg-[#fdf3f2] px-4 py-3 text-[13px] font-semibold text-danger">
                {L(
                  `You can send ${formatXAF(Math.max(0, (cap || 0) - usedToday))} more today. Verify your ID to raise the limit.`,
                  `Vous pouvez encore envoyer ${formatXAF(Math.max(0, (cap || 0) - usedToday))} aujourd'hui. Vérifiez votre identité pour augmenter le plafond.`,
                )}
              </p>
            ) : null}
            {value > 0 && debit > balance ? (
              <p className="rounded-2xl bg-[#fdf3f2] px-4 py-3 text-[13px] font-semibold text-danger">
                {L("Not enough in your wallet. Add money or lower the amount.", "Solde insuffisant. Ajoutez de l'argent ou baissez le montant.")}
              </p>
            ) : null}
            <Button type="submit" disabled={!ready} className="h-14 rounded-2xl text-[16px] font-bold">
              {value ? L(`Withdraw ${formatXAF(value)}`, `Retirer ${formatXAF(value)}`) : L("Withdraw", "Retirer")}
            </Button>
          </form>
        </MoneyCard>
      )}
      <ConfirmSheet
        open={open}
        title={L("Confirm withdrawal", "Confirmer le retrait")}
        subtitle={`${network === "orange" ? "Orange" : "MTN"} ${clean}`}
        amount={debit}
        details={details}
        loading={disburse.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel={L("Enter PIN to withdraw", "Saisissez votre PIN pour retirer")}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </MoneyPage>
  );
}
