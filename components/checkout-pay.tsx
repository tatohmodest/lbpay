"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Check, Lock, ShieldCheck } from "lucide-react";
import { AmountField } from "@/components/amount-field";
import { AppImg } from "@/components/app-img";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { WaitingOnPhone } from "@/components/money-ui";
import { useL } from "@/lib/i18n/use-i18n";
import { Logo } from "@/components/logo";
import { formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { amountIssue } from "@/lib/limits";
import { rememberAuthNext } from "@/lib/auth-next";
import { shopHandlePath } from "@/lib/origin";
import {
  CHECKOUT_METHODS,
  checkoutFeeBadge,
  checkoutMethodFee,
} from "@/lib/checkout-methods";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/cn";

type Method = PaymentMethod;

async function pollStatus(tx: string) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`/api/pay/status?tx=${encodeURIComponent(tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success" || data.status === "failed") return data;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  return { status: "pending" as const };
}

function CheckoutShell({
  children,
  variant = "page",
}: {
  children: React.ReactNode;
  variant?: "page" | "embedded";
}) {
  const L = useL();
  if (variant === "embedded") return <div className="w-full">{children}</div>;
  return (
    <main className="min-h-screen bg-paper pb-12">
      <header className="relative overflow-hidden bg-forest px-4 pb-24 pt-5 text-white">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-md items-center justify-between">
          <Logo href="/" tone="dark" markClassName="h-8 w-8" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/85 ring-1 ring-white/15">
            <Lock className="h-3.5 w-3.5 text-brand" /> {L("Secure checkout", "Paiement sécurisé")}
          </span>
        </div>
      </header>
      <div className="relative mx-auto -mt-20 w-full max-w-md px-4">{children}</div>
    </main>
  );
}

function CheckoutCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "lb-rise rounded-[2rem] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(6,38,28,0.35)] ring-1 ring-line sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

const PAY_TONE = {
  wallet: "border-brand/30 bg-brand-soft",
  mtn: "border-[#e6b800]/50 bg-[#fff8d6]",
  orange: "border-[#ff7900]/40 bg-[#fff1e6]",
  card: "border-line bg-paper",
} as const;

function rememberCheckoutReturn() {
  if (typeof window === "undefined") return;
  rememberAuthNext(`${window.location.pathname}${window.location.search}`);
}

export function CheckoutPay({
  handle,
  slug,
  title,
  merchantName,
  merchantHandle,
  merchantAvatar,
  fixedAmount,
  compareAtAmount,
  description,
  imageUrl,
  merchantVerified = false,
  variant = "page",
}: {
  handle?: string;
  slug?: string;
  title: string;
  merchantName: string;
  merchantHandle: string;
  merchantAvatar?: string;
  fixedAmount?: number | null;
  compareAtAmount?: number | null;
  description?: string;
  imageUrl?: string;
  /** Server-checked: the business behind this link was approved by our team. */
  merchantVerified?: boolean;
  variant?: "page" | "embedded";
}) {
  const L = useL();
  const me = useMe();
  const router = useRouter();
  const search = useSearchParams();
  const signedIn = Boolean(me.data?.session);
  const [method, setMethod] = useState<Method>("wallet");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(fixedAmount ? String(fixedAmount) : "");
  const [error, setError] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState<{ tx: string; seconds: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const shopHref = merchantHandle ? shopHandlePath(merchantHandle) : "";

  const value = fixedAmount && fixedAmount > 0 ? fixedAmount : Number(amount) || 0;
  const clean = cameroonMsisdn(phone);
  const fee = checkoutMethodFee(value, method);
  const payAmount = value + fee;
  const amountKind = method === "wallet" ? "wallet" : "deposit";
  const ussdCode = method === "orange" ? "#150#" : "*126#";
  const walletNeedsAccount = method === "wallet" && !signedIn;
  const ready =
    !amountIssue(value, amountKind) &&
    value > 0 &&
    (method === "wallet" || isCameroonMsisdn(clean)) &&
    !walletNeedsAccount;

  const startedTx = useRef("");
  const verifyLock = useRef(false);

  const markPaid = useCallback(() => {
    setWaiting(null);
    setPaid(true);
    setError("");
  }, []);

  const fail = useCallback((message: string) => {
    setWaiting(null);
    setError(message);
  }, []);

  const watchPayment = useCallback(
    async (tx: string) => {
      const data = await pollStatus(tx);
      if (data.status === "success") {
        markPaid();
        return;
      }
      if (data.status === "failed") {
        fail(
          data.message ||
            L(
              "Your transaction could not be completed. No money has been deducted. Please try again.",
              "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez.",
            ),
        );
        return;
      }
      setWaiting(null);
      setError(
        L(
          "Still waiting. If the popup never came, dial the USSD code, confirm, then try again.",
          "Toujours en attente. Si la fenêtre n'est jamais apparue, composez le code USSD, confirmez, puis réessayez.",
        ),
      );
    },
    [fail, markPaid, L],
  );

  useEffect(() => {
    const tx = search.get("tx");
    if (!tx || paid || startedTx.current === tx) return;
    startedTx.current = tx;
    setWaiting({ tx, seconds: 120 });
    void watchPayment(tx);
  }, [paid, search, watchPayment]);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => {
      setWaiting((current) =>
        current ? { ...current, seconds: Math.max(0, current.seconds - 1) } : current,
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [waiting]);

  async function payNow(pin?: string) {
    if (walletNeedsAccount) {
      setError(L("Create a free LBPay wallet to pay with no fee.", "Créez un portefeuille LBPay gratuit pour payer sans frais."));
      return;
    }
    setError("");
    setPinError("");
    setPinLockedUntil(0);
    setBusy(true);
    try {
      const res = await fetch("/api/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          slug,
          amount: value,
          method,
          phone: clean,
          pin,
          returnUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        status?: string;
        hostedUrl?: string;
        transactionId?: string;
        retryAfter?: number;
      };
      if (!res.ok) {
        if (method === "wallet") {
          setPinError(data.error || L("Could not pay", "Paiement impossible"));
          setPinLockedUntil(Number(data.retryAfter) ? Date.now() + Number(data.retryAfter) * 1000 : 0);
        } else setError(data.error || L("Could not pay", "Paiement impossible"));
        return;
      }
      if (data.hostedUrl) {
        window.location.assign(data.hostedUrl);
        return;
      }
      if (data.status === "success") {
        setPinOpen(false);
        markPaid();
        return;
      }
      if (data.transactionId) {
        setPinOpen(false);
        setWaiting({ tx: data.transactionId, seconds: 120 });
        void watchPayment(data.transactionId);
      }
    } catch {
      setError(L("Could not start the payment. Please try again.", "Impossible de lancer le paiement. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  async function verifyNow() {
    if (!waiting?.tx || verifyLock.current) return;
    verifyLock.current = true;
    setChecking(true);
    try {
      const res = await fetch(`/api/pay/status?tx=${encodeURIComponent(waiting.tx)}`);
      const data = (await res.json()) as { status?: string; error?: string; message?: string };
      if (data.status === "success") {
        markPaid();
        return;
      }
      if (data.status === "failed") {
        fail(
          data.message ||
            L(
              "Your transaction could not be completed. No money has been deducted. Please try again.",
              "L'opération n'a pas abouti. Aucun montant n'a été débité. Réessayez.",
            ),
        );
        return;
      }
      setError(L(`If you have not seen a popup, dial ${ussdCode} and confirm pay.`, `Si aucune fenêtre n'est apparue, composez ${ussdCode} et confirmez.`));
      verifyLock.current = false;
    } catch {
      verifyLock.current = false;
    } finally {
      setChecking(false);
    }
  }

  const methodIndex = Math.max(0, CHECKOUT_METHODS.findIndex((m) => m.id === method));
  const methodName = method === "orange" ? "Orange Money" : method === "mtn" ? "MTN MoMo" : "LBPay";

  if (paid) {
    return (
      <CheckoutShell variant={variant}>
        <CheckoutCard className="text-center">
          <span className="relative mx-auto grid h-20 w-20 place-items-center">
            <span className="lb-live-dot absolute inset-0 rounded-full bg-brand-soft" />
            <span className="lb-check relative grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_10px_30px_-8px_rgba(0,179,105,0.7)]">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
          </span>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
            {L("Payment complete", "Paiement effectué")}
          </p>
          <h1 className="tabular mt-2 font-mono text-4xl font-black tracking-tight text-ink">{formatXAF(value || payAmount)}</h1>
          <p className="mt-2 text-[15px] text-muted">
            <span className="font-semibold text-ink">{merchantName}</span>{" "}
            {L("has received your payment.", "a bien reçu votre paiement.")}
          </p>
          <p className="mt-1 text-xs text-muted" suppressHydrationWarning>
            {new Intl.DateTimeFormat(L("en-GB", "fr-FR"), { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Douala" }).format(new Date())}
            {" · "}
            {L("Keep this screen as your receipt", "Gardez cet écran comme reçu")}
          </p>
          {shopHref ? (
            <Link href={shopHref} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white">
              {L("Back to shop", "Retour à la boutique")}
            </Link>
          ) : null}
        </CheckoutCard>
        {signedIn ? null : (
          <div className="mt-4 rounded-[1.5rem] bg-forest p-5 text-left text-white">
            <p className="text-sm font-bold">{L("Pay with no fee next time", "Payez sans frais la prochaine fois")}</p>
            <p className="mt-1 text-[13px] leading-5 text-white/70">
              {L(
                "Open a free LBPay wallet. Paying shops and friends from your wallet costs nothing.",
                "Ouvrez un portefeuille LBPay gratuit. Payer boutiques et amis depuis votre portefeuille ne coûte rien.",
              )}
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[13px] font-bold text-forest"
            >
              {L("Open a free wallet", "Ouvrir un portefeuille gratuit")}
            </Link>
          </div>
        )}
      </CheckoutShell>
    );
  }

  if (waiting) {
    return (
      <CheckoutShell variant={variant}>
        <WaitingOnPhone
          network={method === "orange" ? "orange" : "mtn"}
          amountLabel={formatXAF(payAmount)}
          seconds={waiting.seconds}
          ussd={ussdCode}
          checking={checking}
          onCheck={() => void verifyNow()}
          onCancel={() => setWaiting(null)}
        />
      </CheckoutShell>
    );
  }

  const header =
    variant === "embedded" ? (
      <>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{L("Or send any amount", "Ou envoyez le montant de votre choix")}</p>
        <h2 className="mt-2 text-xl font-black tracking-tight">{L(`Pay ${merchantName}`, `Payer ${merchantName}`)}</h2>
        <p className="mt-1 font-mono text-sm font-bold text-brand">@{merchantHandle}</p>
      </>
    ) : slug ? (
      <>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-deep">{merchantName}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">{title}</h1>
        {shopHref ? (
          <Link href={shopHref} className="mt-1 inline-block text-[13px] font-semibold text-brand-deep hover:underline">
            {L("See all products", "Voir tous les produits")}
          </Link>
        ) : null}
      </>
    ) : (
      <div className="text-center">
        <AppImg
          src={merchantAvatar}
          alt=""
          className="mx-auto h-20 w-20 rounded-[1.4rem] object-cover ring-4 ring-paper"
        />
        <p className="mt-4 text-[13px] font-medium text-muted">{L("You're paying", "Vous payez")}</p>
        <h1 className="mt-0.5 flex items-center justify-center gap-1.5 text-2xl font-black tracking-tight text-ink">
          <span className="truncate">{merchantName}</span>
          {merchantVerified ? <BadgeCheck className="h-5 w-5 shrink-0 text-brand" aria-label={L("Verified", "Vérifié")} /> : null}
        </h1>
        <p className="mt-0.5 font-mono text-[14px] font-bold text-brand-deep">@{merchantHandle}</p>
      </div>
    );

  const payForm = (
    <>
      {header}

      {fixedAmount && fixedAmount > 0 ? (
        <dl className="mt-6 space-y-2 rounded-2xl bg-paper px-4 py-3.5 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{L("They receive", "Ils reçoivent")}</dt>
            <dd className="tabular font-semibold text-ink">{formatXAF(value)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{L("Fee", "Frais")}</dt>
            <dd className={cn("tabular font-semibold", fee ? "text-ink" : "text-brand-deep")}>
              {fee ? formatXAF(fee) : L("Free", "Gratuit")}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-2">
            <dt className="font-bold text-ink">{L("You pay", "Vous payez")}</dt>
            <dd className="tabular text-[16px] font-black text-ink">{formatXAF(payAmount)}</dd>
          </div>
        </dl>
      ) : (
        <div className="mt-6">
          <AmountField
            value={amount}
            onChange={setAmount}
            kind={amountKind}
            label={L("How much?", "Combien ?")}
            receive={value}
            fee={fee}
            receiveLabel={L(`${merchantName} receives`, `${merchantName} reçoit`)}
            feeLabel={L("Fee", "Frais")}
            pay={payAmount}
            payLabel={L("You pay", "Vous payez")}
          />
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2.5 text-[14px] font-bold text-ink">{L("Pay with", "Payer avec")}</p>
        <div role="radiogroup" aria-label={L("Pay with", "Payer avec")} className="grid grid-cols-3 gap-2">
          {CHECKOUT_METHODS.map((item) => {
            const selected = method === item.id;
            const free = item.id === "wallet";
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMethod(item.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-center transition active:scale-[0.98]",
                  selected ? "bg-brand-soft ring-2 ring-brand" : "bg-paper ring-1 ring-line hover:ring-brand/40",
                )}
              >
                <NetworkMark network={item.id} className="h-9 w-9 rounded-xl text-[9px]" />
                <span className="text-[13px] font-bold text-ink">{item.id === "wallet" ? "LBPay" : item.label}</span>
                <span className={cn("text-[11px]", free ? "font-bold text-brand-deep" : "text-muted")}>
                  {free ? L("Free", "Gratuit") : checkoutFeeBadge(item.id).replace("Charge", L("Fee", "Frais"))}
                </span>
                {selected ? (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Attached box under the chosen method */}
        <div key={method} className="lb-rise relative mt-3">
          <span
            aria-hidden
            className={cn("absolute -top-2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t", PAY_TONE[method])}
            style={{ left: `${methodIndex * 33.333 + 16.666}%` }}
          />
          <div className={cn("relative rounded-2xl border p-4", PAY_TONE[method])}>
            {method === "wallet" ? (
              walletNeedsAccount ? (
                <>
                  <p className="text-[14px] font-bold text-ink">{L("Pay from your LBPay wallet, free", "Payez depuis votre portefeuille LBPay, sans frais")}</p>
                  <p className="mt-1 text-[13px] text-muted">
                    {L(
                      "Sign in or open a free wallet. No account? MTN and Orange work too.",
                      "Connectez-vous ou ouvrez un portefeuille gratuit. Pas de compte ? MTN et Orange fonctionnent aussi.",
                    )}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        rememberCheckoutReturn();
                        router.push("/signup");
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-brand text-[14px] font-bold text-white"
                    >
                      {L("Open a wallet", "Ouvrir un compte")}
                    </button>
                    <Link
                      href="/login"
                      onClick={() => rememberCheckoutReturn()}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-white text-[14px] font-bold text-ink ring-1 ring-line"
                    >
                      {L("Sign in", "Se connecter")}
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-[14px] text-ink">
                  <span className="font-bold">{L("From your LBPay wallet.", "Depuis votre portefeuille LBPay.")}</span>{" "}
                  {L("No fee, confirmed with your PIN.", "Sans frais, confirmé avec votre PIN.")}
                </p>
              )
            ) : (
              <>
                <label htmlFor="pay-from" className="flex items-center gap-2 text-[13px] font-bold text-ink">
                  <NetworkMark network={method} className="h-5 w-5 rounded-md text-[6px]" />
                  {L(`Your ${methodName} number`, `Votre numéro ${methodName}`)}
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                  <span className="font-mono text-[15px] font-semibold text-muted">+237</span>
                  <input
                    id="pay-from"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="6XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
                    required
                    className="tabular h-12 min-w-0 flex-1 bg-transparent font-mono text-[18px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted/60"
                  />
                </div>
                <p className="mt-2 text-[12px] text-muted">
                  {L(
                    `You'll approve it on this phone with your ${methodName} PIN.`,
                    `Vous validerez sur ce téléphone avec votre code ${methodName}.`,
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-[#fdf3f2] px-4 py-3 text-[13px] font-semibold text-danger">{error}</p> : null}

      {walletNeedsAccount ? null : (
        <button
          type="button"
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(0,179,105,0.8)] transition hover:bg-brand-dark disabled:bg-line disabled:text-muted disabled:shadow-none"
          disabled={!ready || busy}
          onClick={() => {
            if (method === "wallet") {
              setPinError("");
              setPinLockedUntil(0);
              setPinOpen(true);
              return;
            }
            void payNow();
          }}
        >
          <Lock className="h-4 w-4" />
          {busy
            ? L("Starting…", "Lancement…")
            : value
              ? L(`Pay ${formatXAF(payAmount)}`, `Payer ${formatXAF(payAmount)}`)
              : L("Pay", "Payer")}
        </button>
      )}
    </>
  );

  const confirm = (
    <ConfirmSheet
      open={pinOpen}
      title={L("Confirm payment", "Confirmer le paiement")}
      subtitle={L(`Pay @${merchantHandle}`, `Payer @${merchantHandle}`)}
      amount={value}
      details={[
        { label: L("To", "Vers"), value: `@${merchantHandle}` },
        { label: L("They receive", "Ils reçoivent"), value: formatXAF(value) },
        { label: L("Fee", "Frais"), value: L("Free", "Gratuit") },
      ]}
      loading={busy}
      error={pinError}
      lockedUntil={pinLockedUntil}
      confirmLabel={L("Enter PIN to pay", "Saisissez votre PIN pour payer")}
      onClose={() => setPinOpen(false)}
      onConfirm={(pin) => void payNow(pin)}
    />
  );

  return (
    <CheckoutShell variant={variant}>
      <CheckoutCard>{payForm}</CheckoutCard>
      {variant === "embedded" ? null : (
        <ul className="mt-5 space-y-2 px-2 text-[12px] text-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            {L(
              "You see the exact total before paying, and you approve it yourself.",
              "Vous voyez le total exact avant de payer, et c'est vous qui validez.",
            )}
          </li>
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            {L(
              "LBPay will never call or message you to ask for a PIN or code.",
              "LBPay ne vous appellera jamais pour demander un PIN ou un code.",
            )}
          </li>
        </ul>
      )}
      {confirm}
    </CheckoutShell>
  );
}
