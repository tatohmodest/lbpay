import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Flame, ShieldCheck, Timer } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { Button } from "@/components/ui/button";
import { COUNTRIES, INTERNATIONAL, quote } from "@/lib/countries";
import { SAVINGS } from "@/lib/savings";

/* ---------------- Savings ---------------- */

const POT = { name: "Rent, January", emoji: "🏠", amount: 2_500, saved: 47_500, target: 75_000, streak: 19, penaltyRate: 0.05 };

function PotPreview() {
  const pct = Math.round((POT.saved / POT.target) * 100);
  const penalty = Math.round(POT.amount * POT.penaltyRate);
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -left-8 -top-5 hidden -rotate-6 rounded-2xl bg-white px-3.5 py-2.5 text-xs font-bold text-ink shadow-[0_18px_40px_rgba(6,38,28,0.14)] ring-1 ring-line sm:block">
        <span className="flex items-center gap-1.5 text-[#b4530a]">
          <Flame className="h-3.5 w-3.5" /> {POT.streak}-day streak
        </span>
      </div>
      <div className="absolute -bottom-6 -right-6 hidden rotate-3 rounded-2xl bg-white px-3.5 py-2.5 text-xs font-bold text-ink shadow-[0_18px_40px_rgba(6,38,28,0.14)] ring-1 ring-line sm:block">
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-danger">Missed a day</span>
        −{penalty.toLocaleString("fr-FR")} XAF penalty
      </div>
      <div className="rounded-[1.75rem] bg-forest p-6 text-white shadow-[0_30px_70px_rgba(6,38,28,0.28)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-2xl">{POT.emoji}</span>
            <div>
              <p className="text-base font-black leading-tight">{POT.name}</p>
              <p className="text-xs text-hero-muted">{POT.amount.toLocaleString("fr-FR")} XAF every day</p>
            </div>
          </div>
          <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-black text-ink">Due today</span>
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-hero-muted">In the pot</p>
        <p className="mt-1 font-mono text-4xl font-black tracking-tight">
          {POT.saved.toLocaleString("fr-FR")} <span className="text-base font-bold text-hero-muted">/ {POT.target.toLocaleString("fr-FR")} XAF</span>
        </p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-hero-muted">
          <span>{pct}% there</span>
          <span>11 days to go</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <span className="grid h-11 place-items-center rounded-xl bg-brand text-sm font-bold text-white">Save 2,500 now</span>
          <span className="grid h-11 place-items-center rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15">Auto-save on</span>
        </div>
      </div>
    </div>
  );
}

export function SavingsShowcase() {
  return (
    <section id="savings" className="bg-white py-20 lg:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-deep">Savings pots</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-[2.4rem] md:leading-[1.15]">
            Save every day. Or pay the price you set yourself.
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-muted">
            Pick a rhythm — daily, weekly or monthly — and an amount. Every time the cycle lands and you have not saved, LBPay cuts a small
            penalty from your wallet. You choose how much it stings, from {Math.round(SAVINGS.minPenaltyRate * 100)}% to {Math.round(SAVINGS.maxPenaltyRate * 100)}%.
            Most people leave it at {Math.round(SAVINGS.defaultPenaltyRate * 100)}%.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Streaks and a progress ring keep the pot in front of you",
              "Auto-save pulls the amount the moment it falls due, so you never miss",
              "Withdraw any time. Reach the goal and collect it all in one tap",
              "Penalties are transparent, capped, and listed in your history",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] leading-6 text-ink">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button className="rounded-full px-6">Start a pot</Button>
            </Link>
            <Link href="/wallet/savings">
              <Button variant="secondary" className="rounded-full px-6">
                I already have a wallet
              </Button>
            </Link>
          </div>
        </div>
        <PotPreview />
      </Container>
    </section>
  );
}

/* ---------------- Cross-border ---------------- */

export function AfricaCorridors({ cities }: { cities: string[] }) {
  const abroad = COUNTRIES.filter((c) => c.code !== "CM");
  return (
    <section id="africa" className="bg-paper py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-deep">Across Africa</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-[2.4rem] md:leading-[1.15]">
              Send XAF from Douala. They get naira in Lagos.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-muted">
              One flat {Math.round(INTERNATIONAL.feeRate * 1000) / 10}% fee, the rate locked when you confirm, and delivery to Mobile Money or a bank account in local
              currency. Receiving is even simpler: share your @handle and money from any of these countries lands in XAF.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {abroad.map((c) => (
                <div key={c.code} className="rounded-2xl bg-white p-3 ring-1 ring-line/80">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <span className="truncate text-sm font-bold text-ink">{c.short ?? c.name.split(" (")[0]}</span>
                  </div>
                  <p className="mt-1.5 font-mono text-[12px] font-semibold text-muted">
                    1 XAF = {quote(c, 1).rate} {c.currency}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand" /> Rate locked at confirm
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-brand" /> Minutes to Mobile Money
              </span>
            </div>
            <Link href="/signup" className="mt-8 inline-block">
              <Button className="rounded-full px-6">
                Send abroad <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div>
            <Image
              src="/illustrations/cameroon-map.webp"
              alt="Map of Cameroon highlighting coverage"
              width={1600}
              height={900}
              className="h-auto w-full"
            />
            <div className="mt-6 rounded-[1.5rem] bg-white p-5 ring-1 ring-line/80">
              <p className="text-sm font-bold text-ink">And every corner of Cameroon</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cities.map((city) => (
                  <li key={city} className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    {city}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-muted">Built for how people already move cash at home, now reaching the neighbours.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
