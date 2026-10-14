import { SiteOrigin } from "@/components/docs/code-block";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Lock,
  PiggyBank,
  Plus,
  QrCode,
  Send,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Phone frame                                                         */
/* ------------------------------------------------------------------ */

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[300px] rounded-[2.75rem] bg-[#0b1511] p-2.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2.2rem] bg-paper">
        <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-[#0b1511]" />
        {children}
      </div>
    </div>
  );
}

const feed = [
  { who: "Amina N.", what: "Received", amount: "+15 000", tone: "in", icon: ArrowDownLeft, note: "@amina · Wallet" },
  { who: "MTN 6•• •• 41", what: "Sent", amount: "−8 500", tone: "out", icon: ArrowUpRight, note: "Mobile Money · 2.5%" },
  { who: "Rent, January", what: "Saved", amount: "−2 500", tone: "save", icon: PiggyBank, note: "Day 19 streak" },
] as const;

/** A personal wallet screen. Activity rows slide in on a loop. */
export function WalletScreen() {
  return (
    <div className="pb-6 pt-11 text-ink">
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-deep">
            MT
          </span>
          <div className="leading-tight">
            <p className="text-[10px] text-muted">Good morning</p>
            <p className="text-[12px] font-semibold">@modest</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-brand-deep ring-1 ring-line">
          <Lock className="h-2.5 w-2.5" /> PIN on
        </span>
      </div>

      <div className="lb-house-card mx-4 mt-4 rounded-[1.4rem] p-4 text-white">
        <p className="text-[10px] font-medium text-white/75">Wallet balance</p>
        <p className="tabular mt-1 text-[26px] font-bold tracking-tight">
          248 750 <span className="text-[13px] font-semibold text-white/75">XAF</span>
        </p>
        <div className="mt-3 flex items-center justify-between text-[9px] text-white/80">
          <span>LBPay · Cameroon</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">Verified</span>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { icon: Send, label: "Send" },
          { icon: ArrowDownLeft, label: "Request" },
          { icon: Plus, label: "Deposit" },
          { icon: QrCode, label: "Scan" },
        ].map((a) => (
          <div key={a.label} className="flex flex-col items-center gap-1">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-brand-deep shadow-sm ring-1 ring-line">
              <a.icon className="h-4 w-4" />
            </span>
            <span className="text-[9px] font-medium text-muted">{a.label}</span>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-5 flex items-center justify-between">
        <p className="text-[11px] font-semibold">Activity</p>
        <span className="flex items-center gap-1 text-[9px] font-medium text-brand-deep">
          <span className="lb-live-dot h-1.5 w-1.5 rounded-full bg-brand" /> Live
        </span>
      </div>
      <ul className="mx-4 mt-2 space-y-1.5">
        {feed.map((row, i) => (
          <li
            key={row.who}
            className="lb-feed-item flex items-center gap-2.5 rounded-2xl bg-white p-2.5 ring-1 ring-line/70"
            style={{ animationDelay: `${i * 0.9}s` }}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                row.tone === "in" && "bg-brand-soft text-brand-deep",
                row.tone === "out" && "bg-[#fff6d6] text-[#8a6a00]",
                row.tone === "save" && "bg-gold-soft text-[#8a6a2a]",
              )}
            >
              <row.icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[11px] font-semibold">{row.who}</span>
              <span className="block truncate text-[9px] text-muted">{row.note}</span>
            </span>
            <span
              className={cn(
                "tabular text-[11px] font-bold",
                row.tone === "in" ? "text-brand-deep" : "text-ink",
              )}
            >
              {row.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating receipts                                                   */
/* ------------------------------------------------------------------ */

export function SentToast({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 text-ink shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] ring-1 ring-black/5 backdrop-blur",
        className,
      )}
    >
      <span className="lb-check grid h-9 w-9 place-items-center rounded-full bg-brand text-white">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] font-bold">20 000 XAF sent</span>
        <span className="block text-[10px] text-muted">To @nkoum · Fee 0 XAF · 1.2s</span>
      </span>
    </div>
  );
}

export function SecureToast({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-forest/90 p-3 pr-4 text-white shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur",
        className,
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-brand">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] font-bold">PIN confirmed</span>
        <span className="block text-[10px] text-white/60">Ledger entry posted</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Merchant checkout                                                   */
/* ------------------------------------------------------------------ */

export function CheckoutCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-[360px] overflow-hidden rounded-[1.6rem] bg-white text-ink shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/5",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-soft text-lg">☕</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-bold">Café des Palmiers</p>
          <p className="text-[11px] text-muted">lbpay · /p/palmiers</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[10px] font-semibold text-brand-deep">
          <ShieldCheck className="h-3 w-3" /> Verified
        </span>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted">2 × Cappuccino</span>
          <span className="tabular font-medium">5 000</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[13px]">
          <span className="text-muted">1 × Croissant beurre</span>
          <span className="tabular font-medium">2 500</span>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-dashed border-line pt-4">
          <span className="text-[12px] font-medium text-muted">Total</span>
          <span className="tabular text-[26px] font-bold tracking-tight">
            7 500 <span className="text-sm font-semibold text-muted">XAF</span>
          </span>
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Pay with</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { label: "MTN MoMo", tone: "bg-mtn text-black", short: "MTN", active: true },
            { label: "Orange", tone: "bg-om text-white", short: "OM", active: false },
            { label: "Wallet", tone: "bg-brand text-white", short: "LB", active: false },
          ].map((m) => (
            <span
              key={m.label}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5",
                m.active ? "border-brand bg-brand-soft/50 ring-2 ring-brand/15" : "border-line",
              )}
            >
              <span className={cn("grid h-7 w-7 place-items-center rounded-lg text-[8px] font-black", m.tone)}>
                {m.short}
              </span>
              <span className="text-[10px] font-semibold">{m.label}</span>
            </span>
          ))}
        </div>
        <span className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white">
          <Lock className="h-3.5 w-3.5" /> Pay 7 500 XAF
        </span>
        <p className="mt-3 text-center text-[10px] text-muted">
          Approve on your phone. You only pay what you see.
        </p>
      </div>
    </div>
  );
}

