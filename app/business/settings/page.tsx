"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  ExternalLink,
  KeyRound,
  LifeBuoy,
  Lock,
  QrCode,
  Receipt,
  Store,
  Wallet,
} from "lucide-react";
import { AppImg } from "@/components/app-img";
import { BusinessPageHeader } from "@/components/business/page-header";
import { ChangeHandle } from "@/components/change-handle-sheet";
import { NetworkMark } from "@/components/network-mark";
import { useMe } from "@/lib/hooks/wallet";
import { businessKindLabel } from "@/lib/kyc";
import { FEE_RATES, feePercent } from "@/lib/fees";
import { shopHandlePath, shopHandleUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";
import { cn } from "@/lib/cn";

const STATUS: Record<string, { label: string; tone: string; icon: typeof BadgeCheck; copy: string }> = {
  verified: {
    label: "Verified business",
    tone: "bg-brand-soft text-brand-deep",
    icon: BadgeCheck,
    copy: "Customers see a verified badge on your shop and checkout.",
  },
  pending: {
    label: "Review in progress",
    tone: "bg-gold-soft text-[#7a5a1c]",
    icon: Clock3,
    copy: "A person on our team is checking your details. We'll notify you.",
  },
  rejected: {
    label: "Needs another look",
    tone: "bg-[#fdecea] text-danger",
    icon: Clock3,
    copy: "Something didn't match. Update your details and apply again.",
  },
  unverified: {
    label: "Not verified yet",
    tone: "bg-paper text-muted",
    icon: Clock3,
    copy: "Verify your business to show the badge and unlock higher limits.",
  },
};

export default function BusinessSettingsPage() {
  const me = useMe();
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });
  const origin = useBrowserOrigin();
  const user = me.data?.user;
  const handle = user?.lbpayId || "";
  const name = data.data?.businessName || user?.businessName || user?.name || "Your business";
  const kind = data.data?.businessKind || user?.businessKind;
  const statusKey = (user?.kyc?.business as string) || "unverified";
  const status = STATUS[statusKey] || STATUS.unverified;
  const loading = me.isLoading;

  return (
    <div className="mx-auto max-w-2xl">
      <BusinessPageHeader title="Settings" copy="How your business appears and gets paid." />

      <div className="space-y-5">
        {/* Identity */}
        <section className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">
          <div className="flex items-center gap-4 p-5">
            <AppImg src={user?.avatar} alt="" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-line" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-black text-ink">{name}</p>
              <p className="text-[13px] text-muted">{businessKindLabel(kind)}</p>
              {loading ? (
                <span className="mt-2 inline-block h-6 w-32 animate-pulse rounded-full bg-paper" />
              ) : (
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold",
                    status.tone,
                  )}
                >
                  <status.icon className="h-3.5 w-3.5" /> {status.label}
                </span>
              )}
            </div>
          </div>
          {!loading ? (
            <div className="flex items-center justify-between gap-3 border-t border-line bg-paper/60 px-5 py-3.5">
              <p className="text-[13px] text-muted">{status.copy}</p>
              {statusKey !== "verified" && statusKey !== "pending" ? (
                <Link href="/wallet/kyc" className="shrink-0 text-[13px] font-bold text-brand-deep">
                  Verify
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Shop address */}
        <Group title="Your shop">
          <Row icon={Store} title="Shop address" hint={handle ? shopHandleUrl(handle, origin) : "Loading…"}>
            {handle ? (
              <a
                href={shopHandlePath(handle)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-deep"
              >
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </Row>
          <Row icon={KeyRound} title={`@${handle || "…"}`} hint="Your LBPay ID. It's in every shop and pay link.">
            {handle ? <ChangeHandle name={user?.name || name} current={handle} /> : null}
          </Row>
          <Row icon={QrCode} title="Counter QR code" hint="Print it and let customers scan to pay." href="/business/qr" />
          <Row icon={Receipt} title="Products and links" hint="Add, edit and share what you sell." href="/business/links" />
        </Group>

        {/* Payments */}
        <Group title="Getting paid">
          <div className="p-5">
            <p className="text-[14px] font-bold text-ink">Customers can pay with</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  { n: "mtn", t: "MTN MoMo", h: `${feePercent(FEE_RATES.deposit)}% to customer` },
                  { n: "orange", t: "Orange Money", h: `${feePercent(FEE_RATES.deposit)}% to customer` },
                  { n: "wallet", t: "LBPay wallet", h: "Free for both" },
                ] as const
              ).map((m) => (
                <div key={m.n} className="flex flex-col items-center gap-2 rounded-2xl bg-paper px-2 py-3 text-center ring-1 ring-line">
                  <NetworkMark network={m.n} className="h-9 w-9 rounded-xl text-[8px]" />
                  <span className="text-[12px] font-bold leading-tight text-ink">{m.t}</span>
                  <span className="text-[11px] leading-tight text-muted">{m.h}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-[13px] font-semibold text-brand-deep">
              You always receive the full price of every sale.
            </p>
          </div>
          <Row
            icon={Wallet}
            title="Where payments land"
            hint={`Straight into your LBPay balance. Withdraw to MTN or Orange any time (${feePercent(FEE_RATES.withdraw)}%).`}
            href="/wallet/withdraw"
          />
        </Group>

        {/* Security & help */}
        <Group title="Security and help">
          <Row icon={Lock} title="Change password" hint="We'll email you a code to set a new one." href="/forgot" />
          <Row icon={KeyRound} title="Reset PIN" hint="The 4 digits you use to approve payments." href="/pin/forgot" />
          <Row icon={LifeBuoy} title="Talk to the LBPay team" hint="Questions about payments, payouts or your shop." href="/wallet/support" />
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-[0.14em] text-muted">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  hint,
  href,
  children,
}: {
  icon: typeof Store;
  title: string;
  hint: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-ink ring-1 ring-line">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-ink">{title}</span>
        <span className="block truncate text-[13px] text-muted">{hint}</span>
      </span>
      {children ?? (href ? <ChevronRight className="h-4 w-4 shrink-0 text-muted" /> : null)}
    </>
  );
  return href ? (
    <Link href={href} className="flex items-center gap-3 px-5 py-4 transition hover:bg-paper/60">
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-3 px-5 py-4">{body}</div>
  );
}
