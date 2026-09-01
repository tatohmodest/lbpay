"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(7,20,15,0.12)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">LBPay</p>
        <h1 className="mt-3 text-2xl font-black text-ink">Could not open that screen</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Something broke while loading. Try again — your money is still on the ledger.
        </p>
        <Button className="mt-6 w-full" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
