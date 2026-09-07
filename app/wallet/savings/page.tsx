"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { NewPlanForm, PlanCard, SavingsEmpty, SavingsHero } from "@/components/savings";
import { ACTION_ART, ONBOARD_ART } from "@/lib/assets";
import { useMe, useSavings } from "@/lib/hooks/wallet";
import { monthlyPace } from "@/lib/savings";
import { cn } from "@/lib/cn";

const POINTS = [
  { art: ACTION_ART.save, title: "Pick a rhythm", copy: "Daily, weekly or monthly" },
  { art: ONBOARD_ART.save, title: "You set the bar", copy: "1–10% if a save is missed" },
  { art: ACTION_ART.withdraw, title: "Out anytime", copy: "Back to wallet, no fee" },
];

function SavingsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const me = useMe();
  const savings = useSavings();
  const fromQuery = params.get("new") === "1";
  const [creating, setCreating] = useState(false);
  const showForm = creating || fromQuery;

  function closeForm() {
    setCreating(false);
    if (fromQuery) router.replace("/wallet/savings");
  }
  const plans = savings.data?.savings ?? me.data?.savings ?? [];
  const active = plans.filter((p) => p.status === "active");
  const done = plans.filter((p) => p.status !== "active");
  const balance = savings.data?.balance ?? me.data?.balance ?? 0;
  const potTotal = plans.reduce((sum, p) => sum + p.balance, 0);
  const pace = active.reduce((sum, p) => sum + monthlyPace(p), 0);
  const bestStreak = plans.reduce((max, p) => Math.max(max, p.bestStreak), 0);

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-5 lg:col-span-5">
        <header className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ACTION_ART.save} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Pots</p>
            <h1 className="text-2xl font-black leading-none text-ink">Save money</h1>
          </div>
        </header>

        <SavingsHero
          amount={potTotal}
          active={active.length}
          pace={pace}
          streak={bestStreak}
          onNew={() => setCreating(true)}
        />

        <section className="grid grid-cols-3 gap-2">
          {POINTS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center rounded-[1.5rem] bg-white px-1.5 py-3 text-center shadow-[0_8px_22px_rgba(12,25,19,0.05)] ring-1 ring-line/80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.art} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
              <p className="mt-1 text-[12px] font-black leading-tight text-ink">{item.title}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">{item.copy}</p>
            </div>
          ))}
        </section>
      </div>

      <div className="space-y-5 lg:col-span-7">
        {showForm ? (
          <Card className="rounded-[1.75rem] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">New plan</p>
                <h2 className="text-lg font-black">Set your rhythm</h2>
              </div>
              <button type="button" onClick={closeForm} className="text-sm font-bold text-muted hover:text-ink">
                Cancel
              </button>
            </div>
            <NewPlanForm
              balance={balance}
              onCreated={(plan) => {
                closeForm();
                router.push(`/wallet/savings/${encodeURIComponent(plan.id)}`);
              }}
            />
          </Card>
        ) : null}

        <section>
          <div className="mb-2 flex items-end justify-between px-1">
            <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-muted">Active plans</h2>
            <span className={cn("text-xs font-bold", active.length ? "text-muted" : "text-transparent")}>{active.length}</span>
          </div>
          {savings.isLoading && !plans.length ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="h-[7.5rem] animate-pulse rounded-[1.5rem] bg-white ring-1 ring-line/60" />
              ))}
            </div>
          ) : active.length ? (
            <div className="space-y-2.5">
              {active.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : !showForm ? (
            <SavingsEmpty href="/wallet/savings?new=1" />
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] bg-white px-4 py-8 text-center ring-1 ring-line/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ACTION_ART.save} alt="" width={64} height={64} className="mx-auto h-16 w-16 object-contain" />
              <p className="mt-2 text-sm font-bold text-ink">Your first plan will show here.</p>
            </div>
          )}
        </section>

        {done.length ? (
          <section>
            <h2 className="mb-2 px-1 text-[13px] font-black uppercase tracking-[0.14em] text-muted">Completed and closed</h2>
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