export function PaidNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 text-ink shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5",
        className,
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-deep">
        <ArrowDownLeft className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] font-bold">Payment received</span>
        <span className="tabular block text-[10px] text-muted">7 500 XAF · MTN MoMo · just now</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* API console                                                         */
/* ------------------------------------------------------------------ */

export function ApiConsole({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl bg-[#07120e] font-mono text-[12px] leading-6 text-white/80 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 text-[11px] text-white/40">POST /api/v1/payments</span>
        <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">sandbox</span>
      </div>
      <pre className="overflow-x-auto px-4 py-4">
        <code>
          <span className="text-white/40">$</span> curl <SiteOrigin />/api/v1/payments \{"\n"}
          {"  "}-H <span className="text-[#9fe8c4]">&quot;Authorization: Bearer sk_test_…&quot;</span> \{"\n"}
          {"  "}-d <span className="text-[#9fe8c4]">&apos;{"{"} &quot;amount&quot;: 7500, &quot;currency&quot;: &quot;XAF&quot;,</span>{"\n"}
          {"        "}<span className="text-[#9fe8c4]">&quot;customer&quot;: {"{"} &quot;phone&quot;: &quot;670112233&quot; {"}"},</span>{"\n"}
          {"        "}<span className="text-[#9fe8c4]">&quot;method&quot;: &quot;mobile_money&quot; {"}"}&apos;</span>
        </code>
      </pre>
      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Response · 201</p>
        <pre className="mt-1 overflow-x-auto">
          <code>
            {"{"}{"\n"}
            {"  "}<span className="text-[#f4ead2]">&quot;id&quot;</span>: <span className="text-[#9fe8c4]">&quot;pay_8Kq2…&quot;</span>,{"\n"}
            {"  "}<span className="text-[#f4ead2]">&quot;status&quot;</span>: <span className="text-[#9fe8c4]">&quot;pending&quot;</span>,{"\n"}
            {"  "}<span className="text-[#f4ead2]">&quot;amount&quot;</span>: <span className="text-[#ffd27a]">7500</span>,{"\n"}
            {"  "}<span className="text-[#f4ead2]">&quot;rail&quot;</span>: <span className="text-[#9fe8c4]">&quot;sandbox&quot;</span>{"\n"}
            {"}"}
          </code>
        </pre>
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.03] px-4 py-3 text-[11px]">
        <span className="lb-live-dot h-1.5 w-1.5 rounded-full bg-brand" />
        <span className="text-white/60">sandbox</span>
        <span className="text-brand">no real money moves</span>
        <span className="ml-auto text-white/35">sk_test_…</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm with PIN                                                    */
/* ------------------------------------------------------------------ */

export function ConfirmSheet({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-[340px] rounded-[1.75rem] bg-white p-6 text-ink shadow-[0_40px_80px_-24px_rgba(6,38,28,0.35)] ring-1 ring-line",
        className,
      )}
    >
      <div className="mx-auto h-1 w-10 rounded-full bg-line" />
      <p className="mt-5 text-center text-[12px] font-medium text-muted">You&apos;re sending</p>
      <p className="tabular mt-1 text-center text-4xl font-bold tracking-tight">
        25 000 <span className="text-base font-semibold text-muted">XAF</span>
      </p>
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-paper p-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-mtn text-[10px] font-black text-black">
          MTN
        </span>
        <span className="leading-tight">
          <span className="block text-[14px] font-semibold">Mama Ngono</span>
          <span className="tabular block text-[12px] text-muted">MTN · 6•• •• 18 42</span>
        </span>
        <Check className="ml-auto h-4 w-4 text-brand" strokeWidth={3} />
      </div>
      <dl className="mt-4 space-y-2 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-muted">They receive</dt>
          <dd className="tabular font-semibold">25 000 XAF</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Fee (2.5%)</dt>
          <dd className="tabular font-semibold">625 XAF</dd>
        </div>
        <div className="flex justify-between border-t border-dashed border-line pt-2">
          <dt className="font-semibold">Total from wallet</dt>
          <dd className="tabular font-bold">25 625 XAF</dd>
        </div>
      </dl>
      <p className="mt-5 text-center text-[12px] font-semibold">Enter your PIN</p>
      <div className="mt-3 flex justify-center gap-3">
        {[1, 1, 1, 0].map((on, i) => (
          <span
            key={i}
            className={cn("h-3.5 w-3.5 rounded-full", on ? "bg-brand" : "bg-white ring-2 ring-line")}
          />
        ))}
      </div>
    </div>
  );
}
