"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PiggyBank, Plus, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NewPlanForm, PlanCard, SavingsEmpty } from "@/components/savings";
import { formatXAF } from "@/lib/format";
import { useMe, useSavings } from "@/lib/hooks/wallet";
import { monthlyPace } from "@/lib/savings";
import { cn } from "@/lib/cn";

function SavingsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const me = useMe();
  const savings = useSavings();
  const [creating, setCreating] = useState(params.get("new") === "1");
  const plans = savings.data?.savings ?? me.data?.savings ?? [];
  const active = plans.filter((p) => p.status === "active");
  const done = plans.filter((p) => p.status !== "active");
  const balance = savings.data?.balance ?? me.data?.balance ?? 0;
  const potTotal = plans.reduce((sum, p) => sum + p.balance, 0);
  const pace = active.reduce((sum, p) => sum + monthlyPace(p), 0);
  const bestStreak = plans.reduce((max, p) => Math.max(max, p.bestStreak), 0);

  return (
    <div className="mx-auto max-w-xl space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-5 lg:col-span-5">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-line/80" aria-label="Back to wallet">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black">Savings</h1>
            <p className="text-sm text-muted">Money you set aside, on a schedule you choose.</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-[1.6rem] bg-forest p-5 text-white">
          <p className="text-[12px] font-semibold text-hero-muted">In your pots</p>
          <p className="mt-1 font-mono text-[2.2rem] font-black leading-none tracking-tight">
            {formatXAF(potTotal, { withCurrency: false })} <span className="text-base font-bold text-hero-muted">XAF</span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="font-mono text-sm font-black">{active.length}</p>
              <p className="text-[10px] font-semibold text-hero-muted">Active plans</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="font-mono text-sm font-black">{formatXAF(pace, { withCurrency: false })}</p>
              <p className="text-[10px] font-semibold text-hero-muted">Per month</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="font-mono text-sm font-black">{bestStreak}</p>
              <p className="text-[10px] font-semibold text-hero-muted">Best streak</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" /> New plan
          </button>
        </section>

        <section className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { icon: TrendingUp, title: "Pick a rhythm", copy: "Daily, weekly or monthly. From 100 XAF." },
            { icon: ShieldCheck, title: "Penalty you choose", copy: "1–10% of a missed save is cut. Default 5%." },
            { icon: Sparkles, title: "Withdraw anytime", copy: "Your pot moves back to your wallet instantly. No fee." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line/80">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black text-ink">{item.title}</p>
                <p className="text-xs text-muted">{item.copy}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="space-y-5 lg:col-span-7">
        {creating ? (
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">New plan</p>
                <h2 className="text-lg font-black">Set your rhythm</h2>
              </div>
              <button type="button" onClick={() => setCreating(false)} className="text-sm font-bold text-muted hover:text-ink">
                Cancel
              </button>
            </div>
            <NewPlanForm
              balance={balance}
              onCreated={(plan) => {
                setCreating(false);
                router.push(`/wallet/savings/${encodeURIComponent(plan.id)}`);
              }}
            />
          </Card>
        ) : null}

        <section>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[15px] font-bold text-ink">Active plans</h2>
            <span className={cn("text-xs font-bold", active.length ? "text-muted" : "text-transparent")}>{active.length}</span>
          </div>
          {savings.isLoading && !plans.length ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="h-[7.5rem] animate-pulse rounded-2xl bg-white ring-1 ring-line/60" />
              ))}
            </div>
          ) : active.length ? (
            <div className="space-y-2.5">
              {active.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : !creating ? (
            <SavingsEmpty href="#new" />
          ) : (
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-muted ring-1 ring-line/80">
              <PiggyBank className="mx-auto mb-2 h-5 w-5" /> Your first plan will show here.
            </p>
          )}
        </section>

        {done.length ? (
          <section>
            <h2 className="mb-2 text-[15px] font-bold text-ink">Completed and closed</h2>
            <div className="space-y-2.5">
              {done.map((plan) => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function SavingsPage() {
  return (
    <Suspense>
      <SavingsInner />
    </Suspense>
  );
}
