"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Lock, PiggyBank, ShieldCheck } from "lucide-react";
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

const DISCIPLINE_PERKS = [
  {
    icon: Calendar,
    title: "Flexible Rhythm",
    copy: "Daily, weekly, or monthly schedules",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "Prepay & Shield",
    copy: "Deposit 4 days ahead and stay protected",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Lock,
    title: "Locked Objective",
    copy: "Pledge your penalty, stay committed",
    color: "text-amber-600 bg-amber-50",
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
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-brand shadow-sm">
            <PiggyBank className="h-6 w-6" />
          </div>
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

        {/* Discipline Value Props (Clean Lucide Icons, No Emojis) */}
        <section className="grid grid-cols-3 gap-2">
          {DISCIPLINE_PERKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-[0_4px_16px_rgba(0,0,0,0.03)] ring-1 ring-line/70"
              >
                <div className={cn("grid h-9 w-9 place-items-center rounded-xl", item.color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-2 text-[11px] font-black leading-tight text-ink">{item.title}</p>
                <p className="mt-0.5 text-[9px] leading-snug text-muted">{item.copy}</p>
              </div>
            );
          })}
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
