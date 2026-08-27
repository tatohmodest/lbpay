"use client";

import { useRef, useState } from "react";
import Link from "next/link";
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
    <div className="fixed inset-0 z-[85] grid place-items-end bg-navy/50 p-0 md:place-items-center md:p-6">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl md:rounded-3xl">
        {step === "review" ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Confirm</p>
            <h2 className="mt-1 text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <p className="mt-4 font-mono text-4xl font-black text-brand">{formatXAF(amount)}</p>
            <dl className="mt-4 space-y-2 rounded-2xl bg-paper p-4 text-sm">
              {details.map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="text-right font-semibold">{row.value}</dd>
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
            <h2 className="mb-2 text-center text-xl font-black">{confirmLabel}</h2>
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
