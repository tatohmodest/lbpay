"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { AmountField } from "@/components/amount-field";
import { AppImg } from "@/components/app-img";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { NetworkMark } from "@/components/network-mark";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { ShareRow } from "@/components/share-row";
import { formatXAF } from "@/lib/format";
import { useMe } from "@/lib/hooks/wallet";
import { amountIssue } from "@/lib/limits";
import { rememberAuthNext } from "@/lib/auth-next";
import { payHandlePath } from "@/lib/origin";
import { productPricing, productShareText, productUrl } from "@/lib/shop";
import { ProductPrice, SaleBadge } from "@/components/product-price";
import { useBrowserOrigin } from "@/lib/use-origin";
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
  if (variant === "embedded") return <div className="w-full">{children}</div>;
  return (
    <main className="min-h-screen bg-paper">
      <div className="border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Logo href="/" markClassName="h-8 w-8" />
          <p className="flex items-center gap-1 text-xs font-semibold text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Secured by LBPay
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">{children}</div>
    </main>
  );
}

function CheckoutCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[1.85rem] bg-white p-5 shadow-[0_18px_50px_rgba(12,25,19,0.06)] ring-1 ring-line/80 sm:p-6", className)}>
      {children}
    </section>
  );
}

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
  variant?: "page" | "embedded";
}) {
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
  const origin = useBrowserOrigin();
  const shopHref = merchantHandle ? payHandlePath(merchantHandle) : "";
  const productHref = slug ? productUrl(slug, origin) : "";
  const { original, price, percentOff } = productPricing(fixedAmount, compareAtAmount);
  const saved = original && price ? original - price : 0;
  const details = String(description || "").trim();

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
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      setWaiting(null);
      setError("Still waiting. If the popup never came, dial the USSD code, confirm, then try again.");
    },
    [fail, markPaid],
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
      setError("Create a free LBPay wallet to pay with no fee.");
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
          setPinError(data.error || "Could not pay");
          setPinLockedUntil(Number(data.retryAfter) ? Date.now() + Number(data.retryAfter) * 1000 : 0);
        } else setError(data.error || "Could not pay");
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
      setError("Could not start the payment. Please try again.");
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
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        );
        return;
      }
      setError(`If you have not seen a popup, dial ${ussdCode} and confirm pay.`);
      verifyLock.current = false;
    } catch {
      verifyLock.current = false;
    } finally {
      setChecking(false);
    }
  }

  if (paid) {
    return (
      <CheckoutShell variant={variant}>
        <div className="mx-auto max-w-md">
          <CheckoutCard className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
              <Check className="h-7 w-7" />
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Paid</p>
            <h1 className="mt-2 font-mono text-3xl font-black text-ink">{formatXAF(value || payAmount)}</h1>
            <p className="mt-2 text-sm text-muted">{merchantName} has received this payment.</p>
            {shopHref ? (
              <Link href={shopHref} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white">
                Back to shop
              </Link>
            ) : null}
          </CheckoutCard>
        </div>
      </CheckoutShell>
    );
  }

  if (waiting) {
    return (
      <CheckoutShell variant={variant}>
        <div className="mx-auto max-w-md">
          <CheckoutCard className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Waiting for payment</p>
            <h2 className="mt-2 text-2xl font-black">Approve on your phone</h2>
            <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink">
              If you have not seen a popup, dial <span className="font-mono font-semibold">{ussdCode}</span> and
              confirm pay.
            </p>
            <p className="mt-6 font-mono text-4xl font-black">{waiting.seconds}s</p>
            <div className="mt-6 grid gap-2">
              <Button onClick={() => void verifyNow()} disabled={checking}>
                {checking ? "Checking…" : "I've paid"}
              </Button>
              <Button variant="ghost" onClick={() => setWaiting(null)}>
                Cancel wait
              </Button>
            </div>
          </CheckoutCard>
        </div>
      </CheckoutShell>
    );
  }

  const payForm = (
    <>
      {variant === "embedded" ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Or send any amount</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">Pay {merchantName}</h2>
          <p className="mt-1 font-mono text-sm font-bold text-brand">@{merchantHandle}</p>
        </>
      ) : slug ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Checkout</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">How will you pay?</h2>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <AppImg src={merchantAvatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-soft" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{merchantName}</p>
              <h1 className="text-xl font-black tracking-tight">{title}</h1>
              <p className="font-mono text-sm font-bold text-brand">@{merchantHandle}</p>
            </div>
          </div>
        </>
      )}
      {fixedAmount && fixedAmount > 0 ? (
        <div className="mt-5 space-y-1.5 rounded-2xl bg-paper px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">They receive</span>
            <span className="font-mono font-semibold">{formatXAF(value)}</span>
          </div>
          {fee ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted">{checkoutFeeBadge(method)}</span>
              <span className="font-mono font-semibold">{formatXAF(fee)}</span>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <span className="text-muted">LBPay wallet</span>
              <span className="font-semibold text-brand">No fee</span>
            </div>
          )}
          {fee ? (
            <div className="flex justify-between gap-3 border-t border-line pt-1.5">
              <span>You pay</span>
              <span className="font-mono font-semibold">{formatXAF(payAmount)}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5">
          <AmountField
            value={amount}
            onChange={setAmount}
            kind={amountKind}
            receive={value}
            fee={fee}
            feeLabel={checkoutFeeBadge(method)}
            pay={method === "wallet" ? undefined : payAmount}
          />
          {method === "wallet" && value > 0 && !amountIssue(value, "wallet") ? (
            <p className="mt-2 text-sm font-semibold text-brand">No fee on LBPay wallet.</p>
          ) : null}
        </div>
      )}
      <div className="mt-5 grid gap-2">
        {CHECKOUT_METHODS.map((item) => {
          const selected = method === item.id;
          const free = item.id === "wallet";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMethod(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-[1.25rem] p-3 text-left ring-1 transition",
                selected ? "bg-brand-soft ring-brand/40" : "bg-[#f6f8f7] ring-transparent hover:bg-white hover:ring-line/80",
              )}
            >
              <NetworkMark network={item.id} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{item.label}</span>
                <span className={cn("text-xs", free ? "font-semibold text-brand" : "text-muted")}>
                  {checkoutFeeBadge(item.id)}
                </span>
              </span>
              {free ? (
                <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Free
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {method !== "card" && method !== "wallet" ? (
        <div className="mt-4">
          <Field label="Paying from">
            <Input
              inputMode="numeric"
              placeholder="677000000"
              value={phone}
              onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
              required
            />
          </Field>
        </div>
      ) : null}
      {walletNeedsAccount ? (
        <div className="mt-5 rounded-[1.1rem] bg-brand-soft px-4 py-4">
          <p className="text-sm font-semibold text-ink">Pay with your LBPay wallet for free.</p>
          <p className="mt-1 text-sm text-muted">Create an account to use it. MTN and Orange still work without one.</p>
          <div className="mt-4 grid gap-2">
            <Button
              className="w-full"
              onClick={() => {
                rememberCheckoutReturn();
                router.push("/signup");
              }}
            >
              Create a free wallet
            </Button>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full text-sm font-medium text-brand"
              onClick={() => rememberCheckoutReturn()}
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm font-semibold text-danger">{error}</p> : null}
      {walletNeedsAccount ? null : (
        <Button
          className="mt-6 w-full"
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
          {busy ? "Starting…" : value ? `Pay ${formatXAF(payAmount)}` : "Pay"}
        </Button>
      )}
    </>
  );

  const confirm = (
    <ConfirmSheet
      open={pinOpen}
      title="Confirm payment"
      subtitle={`Pay @${merchantHandle}`}
      amount={value}
      details={[
        { label: "To", value: `@${merchantHandle}` },
        { label: "They receive", value: formatXAF(value) },
        { label: "Charge", value: "No fee" },
      ]}
      loading={busy}
      error={pinError}
      lockedUntil={pinLockedUntil}
      confirmLabel="Enter PIN to pay"
      onClose={() => setPinOpen(false)}
      onConfirm={(pin) => void payNow(pin)}
    />
  );

  if (variant === "page" && slug) {
    return (
      <CheckoutShell variant={variant}>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-[1.85rem] bg-white shadow-[0_18px_50px_rgba(12,25,19,0.06)] ring-1 ring-line/80">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-brand-soft to-paper sm:aspect-[5/4] lg:aspect-[4/5]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center">
                  <p className="text-3xl font-black text-brand-deep">{title}</p>
                </div>
              )}
              <SaleBadge percentOff={percentOff} className="absolute left-4 top-4" />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {shopHref ? (
                <Link href={shopHref} className="flex items-center gap-3">
                  <AppImg src={merchantAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <span>
                    <span className="block text-sm font-bold text-ink">{merchantName}</span>
                    <span className="font-mono text-xs font-semibold text-brand">@{merchantHandle}</span>
                  </span>
                </Link>
              ) : null}
              <div>
                <h1 className="text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">{title}</h1>
                <ProductPrice
                  className="mt-3"
                  amount={fixedAmount}
                  compareAtAmount={compareAtAmount}
                  size="lg"
                  badge={false}
                />
                {saved > 0 ? (
                  <p className="mt-1.5 text-sm font-semibold text-brand-deep">You save {formatXAF(saved)}</p>
                ) : null}
              </div>
              {details ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink/80">{details}</p>
              ) : null}
              {productHref ? (
                <ShareRow
                  url={productHref}
                  text={productShareText(title, fixedAmount ?? null, productHref)}
                  copyLabel="Share this product"
                />
              ) : null}
            </div>
          </article>
          <div className="lg:sticky lg:top-8">
            <CheckoutCard>{payForm}</CheckoutCard>
          </div>
        </div>
        {confirm}
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell variant={variant}>
      <div className={variant === "embedded" ? "" : "mx-auto max-w-md"}>
        <CheckoutCard>{payForm}</CheckoutCard>
      </div>
      {confirm}
    </CheckoutShell>
  );
}
