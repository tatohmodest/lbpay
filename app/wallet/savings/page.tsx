"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DuolingoNudgeCard,
  PlanCard,
  SavingsDepositModal,
  SavingsEmpty,
  SavingsHero,
  SavingsModal,
} from "@/components/savings";
import { ACTION_ART } from "@/lib/assets";
import { useMe, useSavings } from "@/lib/hooks/wallet";
import { monthlyPace } from "@/lib/savings";
import { cn } from "@/lib/cn";
import type { SavingsPlan } from "@/lib/types";

const POINTS = [
  {
    art: ACTION_ART.save,
    title: "Pick a rhythm",
    copy: "Daily, weekly, or monthly schedules",
  },
  {
    art: ACTION_ART.deposit,
    title: "Prepay & Shield",
    copy: "Pay ahead anytime to protect your streak",
  },
  {
    art: ACTION_ART.withdraw,
    title: "Zero-fee finish",
    copy: "100% free cashout once objective is met",
  },
];

function SavingsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const me = useMe();
  const savings = useSavings();

  const fromQuery = params.get("new") === "1";
  const [modalOpen, setModalOpen] = useState(fromQuery);
  const [depositTargetPlan, setDepositTargetPlan] = useState<SavingsPlan | null>(null);

  function closeModal() {
    setModalOpen(false);
    if (fromQuery) router.replace("/wallet/savings");
  }

  const plans = savings.data?.savings ?? me.data?.savings ?? [];
  const active = plans.filter((p) => p.status === "active");
  const done = plans.filter((p) => p.status !== "active");
  const balance = savings.data?.balance ?? me.data?.balance ?? 0;
  const potTotal = plans.reduce((sum, p) => sum + p.balance, 0);
  const pace = active.reduce((sum, p) => sum + monthlyPace(p), 0);
  const bestStreak = plans.reduce((max, p) => Math.max(max, p.bestStreak), 0);
  const totalPoints = plans.reduce((sum, p) => sum + (p.points || 0), 0);

  function handleNudgeAction(targetPlanId?: string) {
    if (targetPlanId) {
      const target = active.find((p) => p.id === targetPlanId);
      if (target) {
        setDepositTargetPlan(target);
        return;
      }
    }
    setModalOpen(true);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      {/* Left Column: Hero & Discipline Features */}
      <div className="space-y-5 lg:col-span-5">
        <header className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ACTION_ART.save} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Finances & Discipline</p>
            <h1 className="text-2xl font-black leading-none text-ink">Savings Pots</h1>
          </div>
        </header>

        {/* Hero Card with Gamified Stats */}
        <SavingsHero
          amount={potTotal}
          active={active.length}
          pace={pace}
          streak={bestStreak}
          points={totalPoints}
          onNew={() => setModalOpen(true)}
        />

        {/* Duolingo Motivational Nudge */}
        <DuolingoNudgeCard plans={plans} onAction={handleNudgeAction} />

        {/* Discipline Value Props with 3D Illustrative Art */}
        <section className="grid grid-cols-3 gap-2">
          {POINTS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center rounded-[1.5rem] bg-white px-1.5 py-3.5 text-center shadow-[0_8px_22px_rgba(12,25,19,0.05)] ring-1 ring-line/80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.art} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
              <p className="mt-1.5 text-[12px] font-black leading-tight text-ink">{item.title}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-muted">{item.copy}</p>
            </div>
          ))}
        </section>
      </div>

      {/* Right Column: Active Plans & Completed Plans */}
      <div className="space-y-5 lg:col-span-7">
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-black uppercase tracking-[0.14em] text-muted">Active Pots</h2>
              {active.length ? (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                  {active.length}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs font-bold text-brand-deep hover:underline cursor-pointer"
            >
              + New pot
            </button>
          </div>

          {savings.isLoading && !plans.length ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-[1.75rem] bg-white ring-1 ring-line/60" />
              ))}
            </div>
          ) : active.length ? (
            <div className="space-y-3">
              {active.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSaveNow={(p) => setDepositTargetPlan(p)}
                />
              ))}
            </div>
          ) : (
            <SavingsEmpty onNew={() => setModalOpen(true)} />
          )}
        </section>

        {done.length ? (
          <section>
            <h2 className="mb-2 px-1 text-[13px] font-black uppercase tracking-[0.14em] text-muted">
              Completed and Closed
            </h2>
            <div className="space-y-2.5">
              {done.map((plan) => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Pop-up Modal Form */}
      <SavingsModal
        open={modalOpen}
        onClose={closeModal}
        balance={balance}
        onCreated={(plan) => {
          closeModal();
          router.push(`/wallet/savings/${encodeURIComponent(plan.id)}`);
        }}
      />

      {/* Quick Deposit & Prepay Modal */}
      {depositTargetPlan ? (
        <SavingsDepositModal
          plan={depositTargetPlan}
          walletBalance={balance}
          open={Boolean(depositTargetPlan)}
          onClose={() => setDepositTargetPlan(null)}
          onSuccess={() => setDepositTargetPlan(null)}
        />
      ) : null}
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
