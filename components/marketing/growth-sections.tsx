import { Flame, ShieldCheck, Timer } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { Accent, ButtonLink, CheckList, Eyebrow, Lead, SectionTitle } from "@/components/marketing/ui";
import { COUNTRIES, INTERNATIONAL, quote } from "@/lib/countries";
import { FEATURES } from "@/lib/flags";
import { SAVINGS } from "@/lib/savings";

/* ---------------- Savings ---------------- */

const POT = { name: "Rent, January", emoji: "🏠", amount: 2_500, saved: 47_500, target: 75_000, streak: 19, penaltyRate: 0.05 };

export function PotPreview() {
  const pct = Math.round((POT.saved / POT.target) * 100);
  const penalty = Math.round(POT.amount * POT.penaltyRate);
  const r = 46;
  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="lb-float absolute -left-6 -top-6 z-10 hidden -rotate-6 rounded-2xl bg-white px-3.5 py-2.5 text-xs font-bold text-ink shadow-[0_18px_40px_rgba(6,38,28,0.18)] ring-1 ring-line sm:block">
        <span className="flex items-center gap-1.5 text-[#b4530a]">
          <Flame className="h-3.5 w-3.5" /> {POT.streak}-day streak
        </span>
      </div>
      <div className="lb-float-delayed absolute -bottom-5 -right-5 z-10 hidden rotate-3 rounded-2xl bg-white px-3.5 py-2.5 text-xs font-bold text-ink shadow-[0_18px_40px_rgba(6,38,28,0.18)] ring-1 ring-line sm:block">
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-danger">If you skip a day</span>
        <span className="tabular">−{penalty.toLocaleString("fr-FR")} XAF</span>, the price you chose
      </div>
      <div className="rounded-[1.75rem] bg-white p-6 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-soft text-2xl">{POT.emoji}</span>
            <div>
              <p className="text-base font-bold leading-tight">{POT.name}</p>
              <p className="tabular text-xs text-muted">{POT.amount.toLocaleString("fr-FR")} XAF every day</p>
            </div>
          </div>
          <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-bold text-[#7a5a1c]">Due today</span>
        </div>
        <div className="mt-6 flex items-center gap-5">
          <svg viewBox="0 0 110 110" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden>
            <circle cx="55" cy="55" r={r} fill="none" stroke="var(--color-brand-soft)" strokeWidth="10" />
            <circle
              cx="55"
              cy="55"
              r={r}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="10"
              strokeLinecap="round"
              pathLength={1}
              style={{ strokeDasharray: `${pct / 100} 1` }}
            />
          </svg>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">In the pot</p>
            <p className="tabular mt-1 text-3xl font-bold tracking-tight">{POT.saved.toLocaleString("fr-FR")}</p>
            <p className="tabular text-sm text-muted">of {POT.target.toLocaleString("fr-FR")} XAF · {pct}%</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <span className="grid h-11 place-items-center rounded-xl bg-brand text-sm font-bold text-white">Save 2 500 now</span>
          <span className="grid h-11 place-items-center rounded-xl bg-paper text-sm font-bold text-ink ring-1 ring-line">
            Auto-save on
          </span>
        </div>
      </div>
    </div>
  );
}

export function SavingsShowcase() {
  return (
    <section id="savings" className="bg-paper py-20 lg:py-28">
      <Container className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <Eyebrow>Savings pots</Eyebrow>
          <SectionTitle className="mt-4">
            Save like you mean it. <Accent>Literally.</Accent>
          </SectionTitle>
          <Lead className="mt-5">
            Pick a goal, a rhythm (daily, weekly or monthly) and an amount. Skip a cycle and LBPay takes a small
            penalty you chose yourself, from {Math.round(SAVINGS.minPenaltyRate * 100)}% to{" "}
            {Math.round(SAVINGS.maxPenaltyRate * 100)}%. It works like a njangi that never forgets.
          </Lead>
          <CheckList
            className="mt-8"
            items={[
              "Streaks and a progress ring keep your goal in front of you",
              "Auto-save takes the amount the moment it's due, so you never miss",
              "Collect everything free at your goal. Need it sooner? Withdraw any time for the same small fee",
              "Penalties are capped, transparent, and listed in your history",
            ]}
          />
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/signup" arrow>
              Start a pot
            </ButtonLink>
            <ButtonLink href="/wallet/savings" variant="secondary">
              I already have a wallet
            </ButtonLink>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -rotate-2 rounded-[2.5rem] bg-forest" />
          <div className="lb-glow absolute inset-0 -rotate-2 rounded-[2.5rem]" />
          <div className="relative px-6 py-14 sm:px-14 sm:py-20">
            <PotPreview />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Cross-border ---------------- */

export function AfricaCorridors({ cities }: { cities: string[] }) {
  const abroad = COUNTRIES.filter((c) => c.code !== "CM");
  const live = FEATURES.international;
  return (
    <section id="africa" className="py-20 lg:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>Across Africa</Eyebrow>
              {live ? null : (
                <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-bold text-[#7a5a1c]">
                  Opening soon
                </span>
              )}
            </div>
            <SectionTitle className="mt-4">
              Send from Douala. <Accent>They get naira in Lagos.</Accent>
            </SectionTitle>
            <Lead className="mt-5">
              One flat {Math.round(INTERNATIONAL.feeRate * 1000) / 10}% fee, the rate locked the moment you confirm,
              and delivery to Mobile Money or a bank account in local currency.{" "}
              {live
                ? "Share your @handle and money from these countries lands in XAF."
                : "It isn't open yet. Open an account today and it will be ready for you the day it is."}
            </Lead>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[14px] text-muted">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand" /> Rate locked at confirm
              </span>
              <span className="inline-flex items-center gap-2">
                <Timer className="h-4 w-4 text-brand" /> Minutes to Mobile Money
              </span>
            </div>
            <div className="mt-9">
              <ButtonLink href="/signup" arrow>
                {live ? "Send abroad" : "Open an account"}
              </ButtonLink>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {abroad.map((c) => (
                <div key={c.code} className="rounded-2xl bg-white p-4 ring-1 ring-line/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <span className="truncate text-sm font-semibold text-ink">{c.short ?? c.name.split(" (")[0]}</span>
                  </div>
                  <p className="tabular mt-2 text-[12px] font-medium text-muted">
                    {c.currency === "XAF" ? "Same currency · XAF" : `1 XAF ≈ ${quote(c, 1).rate} ${c.currency}`}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-forest p-6 text-white">
              <p className="text-[15px] font-semibold">At home, everywhere in Cameroon</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {cities.map((city) => (
                  <li key={city} className="rounded-full bg-white/[0.07] px-3 py-1.5 text-[13px] font-medium text-white/85 ring-1 ring-white/10">
                    {city}
                  </li>
                ))}
                <li className="rounded-full px-3 py-1.5 text-[13px] text-white/50">and every town with a network</li>
              </ul>
            </div>
            <p className="mt-3 text-[12px] text-muted">Rates shown are indicative. Your exact rate is locked when you confirm.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
