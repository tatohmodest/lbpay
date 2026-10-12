"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { PinPad } from "@/components/auth/pin-pad";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/format";
import { secondsLeft, useNow } from "@/lib/use-now";

function ConfirmSheetInner({
  title,
  subtitle,
  amount,
  details,
  warning,
  loading,
  error,
  confirmLabel,
  onClose,
  onConfirm,
  lockedUntil = 0,
}: {
  title: string;
  subtitle: string;
  amount: number;
  details: { label: string; value: string }[];
  warning?: string;
  loading?: boolean;
  error?: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  lockedUntil?: number;
}) {
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"review" | "pin">("review");
  const sent = useRef("");
  const now = useNow(lockedUntil > 0);
  const wait = secondsLeft(lockedUntil, now);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-forest/60 p-0 backdrop-blur-sm md:place-items-center md:p-6">
      <div className="lb-sheet w-full max-w-md rounded-t-[2rem] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl md:rounded-[2rem] md:pb-6">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line md:hidden" />
        {step === "review" ? (
          <>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-deep">
              <ShieldCheck className="h-3.5 w-3.5" /> Check before you confirm
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <p className="tabular mt-5 font-mono text-4xl font-black tracking-tight text-ink">{formatXAF(amount)}</p>
            <dl className="mt-5 space-y-2.5 rounded-2xl bg-paper p-4 text-sm">
              {details.map((row, i) => (
                <div
                  key={row.label}
                  className={
                    i === details.length - 1 && details.length > 2
                      ? "flex justify-between gap-3 border-t border-dashed border-line pt-2.5"
                      : "flex justify-between gap-3"
                  }
                >
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="tabular text-right font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            {warning ? <p className="mt-3 text-xs text-muted">{warning}</p> : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setStep("pin")}>
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-deep">
              <Lock className="h-5 w-5" />
            </span>
            <h2 className="text-center text-xl font-black">{confirmLabel}</h2>
            <p className="mb-3 mt-1 text-center text-[13px] text-muted">
              <span className="tabular font-semibold text-ink">{formatXAF(amount)}</span> · LBPay will never ask for your PIN
            </p>
            <PinPad
              value={pin}
              disabled={wait > 0}
              onChange={(next) => {
                if (next.length < 4) sent.current = "";
                setPin(next);
                if (next.length === 4 && !loading && wait <= 0 && sent.current !== next) {
                  sent.current = next;
                  onConfirm(next);
                }
              }}
              error={error}
              hint={
                wait > 0
                  ? `Too many incorrect PINs. Wait ${wait}s.`
                  : loading
                    ? "Authorizing…"
                    : "Confirm with your 4-digit PIN"
              }
            />
            <Link href="/pin/forgot" className="mt-4 block text-center text-sm font-semibold text-brand">
              Forgot PIN?
            </Link>
            <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => setStep("review")}>
              Back
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function ConfirmSheet({
  open,
  title,
  subtitle,
  amount,
  details,
  warning,
  loading,
  error,
  confirmLabel = "Enter PIN to send",
  onClose,
  onConfirm,
  lockedUntil = 0,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  amount: number;
  details: { label: string; value: string }[];
  warning?: string;
  loading?: boolean;
  error?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  lockedUntil?: number;
}) {
  if (!open) return null;
  return (
    <ConfirmSheetInner
      title={title}
      subtitle={subtitle}
      amount={amount}
      details={details}
      warning={warning}
      loading={loading}
      error={error}
      confirmLabel={confirmLabel}
      onClose={onClose}
      onConfirm={onConfirm}
      lockedUntil={lockedUntil}
    />
  );
}
