"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PayoutSwitch({
  state,
  owner,
}: {
  state?: { on: boolean; changedAt?: string };
  owner: boolean;
}) {
  const notify = useNotify();
  const client = useQueryClient();
  const flip = useMutation({
    mutationFn: async (on: boolean) => {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      return data;
    },
    onSuccess: (_d, on) => {
      client.invalidateQueries({ queryKey: ["admin-overview"] });
      notify.success(on ? "Payouts are on" : "Payouts paused", on ? "Money can leave LBPay again." : "No money can leave LBPay.");
    },
    onError: (err: Error) => notify.error("Not changed", err.message),
  });
  if (!state) return null;
  const on = state.on;
  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[1.25rem] p-4",
        on ? "border border-line/80 bg-white" : "bg-danger/10 ring-1 ring-danger/30",
      )}
    >
      <span className={cn("grid h-10 w-10 place-items-center rounded-full", on ? "bg-brand-soft text-brand-deep" : "bg-danger text-white")}>
        {on ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{on ? "Payouts are on" : "Payouts are paused"}</p>
        <p className="text-xs text-muted">
          {on
            ? "Withdrawals, API payouts, quick and international transfers can send money."
            : "No withdrawal or payout can leave LBPay. Deposits and wallet transfers still work."}
          {state.changedAt ? ` Changed ${formatDate(state.changedAt)}.` : ""}
        </p>
      </div>
      {on ? (
        <Button variant="dark" className="bg-danger hover:bg-danger/90" disabled={flip.isPending} onClick={() => flip.mutate(false)}>
          Pause payouts
        </Button>
      ) : owner ? (
        <Button
          disabled={flip.isPending}
          onClick={() => {
            if (window.confirm("Turn payouts back on? Only do this once you've checked the refunded payouts below.")) flip.mutate(true);
          }}
        >
          Turn payouts on
        </Button>
      ) : (
        <span className="text-xs font-semibold text-muted">Only an owner can turn them back on.</span>
      )}
    </section>
  );
}
