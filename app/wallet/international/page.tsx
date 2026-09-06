"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Check, Clock3, Copy, Globe2, Share2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { PayQR } from "@/components/qr";
import { COUNTRIES, INTERNATIONAL, findCountry, formatLocal, internationalIssue, quote, recipientIssue, type Country } from "@/lib/countries";
import { formatXAF } from "@/lib/format";
import { useInternationalSend, useMe } from "@/lib/hooks/wallet";
import { cameroonDay, dailyOutboundCap, outboundKinds } from "@/lib/limits";
import { useNotify } from "@/lib/notify";
import { payHandleUrl } from "@/lib/origin";
import { isPinError, readPinFail } from "@/lib/pin-fail";
import { useBrowserOrigin } from "@/lib/use-origin";
import { cn } from "@/lib/cn";

const DESTINATIONS = COUNTRIES.filter((c) => c.code !== "CM");

function InternationalInner() {
  const params = useSearchParams();
  const router = useRouter();
  const notify = useNotify();
  const me = useMe();
  const send = useInternationalSend();
  const [tab, setTab] = useState<"send" | "receive">(params.get("tab") === "receive" ? "receive" : "send");
  const [country, setCountry] = useState<Country>(() => findCountry(params.get("to") || "") || DESTINATIONS[0]);
  const [railId, setRailId] = useState(country.rails[0].id);
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
  const [copied, setCopied] = useState(false);
  const origin = useBrowserOrigin();

  const rail = country.rails.find((r) => r.id === railId) || country.rails[0];
  const balance = me.data?.balance ?? 0;
  const value = Math.round(Number(amount) || 0);
  const q = useMemo(() => quote(country, value), [country, value]);
  const amountProblem = internationalIssue(value);
  const recipientProblem = recipient ? recipientIssue(country, rail, recipient) : "";
  const cap = dailyOutboundCap(me.data?.user?.kyc?.personal);
  const usedToday = (me.data?.transactions || [])
    .filter((tx) => outboundKinds(tx.kind) && cameroonDay(tx.createdAt) === cameroonDay() && (tx.status === "success" || tx.status === "pending"))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const overDaily = cap != null && value > 0 && usedToday + value > cap;
  const ready = value > 0 && !amountProblem && !recipientProblem && recipient.length > 0 && recipientName.trim().length >= 2 && q.total <= balance && !overDaily;

  const handle = me.data?.user?.lbpayId || "";
  const payUrl = handle && origin ? payHandleUrl(handle, origin) : "";

  function pickCountry(next: Country) {
    setCountry(next);
    setRailId(next.rails[0].id);
    setRecipient("");
  }

  async function confirm(pin: string) {
    setPinError("");
    setLockedUntil(0);
    try {
      const res = await send.mutateAsync({ country: country.code, rail: rail.id, recipient, recipientName: recipientName.trim(), amount: value, note, pin });
      notify.moneyOut(res.debitAmount, `${formatLocal(res.receiveAmount, country.currency)} on its way to ${recipientName.trim()} in ${country.name}`);
      setOpen(false);
      router.push("/wallet");
    } catch (err) {
      const fail = readPinFail(err);
      setPinError(fail.error);
      setLockedUntil(fail.lockedUntil);
      if (!isPinError(fail.error)) notify.error("Transfer failed", fail.error);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify.error("Copy failed", "Select the link and copy it manually.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-5 lg:col-span-5">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-line/80" aria-label="Back to wallet">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black">Across Africa</h1>
            <p className="text-sm text-muted">Send to 9 countries. Receive from anywhere in XAF.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-2xl bg-[#eef1ef] p-1">
          {(["send", "receive"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn("h-10 rounded-xl text-sm font-bold capitalize", tab === item ? "bg-white text-ink shadow-sm" : "text-muted")}
            >
              {item === "send" ? "Send abroad" : "Receive"}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-[1.6rem] bg-forest p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">CEMAC + West Africa</p>
          <p className="mt-1 text-lg font-black leading-tight">One wallet. Ten countries. Local money on the other side.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {COUNTRIES.map((c) => {
              const selectable = tab === "send" && c.code !== "CM";
              return (
                <button
                  key={c.code}
                  type="button"
                  disabled={!selectable}
                  onClick={() => pickCountry(c)}
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-semibold transition",
                    selectable && country.code === c.code ? "bg-brand text-forest" : "bg-white/10",
                    selectable ? "hover:bg-white/20" : "cursor-default",
                  )}
                >
                  {c.flag} {c.name.split(" (")[0]}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="font-mono text-sm font-black">{Math.round(INTERNATIONAL.feeRate * 1000) / 10}%</p>
              <p className="text-[10px] font-semibold text-hero-muted">Flat fee</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="font-mono text-sm font-black">1:1</p>
              <p className="text-[10px] font-semibold text-hero-muted">XAF to XOF</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="font-mono text-sm font-black">Mins</p>
              <p className="text-[10px] font-semibold text-hero-muted">Typical delivery</p>
            </div>
          </div>
        </section>

        <section className="grid gap-2.5">
          {[
            { icon: ShieldCheck, title: "Rate locked at confirm", copy: "What you see in the review sheet is what they get." },
            { icon: Clock3, title: "Track every step", copy: "Pending until the partner confirms delivery. Refunded if it fails." },
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
        {tab === "send" ? (
          <Card className="p-5 sm:p-6">
            <p className="mb-4 text-sm text-muted">Available {formatXAF(balance)}</p>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ready) return;
                setPinError("");
                setOpen(true);
              }}
            >
              <Field label="Destination">
                <div className="grid grid-cols-3 gap-2">
                  {DESTINATIONS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => pickCountry(c)}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-left text-sm font-semibold",
                        country.code === c.code ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink",
                      )}
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className="mt-1 block truncate text-[12px]">{c.short ?? c.name.split(" (")[0]}</span>
                      <span className="block text-[10px] font-medium text-muted">{c.currency}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="They get paid on">
                <div className="flex flex-wrap gap-2">
                  {country.rails.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRailId(r.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-bold ring-1",
                        rail.id === r.id ? "bg-brand-soft text-brand-dark ring-brand" : "bg-white text-ink ring-line",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Recipient name">
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="As on their account" required />
                </Field>
                <Field label={rail.field === "phone" ? `${rail.label} number` : "Account number"} hint={rail.hint}>
                  <div className="flex gap-2">
                    {rail.field === "phone" ? (
                      <span className="grid shrink-0 place-items-center rounded-2xl bg-paper px-3 font-mono text-sm font-bold text-ink">{country.dial}</span>
                    ) : null}
                    <Input
                      inputMode="numeric"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value.replace(/[^\d\s]/g, ""))}
                      placeholder={rail.field === "phone" ? "8xx xxx xxxx" : "0123456789"}
                      required
                    />
                  </div>
                </Field>
              </div>
              {recipientProblem ? <p className="-mt-2 text-sm font-semibold text-danger">{recipientProblem}</p> : null}

              <Field label="You send (XAF)">
                <Input type="number" inputMode="numeric" min={INTERNATIONAL.min} max={INTERNATIONAL.max} className="font-mono text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </Field>
              {amount && amountProblem ? <p className="-mt-2 text-sm font-semibold text-danger">{amountProblem}</p> : null}

              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">They receive</p>
                    <p className="font-mono text-2xl font-black tracking-tight text-ink">{value ? formatLocal(q.receiveAmount, q.currency) : `— ${country.currency}`}</p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand ring-1 ring-line">
                    <ArrowRightLeft className="h-5 w-5" />
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Rate</dt>
                    <dd className="font-mono font-semibold">1 XAF = {q.rate} {country.currency}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Fee ({Math.round(INTERNATIONAL.feeRate * 1000) / 10}%, min {INTERNATIONAL.minFee})</dt>
                    <dd className="font-mono font-semibold">{value ? formatXAF(q.fee) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                    <dt className="font-semibold">You pay</dt>
                    <dd className="font-mono font-black">{value ? formatXAF(q.total) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Delivery</dt>
                    <dd className="font-semibold">{country.eta}</dd>
                  </div>
                </dl>
              </div>

              <Field label="Note">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional, shown to the recipient" maxLength={120} />
              </Field>

              {overDaily ? <p className="text-sm font-semibold text-danger">Daily limit remaining is {formatXAF(Math.max(0, (cap || 0) - usedToday))}. Verify your identity to lift it.</p> : null}
              {value > 0 && q.total > balance ? <p className="text-sm font-semibold text-danger">Insufficient wallet balance. Deposit funds or enter a lower amount.</p> : null}

              <Button type="submit" disabled={!ready}>
                Review and confirm
              </Button>
              <p className="text-center text-[11px] text-muted">Rates are indicative until you confirm. Partners may ask the recipient for ID on first delivery.</p>
            </form>
          </Card>
        ) : (
          <Card className="p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Receive from abroad</p>
            <h2 className="mt-1 text-lg font-black">Share your LBPay link. Money lands in XAF.</h2>
            <p className="mt-1 text-sm text-muted">
              Anyone in {COUNTRIES.length} countries can pay your link with Mobile Money, card or bank. You get XAF in your wallet, no conversion to handle.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="mx-auto rounded-2xl bg-white p-3 ring-1 ring-line">
                {payUrl ? <PayQR value={payUrl} size={160} /> : <div className="h-40 w-40 animate-pulse rounded-xl bg-paper" />}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-paper p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Your LBPay ID</p>
                  <p className="mt-0.5 font-mono text-lg font-black text-ink">@{handle || "…"}</p>
                </div>
                <div className="rounded-2xl bg-paper p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Payment link</p>
                  <p className="mt-0.5 truncate font-mono text-sm font-semibold text-ink">{payUrl || "…"}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={copyLink} disabled={!payUrl} className="flex-1">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!payUrl}
                    onClick={() => {
                      if (navigator.share) navigator.share({ title: "Pay me on LBPay", url: payUrl }).catch(() => null);
                      else copyLink();
                    }}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-line/80">
              <p className="text-sm font-black text-ink">Where senders can pay from</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COUNTRIES.map((c) => (
                  <span key={c.code} className="rounded-full bg-paper px-2.5 py-1 text-[12px] font-semibold text-ink">
                    {c.flag} {c.name.split(" (")[0]}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Need a fixed amount? <Link href="/wallet/request" className="font-bold text-brand-deep hover:underline">Create a money request</Link> and send that link instead.
              </p>
            </div>
          </Card>
        )}

        <section className="rounded-2xl bg-white p-4 ring-1 ring-line/80">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-brand" />
            <p className="text-sm font-black text-ink">Indicative rates</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] sm:grid-cols-3">
            {DESTINATIONS.map((c) => (
              <div key={c.code} className="flex justify-between gap-2 border-b border-line/60 py-1">
                <span className="text-muted">
                  {c.flag} {c.code}
                </span>
                <span className="font-mono font-semibold text-ink">{quote(c, 1).rate} {c.currency}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ConfirmSheet
        open={open}
        title="Confirm transfer abroad"
        subtitle={`${recipientName.trim()} · ${country.flag} ${country.name}`}
        amount={q.total}
        details={[
          { label: "Paid on", value: `${rail.label} · ${rail.field === "phone" ? `${country.dial} ${recipient}` : recipient}` },
          { label: "They receive", value: formatLocal(q.receiveAmount, q.currency) },
          { label: "Rate", value: `1 XAF = ${q.rate} ${country.currency}` },
          { label: "Fee", value: formatXAF(q.fee) },
          { label: "You pay", value: formatXAF(q.total) },
        ]}
        warning="Money leaves your wallet now and shows as pending until the partner confirms delivery."
        loading={send.isPending}
        error={pinError}
        lockedUntil={lockedUntil}
        confirmLabel="Enter PIN to send"
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </div>
  );
}

export default function InternationalPage() {
  return (
    <Suspense>
      <InternationalInner />
    </Suspense>
  );
}
